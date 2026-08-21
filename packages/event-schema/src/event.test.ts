import { describe, expect, it } from "vitest";
import {
  createEvent,
  EventSource,
  EventType,
  safeParseCanonicalEvent,
} from "./index";

const ctx = { organizationId: "org_1", projectId: "proj_1", runId: "run_1" };

describe("canonical event", () => {
  it("creates and validates a typed event, filling defaults", () => {
    const e = createEvent({
      ...ctx,
      sequence: 0,
      runtimeMs: 0,
      source: EventSource.Search,
      type: EventType.SearchQuery,
      payload: { query: "acme pricing", engine: "synthetic" },
    });
    expect(e.type).toBe("search.query");
    expect(e.schemaVersion).toBe("1");
    expect(e.visibility).toBe("internal");
    expect(e.ingestOrigin).toBe("mode_a_simulation");
    expect(e.eventId).toMatch(/^evt_/);
  });

  it("rejects an invalid payload for a known event type", () => {
    expect(() =>
      createEvent({
        ...ctx,
        sequence: 0,
        runtimeMs: 0,
        source: EventSource.Network,
        type: EventType.NetworkResponse,
        payload: { url: "https://x.test", status: "not-a-number" },
      }),
    ).toThrow();
  });

  it("accepts a generic payload for a type without a registered schema", () => {
    const e = createEvent({
      ...ctx,
      sequence: 0,
      runtimeMs: 0,
      source: EventSource.Browser,
      type: EventType.BrowserScroll,
      payload: { x: 0, y: 100 },
    });
    expect(e.type).toBe("browser.scroll");
  });

  it("safeParse surfaces payload validation failures", () => {
    const res = safeParseCanonicalEvent({
      schemaVersion: "1",
      eventId: "evt_x",
      organizationId: "o",
      projectId: "p",
      runId: "r",
      sequence: 0,
      timestamp: new Date().toISOString(),
      runtimeMs: 0,
      source: "search",
      type: "search.query",
      payload: {}, // missing required `query`
    });
    expect(res.success).toBe(false);
  });
});
