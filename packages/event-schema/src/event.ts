import { z } from "zod";
import { newEventId } from "@agentlens/shared";
import {
  CANONICAL_EVENT_SCHEMA_VERSION,
  eventSourceSchema,
  eventTypeSchema,
  ingestOriginSchema,
  visibilitySchema,
  type EventSource,
  type EventType,
  type IngestOrigin,
  type Visibility,
} from "./enums";
import { getPayloadSchema } from "./payloads";

/**
 * The canonical event envelope — the single normalized shape every observation
 * becomes, regardless of source or observation mode (docs/10 §9, docs/07 §34).
 *
 * Ordering & correlation (docs/07 §36–37): every event carries a per-run monotonic
 * `sequence`, a `runtimeMs` offset from run start, and wall-clock `timestamp`, plus
 * the tenant/run correlation ids. `payload` is validated per-type (see payloads.ts).
 */
export const canonicalEventEnvelopeSchema = z.object({
  schemaVersion: z.literal(CANONICAL_EVENT_SCHEMA_VERSION).default(CANONICAL_EVENT_SCHEMA_VERSION),
  eventId: z.string(),
  ingestOrigin: ingestOriginSchema.default("mode_a_simulation"),

  // Correlation / tenant scoping (docs/07 §37, §68).
  organizationId: z.string(),
  projectId: z.string(),
  experimentId: z.string().optional(),
  runId: z.string(),
  sessionId: z.string().optional(),
  agentId: z.string().optional(),

  // Ordering (docs/07 §36).
  sequence: z.number().int().nonnegative(),
  timestamp: z.string().datetime(),
  runtimeMs: z.number().nonnegative(),

  source: eventSourceSchema,
  type: eventTypeSchema,
  visibility: visibilitySchema.default("internal"),

  payload: z.unknown(),
});

export type CanonicalEvent = z.infer<typeof canonicalEventEnvelopeSchema>;

export interface EventContext {
  organizationId: string;
  projectId: string;
  experimentId?: string;
  runId: string;
  sessionId?: string;
  agentId?: string;
}

export interface NewEventInput extends EventContext {
  sequence: number;
  runtimeMs: number;
  source: EventSource;
  type: EventType;
  payload: unknown;
  visibility?: Visibility;
  ingestOrigin?: IngestOrigin;
  timestamp?: string;
  eventId?: string;
}

/**
 * Validate an already-shaped event, including its type-specific payload.
 * Throws {@link z.ZodError} on invalid input.
 */
export function parseCanonicalEvent(raw: unknown): CanonicalEvent {
  const envelope = canonicalEventEnvelopeSchema.parse(raw);
  const payload = getPayloadSchema(envelope.type).parse(envelope.payload);
  return { ...envelope, payload };
}

/** Non-throwing variant of {@link parseCanonicalEvent}. */
export function safeParseCanonicalEvent(
  raw: unknown,
): z.SafeParseReturnType<unknown, CanonicalEvent> {
  const envelope = canonicalEventEnvelopeSchema.safeParse(raw);
  if (!envelope.success) return envelope;
  const payload = getPayloadSchema(envelope.data.type).safeParse(envelope.data.payload);
  if (!payload.success) return payload as z.SafeParseError<unknown>;
  return { success: true, data: { ...envelope.data, payload: payload.data } };
}

/**
 * Construct and fully validate a canonical event from execution-time inputs,
 * filling defaults (eventId, timestamp, schemaVersion, visibility, ingestOrigin).
 * Sequencing is the caller's responsibility — see @agentlens/observation.
 */
export function createEvent(input: NewEventInput): CanonicalEvent {
  return parseCanonicalEvent({
    schemaVersion: CANONICAL_EVENT_SCHEMA_VERSION,
    eventId: input.eventId ?? newEventId(),
    ingestOrigin: input.ingestOrigin ?? "mode_a_simulation",
    organizationId: input.organizationId,
    projectId: input.projectId,
    experimentId: input.experimentId,
    runId: input.runId,
    sessionId: input.sessionId,
    agentId: input.agentId,
    sequence: input.sequence,
    timestamp: input.timestamp ?? new Date().toISOString(),
    runtimeMs: input.runtimeMs,
    source: input.source,
    type: input.type,
    visibility: input.visibility ?? "internal",
    payload: input.payload,
  });
}
