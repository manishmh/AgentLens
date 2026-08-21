import { randomUUID } from "node:crypto";
import { posix } from "node:path";
import {
  Sandbox as VercelSandbox,
  type NetworkPolicy as VercelNetworkPolicy,
} from "@vercel/sandbox";
import type {
  CollectedArtifact,
  ExecOptions,
  ExecResult,
  NetworkPolicy,
  SandboxHandle,
  SandboxProvider,
  SandboxProviderCapabilities,
  SandboxSpec,
} from "./types";
import { SandboxUnsupportedFeatureError } from "./types";

export interface VercelSandboxCredentials {
  token: string;
  teamId: string;
  projectId: string;
}

export interface VercelSandboxProviderOptions {
  namePrefix?: string;
  defaultImage?: string;
  defaultRuntime?: "node22" | "node24" | "node26" | "python3.13" | (string & {});
  region?: string;
  failoverRegions?: string[];
  credentials?: VercelSandboxCredentials;
  /**
   * Vercel sandboxes are persistent by default. AgentLens runs should be ephemeral unless
   * a caller deliberately opts into provider-level persistence.
   */
  persistent?: boolean;
  /** Delete the named sandbox on destroy. Keep enabled for per-run isolation. */
  deleteOnDestroy?: boolean;
}

type VercelSandboxInstance = Awaited<ReturnType<typeof VercelSandbox.create>>;

export const vercelSandboxCapabilities: SandboxProviderCapabilities = {
  processIsolation: true,
  filesystemIsolation: true,
  artifactExtraction: true,
  networkPolicy: {
    none: true,
    internet: true,
    allowlist: true,
    denylist: false,
  },
  resourceLimits: {
    wallClockTimeout: true,
    memory: false,
    processes: false,
    disk: false,
  },
};

export function toVercelNetworkPolicy(policy: NetworkPolicy | undefined): VercelNetworkPolicy {
  if (!policy || policy.mode === "internet") return "allow-all";
  if (policy.mode === "none") return "deny-all";
  if (policy.mode === "allowlist") {
    return policy.domains.length === 0 ? "deny-all" : { allow: policy.domains };
  }
  throw new SandboxUnsupportedFeatureError("vercel", "domain denylist network policy");
}

function assertVercelSpecSupported(spec: SandboxSpec): void {
  if (spec.limits?.maxMemoryMb !== undefined) {
    throw new SandboxUnsupportedFeatureError("vercel", "exact memory limit");
  }
  if (spec.limits?.maxProcesses !== undefined) {
    throw new SandboxUnsupportedFeatureError("vercel", "process count limit");
  }
  if (spec.limits?.maxDiskMb !== undefined) {
    throw new SandboxUnsupportedFeatureError("vercel", "disk limit");
  }
  toVercelNetworkPolicy(spec.network);
}

function resolveSandboxPath(root: string, relPath: string): string {
  const normalizedRoot = posix.resolve("/", root);
  const abs = posix.resolve(normalizedRoot, relPath);
  const rootWithSlash = normalizedRoot.endsWith("/") ? normalizedRoot : `${normalizedRoot}/`;
  if (abs !== normalizedRoot && !abs.startsWith(rootWithSlash)) {
    throw new Error(`Path escapes sandbox workspace: ${relPath}`);
  }
  return abs;
}

function compactTags(
  labels: Record<string, string> | undefined,
): Record<string, string> | undefined {
  if (!labels) return undefined;
  const entries = Object.entries(labels).slice(0, 5);
  return entries.length > 0 ? Object.fromEntries(entries) : undefined;
}

class VercelSandboxHandle implements SandboxHandle {
  constructor(
    readonly id: string,
    private readonly sandbox: VercelSandboxInstance,
    private readonly root: string,
    readonly network: NetworkPolicy,
    private readonly deleteOnDestroy: boolean,
  ) {}

  resolve(relPath: string): string {
    return resolveSandboxPath(this.root, relPath);
  }

  async writeFile(relPath: string, content: string | Uint8Array): Promise<void> {
    await this.sandbox.writeFiles([{ path: this.resolve(relPath), content }]);
  }

  async readFile(relPath: string): Promise<Uint8Array> {
    const content = await this.sandbox.readFileToBuffer({ path: this.resolve(relPath) });
    if (!content) throw new Error(`Sandbox file not found: ${relPath}`);
    return new Uint8Array(content);
  }

  async exec(command: string, args: string[] = [], options: ExecOptions = {}): Promise<ExecResult> {
    const started = performance.now();
    try {
      const result = await this.sandbox.runCommand({
        cmd: command,
        args,
        cwd: options.cwd ? this.resolve(options.cwd) : this.root,
        env: options.env,
        timeoutMs: options.timeoutMs,
      });
      const [stdout, stderr] = await Promise.all([result.stdout(), result.stderr()]);
      return {
        exitCode: result.exitCode,
        stdout,
        stderr,
        durationMs: result.durationMs ?? performance.now() - started,
        timedOut: false,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return {
        exitCode: -1,
        stdout: "",
        stderr: message,
        durationMs: performance.now() - started,
        timedOut: /timeout|timed out|SIGKILL/i.test(message),
      };
    }
  }

  async collectArtifacts(relDir: string): Promise<CollectedArtifact[]> {
    const base = this.resolve(relDir);
    const out: CollectedArtifact[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await this.sandbox.fs.readdir(dir, { withFileTypes: true });
      } catch {
        return;
      }
      for (const entry of entries) {
        const abs = posix.join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(abs);
        } else if (entry.isFile()) {
          const content = await this.sandbox.readFileToBuffer({ path: abs });
          if (!content) continue;
          out.push({
            path: posix.relative(this.root, abs),
            sizeBytes: content.byteLength,
            content: new Uint8Array(content),
          });
        }
      }
    };
    await walk(base);
    return out;
  }

  async destroy(): Promise<void> {
    let stopError: unknown;
    try {
      await this.sandbox.stop();
    } catch (err) {
      stopError = err;
    }
    if (this.deleteOnDestroy) {
      try {
        await this.sandbox.delete();
      } catch (err) {
        if (stopError)
          throw new AggregateError([stopError, err], "Failed to stop and delete sandbox");
        throw err;
      }
    }
    if (stopError) throw stopError;
  }
}

export class VercelSandboxProvider implements SandboxProvider {
  readonly name = "vercel";
  readonly capabilities = vercelSandboxCapabilities;

  constructor(private readonly options: VercelSandboxProviderOptions = {}) {}

  async create(spec: SandboxSpec = {}): Promise<SandboxHandle> {
    assertVercelSpecSupported(spec);
    const namePrefix = this.options.namePrefix ?? "agentlens";
    const image = spec.image ?? this.options.defaultImage;
    const runtime = image ? undefined : this.options.defaultRuntime;
    const createParams = {
      ...this.options.credentials,
      name: `${namePrefix}-${randomUUID()}`,
      timeout: spec.limits?.wallClockTimeoutMs,
      networkPolicy: toVercelNetworkPolicy(spec.network),
      env: spec.env,
      tags: compactTags(spec.labels),
      persistent: this.options.persistent ?? false,
      region: this.options.region,
      failoverRegions: this.options.failoverRegions,
    };
    const sandbox = image
      ? await VercelSandbox.create({ ...createParams, image })
      : runtime
        ? await VercelSandbox.create({ ...createParams, runtime })
        : await VercelSandbox.create(createParams);
    return new VercelSandboxHandle(
      sandbox.name,
      sandbox,
      sandbox.cwd,
      spec.network ?? { mode: "internet" },
      this.options.deleteOnDestroy ?? true,
    );
  }
}
