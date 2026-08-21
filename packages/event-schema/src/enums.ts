import { z } from "zod";

/** Canonical event schema version. Bump when the envelope shape changes. */
export const CANONICAL_EVENT_SCHEMA_VERSION = "1" as const;

/**
 * Observation source (docs/07 §35). Which subsystem produced the raw observation
 * before it was normalized into a canonical event.
 */
export const EventSource = {
  Run: "run",
  Agent: "agent",
  Browser: "browser",
  Network: "network",
  Filesystem: "filesystem",
  Process: "process",
  Sandbox: "sandbox",
  Search: "search",
  Mcp: "mcp",
  Api: "api",
  Evaluator: "evaluator",
  System: "system",
} as const;
export type EventSource = (typeof EventSource)[keyof typeof EventSource];
export const eventSourceSchema = z.enum([
  "run",
  "agent",
  "browser",
  "network",
  "filesystem",
  "process",
  "sandbox",
  "search",
  "mcp",
  "api",
  "evaluator",
  "system",
]);

/**
 * Canonical event types (docs/10 §9). Provider-specific events are normalized into
 * one of these before they enter the event stream.
 */
export const EventType = {
  RunStarted: "run.started",
  RunFinished: "run.finished",

  AgentStarted: "agent.started",
  AgentAction: "agent.action",
  AgentMessage: "agent.message",
  AgentToolCall: "agent.tool_call",
  AgentToolResult: "agent.tool_result",
  AgentFinished: "agent.finished",

  BrowserStarted: "browser.started",
  BrowserNavigation: "browser.navigation",
  BrowserClick: "browser.click",
  BrowserInput: "browser.input",
  BrowserScroll: "browser.scroll",
  BrowserError: "browser.error",

  SearchQuery: "search.query",
  SearchResults: "search.results",
  SearchSelection: "search.selection",

  NetworkRequest: "network.request",
  NetworkResponse: "network.response",

  PageSnapshot: "page.snapshot",
  Screenshot: "screenshot",

  EvaluationCompleted: "evaluation.completed",
  FindingCreated: "finding.created",
} as const;
export type EventType = (typeof EventType)[keyof typeof EventType];
export const eventTypeSchema = z.enum([
  "run.started",
  "run.finished",
  "agent.started",
  "agent.action",
  "agent.message",
  "agent.tool_call",
  "agent.tool_result",
  "agent.finished",
  "browser.started",
  "browser.navigation",
  "browser.click",
  "browser.input",
  "browser.scroll",
  "browser.error",
  "search.query",
  "search.results",
  "search.selection",
  "network.request",
  "network.response",
  "page.snapshot",
  "screenshot",
  "evaluation.completed",
  "finding.created",
]);

/**
 * Event visibility / privacy level (docs/07 §67, docs/10 §9).
 * SECRET events must never reach ordinary analytics pipelines and secret VALUES
 * must be redacted before persistence (docs/07 §43).
 */
export const Visibility = {
  Public: "public",
  Internal: "internal",
  CustomerSensitive: "customer_sensitive",
  Secret: "secret",
} as const;
export type Visibility = (typeof Visibility)[keyof typeof Visibility];
export const visibilitySchema = z.enum(["public", "internal", "customer_sensitive", "secret"]);

/**
 * Which observation plane produced the event (docs/03 §4).
 * V1 implements Mode A only. Mode B (customer instrumentation) is not built in V1,
 * but the canonical model carries this discriminant so BOTH modes can feed the same
 * event store when Mode B is implemented later.
 */
export const IngestOrigin = {
  ModeASimulation: "mode_a_simulation",
  ModeBInstrumentation: "mode_b_instrumentation",
} as const;
export type IngestOrigin = (typeof IngestOrigin)[keyof typeof IngestOrigin];
export const ingestOriginSchema = z.enum(["mode_a_simulation", "mode_b_instrumentation"]);
