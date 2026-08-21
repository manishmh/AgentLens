import { spawn } from "node:child_process";
import { randomUUID } from "node:crypto";
import { mkdtemp, mkdir, writeFile, readFile, rm, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve, sep } from "node:path";
import type {
  CollectedArtifact,
  ExecOptions,
  ExecResult,
  NetworkPolicy,
  SandboxProviderCapabilities,
  SandboxHandle,
  SandboxProvider,
  SandboxSpec,
} from "./types";
import { SandboxUnsupportedFeatureError } from "./types";

export const localSandboxCapabilities: SandboxProviderCapabilities = {
  processIsolation: false,
  filesystemIsolation: true,
  artifactExtraction: true,
  networkPolicy: {
    none: false,
    internet: true,
    allowlist: false,
    denylist: false,
  },
  resourceLimits: {
    wallClockTimeout: true,
    memory: false,
    processes: false,
    disk: false,
  },
};

function assertLocalSpecSupported(spec: SandboxSpec): void {
  const network = spec.network ?? { mode: "internet" };
  if (network.mode !== "internet") {
    throw new SandboxUnsupportedFeatureError("local", `network policy '${network.mode}'`);
  }
  if (spec.limits?.maxMemoryMb !== undefined) {
    throw new SandboxUnsupportedFeatureError("local", "memory limit");
  }
  if (spec.limits?.maxProcesses !== undefined) {
    throw new SandboxUnsupportedFeatureError("local", "process limit");
  }
  if (spec.limits?.maxDiskMb !== undefined) {
    throw new SandboxUnsupportedFeatureError("local", "disk limit");
  }
}

/**
 * In-process, filesystem-backed sandbox for local development and tests.
 *
 * It provides a real isolated WORKSPACE (temp dir), process execution, and artifact
 * collection — enough to exercise the runner/observation pipeline and to test cleanup
 * and cross-run filesystem isolation. It is NOT a security boundary: it does not
 * isolate the process namespace and does not enforce {@link NetworkPolicy}. The real
 * isolation boundary is the Vercel Sandbox provider added in Milestone 1.
 */
class LocalSandboxHandle implements SandboxHandle {
  constructor(
    readonly id: string,
    private readonly root: string,
    readonly network: NetworkPolicy,
    private readonly spec: SandboxSpec,
  ) {}

  resolve(relPath: string): string {
    const abs = resolve(this.root, relPath);
    const rootWithSep = this.root.endsWith(sep) ? this.root : this.root + sep;
    if (abs !== this.root && !abs.startsWith(rootWithSep)) {
      throw new Error(`Path escapes sandbox workspace: ${relPath}`);
    }
    return abs;
  }

  async writeFile(relPath: string, content: string | Uint8Array): Promise<void> {
    const abs = this.resolve(relPath);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, content);
  }

  async readFile(relPath: string): Promise<Uint8Array> {
    return new Uint8Array(await readFile(this.resolve(relPath)));
  }

  async exec(command: string, args: string[] = [], options: ExecOptions = {}): Promise<ExecResult> {
    const cwd = options.cwd ? this.resolve(options.cwd) : this.root;
    const timeoutMs = options.timeoutMs ?? this.spec.limits?.wallClockTimeoutMs;
    const started = performance.now();

    return await new Promise<ExecResult>((resolvePromise) => {
      const child = spawn(command, args, {
        cwd,
        env: { ...process.env, ...this.spec.env, ...options.env },
        shell: false,
      });
      let stdout = "";
      let stderr = "";
      let timedOut = false;
      const timer =
        timeoutMs === undefined
          ? undefined
          : setTimeout(() => {
              timedOut = true;
              child.kill("SIGKILL");
            }, timeoutMs);

      child.stdout.on("data", (d: Buffer) => (stdout += d.toString()));
      child.stderr.on("data", (d: Buffer) => (stderr += d.toString()));
      child.on("error", (err) => {
        if (timer) clearTimeout(timer);
        resolvePromise({
          exitCode: -1,
          stdout,
          stderr: stderr + String(err),
          durationMs: performance.now() - started,
          timedOut,
        });
      });
      child.on("close", (code) => {
        if (timer) clearTimeout(timer);
        resolvePromise({
          exitCode: code ?? -1,
          stdout,
          stderr,
          durationMs: performance.now() - started,
          timedOut,
        });
      });
    });
  }

  async collectArtifacts(relDir: string): Promise<CollectedArtifact[]> {
    const base = this.resolve(relDir);
    const out: CollectedArtifact[] = [];
    const walk = async (dir: string): Promise<void> => {
      let entries;
      try {
        entries = await readdir(dir, { withFileTypes: true });
      } catch {
        return; // directory does not exist → no artifacts
      }
      for (const entry of entries) {
        const abs = join(dir, entry.name);
        if (entry.isDirectory()) {
          await walk(abs);
        } else if (entry.isFile()) {
          const info = await stat(abs);
          out.push({
            path: relative(this.root, abs).split(sep).join("/"),
            sizeBytes: info.size,
            content: new Uint8Array(await readFile(abs)),
          });
        }
      }
    };
    await walk(base);
    return out;
  }

  async destroy(): Promise<void> {
    await rm(this.root, { recursive: true, force: true });
  }
}

export class LocalSandboxProvider implements SandboxProvider {
  readonly name = "local";
  readonly capabilities = localSandboxCapabilities;

  async create(spec: SandboxSpec = {}): Promise<SandboxHandle> {
    assertLocalSpecSupported(spec);
    const id = `sbx_${randomUUID()}`;
    const root = await mkdtemp(join(tmpdir(), "agentlens-sbx-"));
    const network: NetworkPolicy = spec.network ?? { mode: "internet" };
    return new LocalSandboxHandle(id, root, network, spec);
  }
}
