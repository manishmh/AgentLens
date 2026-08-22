import { describe, it, expect } from "vitest";
import { ExperimentAggregator } from "./aggregator";
import type { RunManifest, CanonicalEvent } from "@agentlens/event-schema";
import { EventType } from "@agentlens/event-schema";

function createMockRun(opts: {
  status: string;
  evalStatus?: "complete" | "failed";
  metrics?: Record<string, string | number | boolean | string[] | null>;
  events?: CanonicalEvent[];
}): RunManifest {
  return {
    schemaVersion: "1",
    metadata: {
      runId: "run_1",
      organizationId: "org_1",
      projectId: "proj_1",
      createdAt: new Date().toISOString(),
      status: "completed",
      executionStatus: opts.status,
      observationStatus: "complete",
      evaluationStatus: opts.evalStatus || "complete",
      visibility: "customer_sensitive",
    },
    task: { taskId: "t1", title: "Test", instruction: "test", version: "1" },
    environment: { agentRuntime: "test", agentRuntimeVersion: "1", taskVersion: "1" },
    agent: { agentId: "a1", provider: "p1", runtime: "r1" },
    observation: {
      expectedEvents: 1,
      capturedEvents: 1,
      completeness: 1,
      status: opts.status === "success" ? "complete" : "failed",
    },
    events: opts.events || [],
    artifacts: [],
    evaluation: {
      evaluator: "rule-evaluator",
      evaluatorVersion: "1",
      evaluatedAt: new Date().toISOString(),
      status: opts.evalStatus || "complete",
      metrics: opts.metrics || {},
    },
    findings: [],
  };
}

describe("ExperimentAggregator", () => {
  const aggregator = new ExperimentAggregator();

  it("should correctly identify invalid runs", () => {
    const validRun = createMockRun({ status: "success" });
    const invalidRun = createMockRun({ status: "failed" });
    const invalidEval = createMockRun({ status: "success", evalStatus: "failed" });

    expect(ExperimentAggregator.isValidRun(validRun)).toBe(true);
    expect(ExperimentAggregator.isValidRun(invalidRun)).toBe(false);
    expect(ExperimentAggregator.isValidRun(invalidEval)).toBe(false);
  });

  it("should aggregate zero valid runs correctly", () => {
    const res = aggregator.aggregate("exp_1", "example.com", ["comp.com"], []);
    expect(res.runCounts.total).toBe(0);
    expect(res.runCounts.valid).toBe(0);
    expect(res.overallMetrics.taskSuccessRate).toBe(0);
    expect(res.customerMetrics.discoveryRate).toBe(0);
    expect(res.competitorMetrics["comp.com"]!.discoveryRate).toBe(0);
  });

  it("should aggregate single valid run correctly", () => {
    const run = createMockRun({
      status: "success",
      metrics: {
        task_success: true,
        customer_discovered: true,
        customer_recommended: false,
        discovered_competitors: ["comp.com"],
        recommended_competitors: ["comp.com"],
      },
      events: [
        { type: EventType.BrowserNavigation, payload: { url: "https://example.com/page" } },
        { type: EventType.BrowserNavigation, payload: { url: "https://comp.com/page" } },
        { type: EventType.BrowserNavigation, payload: { url: "https://comp.com/pricing" } },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ] as any[],
    });

    const res = aggregator.aggregate("exp_1", "example.com", ["comp.com"], [run]);
    expect(res.runCounts.valid).toBe(1);
    expect(res.overallMetrics.taskSuccessRate).toBe(1);
    expect(res.customerMetrics.discoveryRate).toBe(1);
    expect(res.customerMetrics.recommendationRate).toBe(0);
    expect(res.customerMetrics.pageVisits).toBe(1);

    expect(res.competitorMetrics["comp.com"]!.discoveryRate).toBe(1);
    expect(res.competitorMetrics["comp.com"]!.recommendationRate).toBe(1);
    expect(res.competitorMetrics["comp.com"]!.pageVisits).toBe(2);

    expect(res.sourceFrequency["example.com"]).toBe(1);
    expect(res.sourceFrequency["comp.com"]).toBe(1); // Seen in 1 valid run
  });

  it("should aggregate multiple runs and compute correct rates", () => {
    const run1 = createMockRun({
      status: "success",
      metrics: {
        task_success: true,
        customer_discovered: true,
        customer_recommended: true,
        discovered_competitors: [],
        recommended_competitors: [],
      },
    });
    const run2 = createMockRun({
      status: "success",
      metrics: {
        task_success: false,
        customer_discovered: false,
        customer_recommended: false,
        discovered_competitors: ["comp.com"],
        recommended_competitors: ["comp.com"],
      },
    });
    const run3 = createMockRun({ status: "failed" }); // Invalid

    const res = aggregator.aggregate("exp_1", "example.com", ["comp.com"], [run1, run2, run3]);

    expect(res.runCounts.total).toBe(3);
    expect(res.runCounts.valid).toBe(2);
    expect(res.runCounts.invalid).toBe(1);

    expect(res.overallMetrics.taskSuccessRate).toBe(0.5); // 1 out of 2 valid
    expect(res.customerMetrics.discoveryRate).toBe(0.5);
    expect(res.customerMetrics.recommendationRate).toBe(0.5);

    expect(res.competitorMetrics["comp.com"]!.discoveryRate).toBe(0.5);
    expect(res.competitorMetrics["comp.com"]!.recommendationRate).toBe(0.5);
  });
});
