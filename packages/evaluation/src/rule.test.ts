import { describe, expect, it } from "vitest";
import { RuleEvaluator } from "./rule";
import type { RunManifest } from "@agentlens/event-schema";
import { EventType, EventSource } from "@agentlens/event-schema";

function buildRun(
  events: Record<string, unknown>[] = [],
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
      evaluationStatus: "skipped",
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
    ...overrides,
  } as unknown as RunManifest;
}

describe("RuleEvaluator", () => {
  const evaluator = new RuleEvaluator();

  it("successful task evaluation with full evidence", async () => {
    const run = buildRun(
      [
        {
          source: EventSource.Browser,
          type: EventType.BrowserNavigation,
          payload: { url: "https://customer.com/pricing" },
        },
        {
          source: EventSource.Network,
          type: EventType.NetworkResponse,
          payload: { status: 200 },
        },
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "Customer pricing is $20/mo at customer.com" },
        },
      ],
      {
        task: {
          taskId: "task-1",
          title: "Find",
          instruction: "Do",
          version: "1",
          target: "https://customer.com",
        },
      },
    );

    const result = await evaluator.evaluate({ run, task: run.task });
    expect(result.metrics.customer_discovered).toBe(true);
    expect(result.metrics.customer_recommended).toBe(true);
    expect(result.metrics.interaction_success).toBe(true);
    expect(result.metrics.required_information_found).toBe(true);
    expect(result.metrics.task_success).toBe(true);
    expect(result.metrics.competitor_recommended).toBe(false);
  });

  it("evaluates customer discovered via search results", async () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.SearchResults,
          payload: { results: [{ url: "https://customer.com/about" }] },
        },
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: false, finalAnswer: "Couldn't find it" },
        },
      ],
      {
        task: {
          taskId: "1",
          title: "1",
          instruction: "1",
          version: "1",
          target: "https://customer.com",
        },
      },
    );

    const result = await evaluator.evaluate({ run, task: run.task });
    expect(result.metrics.customer_discovered).toBe(true);
    expect(result.metrics.customer_recommended).toBe(false);
  });

  it("evaluates competitor recommended", async () => {
    const run = buildRun(
      [
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "You should use competitor.com instead" },
        },
      ],
      {
        environment: {
          agentRuntime: "test",
          agentRuntimeVersion: "1",
          taskVersion: "1",
          experimentConfig: { competitors: ["https://competitor.com"] },
        },
      },
    );

    const result = await evaluator.evaluate({ run, task: run.task });
    expect(result.metrics.competitor_recommended).toBe(true);
  });

  it("evaluates missing evidence (empty/incomplete runs)", async () => {
    const run = buildRun([]);
    const result = await evaluator.evaluate({ run, task: run.task });

    expect(result.metrics.customer_discovered).toBe(false);
    expect(result.metrics.customer_recommended).toBe(false);
    expect(result.metrics.competitor_recommended).toBe(false);
    expect(result.metrics.interaction_success).toBe(false);
    expect(result.metrics.required_information_found).toBe(false);
    expect(result.metrics.task_success).toBe(false);
  });

  it("evaluates conflicting evidence (error prevents interaction success)", async () => {
    const run = buildRun([
      {
        source: EventSource.Network,
        type: EventType.NetworkResponse,
        payload: { status: 200 },
      },
      {
        source: EventSource.Browser,
        type: EventType.BrowserError,
        payload: { message: "Crash" },
      },
      {
        source: EventSource.Agent,
        type: EventType.AgentFinished,
        payload: { ok: true, finalAnswer: "Done" },
      },
    ]);

    const result = await evaluator.evaluate({ run, task: run.task });
    // Had a 200 response, but also a BrowserError. Interaction success should be false.
    expect(result.metrics.interaction_success).toBe(false);
    // Task success depends on interaction success.
    expect(result.metrics.task_success).toBe(false);
    // But information was found.
    expect(result.metrics.required_information_found).toBe(true);
  });

  it("deterministic repeated evaluation of the same RunManifest", async () => {
    const run = buildRun(
      [
        {
          source: EventSource.Network,
          type: EventType.NetworkResponse,
          payload: { status: 200 },
        },
        {
          source: EventSource.Agent,
          type: EventType.AgentFinished,
          payload: { ok: true, finalAnswer: "Customer pricing is $20/mo at customer.com" },
        },
      ],
      {
        task: {
          taskId: "task-1",
          title: "Find",
          instruction: "Do",
          version: "1",
          target: "https://customer.com",
        },
      },
    );

    const result1 = await evaluator.evaluate({ run, task: run.task });
    const result2 = await evaluator.evaluate({ run, task: run.task });

    // The timestamp evaluatedAt will differ, so we omit it for equality check
    const { evaluatedAt: _t1, ...metrics1 } = result1;
    const { evaluatedAt: _t2, ...metrics2 } = result2;

    expect(metrics1).toEqual(metrics2);
  });
});
