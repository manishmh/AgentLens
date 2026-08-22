import { describe, expect, it } from "vitest";
import { RuleFindingGenerator } from "./finding";
import type { RunManifest, Finding } from "@agentlens/event-schema";
import { findingSchema, EventType, EventSource } from "@agentlens/event-schema";

function buildRun(
  events: Record<string, unknown>[] = [],
  metrics: Record<string, unknown> | undefined = undefined,
  overrides: Partial<RunManifest> = {},
): RunManifest {
  return {
    schemaVersion: "1",
    metadata: {
      runId: "run-1",
      organizationId: "org-1",
      projectId: "proj-1",
      createdAt: new Date().toISOString(),
      status: "completed",
      executionStatus: "success",
      observationStatus: "complete",
      evaluationStatus: "complete",
      visibility: "customer_sensitive",
    },
    task: {
      taskId: "task-1",
      title: "Test task",
      instruction: "Do something",
      version: "1",
    },
    environment: {
      agentRuntime: "test",
      agentRuntimeVersion: "1",
      taskVersion: "1",
    },
    agent: {
      agentId: "agent-1",
      provider: "test",
      runtime: "test",
    },
    observation: {
      expectedEvents: events.length,
      capturedEvents: events.length,
      completeness: 1,
      status: "complete",
    },
    events: events.map((e, i) => ({
      schemaVersion: "1",
      eventId: `evt-${i}`,
      runId: "run-1",
      timestamp: new Date().toISOString(),
      sequence: i + 1,
      visibility: "internal",
      ...e,
    })),
    artifacts: [],
    findings: [],
    evaluation: metrics
      ? {
          evaluator: "test",
          evaluatorVersion: "1",
          evaluatedAt: new Date().toISOString(),
          status: "complete",
          metrics,
        }
      : undefined,
    ...overrides,
  } as unknown as RunManifest;
}

describe("RuleFindingGenerator", () => {
  const generator = new RuleFindingGenerator();

  it("produces no unnecessary findings for a fully successful run", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Browser,
          type: EventType.BrowserNavigation,
          payload: { url: "https://customer.com" },
        },
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "All good" },
        },
      ],
      {
        task_success: true,
        customer_discovered: true,
        customer_recommended: true,
        competitor_recommended: false,
        required_information_found: true,
        interaction_success: true,
      },
    );

    const findings = generator.generate(run);
    expect(findings).toHaveLength(0);
  });

  it("handles insufficient evidence (missing metrics)", () => {
    const run = buildRun([], undefined); // no evaluation block
    const findings = generator.generate(run);
    expect(findings).toHaveLength(0); // Do not manufacture finding without metrics
  });

  it("generates Interaction failure finding with valid evidence", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Browser,
          type: EventType.BrowserError,
          payload: { message: "Crash" },
        },
      ],
      {
        interaction_success: false,
      },
    );
    const findings = generator.generate(run);
    expect(findings).toHaveLength(1);
    const f = findings[0]!;
    findingSchema.parse(f); // schema validation
    expect(f.category).toBe("Interaction");
    expect(f.evidenceClass).toBe("observed");
    expect(f.evidence).toHaveLength(1);
    expect(f.evidence[0]!.eventId).toBe("evt-0");
  });

  it("generates Task failure and required information missing", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: false, finalAnswer: "Failed" },
        },
      ],
      {
        task_success: false,
        required_information_found: false,
      },
    );
    const findings = generator.generate(run);
    expect(findings).toHaveLength(2);

    const fInfo = findings.find((f) => f.observation.includes("specific information"));
    expect(fInfo).toBeDefined();
    findingSchema.parse(fInfo);
    expect(fInfo!.evidence[0]!.eventId).toBe("evt-0");

    const fTask = findings.find((f) => f.observation.includes("overall task"));
    expect(fTask).toBeDefined();
    findingSchema.parse(fTask);
    expect(fTask!.evidence[0]!.eventId).toBe("evt-0");
  });

  it("generates Discovery failure", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "No customer here" },
        },
      ],
      {
        customer_discovered: false,
      },
    );
    const findings = generator.generate(run);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe("Discovery");
    expect(findings[0]!.evidence[0]!.eventId).toBe("evt-0"); // the final answer
    findingSchema.parse(findings[0]);
  });

  it("generates Customer discovered but not recommended", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.SearchResults,
          payload: { results: [{ url: "https://customer.com" }] }, // evt-0
        },
        {
          source: EventSource.Browser,
          type: EventType.BrowserNavigation,
          payload: { url: "https://customer.com" }, // evt-1
        },
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "Competitor is better" }, // evt-2
        },
      ],
      {
        customer_discovered: true,
        customer_recommended: false,
      },
    );
    const findings = generator.generate(run);
    expect(findings).toHaveLength(1);
    const f = findings[0]!;
    expect(f.category).toBe("Recommendation");
    expect(f.evidence).toHaveLength(3); // The two discovery events + final answer
    expect(f.evidence.map((e) => e.eventId)).toEqual(["evt-0", "evt-1", "evt-2"]);
    findingSchema.parse(f);
  });

  it("generates Competitor recommended", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "Use competitor.com" },
        },
      ],
      {
        competitor_recommended: true,
      },
    );
    const findings = generator.generate(run);
    expect(findings).toHaveLength(1);
    expect(findings[0]!.category).toBe("Recommendation");
    expect(findings[0]!.observation).toContain("recommended competitor(s)");
    findingSchema.parse(findings[0]);
  });

  it("generates deterministic repeated generation", () => {
    const run = buildRun(
      [
        {
          source: EventSource.Browser,
          type: EventType.BrowserError,
          payload: { message: "Crash" },
        },
      ],
      {
        interaction_success: false,
      },
    );
    const findings1 = generator.generate(run);
    const findings2 = generator.generate(run);

    // findingId is generated newly each time, so omit it for deep equality
    const clean = (arr: Finding[]) =>
      arr.map((f) => {
        const { findingId: _, ...rest } = f;
        return rest;
      });

    expect(clean(findings1)).toEqual(clean(findings2));
  });
});
