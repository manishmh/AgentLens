/**
 * Milestone 0 demo: run the synthetic browser agent through the full pipeline and
 * write a reconstructable run.json + artifacts. This is the docs/10 §34 "first
 * engineering task" proven with an in-process fixture (no external services), so the
 * pipeline can be validated before the Vercel Sandbox / Playwright providers land.
 *
 *   pnpm runner:demo [targetUrl]
 */
import { SyntheticAgentRuntime } from "@agentlens/agent-runtime";
import { RuleEvaluator } from "@agentlens/evaluation";
import type { Task } from "@agentlens/event-schema";
import { LocalSandboxProvider } from "@agentlens/sandbox";
import { loadEnv, newOrganizationId, newProjectId } from "@agentlens/shared";
import { executeRun } from "./orchestrator";

async function main(): Promise<void> {
  const env = loadEnv();
  const target = process.argv[2] ?? "https://example.com";

  const task: Task = {
    taskId: "task_pricing_lookup",
    title: `Find the pricing information for ${target}`,
    instruction: `Find the pricing information for ${target}.`,
    version: "1",
    target,
    successCriteria: "The agent reports the product's pricing with a supporting source.",
  };

  const outcome = await executeRun({
    organizationId: newOrganizationId(),
    projectId: newProjectId(),
    task,
    target,
    competitors: ["competitor.example"],
    provider: new LocalSandboxProvider(),
    agent: new SyntheticAgentRuntime(),
    evaluator: new RuleEvaluator(),
    sandboxSpec: { limits: { wallClockTimeoutMs: 120_000 }, network: { mode: "internet" } },
    outputRoot: env.ARTIFACTS_DIR,
  });

  const { manifest, outputDir } = outcome;
  console.log("Run complete.");
  console.log(`  runId:                ${manifest.metadata.runId}`);
  console.log(`  execution status:     ${manifest.metadata.executionStatus}`);
  console.log(`  observation status:   ${manifest.metadata.observationStatus}`);
  console.log(
    `  observation complete: ${manifest.observation.capturedEvents}/${manifest.observation.expectedEvents} ` +
      `(${Math.round(manifest.observation.completeness * 100)}%)`,
  );
  console.log(`  events captured:      ${manifest.events.length}`);
  console.log(`  artifacts:            ${manifest.artifacts.length}`);
  if (manifest.evaluation) {
    console.log(`  metrics:              ${JSON.stringify(manifest.evaluation.metrics)}`);
  }
  console.log(`  output:               ${outputDir}/run.json`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
