import fs from "fs/promises";
import path from "path";
import http from "http";
import { parseRunManifest } from "../../packages/event-schema/src";
import type { RunManifest } from "../../packages/event-schema/src";
import { RuleEvaluator } from "../../packages/evaluation/src/rule";
import { RuleFindingGenerator } from "../../packages/evaluation/src/finding";
import { ExperimentAggregator } from "../../packages/evaluation/src/aggregator";
import { ReadinessScanner } from "../../packages/readiness/src/scanner";

const OUT_DIR = path.join(process.cwd(), ".artifacts", "stress-datasets");

async function loadDataset(filename: string): Promise<any> {
  const data = await fs.readFile(path.join(OUT_DIR, filename), "utf8");
  return JSON.parse(data);
}

function runEvaluator(run: RunManifest) {
  const evaluator = new RuleEvaluator();
  return evaluator.evaluate({
    run,
    task: run.task,
    successCriteria: run.task.successCriteria
  });
}

function runFindings(run: RunManifest) {
  const generator = new RuleFindingGenerator();
  return generator.generate(run);
}

// -----------------------------------------------------
// M7 Readiness Mock Server
// -----------------------------------------------------

function startMockServer(): Promise<{ server: http.Server, port: number }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const url = req.url || "/";

      // A. Fully agent-ready site
      if (url.startsWith("/site-a")) {
        if (url === "/site-a") {
          res.setHeader("Content-Type", "text/html");
          res.end(`<html><head><title>Site A</title><meta name="description" content="A fully ready site"><script type="application/ld+json">{"@context":"https://schema.org","@type":"WebSite"}</script></head><body><h1>Welcome</h1><main>Content</main></body></html>`);
        } else if (url === "/site-a/llms.txt") {
          res.setHeader("Content-Type", "text/plain");
          res.end("# LLMs info for Site A");
        } else if (url === "/site-a/robots.txt") {
          res.setHeader("Content-Type", "text/plain");
          res.end("User-agent: *\nAllow: /");
        } else if (url === "/site-a/sitemap.xml") {
          res.setHeader("Content-Type", "application/xml");
          res.end("<urlset></urlset>");
        } else if (url === "/site-a/.well-known/mcp") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ tools: [] }));
        } else if (url === "/site-a/.well-known/web-bot-authentication") {
          res.setHeader("Content-Type", "application/json");
          res.end(JSON.stringify({ supported: true }));
        } else {
          res.statusCode = 404;
          res.end();
        }
      }
      // B. Partially agent-ready site
      else if (url.startsWith("/site-b")) {
        if (url === "/site-b") {
          res.setHeader("Content-Type", "text/html");
          res.end(`<html><head><title>Site B</title></head><body><h1>Hello</h1><main>Partial</main></body></html>`);
        } else if (url === "/site-b/robots.txt") {
          res.setHeader("Content-Type", "text/plain");
          res.end("User-agent: *\nDisallow: /admin");
        } else {
          res.statusCode = 404;
          res.end();
        }
      }
      // C. Traditional website (none of the standards)
      else if (url.startsWith("/site-c")) {
        if (url === "/site-c") {
          res.setHeader("Content-Type", "text/html");
          res.end(`<html><body>Div soup</body></html>`);
        } else {
          res.statusCode = 404;
          res.end();
        }
      }
      // D. Broken / malformed
      else if (url.startsWith("/site-d")) {
        if (url.endsWith("llms.txt") || url.endsWith("mcp") || url.endsWith("robots.txt")) {
          res.statusCode = 500;
          res.end("Internal Server Error");
        } else {
          res.setHeader("Content-Type", "text/html");
          res.end("Malformed");
        }
      }
      // E. Large HTML
      else if (url.startsWith("/site-e")) {
        if (url === "/site-e") {
          res.setHeader("Content-Type", "text/html");
          res.end(`<html><head><title>Large</title></head><body>` + `<div>Junk</div>`.repeat(50000) + `</body></html>`);
        } else {
          res.statusCode = 404;
          res.end();
        }
      }
      // F. Slow
      else if (url.startsWith("/site-f")) {
        setTimeout(() => {
          res.setHeader("Content-Type", "text/html");
          res.end(`<html><head><title>Slow</title></head><body>Done</body></html>`);
        }, 1500); // Exceeds default timeout or tests slow behavior
      } else {
        res.statusCode = 404;
        res.end();
      }
    });

    server.listen(0, () => {
      const addr = server.address();
      const port = typeof addr === "string" ? 0 : addr?.port || 0;
      resolve({ server, port });
    });
  });
}

// -----------------------------------------------------
// Runner main
// -----------------------------------------------------

