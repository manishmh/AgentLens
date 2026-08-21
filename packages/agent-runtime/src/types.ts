import type { Task } from "@agentlens/event-schema";
import type { ObservationEngine } from "@agentlens/observation";
import type { SandboxHandle } from "@agentlens/sandbox";

/**
 * Agent runtime abstraction (docs/10 §4).
 *
 * V1's first runtime is browser-oriented and built on Vercel AI SDK 7 (Milestone 1+).
 * Future adapters (OpenAI Agents SDK, Anthropic/Claude, Codex, Claude Code, …) implement
 * the same interface so the observation/evaluation layers never change per provider
 * (docs/10 §4, §29). The runtime emits its OWN observations into the ObservationEngine;
 * it must not be the canonical telemetry source itself (docs/10 §35 rule 4).
 */
export interface AgentRuntimeMetadata {
  provider: string;
  runtime: string;
  model?: string;
  version: string;
}

export type AgentStatus = "idle" | "starting" | "running" | "stopped" | "failed";

export interface AgentExecutionContext {
  task: Task;
  /** Canonical event sink for all agent/browser/network observations this run. */
  observation: ObservationEngine;
  /** Isolated workspace for artifacts (screenshots, snapshots). */
  sandbox: SandboxHandle;
  signal?: AbortSignal;
}

export interface AgentExecutionResult {
  ok: boolean;
  finalAnswer?: string;
  /** Set when the run failed, so failures can be attributed rather than blamed (docs/07 §64). */
  failureCategory?: string;
  error?: string;
}

export interface AgentRuntime {
  metadata(): AgentRuntimeMetadata;
  status(): AgentStatus;
  start(): Promise<void>;
  execute(context: AgentExecutionContext): Promise<AgentExecutionResult>;
  stop(): Promise<void>;
}
