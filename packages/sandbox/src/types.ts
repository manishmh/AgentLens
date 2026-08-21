/**
 * Sandbox provider abstraction (docs/10 §13, docs/03 §8, docs/07 §8).
 *
 * The execution plane must not be permanently coupled to one provider. V1 will use
 * Vercel Sandbox behind this interface; a future migration to Firecracker/microVMs
 * (or a customer-hosted runner) must not require rewriting the agent, browser,
 * observation, or evaluation layers.
 */

/** Network access policy for a run (docs/07 §31, docs/03 §39). */
export type NetworkPolicy =
  | { mode: "none" }
  | { mode: "internet" }
  | { mode: "allowlist"; domains: string[] }
  | { mode: "denylist"; domains: string[] };

/** Resource ceilings so a runaway agent cannot consume unlimited resources (docs/03 §38). */
export interface ResourceLimits {
  wallClockTimeoutMs?: number;
  maxMemoryMb?: number;
  maxProcesses?: number;
  maxDiskMb?: number;
}

export interface SandboxSpec {
  /** Pinned image/runtime identifier, recorded for reproducibility (docs/07 §49). */
  image?: string;
  limits?: ResourceLimits;
  network?: NetworkPolicy;
  /**
   * Environment injected into the sandbox at creation. Secrets are injected here and
   * ONLY here — never into the control plane's process, prompts, or event stream
   * (docs/03 §21, docs/07 §27–28). Callers must not log these values.
   */
  env?: Record<string, string>;
  labels?: Record<string, string>;
}

export interface SandboxProviderCapabilities {
  /** Whether commands run behind a real process/VM/container isolation boundary. */
  processIsolation: boolean;
  filesystemIsolation: boolean;
  artifactExtraction: boolean;
  networkPolicy: {
    none: boolean;
    internet: boolean;
    allowlist: boolean;
    denylist: boolean;
  };
  resourceLimits: {
    wallClockTimeout: boolean;
    memory: boolean;
    processes: boolean;
    disk: boolean;
  };
}

export class SandboxUnsupportedFeatureError extends Error {
  constructor(provider: string, feature: string) {
    super(`${provider} does not support required sandbox feature: ${feature}`);
    this.name = "SandboxUnsupportedFeatureError";
  }
}

export interface ExecOptions {
  cwd?: string;
  env?: Record<string, string>;
  timeoutMs?: number;
}

export interface ExecResult {
  exitCode: number;
  stdout: string;
  stderr: string;
  durationMs: number;
  timedOut: boolean;
}

export interface CollectedArtifact {
  /** Path relative to the sandbox workspace root. */
  path: string;
  sizeBytes: number;
  content: Uint8Array;
}

/** A live sandbox instance. */
export interface SandboxHandle {
  readonly id: string;
  readonly network: NetworkPolicy;
  exec(command: string, args?: string[], options?: ExecOptions): Promise<ExecResult>;
  writeFile(relPath: string, content: string | Uint8Array): Promise<void>;
  readFile(relPath: string): Promise<Uint8Array>;
  /** Provider-local absolute path to a workspace-relative file. */
  resolve(relPath: string): string;
  /** Collect artifacts under a workspace-relative directory (docs/10 §13). */
  collectArtifacts(relDir: string): Promise<CollectedArtifact[]>;
  destroy(): Promise<void>;
}

export interface SandboxProvider {
  readonly name: string;
  readonly capabilities?: SandboxProviderCapabilities;
  create(spec?: SandboxSpec): Promise<SandboxHandle>;
}
