import { describe, expect, it } from "vitest";
import { EventSource, EventType } from "@agentlens/event-schema";
import { ObservationEngine } from "./index";

const ctx = { organizationId: "o", projectId: "p", runId: "r" };

describe("ObservationEngine", () => {
  it("assigns increasing sequence numbers and preserves capture order", () => {
    const obs = new ObservationEngine(ctx);
    obs.record({ source: EventSource.Agent, type: EventType.AgentStarted, payload: { runtime: "x" } });
    obs.record({ source: EventSource.Search, type: EventType.SearchQuery, payload: { query: "q" } });

    const events = obs.events();
    expect(events.map((e) => e.sequence)).toEqual([0, 1]);
    expect(events.at(0)?.type).toBe("agent.started");
    expect(events.at(1)?.type).toBe("search.query");

    const summary = obs.summary();
    expect(summary.capturedEvents).toBe(2);
    expect(summary.completeness).toBe(1);
    expect(summary.status).toBe("complete");
  });

  it("drops invalid observations and reports degraded completeness separately", () => {
    const obs = new ObservationEngine(ctx);
    obs.record({ source: EventSource.Agent, type: EventType.AgentStarted, payload: { runtime: "x" } });
    // Missing required `status` → cannot normalize → dropped.
    obs.record({
      source: EventSource.Network,
      type: EventType.NetworkResponse,
      payload: { url: "https://x.test" },
    });

    const summary = obs.summary();
    expect(summary.capturedEvents).toBe(1);
    expect(summary.expectedEvents).toBe(2);
    expect(summary.status).toBe("degraded");
    expect(summary.completeness).toBeCloseTo(0.5);
    expect(obs.dropped()).toHaveLength(1);
  });
});
