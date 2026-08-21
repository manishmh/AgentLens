import { mkdtemp, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import type {
  AgentExecutionContext,
  AgentExecutionResult,
  AgentRuntime,
  AgentRuntimeMetadata,
  AgentStatus,
} from "@agentlens/agent-runtime";
import type { Task } from "@agentlens/event-schema";
import {
  LocalSandboxProvider,
  type ExecOptions,
  type ExecResult,
  type CollectedArtifact,
  type NetworkPolicy,
  type SandboxHandle,
  type SandboxProvider,
  type SandboxProviderCapabilities,
  type SandboxSpec,
} from "@agentlens/sandbox";
import { newOrganizationId, newProjectId } from "@agentlens/shared";
import { executeRun } from "./orchestrator";

class TrackingSandboxHandle implements SandboxHandle {
  constructor(
    private readonly inner: SandboxHandle,
    private readonly onDestroy: () => void,
  ) {}

  get id(): string {
    return this.inner.id;
  }

  get network(): NetworkPolicy {
    return this.inner.network;
  }

  exec(command: string, args?: string[], options?: ExecOptions): Promise<ExecResult> {
    return this.inner.exec(command, args, options);
  }

  writeFile(relPath: string, content: string | Uint8Array): Promise<void> {
    return this.inner.writeFile(relPath, content);
  }

  readFile(relPath: string): Promise<Uint8Array> {
    return this.inner.readFile(relPath);
  }

  resolve(relPath: string): string {
    return this.inner.resolve(relPath);
  }

  collectArtifacts(relDir: string): Promise<CollectedArtifact[]> {
    return this.inner.collectArtifacts(relDir);
  }

  async destroy(): Promise<void> {
    try {
      await this.inner.destroy();
    } finally {
      this.onDestroy();
    }
  }
}

class TrackingSandboxProvider implements SandboxProvider {
  readonly name = "tracking-local";
  readonly capabilities: SandboxProviderCapabilities | undefined;
  root: string | undefined;
  destroyed = false;
  private readonly inner = new LocalSandboxProvider();

  constructor() {
    this.capabilities = this.inner.capabilities;
  }

  async create(spec?: SandboxSpec): Promise<SandboxHandle> {
    const handle = await this.inner.create(spec);
    this.root = handle.resolve(".");
    return new TrackingSandboxHandle(handle, () => {
      this.destroyed = true;
    });
  }
}

class SignalAwareTimeoutAgent implements AgentRuntime {
  private currentStatus: AgentStatus = "idle";
  stopped = false;
  sawAbort = false;

  metadata(): AgentRuntimeMetadata {
    return {
      provider: "agentlens-test",
      runtime: "signal-aware-timeout-agent",
      version: "1",
    };
  }

  status(): AgentStatus {
    return this.currentStatus;
  }

  async start(): Promise<void> {
    this.currentStatus = "running";
  }

  async execute(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
    await ctx.sandbox.writeFile("artifacts/pre-timeout.txt", "written before timeout");
    return await new Promise<AgentExecutionResult>((_resolve, reject) => {
      const abort = (): void => {
        this.sawAbort = true;
        reject(ctx.signal?.reason instanceof Error ? ctx.signal.reason : new Error("aborted"));
      };
      if (ctx.signal?.aborted) {
        abort();
        return;
      }
      ctx.signal?.addEventListener("abort", abort, { once: true });
    });
  }

  async stop(): Promise<void> {
    this.stopped = true;
    this.currentStatus = "stopped";
  }
}

const task: Task = {
  taskId: "task_timeout",
  title: "Timeout task",
  instruction: "Wait until the runner timeout aborts execution.",
  version: "1",
};

describe("executeRun", () => {
  it("aborts timed-out agent execution, cleans up the sandbox, and persists artifacts", async () => {
    const outputRoot = await mkdtemp(join(tmpdir(), "agentlens-runner-timeout-"));
    const provider = new TrackingSandboxProvider();
    const agent = new SignalAwareTimeoutAgent();

    try {
      const { manifest, outputDir } = await executeRun({
        organizationId: newOrganizationId(),
        projectId: newProjectId(),
        task,
        provider,
        agent,
        sandboxSpec: { limits: { wallClockTimeoutMs: 20 } },
        outputRoot,
      });

      expect(manifest.metadata.status).toBe("failed");
      expect(manifest.metadata.executionStatus).toBe("timeout");
      expect(manifest.metadata.failureCategory).toBe("sandbox");
      expect(agent.sawAbort).toBe(true);
      expect(agent.stopped).toBe(true);
      expect(provider.destroyed).toBe(true);
      expect(provider.root).toBeDefined();
      await expect(stat(provider.root ?? "")).rejects.toBeTruthy();
      await expect(stat(join(outputDir, "artifacts/pre-timeout.txt"))).resolves.toBeTruthy();
    } finally {
      await rm(outputRoot, { recursive: true, force: true });
    }
  });
});
