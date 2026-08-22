import { EventSource, EventType, type ArtifactRef } from "@agentlens/event-schema";
import { newArtifactId } from "@agentlens/shared";
import type {
  AgentExecutionContext,
  AgentExecutionResult,
  AgentRuntime,
  AgentRuntimeMetadata,
  AgentStatus,
} from "./types";

/** Minimal valid 1x1 transparent PNG, used as a placeholder screenshot artifact. */
const PLACEHOLDER_PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMDAQCwZ0jaAAAAAElFTkSuQmCC",
  "base64",
);

function hostOf(url: string | undefined, fallback: string): string {
  if (!url) return fallback;
  try {
    return new URL(url).host;
  } catch {
    return fallback;
  }
}

/**
 * Deterministic, framework-free agent used to validate the observation/evidence
 * pipeline end-to-end without any external service (docs/07 §79 "Synthetic Agent
 * Tests", docs/10 §11 "First Prototype"). It replays the canonical journey for
 * "Find the pricing information for X": search → select → navigate → snapshot →
 * screenshot → answer, emitting the full canonical event trace and writing artifacts
 * into the sandbox workspace.
 *
 * It is a fixture for building/verifying the platform — NOT a real agent. The first
 * real runtime (Vercel AI SDK 7 + Chromium/Playwright) replaces it in Milestone 1+.
 */
export class SyntheticAgentRuntime implements AgentRuntime {
  private _status: AgentStatus = "idle";

  metadata(): AgentRuntimeMetadata {
    return {
      provider: "agentlens",
      runtime: "synthetic-browser-agent",
      model: "synthetic-deterministic",
      version: "0.1.0",
    };
  }

  status(): AgentStatus {
    return this._status;
  }

  async start(): Promise<void> {
    this._status = "starting";
    this._status = "running";
  }

  async execute(ctx: AgentExecutionContext): Promise<AgentExecutionResult> {
    const { task, observation, sandbox } = ctx;
    const meta = this.metadata();
    const target = task.target ?? "https://example.com";
    const host = hostOf(target, "example.com");
    const pricingUrl = new URL("/pricing", target).toString();
    const competitorUrl = "https://competitor.example/pricing";

    observation.record({
      source: EventSource.Agent,
      type: EventType.AgentStarted,
      payload: { runtime: meta.runtime, model: meta.model },
    });
    observation.record({
      source: EventSource.Agent,
      type: EventType.AgentMessage,
      payload: { role: "assistant", text: `I'll find the pricing information for ${host}.` },
    });

    // Search phase.
    const query = `${host} pricing`;
    observation.record({
      source: EventSource.Search,
      type: EventType.SearchQuery,
      payload: { query, engine: "synthetic" },
    });
    observation.record({
      source: EventSource.Search,
      type: EventType.SearchResults,
      payload: {
        query,
        results: [
          { url: pricingUrl, title: `${host} — Pricing`, rank: 0 },
          { url: competitorUrl, title: "Competitor — Pricing", rank: 1 },
        ],
      },
    });
    observation.record({
      source: EventSource.Search,
      type: EventType.SearchSelection,
      payload: { url: pricingUrl, rank: 0 },
    });

    // Browser phase.
    observation.record({
      source: EventSource.Browser,
      type: EventType.BrowserStarted,
      payload: { browser: "synthetic-chromium", version: "0.0.0" },
    });
    observation.record({
      source: EventSource.Browser,
      type: EventType.BrowserNavigation,
      payload: { url: pricingUrl },
    });

    const requestId = "req-1";
    observation.record({
      source: EventSource.Network,
      type: EventType.NetworkRequest,
      payload: { requestId, method: "GET", url: pricingUrl, resourceType: "document" },
    });
    observation.record({
      source: EventSource.Network,
      type: EventType.NetworkResponse,
      payload: {
        requestId,
        url: pricingUrl,
        status: 200,
        contentType: "text/html",
        durationMs: 42,
      },
    });

    // Evidence artifacts written to the sandbox workspace.
    const html = `<!doctype html><html><body><h1>${host} Pricing</h1><p>Pro plan: $20/month.</p></body></html>`;
    const snapshotPath = "artifacts/snapshot-1.html";
    await sandbox.writeFile(snapshotPath, html);
    const snapshotArtifact: ArtifactRef = {
      artifactId: newArtifactId(),
      kind: "html_snapshot",
      path: snapshotPath,
      contentType: "text/html",
      sizeBytes: Buffer.byteLength(html),
      visibility: "customer_sensitive",
    };
    observation.record({
      source: EventSource.Browser,
      type: EventType.PageSnapshot,
      payload: { url: pricingUrl, artifact: snapshotArtifact },
    });

    const screenshotPath = "screenshots/step-1.png";
    await sandbox.writeFile(screenshotPath, PLACEHOLDER_PNG);
    const screenshotArtifact: ArtifactRef = {
      artifactId: newArtifactId(),
      kind: "screenshot",
      path: screenshotPath,
      contentType: "image/png",
      sizeBytes: PLACEHOLDER_PNG.byteLength,
      visibility: "internal",
    };
    observation.record({
      source: EventSource.Browser,
      type: EventType.Screenshot,
      payload: { artifact: screenshotArtifact, label: "pricing-page" },
    });

    // Result phase.
    const finalAnswer = `${host} lists a Pro plan at $20/month on ${pricingUrl}.`;
    observation.record({
      source: EventSource.Agent,
      type: EventType.AgentAction,
      payload: { action: "extract_pricing", detail: "Read pricing from the pricing page." },
    });
    observation.record({
      source: EventSource.Agent,
      type: EventType.AgentFinished,
      payload: { ok: true, finalAnswer },
    });

    this._status = "stopped";
    return { ok: true, finalAnswer };
  }

  async stop(): Promise<void> {
    this._status = "stopped";
  }
}
