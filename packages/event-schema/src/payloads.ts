import { z } from "zod";
import { EventType, type EventType as EventTypeValue } from "./enums";
import { artifactRefSchema } from "./artifact";

/**
 * Per-event-type payload schemas.
 *
 * Payloads are intentionally metadata-first (docs/07 §13): capture URLs, methods,
 * statuses, timings and pointers — NOT raw bodies, which may contain secrets/PII.
 * Any event type without an entry in {@link payloadSchemas} accepts a generic
 * key/value payload, so new observations are never blocked on a schema change.
 */
const genericPayload = z.record(z.string(), z.unknown());

const searchResultSchema = z.object({
  url: z.string(),
  title: z.string().optional(),
  rank: z.number().int().nonnegative(),
});

export const payloadSchemas = {
  [EventType.RunStarted]: z.object({
    taskId: z.string(),
    taskTitle: z.string(),
  }),
  [EventType.RunFinished]: z.object({
    executionStatus: z.string(),
    observationStatus: z.string(),
    evaluationStatus: z.string(),
    durationMs: z.number().nonnegative(),
  }),

  [EventType.AgentStarted]: z.object({
    runtime: z.string(),
    model: z.string().optional(),
  }),
  [EventType.AgentAction]: z.object({
    action: z.string(),
    detail: z.string().optional(),
  }),
  [EventType.AgentMessage]: z.object({
    role: z.enum(["system", "user", "assistant"]),
    text: z.string(),
  }),
  [EventType.AgentToolCall]: z.object({
    tool: z.string(),
    arguments: z.record(z.string(), z.unknown()).default({}),
  }),
  [EventType.AgentToolResult]: z.object({
    tool: z.string(),
    ok: z.boolean(),
    result: z.unknown().optional(),
    error: z.string().optional(),
  }),
  [EventType.AgentFinished]: z.object({
    ok: z.boolean(),
    finalAnswer: z.string().optional(),
  }),

  [EventType.BrowserStarted]: z.object({
    browser: z.string(),
    version: z.string(),
  }),
  [EventType.BrowserNavigation]: z.object({
    url: z.string(),
    referrer: z.string().optional(),
  }),
  [EventType.BrowserClick]: z.object({
    selector: z.string().optional(),
    x: z.number().optional(),
    y: z.number().optional(),
  }),
  [EventType.BrowserInput]: z.object({
    selector: z.string().optional(),
    /** Whether the input value was redacted before persistence (docs/07 §43). */
    redacted: z.boolean().default(true),
  }),
  [EventType.BrowserScroll]: z.object({
    x: z.number(),
    y: z.number(),
  }),
  [EventType.BrowserError]: z.object({
    message: z.string(),
  }),

  [EventType.SearchQuery]: z.object({
    query: z.string(),
    engine: z.string().optional(),
  }),
  [EventType.SearchResults]: z.object({
    query: z.string(),
    results: z.array(searchResultSchema),
  }),
  [EventType.SearchSelection]: z.object({
    url: z.string(),
    rank: z.number().int().nonnegative().optional(),
  }),

  [EventType.NetworkRequest]: z.object({
    requestId: z.string().optional(),
    method: z.string(),
    url: z.string(),
    resourceType: z.string().optional(),
  }),
  [EventType.NetworkResponse]: z.object({
    requestId: z.string().optional(),
    url: z.string(),
    status: z.number().int(),
    contentType: z.string().optional(),
    durationMs: z.number().nonnegative().optional(),
  }),

  [EventType.PageSnapshot]: z.object({
    url: z.string(),
    artifact: artifactRefSchema.optional(),
  }),
  [EventType.Screenshot]: z.object({
    artifact: artifactRefSchema,
    label: z.string().optional(),
  }),

  [EventType.EvaluationCompleted]: z.object({
    evaluator: z.string(),
    metrics: z.record(z.string(), z.unknown()),
  }),
  [EventType.FindingCreated]: z.object({
    findingId: z.string(),
    category: z.string(),
    severity: z.string(),
  }),
} satisfies Partial<Record<EventTypeValue, z.ZodTypeAny>>;

/** Returns the payload schema for an event type, or a generic key/value schema. */
export function getPayloadSchema(type: EventTypeValue): z.ZodTypeAny {
  return (payloadSchemas as Record<string, z.ZodTypeAny>)[type] ?? genericPayload;
}
