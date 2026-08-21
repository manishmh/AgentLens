import {
  createEvent,
  type CanonicalEvent,
  type EventContext,
  type EventSource,
  type EventType,
  type IngestOrigin,
  type ObservationSummary,
  type Visibility,
} from "@agentlens/event-schema";
import { RunClock } from "./clock";

/** A single observation to normalize into a canonical event. */
export interface ObservationInput {
  source: EventSource;
  type: EventType;
  payload: unknown;
  visibility?: Visibility;
  /** Override correlation ids for this event (e.g. the agent/session that produced it). */
  agentId?: string;
  sessionId?: string;
}

/** An observation that failed to normalize/validate and was therefore dropped. */
export interface DroppedObservation {
  type: EventType;
  source: EventSource;
  reason: string;
}

/**
 * The Observation Engine is the platform's own evidence layer (docs/10 §6). It is the
 * canonical sink: every observer routes raw observations here, where they are stamped
 * with sequence + timing, normalized into a {@link CanonicalEvent}, ordered, and held.
 *
 * It is deliberately independent of any agent framework's telemetry (docs/10 §35 rule 4)
 * and of the dashboard (docs/10 §15), and it is ingest-mode agnostic so Mode B telemetry
 * can flow through the same path later.
 */
export class ObservationEngine {
  private readonly clock = new RunClock();
  private readonly _events: CanonicalEvent[] = [];
  private readonly _dropped: DroppedObservation[] = [];
  private expected = 0;
  private captured = 0;

  constructor(
    private readonly context: EventContext,
    private readonly options: { ingestOrigin?: IngestOrigin } = {},
  ) {}

  /**
   * Declare that N events are anticipated but might be lost before they reach the sink
   * (e.g. an observer crashed). This lowers completeness even when nothing was recorded.
   */
  expect(n = 1): void {
    this.expected += n;
  }

  /**
   * Normalize and record one observation. Each call counts as one expected event; a
   * successfully normalized event also counts as captured. Failures are dropped (never
   * throw into the agent's execution path) and reduce observation completeness.
   */
  record(input: ObservationInput): CanonicalEvent | undefined {
    this.expected += 1;
    try {
      const event = createEvent({
        ...this.context,
        agentId: input.agentId ?? this.context.agentId,
        sessionId: input.sessionId ?? this.context.sessionId,
        sequence: this.clock.nextSequence(),
        runtimeMs: this.clock.runtimeMs(),
        timestamp: this.clock.wallClock(),
        source: input.source,
        type: input.type,
        payload: input.payload,
        visibility: input.visibility,
        ingestOrigin: this.options.ingestOrigin,
      });
      this._events.push(event);
      this.captured += 1;
      return event;
    } catch (err) {
      this._dropped.push({
        type: input.type,
        source: input.source,
        reason: err instanceof Error ? err.message : String(err),
      });
      return undefined;
    }
  }

  /** Events in capture order (already sequenced). */
  events(): readonly CanonicalEvent[] {
    return this._events;
  }

  dropped(): readonly DroppedObservation[] {
    return this._dropped;
  }

  /** Observation completeness metric (docs/10 §16, docs/07 §82). */
  summary(): ObservationSummary {
    const completeness = this.expected === 0 ? 1 : this.captured / this.expected;
    const status =
      this.captured === 0 && this.expected > 0
        ? "failed"
        : this.captured < this.expected
          ? "degraded"
          : "complete";
    return {
      expectedEvents: this.expected,
      capturedEvents: this.captured,
      completeness,
      status,
    };
  }
}
