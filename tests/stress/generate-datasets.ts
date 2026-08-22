import fs from "fs/promises";
import path from "path";
import type {
  RunManifest,
  Task,
  Reproducibility,
  AgentDescriptor,
  ObservationSummary,
  EvaluationResult,
  CanonicalEvent,
} from "../../packages/event-schema/src";
import { EventType, EventSource } from "../../packages/event-schema/src";
import { createEvent } from "../../packages/event-schema/src/event";

const OUT_DIR = path.join(process.cwd(), ".artifacts", "stress-datasets");

const baseContext = {
  organizationId: "org-stress",
  projectId: "proj-stress",
  experimentId: "exp-stress",
  runId: "run-stress",
};

function generateRealisticRun(runId: string, withFailures: boolean = false): RunManifest {
  const events: CanonicalEvent[] = [];
  
  // Start task
  events.push(createEvent({
    ...baseContext,
    runId,
    sequence: 1,
    runtimeMs: 0,
    source: "agent",
    type: EventType.AgentStarted,
    payload: { runtime: "test-runtime", model: "test-model" }
  }));
  let sequence = 2;
  // Agent prompt (user message)
  events.push(createEvent({
    ...baseContext,
    runId,
    sequence: sequence++,
    runtimeMs: 10,
    source: "agent",
    type: EventType.AgentMessage,
    payload: { role: "user", text: "Suggest me the best phone to buy under ₹20,000 in India..." }
  }));

  // Simulate long research journey
  let runtimeMs = 1000;

  const competitors = [
    "competitor-one.in",
    "competitor-two.com",
    "competitor-three.co.in",
    "competitor-four.com",
    "competitor-five.com",
    "competitor-six.com",
    "competitor-seven.com",
    "competitor-eight.com",
    "competitor-nine.com",
    "competitor-ten.com",
  ];

  const searchPayload = {
    query: "best phone under 20000 india",
    results: competitors.map((c, idx) => ({ url: `https://${c}/products`, title: `Buy phone at ${c}`, rank: idx + 1 }))
  };

  events.push(createEvent({
    ...baseContext,
    runId,
    sequence: sequence++,
    runtimeMs,
    source: "browser",
    type: EventType.SearchResults,
    payload: searchPayload
  }));

  // Agent visits several competitors
  for (let i = 0; i < 6; i++) {
    runtimeMs += 2000;
    events.push(createEvent({
      ...baseContext,
      runId,
      sequence: sequence++,
      runtimeMs,
      source: "browser",
      type: EventType.BrowserNavigation,
      payload: { url: `https://${competitors[i]}/products/latest` }
    }));
    
    runtimeMs += 500;
    events.push(createEvent({
      ...baseContext,
      runId,
      sequence: sequence++,
      runtimeMs,
      source: "network",
      type: EventType.NetworkResponse,
      payload: { url: `https://${competitors[i]}/api/pricing`, status: withFailures && i === 2 ? 500 : 200 }
    }));

    if (withFailures && i === 2) {
      events.push(createEvent({
        ...baseContext,
        runId,
        sequence: sequence++,
        runtimeMs,
        source: "browser",
        type: EventType.BrowserError,
        payload: { message: "Failed to load pricing details" }
      }));
    }
  }

  runtimeMs += 10000;
  // Final recommendation
  events.push(createEvent({
    ...baseContext,
    runId,
    sequence: sequence++,
    runtimeMs,
    source: "agent",
    type: EventType.AgentFinished,
    payload: {
      ok: !withFailures,
      finalAnswer: withFailures 
        ? "I could not complete the research due to a pricing API error." 
        : `I recommend checking out https://${competitors[0]} and https://${competitors[1]} for the best options.`
    }
  }));

  return {
    schemaVersion: "1",
    metadata: {
      runId,
      organizationId: "org-stress",
      projectId: "proj-stress",
      experimentId: "exp-stress",
      createdAt: new Date().toISOString(),
      status: "complete",
      executionStatus: withFailures ? "failed" : "success",
      observationStatus: "complete",
      evaluationStatus: "pending",
      visibility: "internal"
    },
    task: {
      taskId: "task-1",
      title: "Find a phone under 20k",
      instruction: "Suggest me the best phone to buy under ₹20,000 in India...",
      version: "1",
      target: "https://customer.com"
    },
    environment: {
      agentRuntime: "test-runtime",
      agentRuntimeVersion: "1.0",
      taskVersion: "1.0",
      experimentConfig: { competitors }
    },
    agent: {
      agentId: "agent-1",
      provider: "test-provider",
      runtime: "test-runtime"
    },
    observation: {
      expectedEvents: events.length,
      capturedEvents: events.length,
      completeness: 1.0,
      status: "complete"
    },
    events
  };
}

function generateLargeStressRun(): RunManifest {
  const run = generateRealisticRun("run-stress-large");
  run.task.instruction = "A".repeat(50000); // 50k char prompt
  
  const lastEvent = run.events[run.events.length - 1];
  lastEvent.payload = {
    ok: true,
    finalAnswer: "A".repeat(100000) // 100k char answer
  };

  for(let i=0; i<1000; i++) {
    run.events.push(createEvent({
      ...baseContext,
      runId: "run-stress-large",
      sequence: 100 + i,
      runtimeMs: 20000 + i,
      source: "browser",
      type: EventType.BrowserNavigation,
      payload: { url: `https://competitor-three.co.in/page${i}` }
    }));
  }

  // Add out-of-order and duplicated sequences
  run.events.push(createEvent({
    ...baseContext,
    runId: "run-stress-large",
    sequence: 50, // Out of order
    runtimeMs: 15000,
    source: "network",
    type: EventType.NetworkResponse,
    payload: { url: "https://customer.com", status: 200 }
  }));

  run.observation.expectedEvents = run.events.length;
  run.observation.capturedEvents = run.events.length;
  return run;
}

export async function generateAll() {
  await fs.mkdir(OUT_DIR, { recursive: true });
  
  // 1. Realistic Dataset
  const realisticRun = generateRealisticRun("run-realistic-1");
  await fs.writeFile(path.join(OUT_DIR, "realistic-run.json"), JSON.stringify(realisticRun, null, 2));

  // 2. Large Stress Run
  const largeStressRun = generateLargeStressRun();
  await fs.writeFile(path.join(OUT_DIR, "large-stress-run.json"), JSON.stringify(largeStressRun));

  // 3. Multi-run Experiment (dozens of runs)
  const experimentRuns = [];
  for (let i = 0; i < 50; i++) {
    // ~20% failure rate
    experimentRuns.push(generateRealisticRun(`exp-run-${i}`, i % 5 === 0));
  }
  await fs.writeFile(path.join(OUT_DIR, "experiment-runs.json"), JSON.stringify(experimentRuns));

  console.log("Datasets generated successfully at", OUT_DIR);
}

generateAll().catch(console.error);
