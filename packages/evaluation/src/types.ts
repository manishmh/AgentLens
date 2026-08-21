import type { EvaluationResult, RunManifest, Task } from "@agentlens/event-schema";

/**
 * Evaluation is independent from execution (docs/03 §25): evaluators consume the
 * normalized event stream, never the live agent. `evaluate(run, task, criteria)`
 * (docs/10 §17). Deterministic rules establish factual metrics; LLM summarization/
 * prioritization (docs/10 §18) is layered on later and is not part of V1 Milestone 0.
 */
export interface EvaluationInput {
  run: RunManifest;
  task: Task;
  /** Natural language success criteria or strict evaluation goals. */
  successCriteria?: string;
}

export interface Evaluator {
  readonly name: string;
  readonly version: string;
  evaluate(input: EvaluationInput): Promise<EvaluationResult>;
}
