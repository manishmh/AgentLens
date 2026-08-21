import { describe, expect, it } from "vitest";
import { EventPipeline } from "./pipeline";
import { EventSource, EventType } from "@agentlens/event-schema";
import { createEvent } from "@agentlens/event-schema";

describe("EventPipeline", () => {
  const baseContext = {
    organizationId: "org-1",
    projectId: "proj-1",
    runId: "run-1",
  };

  it("validates and ingests canonical events", () => {
    const pipeline = new EventPipeline();
    const e1 = createEvent({
      ...baseContext,
      sequence: 1,
      runtimeMs: 100,
      source: EventSource.Browser,
      type: EventType.BrowserStarted,
      payload: { browser: "chromium", version: "100" },
    });

    pipeline.ingest([e1]);
    expect(pipeline.events()).toHaveLength(1);
    expect(pipeline.rejected()).toHaveLength(0);
    expect(pipeline.events()[0]!.type).toBe(EventType.BrowserStarted);
  });

  it("rejects malformed events", () => {
    const pipeline = new EventPipeline();
    pipeline.ingest([
      { invalid: "event" },
      { schemaVersion: "1", type: "non-existent-type" },
    ]);
    expect(pipeline.events()).toHaveLength(0);
    expect(pipeline.rejected()).toHaveLength(2);
  });

  it("maintains chronological ordering regardless of ingest order", () => {
    const pipeline = new EventPipeline();
    
    const e1 = createEvent({ ...baseContext, sequence: 1, runtimeMs: 10, source: EventSource.Browser, type: EventType.BrowserStarted, payload: { browser: "chrome", version: "100" } });
    const e2 = createEvent({ ...baseContext, sequence: 2, runtimeMs: 20, source: EventSource.Browser, type: EventType.BrowserNavigation, payload: { url: "about:blank" } });
    const e3 = createEvent({ ...baseContext, sequence: 3, runtimeMs: 30, source: EventSource.Browser, type: EventType.BrowserClick, payload: { selector: "button" } });

    // Ingest out of order
    pipeline.ingest([e3, e1]);
    pipeline.ingest([e2]);

    const events = pipeline.events();
    expect(events).toHaveLength(3);
    expect(events[0]!.sequence).toBe(1);
    expect(events[1]!.sequence).toBe(2);
    expect(events[2]!.sequence).toBe(3);
  });

  it("redacts sensitive data from payloads and urls", () => {
    const pipeline = new EventPipeline();
    
    const e1 = createEvent({
      ...baseContext,
      sequence: 1,
      runtimeMs: 10,
      source: EventSource.Network,
      type: EventType.NetworkRequest,
      payload: {
        url: "https://example.com/api?token=secret123&query=search",
        method: "GET",
        body: "sensitive body",
        headers: {
          "Authorization": "Bearer secret",
          "Accept": "application/json"
        }
      }
    });

    const e2 = createEvent({
      ...baseContext,
      sequence: 2,
      runtimeMs: 20,
      source: EventSource.Browser,
      type: EventType.BrowserInput,
      payload: {
        selector: "#password",
        text: "my-password",
        redacted: false
      }
    });

    pipeline.ingest([e1, e2]);
    const events = pipeline.events();
    
    const req = events[0]!.payload as Record<string, unknown>;
    expect(req.url).toContain("token=%5BREDACTED%5D");
    expect(req.url).toContain("query=search");
    // Body and headers are stripped by the NetworkRequest Zod schema anyway,
    // but the redaction logic acts as a second line of defense if schema ever allows them.
    expect(req.body).toBeUndefined();
    expect(req.headers).toBeUndefined();

    const input = events[1]!.payload as Record<string, unknown>;
    expect(input.text).toBe("[REDACTED]");
    expect(input.redacted).toBe(true);
  });

  it("extracts artifacts from events", () => {
    const pipeline = new EventPipeline();
    
    const e1 = createEvent({
      ...baseContext,
      sequence: 1,
      runtimeMs: 10,
      source: EventSource.Browser,
      type: EventType.Screenshot,
      payload: {
        artifact: {
          artifactId: "art-1",
          kind: "screenshot",
          path: "screenshots/art-1.png",
          contentType: "image/png",
          sizeBytes: 1000,
          visibility: "internal"
        }
      }
    });

    pipeline.ingest([e1]);
    expect(pipeline.events()).toHaveLength(1);
    expect(pipeline.artifacts()).toHaveLength(1);
    expect(pipeline.artifacts()[0]!.artifactId).toBe("art-1");
  });
});
