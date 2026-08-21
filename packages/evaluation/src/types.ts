import type { CanonicalEvent, EvaluationResult, Task } from "@agentlens/event-schema";

/**
 * Evaluation is independent from execution (docs/03 §25): evaluators consume the
 * normalized event stream, never the live agent. `evaluate(run, task, criteria)`
 * (docs/10 §17). Deterministic rules establish factual metrics; LLM summarization/
 * prioritization (docs/10 §18) is layered on later and is not part of V1 Milestone 0.
 */
export interface EvaluationInput {
  task: Task;
  events: readonly CanonicalEvent[];
  result: { ok: boolean; finalAnswer?: string };
  /** The customer's site/domain, for discovery & recommendation checks. */
  target?: string;
  /** Competitor domains to detect in the agent's behavior and answer. */
  competitors?: string[];
}

export interface Evaluator {
  readonly name: string;
  readonly version: string;
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
