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
    const { run, task } = input;
    const events = run.events;
    
    // Find final answer from AgentFinished event
    const agentFinished = eventsOfType(events, EventType.AgentFinished).at(-1);
    const resultOk = (agentFinished?.payload as { ok?: boolean } | undefined)?.ok ?? false;
    const answer = (agentFinished?.payload as { finalAnswer?: string } | undefined)?.finalAnswer;
    
    // In V1, target and competitors might be parsed from the task or environment, but if not strictly provided in EvaluationInput, we use task.target and empty competitors, OR we can extract from the run's environment experimentConfig if present. 
    // Wait, the orchestrator used to pass them explicitly. Let's get target from task.target.
    const targetHost = hostOf(task.target ?? "");
    // Competitors were passed explicitly before. If they are not in the interface, we'll assume they aren't evaluated here unless they are in the task or environment.
    // Let's grab competitors from run.environment.experimentConfig?.competitors if it exists.
    const configCompetitors = Array.isArray(run.environment.experimentConfig?.competitors) 
      ? run.environment.experimentConfig!.competitors as string[] 
      : [];
    const competitorHosts = configCompetitors
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
    const customerRecommended = mentionsHost(answer, targetHost);
    const competitorRecommended = competitorHosts.some((h) => mentionsHost(answer, h));

    // Interaction health: navigation succeeded and no browser errors were observed.
    const hadBrowserError = eventsOfType(events, EventType.BrowserError).length > 0;
    const hadOkResponse = eventsOfType(events, EventType.NetworkResponse).some(
      (e) => (e.payload as { status: number }).status < 400,
    );
    const interactionSuccess = !hadBrowserError && hadOkResponse;

    const requiredInformationFound = Boolean(
      resultOk && answer,
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
