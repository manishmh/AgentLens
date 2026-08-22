/**
 * Milestone 8 demo: run a multi-run experiment using the synthetic browser agent.
 *
 *   pnpm runner:experiment [targetUrl]
 */
import { SyntheticAgentRuntime } from "@agentlens/agent-runtime";
import { RuleEvaluator, ExperimentAggregator } from "@agentlens/evaluation";
import type { Task, RunManifest } from "@agentlens/event-schema";
import { LocalSandboxProvider } from "@agentlens/sandbox";
import { loadEnv, newOrganizationId, newProjectId, newExperimentId } from "@agentlens/shared";
import { executeRun } from "./orchestrator";
import * as fs from "node:fs/promises";
import * as path from "node:path";

async function main(): Promise<void> {
  const env = loadEnv();
  const target = process.argv[2] ?? "https://example.com";
  const competitors = ["competitor.example", "another-competitor.com"];
  const experimentId = newExperimentId();
  const orgId = newOrganizationId();
  const projId = newProjectId();

  const task: Task = {
    taskId: "task_pricing_lookup",
    title: `Find the pricing information for ${target} and compare with ${competitors.join(", ")}`,
    instruction: `Find the pricing information for ${target}.`,
    version: "1",
    target,
    successCriteria: "The agent reports the product's pricing with a supporting source.",
  };

  const runs: RunManifest[] = [];
  const runCount = 2; // Simulate a 2-run experiment

  console.log(`Starting Experiment: ${experimentId}`);
  console.log(`Target: ${target}`);
  console.log(`Competitors: ${competitors.join(", ")}`);
  console.log(`Planned runs: ${runCount}`);

  for (let i = 0; i < runCount; i++) {
    console.log(`\nExecuting Run ${i + 1}/${runCount}...`);
    const outcome = await executeRun({
      organizationId: orgId,
      projectId: projId,
      task,
      target,
      competitors,
      provider: new LocalSandboxProvider(),
      agent: new SyntheticAgentRuntime(),
      evaluator: new RuleEvaluator(),
      sandboxSpec: { limits: { wallClockTimeoutMs: 120_000 }, network: { mode: "internet" } },
      outputRoot: env.ARTIFACTS_DIR,
    });

    // Inject experiment info since the existing executeRun doesn't take experimentId right now
    outcome.manifest.metadata.experimentId = experimentId;
    runs.push(outcome.manifest);

    console.log(
      `  runId: ${outcome.manifest.metadata.runId} (${outcome.manifest.metadata.executionStatus})`,
    );
  }

  console.log("\nAggregating runs...");
  const aggregator = new ExperimentAggregator();
  const experimentResult = aggregator.aggregate(experimentId, target, competitors, runs);

  const outputPath = path.join(env.ARTIFACTS_DIR, `experiment_${experimentId}.json`);
  await fs.mkdir(env.ARTIFACTS_DIR, { recursive: true });
  await fs.writeFile(outputPath, JSON.stringify(experimentResult, null, 2));

  console.log("\nExperiment Result:");
  console.log(`  Total runs:   ${experimentResult.runCounts.total}`);
  console.log(`  Valid runs:   ${experimentResult.runCounts.valid}`);
  console.log(`  Invalid runs: ${experimentResult.runCounts.invalid}`);
  console.log(
    `  Task success rate: ${(experimentResult.overallMetrics.taskSuccessRate * 100).toFixed(1)}%`,
  );

  console.log(`\n  Customer Metrics (${target}):`);
  console.log(
    `    Discovery Rate:      ${(experimentResult.customerMetrics.discoveryRate * 100).toFixed(1)}%`,
  );
  console.log(
    `    Recommendation Rate: ${(experimentResult.customerMetrics.recommendationRate * 100).toFixed(1)}%`,
  );
  console.log(`    Page Visits:         ${experimentResult.customerMetrics.pageVisits}`);

  console.log(`\n  Competitor Metrics:`);
  for (const comp of competitors) {
    const cm = experimentResult.competitorMetrics[comp]!;
    console.log(`    ${comp}:`);
    console.log(`      Discovery Rate:      ${(cm.discoveryRate * 100).toFixed(1)}%`);
    console.log(`      Recommendation Rate: ${(cm.recommendationRate * 100).toFixed(1)}%`);
    console.log(`      Page Visits:         ${cm.pageVisits}`);
  }

  console.log(`\n  Source Frequency:`);
  for (const [src, freq] of Object.entries(experimentResult.sourceFrequency)) {
    console.log(`    ${src}: ${freq}`);
  }

  console.log(`\nOutput written to: ${outputPath}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
