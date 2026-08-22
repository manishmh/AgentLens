import { z } from "zod";
import { canonicalEventEnvelopeSchema } from "./event";
import { artifactRefSchema } from "./artifact";
import { visibilitySchema } from "./enums";

/** The task the agent is asked to perform (docs/10 §11). */
export const taskSchema = z.object({
  taskId: z.string(),
  title: z.string(),
  instruction: z.string(),
  version: z.string().default("1"),
  target: z.string().url().optional(),
  successCriteria: z.string().optional(),
});
export type Task = z.infer<typeof taskSchema>;

/**
 * Reproducibility metadata (docs/10 §10, docs/03 §23, docs/07 §49).
 * A result without its execution context is difficult to trust.
 */
export const reproducibilitySchema = z.object({
  agentRuntime: z.string(),
  agentRuntimeVersion: z.string(),
  model: z.string().optional(),
  browser: z.string().optional(),
  browserVersion: z.string().optional(),
  sandboxProvider: z.string().optional(),
  sandboxImage: z.string().optional(),
  taskVersion: z.string(),
  region: z.string().optional(),
  locale: z.string().optional(),
  timezone: z.string().optional(),
  networkPolicy: z.string().optional(),
  experimentConfig: z.record(z.string(), z.unknown()).optional(),
});
export type Reproducibility = z.infer<typeof reproducibilitySchema>;

export const agentDescriptorSchema = z.object({
  agentId: z.string(),
  provider: z.string(),
  runtime: z.string(),
  model: z.string().optional(),
  version: z.string().optional(),
});
export type AgentDescriptor = z.infer<typeof agentDescriptorSchema>;

export const browserDescriptorSchema = z.object({
  browser: z.string(),
  version: z.string(),
});
export type BrowserDescriptor = z.infer<typeof browserDescriptorSchema>;

/**
 * Observation completeness (docs/10 §16, docs/07 §82). Agent-execution success and
 * observation completeness are tracked separately; a run must never be silently
 * presented as fully observed when events were lost.
 */
export const observationSummarySchema = z.object({
  expectedEvents: z.number().int().nonnegative(),
  capturedEvents: z.number().int().nonnegative(),
  /** capturedEvents / expectedEvents, in [0, 1]. */
  completeness: z.number().min(0).max(1),
  status: z.enum(["complete", "degraded", "failed"]),
});
export type ObservationSummary = z.infer<typeof observationSummarySchema>;

/** Evidence classification (docs/07 §63) — the core trust mechanism. */
export const evidenceClassSchema = z.enum(["observed", "inferred", "unknown"]);
export type EvidenceClass = z.infer<typeof evidenceClassSchema>;

export const evidenceRefSchema = z.object({
  kind: z.enum(["event", "artifact", "external"]),
  eventId: z.string().optional(),
  artifact: artifactRefSchema.optional(),
  note: z.string().optional(),
});
export type EvidenceRef = z.infer<typeof evidenceRefSchema>;

export const evaluationResultSchema = z.object({
  evaluator: z.string(),
  evaluatorVersion: z.string().default("1"),
  evaluatedAt: z.string().datetime(),
  status: z.enum(["complete", "complete_with_limitations", "skipped", "failed"]),
  /** Named metrics (e.g. task_success, customer_recommended). Values are booleans/numbers/strings/arrays. */
  metrics: z.record(
    z.string(),
    z.union([z.boolean(), z.number(), z.string(), z.null(), z.array(z.string())]),
  ),
});
export type EvaluationResult = z.infer<typeof evaluationResultSchema>;

/** Finding model (docs/10 §18). Observation, inference and recommendation stay distinct. */
export const findingSchema = z.object({
  findingId: z.string(),
  runId: z.string(),
  category: z.string(),
  severity: z.enum(["info", "low", "medium", "high", "critical"]),
  evidenceClass: evidenceClassSchema,
  observation: z.string(),
  evidence: z.array(evidenceRefSchema).default([]),
  inference: z.string().optional(),
  recommendation: z.string().optional(),
  confidence: z.enum(["low", "medium", "high"]),
});
export type Finding = z.infer<typeof findingSchema>;

/**
 * The Run aggregate persisted as run.json (docs/10 §10, §11).
 * The success condition for the first prototype is that the complete observable
 * journey can be reconstructed from this document alone.
 */
export const runManifestSchema = z.object({
  schemaVersion: z.literal("1").default("1"),
  metadata: z.object({
    runId: z.string(),
    organizationId: z.string(),
    projectId: z.string(),
    experimentId: z.string().optional(),
    sessionId: z.string().optional(),
    createdAt: z.string().datetime(),
    finishedAt: z.string().datetime().optional(),
    durationMs: z.number().nonnegative().optional(),
    status: z.string(),
    executionStatus: z.string(),
    observationStatus: z.string(),
    evaluationStatus: z.string(),
    failureCategory: z.string().optional(),
    visibility: visibilitySchema.default("customer_sensitive"),
  }),
  task: taskSchema,
  environment: reproducibilitySchema,
  agent: agentDescriptorSchema,
  browser: browserDescriptorSchema.optional(),
  observation: observationSummarySchema,
  events: z.array(canonicalEventEnvelopeSchema),
  artifacts: z.array(artifactRefSchema).default([]),
  evaluation: evaluationResultSchema.optional(),
  findings: z.array(findingSchema).default([]),
});
export type RunManifest = z.infer<typeof runManifestSchema>;

export function parseRunManifest(raw: unknown): RunManifest {
  return runManifestSchema.parse(raw);
}
