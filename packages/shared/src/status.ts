/**
 * Run lifecycle and completeness statuses.
 *
 * A run tracks three INDEPENDENT axes (docs/07 §83): execution, observation, and
 * evaluation. Agent-execution failure and observation failure must be represented
 * separately (docs/10 §16) — a successfully executed run can still be poorly observed.
 */

/** Overall run lifecycle state machine (docs/03 §37). */
export const RunStatus = {
  Queued: "queued",
  Starting: "starting",
  Running: "running",
  Collecting: "collecting",
  Evaluating: "evaluating",
  Completed: "completed",
  Failed: "failed",
  Timeout: "timeout",
  Cancelled: "cancelled",
} as const;
export type RunStatus = (typeof RunStatus)[keyof typeof RunStatus];

/** Did the agent execute the task at all? */
export const ExecutionStatus = {
  Success: "success",
  Failed: "failed",
  Timeout: "timeout",
  Cancelled: "cancelled",
} as const;
export type ExecutionStatus = (typeof ExecutionStatus)[keyof typeof ExecutionStatus];

/** How completely did the observation layer capture the run? */
export const ObservationStatus = {
  Complete: "complete",
  Degraded: "degraded",
  Failed: "failed",
} as const;
export type ObservationStatus = (typeof ObservationStatus)[keyof typeof ObservationStatus];

/** Did evaluation run, and under what limitations? */
export const EvaluationStatus = {
  Complete: "complete",
  CompleteWithLimitations: "complete_with_limitations",
  Skipped: "skipped",
  Failed: "failed",
} as const;
export type EvaluationStatus = (typeof EvaluationStatus)[keyof typeof EvaluationStatus];

/** Failure attribution categories (docs/07 §64) — never blame the customer for infra failures. */
export const FailureCategory = {
  Agent: "agent",
  Website: "website",
  Network: "network",
  Authentication: "authentication",
  Tool: "tool",
  Content: "content",
  Search: "search",
  Sandbox: "sandbox",
  Provider: "provider",
  Unknown: "unknown",
} as const;
export type FailureCategory = (typeof FailureCategory)[keyof typeof FailureCategory];
