import { EventType, type CanonicalEvent, type EvaluationResult } from "@agentlens/event-schema";
import type { EvaluationInput, Evaluator } from "./types";

function hostOf(url: string): string | undefined {
  try {
    return new URL(url).host.toLowerCase();
  } catch {
    return undefined;
  }
}

function eventsOfType(events: readonly CanonicalEvent[], type: string): CanonicalEvent[] {
  return events.filter((e) => e.type === type);
}

function mentionsHost(text: string | undefined, host: string | undefined): boolean {
  if (!text || !host) return false;
  return text.toLowerCase().includes(host);
}

/**
 * Deterministic rule evaluator producing the initial V1 metrics (docs/10 §17):
 * task_success, customer_discovered, customer_recommended, competitor_recommended,
 * required_information_found, interaction_success. Every metric is derived purely from
 * observed events + the final answer, so results are reproducible and evidence-backed.
 */
export class RuleEvaluator implements Evaluator {
  readonly name = "rule-evaluator";
  readonly version = "1";

  async evaluate(input: EvaluationInput): Promise<EvaluationResult> {
    const { events, result, task } = input;
    const targetHost = input.target ? hostOf(input.target) : hostOf(task.target ?? "");
    const competitorHosts = (input.competitors ?? [])
      .map(hostOf)
      .filter((h): h is string => Boolean(h));

    // Discovery: did the customer's site appear in results or get navigated to?
    const searchResultHosts = eventsOfType(events, EventType.SearchResults).flatMap((e) => {
      const payload = e.payload as { results?: { url: string }[] };
      return (payload.results ?? []).map((r) => hostOf(r.url)).filter(Boolean);
    });
    const navigatedHosts = eventsOfType(events, EventType.BrowserNavigation)
      .map((e) => hostOf((e.payload as { url: string }).url))
      .filter(Boolean);
    const customerDiscovered = Boolean(
      targetHost &&
        (searchResultHosts.includes(targetHost) || navigatedHosts.includes(targetHost)),
    );

    // Recommendation: who is named in the final answer?
    const answer = result.finalAnswer;
    const customerRecommended = mentionsHost(answer, targetHost);
    const competitorRecommended = competitorHosts.some((h) => mentionsHost(answer, h));

    // Interaction health: navigation succeeded and no browser errors were observed.
    const hadBrowserError = eventsOfType(events, EventType.BrowserError).length > 0;
    const hadOkResponse = eventsOfType(events, EventType.NetworkResponse).some(
      (e) => (e.payload as { status: number }).status < 400,
    );
    const interactionSuccess = !hadBrowserError && hadOkResponse;

    const agentFinished = eventsOfType(events, EventType.AgentFinished).at(-1);
    const requiredInformationFound = Boolean(
      result.ok && answer && (agentFinished?.payload as { ok?: boolean } | undefined)?.ok,
    );
    const taskSuccess = requiredInformationFound && interactionSuccess;

    return {
      evaluator: this.name,
      evaluatorVersion: this.version,
      evaluatedAt: new Date().toISOString(),
      status: "complete",
      metrics: {
        task_success: taskSuccess,
        customer_discovered: customerDiscovered,
        customer_recommended: customerRecommended,
        competitor_recommended: competitorRecommended,
        required_information_found: requiredInformationFound,
        interaction_success: interactionSuccess,
      },
    };
  }
}
