import { mkdtemp, readFile, rm, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { SyntheticAgentRuntime } from "@agentlens/agent-runtime";
import { RuleEvaluator } from "@agentlens/evaluation";
import { parseRunManifest, type Task } from "@agentlens/event-schema";
import { LocalSandboxProvider } from "@agentlens/sandbox";
import { newOrganizationId, newProjectId } from "@agentlens/shared";
import { executeRun } from "@agentlens/runner";

function pricingTask(target: string): Task {
  return {
    taskId: "task_pricing",
    title: `Find the pricing information for ${target}`,
    instruction: `Find the pricing information for ${target}.`,
    version: "1",
    target,
    successCriteria: "Reports pricing with a supporting source.",
  };
}

describe("synthetic run pipeline (Milestone 0 end-to-end)", () => {
  it("produces a reconstructable run.json with a full canonical event trace", async () => {
    const out = await mkdtemp(join(tmpdir(), "agentlens-e2e-"));
    try {
      const { manifest, outputDir } = await executeRun({
        organizationId: newOrganizationId(),
        projectId: newProjectId(),
        task: pricingTask("https://example.com"),
        target: "https://example.com",
        competitors: ["competitor.example"],
        provider: new LocalSandboxProvider(),
        agent: new SyntheticAgentRuntime(),
        evaluator: new RuleEvaluator(),
        outputRoot: out,
      });

      // run.json is written and re-parses under the canonical schema.
      const raw = JSON.parse(await readFile(join(outputDir, "run.json"), "utf8"));
      const reparsed = parseRunManifest(raw);
      expect(reparsed.metadata.runId).toBe(manifest.metadata.runId);
      expect(reparsed.metadata.executionStatus).toBe("success");

      // The observable journey is fully present.
      const types = manifest.events.map((e) => e.type);
      for (const expected of [
        "run.started",
        "agent.started",
        "search.query",
        "search.results",
        "browser.navigation",
        "network.request",
        "network.response",
        "page.snapshot",
        "screenshot",
        "run.finished",
      ]) {
        expect(types).toContain(expected);
      }

      // Sequence is strictly increasing (reconstructable ordering).
      const seq = manifest.events.map((e) => e.sequence);
      expect(seq).toEqual([...seq].sort((a, b) => a - b));
      expect(new Set(seq).size).toBe(seq.length);

      // Observation is complete and artifacts landed on disk.
      expect(manifest.observation.status).toBe("complete");
      expect(manifest.observation.completeness).toBe(1);
      expect(manifest.artifacts.length).toBeGreaterThan(0);
      await expect(stat(join(outputDir, "screenshots/step-1.png"))).resolves.toBeTruthy();
      await expect(stat(join(outputDir, "artifacts/snapshot-1.html"))).resolves.toBeTruthy();

      // Deterministic evaluation metrics.
      expect(manifest.evaluation?.metrics.customer_discovered).toBe(true);
      expect(manifest.evaluation?.metrics.customer_recommended).toBe(true);
      expect(manifest.evaluation?.metrics.competitor_recommended).toBe(false);
      expect(manifest.evaluation?.metrics.task_success).toBe(true);
    } finally {
      await rm(out, { recursive: true, force: true });
    }
  });

  it("isolates sandbox workspaces and cleans them up on destroy", async () => {
    const provider = new LocalSandboxProvider();
    const a = await provider.create();
    const b = await provider.create();
    try {
      await a.writeFile("secret.txt", "from-a");
      // b is a separate workspace and must not see a's files.
      await expect(b.readFile("secret.txt")).rejects.toBeTruthy();

      const rootA = a.resolve(".");
      await a.destroy();
      await expect(stat(rootA)).rejects.toBeTruthy(); // workspace removed
    } finally {
      await b.destroy().catch(() => undefined);
    }
  });
});
