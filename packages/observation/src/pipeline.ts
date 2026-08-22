import {
  parseCanonicalEvent,
  EventType,
  type CanonicalEvent,
  type ArtifactRef,
  type RunManifest,
} from "@agentlens/event-schema";

export class EventPipeline {
  private readonly _events: CanonicalEvent[] = [];
  private readonly _artifacts = new Map<string, ArtifactRef>();
  private readonly _rejected: { raw: unknown; reason: string }[] = [];

  /**
   * Ingest raw or partially processed events.
   * Validates against the schema, redacts sensitive info, extracts artifacts,
   * and preserves deterministic chronological ordering.
   */
  ingest(events: readonly unknown[]): void {
    const validEvents: CanonicalEvent[] = [];

    for (const raw of events) {
      try {
        // 1. Validation (Rejects malformed)
        const event = parseCanonicalEvent(raw);

        // 2. Redaction / Privacy
        const redacted = this.redact(event);

        // 3. Artifact Handling
        this.extractArtifacts(redacted);

        validEvents.push(redacted);
      } catch (err) {
        this._rejected.push({
          raw,
          reason: err instanceof Error ? err.message : String(err),
        });
      }
    }

    // 4. Ordering
    this._events.push(...validEvents);
    this._events.sort((a, b) => {
      // Primary: monotonically increasing sequence
      if (a.sequence !== b.sequence) return a.sequence - b.sequence;
      // Fallback: runtime elapsed
      if (a.runtimeMs !== b.runtimeMs) return a.runtimeMs - b.runtimeMs;
      // Fallback: timestamp
      return a.timestamp.localeCompare(b.timestamp);
    });
  }

  private redact(event: CanonicalEvent): CanonicalEvent {
    const payload = event.payload as Record<string, unknown>;
    if (!payload || typeof payload !== "object") return event;

    const redactedPayload = { ...payload };

    // Redact URLs
    if (typeof redactedPayload.url === "string") {
      redactedPayload.url = this.redactUrl(redactedPayload.url);
    }

    // Never persist raw request/response bodies unless explicitly required
    if ("body" in redactedPayload) {
      delete redactedPayload.body;
    }

    // Redact browser inputs
    if (event.type === EventType.BrowserInput && !redactedPayload.redacted) {
      redactedPayload.text = "[REDACTED]";
      redactedPayload.redacted = true;
    }

    // Redact sensitive headers (e.g. from network requests/responses if they are ever included)
    if (redactedPayload.headers && typeof redactedPayload.headers === "object") {
      const headers = redactedPayload.headers as Record<string, string>;
      const redactedHeaders: Record<string, string> = {};
      const sensitiveHeaderKeys = ["authorization", "cookie", "set-cookie", "x-api-key"];

      for (const [key, value] of Object.entries(headers)) {
        if (sensitiveHeaderKeys.some((k) => key.toLowerCase().includes(k))) {
          redactedHeaders[key] = "[REDACTED]";
        } else {
          redactedHeaders[key] = value;
        }
      }
      redactedPayload.headers = redactedHeaders;
    }

    return { ...event, payload: redactedPayload };
  }

  private redactUrl(urlString: string): string {
    try {
      const url = new URL(urlString);
      const sensitiveParams = ["token", "key", "auth", "password", "secret", "code", "session"];

      for (const [key] of url.searchParams.entries()) {
        if (sensitiveParams.some((p) => key.toLowerCase().includes(p))) {
          url.searchParams.set(key, "[REDACTED]");
        }
      }
      return url.toString();
    } catch {
      // If it's not a valid URL (e.g. relative path), return as is
      return urlString;
    }
  }

  private extractArtifacts(event: CanonicalEvent) {
    const payload = event.payload as Record<string, unknown>;
    if (payload && payload.artifact && typeof payload.artifact === "object") {
      const artifact = payload.artifact as ArtifactRef;
      if (artifact.artifactId) {
        this._artifacts.set(artifact.artifactId, artifact);
      }
    }
  }

  events(): readonly CanonicalEvent[] {
    return this._events;
  }

  artifacts(): readonly ArtifactRef[] {
    return Array.from(this._artifacts.values());
  }

  rejected() {
    return this._rejected;
  }

  /**
   * Run Reconstruction (docs/10 §11)
   * Builds the complete chronological run from ingested events.
   */
  reconstruct(base: Omit<RunManifest, "events">): RunManifest {
    return {
      ...base,
      events: [...this._events],
    };
  }
}
