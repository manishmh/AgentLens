import { type RunManifest, type ExperimentResult, EventType } from "@agentlens/event-schema";

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return undefined;
  }
}

/**
 * Aggregates multiple RunManifests into an ExperimentResult (M8).
 * Ensures determinism and multi-run aggregation.
 */
export class ExperimentAggregator {
  /**
   * Defines a valid run as one where observation was not entirely failed,
   * evaluation completed, and the agent didn't crash before finishing.
   */
  public static isValidRun(run: RunManifest): boolean {
    if (run.observation.status === "failed") return false;
    if (!run.evaluation) return false;
    if (run.evaluation.status === "failed") return false;
    if (run.metadata.executionStatus !== "success") return false;
    return true;
  }

  public aggregate(
    experimentId: string,
    targetHost: string,
    competitorHosts: string[],
    runs: RunManifest[],
  ): ExperimentResult {
    const validRuns = runs.filter(ExperimentAggregator.isValidRun);
    const invalidCount = runs.length - validRuns.length;
    const totalCount = runs.length;

    let taskSuccessCount = 0;

    let customerDiscoveryCount = 0;
    let customerRecommendationCount = 0;
    let customerPageVisits = 0;

    const competitorStats: Record<
      string,
      { discoveryCount: number; recommendationCount: number; pageVisits: number }
    > = {};
    for (const comp of competitorHosts) {
      competitorStats[comp] = { discoveryCount: 0, recommendationCount: 0, pageVisits: 0 };
    }

    const sourceFrequencyMap: Record<string, number> = {};

    for (const run of validRuns) {
      if (!run.evaluation || !run.evaluation.metrics) continue;
      const metrics = run.evaluation.metrics;

      if (metrics.task_success === true) taskSuccessCount++;
      if (metrics.customer_discovered === true) customerDiscoveryCount++;
      if (metrics.customer_recommended === true) customerRecommendationCount++;

      const discoveredComps = Array.isArray(metrics.discovered_competitors)
        ? (metrics.discovered_competitors as string[])
        : [];
      const recommendedComps = Array.isArray(metrics.recommended_competitors)
        ? (metrics.recommended_competitors as string[])
        : [];

      for (const comp of discoveredComps) {
        if (competitorStats[comp]) competitorStats[comp]!.discoveryCount++;
      }
      for (const comp of recommendedComps) {
        if (competitorStats[comp]) competitorStats[comp]!.recommendationCount++;
      }

      // Compute page visits and source frequencies for this run
      const runSources = new Set<string>();

      let customerVisitedInRun = 0;
      const compVisitsInRun: Record<string, number> = {};
      for (const comp of competitorHosts) compVisitsInRun[comp] = 0;

      for (const event of run.events) {
        if (event.type === EventType.BrowserNavigation) {
          const payload = event.payload as { url?: string };
          if (payload.url) {
            const h = hostOf(payload.url);
            if (h) {
              runSources.add(h);
              if (h.includes(targetHost)) customerVisitedInRun++;
              for (const comp of competitorHosts) {
                if (h.includes(comp)) compVisitsInRun[comp]!++;
              }
            }
          }
        }
        if (event.type === EventType.SearchResults) {
          const payload = event.payload as { results?: { url: string }[] };
          if (payload.results) {
            for (const res of payload.results) {
              const h = hostOf(res.url);
              if (h) runSources.add(h);
            }
          }
        }
      }

      customerPageVisits += customerVisitedInRun;
      for (const comp of competitorHosts) {
        competitorStats[comp]!.pageVisits += compVisitsInRun[comp]!;
      }

      for (const src of runSources) {
        sourceFrequencyMap[src] = (sourceFrequencyMap[src] || 0) + 1;
      }
    }

    const denom = validRuns.length > 0 ? validRuns.length : 1; // Prevent division by zero, though rate is 0 if validRuns=0

    const customerMetrics = {
      discoveryRate: validRuns.length > 0 ? customerDiscoveryCount / denom : 0,
      recommendationRate: validRuns.length > 0 ? customerRecommendationCount / denom : 0,
      pageVisits: customerPageVisits,
    };

    const competitorMetrics: ExperimentResult["competitorMetrics"] = {};
    for (const comp of competitorHosts) {
      competitorMetrics[comp] = {
        discoveryRate: validRuns.length > 0 ? competitorStats[comp]!.discoveryCount / denom : 0,
        recommendationRate:
          validRuns.length > 0 ? competitorStats[comp]!.recommendationCount / denom : 0,
        pageVisits: competitorStats[comp]!.pageVisits,
      };
    }

    // Aggregate findings across runs to present experiment-level summary findings
    // In V1, we just concat run-level findings. A true experiment-level finding could be added here if needed.
    const allFindings = validRuns.flatMap((r) => r.findings || []);

    return {
      experimentId,
      target: targetHost,
      competitors: competitorHosts,
      runCounts: {
        total: totalCount,
        valid: validRuns.length,
        invalid: invalidCount,
      },
      overallMetrics: {
        taskSuccessRate: validRuns.length > 0 ? taskSuccessCount / denom : 0,
      },
      customerMetrics,
      competitorMetrics,
      sourceFrequency: sourceFrequencyMap,
      findings: allFindings,
      evaluatedAt: new Date().toISOString(),
    };
  }
}
