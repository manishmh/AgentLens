import type { RunManifest, Finding, EvidenceRef } from "@agentlens/event-schema";
import { EventType } from "@agentlens/event-schema";
import { newFindingId } from "@agentlens/shared";

export class RuleFindingGenerator {
  public generate(manifest: RunManifest): Finding[] {
    const findings: Finding[] = [];
    const { evaluation, events, metadata } = manifest;

    if (!evaluation || !evaluation.metrics) {
      return findings;
    }

    const { metrics } = evaluation;

    // Helper to find the final answer event
    const finalAnswerEvent = events.find(
      (e) => e.type === EventType.AgentFinished
    );

    // Helper to build evidence ref from an event
    const toEvidence = (eventId: string, note?: string): EvidenceRef => ({
      kind: "event",
      eventId,
      ...(note ? { note } : {}),
    });

    // 1. Interaction failure
    if (metrics.interaction_success === false) {
      const errorEvents = events.filter((e) => e.type === EventType.BrowserError || (e.type === EventType.NetworkResponse && typeof e.payload === "object" && e.payload !== null && "status" in e.payload && typeof e.payload.status === "number" && e.payload.status >= 400));
      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Interaction",
        severity: "high",
        evidenceClass: "observed",
        observation: "Agent encountered errors during browser interaction or network requests.",
        evidence: errorEvents.map((e) => toEvidence(e.eventId)),
        confidence: "high",
      });
    }

    // 2. Customer not discovered
    if (metrics.customer_discovered === false) {
      const evidence = finalAnswerEvent ? [toEvidence(finalAnswerEvent.eventId, "Agent final answer indicates failure to find customer")] : [];
      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Discovery",
        severity: "medium",
        evidenceClass: "observed",
        observation: "Customer did not appear in search results or direct navigation.",
        evidence,
        confidence: "high",
      });
    }

    // 3. Customer discovered but not recommended
    if (metrics.customer_discovered === true && metrics.customer_recommended === false) {
      const discoveryEvents = events.filter((e) => {
        if (e.type === EventType.BrowserNavigation && typeof e.payload === "object" && e.payload !== null && "url" in e.payload && typeof e.payload.url === "string") {
          return true; // Weak heuristic for discovering where they went
        }
        if (e.type === EventType.SearchResults) return true;
        return false;
      });
      // Pick the most relevant ones (e.g. up to 2)
      const evidence = discoveryEvents.slice(-2).map((e) => toEvidence(e.eventId, "Customer discovered here"));
      if (finalAnswerEvent) {
        evidence.push(toEvidence(finalAnswerEvent.eventId, "Final answer did not recommend customer"));
      }

      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Recommendation",
        severity: "high",
        evidenceClass: "observed",
        observation: "Customer was discovered but not recommended in the final answer.",
        evidence,
        confidence: "high",
      });
    }

    // 4. Competitor recommended
    if (metrics.competitor_recommended === true) {
      const evidence = finalAnswerEvent ? [toEvidence(finalAnswerEvent.eventId, "Agent recommended a competitor in final answer")] : [];
      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Recommendation",
        severity: "high",
        evidenceClass: "observed",
        observation: "Agent recommended a competitor over the target customer.",
        evidence,
        confidence: "high",
      });
    }

    // 5. Required information missing
    if (metrics.required_information_found === false) {
      const evidence = finalAnswerEvent ? [toEvidence(finalAnswerEvent.eventId, "Agent failed to find required information")] : [];
      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Task",
        severity: "medium",
        evidenceClass: "observed",
        observation: "Agent failed to locate the specific information required by the task.",
        evidence,
        confidence: "high",
      });
    }

    // 6. Task failure (catch-all if not covered by above or to emphasize overall failure)
    if (metrics.task_success === false) {
      // Find where agent said it failed or crashed
      const evidence = finalAnswerEvent ? [toEvidence(finalAnswerEvent.eventId, "Agent reported failure or incomplete task")] : [];
      findings.push({
        findingId: newFindingId(),
        runId: metadata.runId,
        category: "Task",
        severity: "critical",
        evidenceClass: "observed",
        observation: "Agent failed to successfully complete the overall task.",
        evidence,
        confidence: "high",
      });
    }

    return findings;
  }
}