async function runTests() {
  console.log("=========================================");
  console.log("   V1 STRESS TEST & VALIDATION HARNESS   ");
  console.log("=========================================\n");

  const results: any = {
    performance: {},
    issues: []
  };

  // 1 & 2 & 5. Large / Realistic Run Evaluation & Data Integrity
  try {
    console.log("--- 1. Evaluating Realistic Dataset ---");
    const realisticData = await loadDataset("realistic-run.json");
    const realisticRun = parseRunManifest(realisticData);
    
    let t0 = performance.now();
    realisticRun.evaluation = await runEvaluator(realisticRun);
    realisticRun.findings = await runFindings(realisticRun);
    results.performance.realisticRunEvaluationMs = performance.now() - t0;
    
    console.log(`Realistic run events: ${realisticRun.events.length}`);
    console.log(`Task Success: ${realisticRun.evaluation.metrics.task_success}`);
    console.log(`Findings generated: ${realisticRun.findings.length}`);

    console.log("\n--- 2. Evaluating Large Stress Dataset ---");
    const largeData = await loadDataset("large-stress-run.json");
    
    t0 = performance.now();
    // Intentionally testing parsing
    const largeRun = parseRunManifest(largeData);
    results.performance.largeRunParseMs = performance.now() - t0;

    t0 = performance.now();
    largeRun.evaluation = await runEvaluator(largeRun);
    largeRun.findings = await runFindings(largeRun);
    results.performance.largeRunEvaluationMs = performance.now() - t0;

    console.log(`Large run events: ${largeRun.events.length}`);
    console.log(`Large prompt size: ${largeRun.task.instruction.length}`);
    console.log(`Large run evaluated successfully in ${results.performance.largeRunEvaluationMs.toFixed(2)}ms`);

  } catch (e: any) {
    console.error("Error in single run tests:", e);
    results.issues.push({ phase: "Single Run Eval", error: e.message });
  }

  // 3 & 4. Multi-Run Experiment & Competitor Aggregation
  try {
    console.log("\n--- 3. Multi-Run & Competitor Aggregation ---");
    const experimentData = await loadDataset("experiment-runs.json");
    
    // Evaluate all 50
    let t0 = performance.now();
    for (const data of experimentData) {
      const run = parseRunManifest(data);
      run.evaluation = await runEvaluator(run);
      run.findings = await runFindings(run);
      // mutates data inline for aggregator
      data.evaluation = run.evaluation;
      data.findings = run.findings;
    }
    results.performance.experimentEvaluationMs = performance.now() - t0;

    const aggregator = new ExperimentAggregator();
    
    t0 = performance.now();
    const aggResult = aggregator.aggregate(
      "exp-stress",
      "customer.com",
      ["competitor-one.in", "competitor-two.com", "competitor-three.co.in", "competitor-four.com", "competitor-five.com"],
      experimentData as RunManifest[]
    );
    results.performance.experimentAggregationMs = performance.now() - t0;

    console.log(`Total runs processed: ${aggResult.runCounts.total}`);
    console.log(`Valid runs filtered: ${aggResult.runCounts.valid}`);
    console.log(`Customer Rec Rate: ${(aggResult.customerMetrics.recommendationRate * 100).toFixed(1)}%`);
    console.log(`Competitor 1 Rec Rate: ${(aggResult.competitorMetrics["competitor-one.in"]?.recommendationRate * 100).toFixed(1)}%`);
    console.log(`Aggregated in ${results.performance.experimentAggregationMs.toFixed(2)}ms`);

    // Determinism test
    const aggResult2 = aggregator.aggregate(
      "exp-stress",
      "customer.com",
      ["competitor-one.in", "competitor-two.com", "competitor-three.co.in", "competitor-four.com", "competitor-five.com"],
      experimentData as RunManifest[]
    );
    
    const clone1 = { ...aggResult, evaluatedAt: null };
    const clone2 = { ...aggResult2, evaluatedAt: null };

    if (JSON.stringify(clone1) !== JSON.stringify(clone2)) {
      results.issues.push({ phase: "Aggregation", error: "Aggregation is not deterministic across identical datasets" });
    }

  } catch (e: any) {
    console.error("Error in multi-run tests:", e);
    results.issues.push({ phase: "Multi-run Aggregation", error: e.message });
  }

  // 6. Readiness Scanner
  let serverInfo;
  try {
    console.log("\n--- 4. Agent Readiness Scanning ---");
    serverInfo = await startMockServer();
    const port = serverInfo.port;
    const scanner = new ReadinessScanner();
    // Use same scanner for slow test, we just want to see it complete or fail
    const slowScanner = new ReadinessScanner();

    const sites = [
      { name: "A (Fully Ready)", url: `http://localhost:${port}/site-a`, scanner },
      { name: "B (Partial)", url: `http://localhost:${port}/site-b`, scanner },
      { name: "C (Traditional)", url: `http://localhost:${port}/site-c`, scanner },
      { name: "D (Broken)", url: `http://localhost:${port}/site-d`, scanner },
      { name: "E (Large HTML)", url: `http://localhost:${port}/site-e`, scanner },
      { name: "F (Slow)", url: `http://localhost:${port}/site-f`, scanner: slowScanner },
    ];

    for (const site of sites) {
      let t0 = performance.now();
      const report = await site.scanner.scan({ targetUrl: site.url });
      const elapsed = performance.now() - t0;
      
      const passed = report.checks.filter(c => c.status === "pass").length;
      const total = report.checks.length;
      console.log(`${site.name} -> Scanned in ${elapsed.toFixed(2)}ms. Checks passed: ${passed}/${total}`);
    }

  } catch (e: any) {
    console.error("Error in readiness tests:", e);
    results.issues.push({ phase: "Readiness Scanner", error: e.message });
  } finally {
    if (serverInfo) serverInfo.server.close();
  }

  console.log("\n=========================================");
  console.log("   STRESS TEST COMPLETE                  ");
  console.log("=========================================\n");
  
  if (results.issues.length > 0) {
    console.log("⚠️ ISSUES DETECTED:");
    console.log(JSON.stringify(results.issues, null, 2));
  } else {
    console.log("✅ ALL PIPELINES EXECUTED SUCCESSFULLY.");
  }
  
  console.log("\nPerformance Metrics:");
  console.table(results.performance);
}

runTests().catch(console.error);
