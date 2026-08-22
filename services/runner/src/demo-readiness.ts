import { ReadinessScanner } from "@agentlens/readiness";
import { PlaywrightBrowserProvider } from "@agentlens/browser";
import { loadEnv } from "@agentlens/shared";
import { writeFile, mkdir } from "node:fs/promises";
import { join } from "node:path";
import * as crypto from "node:crypto";
import type { ObservationEngine } from "@agentlens/observation";
import type { SandboxHandle } from "@agentlens/sandbox";

async function main(): Promise<void> {
  const env = loadEnv();
  const targetUrl = process.argv[2] ?? "https://example.com";
  
  console.log(`Starting Agent Readiness scan for ${targetUrl}...\n`);

  const scanner = new ReadinessScanner();
  const observation = { record: () => {} } as unknown as ObservationEngine;
  const sandbox = { readFile: async () => "", writeFile: async () => {}, execute: async () => ({ exitCode: 0 }), destroy: async () => {} } as unknown as SandboxHandle;
  const browserProvider = new PlaywrightBrowserProvider(observation, sandbox);

  const report = await scanner.scan({
    targetUrl,
    browserProvider,
  });

  const runId = `readiness_${crypto.randomUUID()}`;
  const outDir = join(env.ARTIFACTS_DIR, runId);
  await mkdir(outDir, { recursive: true });

  await writeFile(join(outDir, "report.json"), JSON.stringify(report, null, 2), "utf8");

  console.log("Readiness scan complete.");
  console.log(`  Target:       ${report.targetUrl}`);
  console.log(`  Generated At: ${report.generatedAt}`);
  
  for (const check of report.checks) {
    console.log(`  [${check.status.toUpperCase().padEnd(14)}] ${check.category.toUpperCase().padEnd(14)} ${check.name}: ${check.reason}`);
  }

  console.log(`\n  Output: ${join(outDir, "report.json")}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
