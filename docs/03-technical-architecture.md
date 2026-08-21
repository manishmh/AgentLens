# Technical Architecture

**Status:** Draft v0.1  
**Document:** Technical Architecture  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Core principle:** We are building infrastructure to observe, evaluate, and improve how AI systems discover, understand, recommend, and interact with digital products.

---

# 1. Architecture Goals

The architecture must support five capabilities:

1. **AI discovery testing**
2. **Agent execution and observation**
3. **Website and infrastructure analysis**
4. **Reliable evaluation and benchmarking**
5. **Before/after optimization experiments**

The architecture must also remain extensible enough to support future:

- MCP;
- WebMCP;
- APIs;
- SDKs;
- Agent Skills;
- browser agents;
- coding agents;
- consumer AI surfaces;
- agentic commerce.

We should avoid coupling the platform to a single model, agent, browser, sandbox, or telemetry format.

---

# 2. Key Architectural Principle

The system should separate:

```text
EXECUTION
     ↓
OBSERVATION
     ↓
NORMALIZATION
     ↓
EVALUATION
     ↓
DIAGNOSIS
     ↓
RECOMMENDATION
     ↓
EXPERIMENT
```

This separation is critical.

An agent runtime may change.

A browser may change.

A transcript format may change.

A model provider may change.

Our evaluation model should not need to change every time one of those changes.

---

# 3. High-Level Architecture

```text
                         ┌─────────────────────┐
                         │      Dashboard      │
                         │  Reports / API      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Experiment Manager  │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
             AI Query Runner   Agent Runner    Site Analyzer
                    │               │                │
                    │               │                │
                    ▼               ▼                ▼
               Model APIs       Sandbox          HTTP/Crawler
                                    │
                         ┌──────────┴──────────┐
                         │ Observation Layer   │
                         │                    │
                         │ - transcripts      │
                         │ - network events   │
                         │ - browser events   │
                         │ - tool calls       │
                         │ - filesystem       │
                         │ - screenshots      │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Event Normalization │
                         └──────────┬──────────┘
                                    │
                                    ▼
                         ┌─────────────────────┐
                         │ Evaluation Engine   │
                         └──────────┬──────────┘
                                    │
                    ┌───────────────┼────────────────┐
                    ▼               ▼                ▼
                 Visibility     Agent Task       Readiness
                 Evaluation      Evaluation      Evaluation
                    │               │                │
                    └───────────────┼────────────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Diagnosis Engine    │
                         └──────────┬──────────┘
                                    ▼
                         ┌─────────────────────┐
                         │ Recommendations     │
                         └─────────────────────┘
```

# 4. Observation Modes

The platform supports two observation planes.

## Mode A — External Agent Simulation

Our execution infrastructure controls:

- sandbox;
- agent runtime;
- browser;
- network;
- credentials;
- observation.

Purpose:

- reproducible experiments;
- competitor benchmarking;
- AI visibility testing;
- agent-readiness testing;
- controlled optimization experiments.

## Mode B — Customer Instrumentation

Customer infrastructure emits telemetry through supported integrations such as:

- SDK;
- MCP instrumentation;
- Connector instrumentation;
- future agent integrations.

Purpose:

- real-world agent sessions;
- production behavior;
- recurring agent analytics;
- actual task outcomes.

Both modes normalize into the same canonical event model:

```text
Mode A ───────┐
              ├──> Canonical Events
Mode B ───────┘
                     ↓
                 Evaluation
                     ↓
                 Diagnosis
                     ↓
                Optimization

---

# 4. Architecture Layers

## Layer 1 — Control Plane

Responsible for:

- customers;
- projects;
- experiments;
- test configurations;
- agent definitions;
- query sets;
- credentials metadata;
- run scheduling;
- results;
- permissions.

This is the normal SaaS application layer.

---

# 5. Layer 2 — Experiment Orchestrator

The orchestrator converts a customer request into reproducible test runs.

Example:

```text
Experiment
    │
    ├── 50 queries
    ├── 4 AI systems
    ├── 3 competitors
    ├── 3 repetitions
    └── website analysis
```

The orchestrator creates individual jobs:

```text
Experiment
    ↓
Run
    ↓
Agent/Model execution
    ↓
Observation
    ↓
Evaluation
```

Each run should receive a unique immutable identifier.

---

# 6. Layer 3 — Execution Infrastructure

We need multiple execution modes.

## Mode A — Model/API execution

Used for:

- standard LLM testing;
- controlled prompts;
- repeatable AI visibility experiments.

## Mode B — Browser-agent execution

Used for:

- consumer-style web interaction;
- search;
- navigation;
- page interaction;
- forms;
- browser tools;
- WebMCP.

## Mode C — Coding-agent execution

Used for:

- Codex;
- Claude Code;
- OpenCode;
- other CLI agents.

## Mode D — Direct site analysis

Used for:

- HTML;
- HTTP;
- robots.txt;
- sitemap;
- headers;
- structured data;
- well-known resources;
- APIs;
- MCP metadata.

These modes share the same observation and evaluation pipeline.

---

# 7. Sandbox Strategy

## Decision

For V1, use a **microVM-based sandbox abstraction** rather than directly coupling the product to one vendor.

The first implementation should use a managed sandbox provider that provides:

- isolated Linux environments;
- fast startup;
- filesystem access;
- shell execution;
- configurable CPU/memory;
- timeouts;
- network access controls;
- snapshots or reusable images where possible;
- secret injection;
- artifact extraction.

Vercel's current implementation is strong evidence for this architectural choice: their coding-agent AEO system uses ephemeral Linux MicroVMs, installs each CLI inside a fresh environment, injects credentials through a gateway, runs the agent, captures its transcript, and tears the environment down. citeturn0search0

## Why microVMs

We need stronger isolation than simply running arbitrary agent processes directly on our application server.

Agents may:

- execute arbitrary shell commands;
- install packages;
- access files;
- launch browsers;
- make network requests;
- execute generated code.

The sandbox therefore becomes a security boundary.

---

# 8. Sandbox Abstraction

The application should expose an internal interface similar to:

```text
SandboxProvider
    ├── create()
    ├── exec()
    ├── writeFile()
    ├── readFile()
    ├── uploadArtifact()
    ├── configureNetwork()
    ├── injectSecret()
    ├── collectLogs()
    └── destroy()
```

Possible providers can later include:

- Vercel Sandbox;
- Cloudflare Browser/Kitesurf infrastructure;
- AWS-based microVM infrastructure;
- Firecracker directly;
- another managed sandbox provider.

The application should not know which provider is underneath.

---

# 9. Why We Should Not Commit to One Sandbox Yet

Our research indicates that the sandbox choice affects:

- browser support;
- network visibility;
- filesystem access;
- startup latency;
- snapshots;
- credential handling;
- region availability;
- cost;
- scaling;
- observability.

Therefore the architecture should make the provider replaceable.

The technical evaluation will determine the final V1 provider.

---

# 10. Agent Adapter Layer

Every supported agent should have an adapter.

```text
AgentAdapter
    │
    ├── install()
    ├── configure()
    ├── buildCommand()
    ├── run()
    ├── capture()
    └── normalize()
```

Example:

```text
Claude Code Adapter
Codex Adapter
OpenCode Adapter
Browser Agent Adapter
Custom Agent Adapter
```

This mirrors a useful pattern demonstrated by Vercel: the sandbox lifecycle stays uniform while agent-specific setup, invocation, and transcript handling live in configuration/adapters. citeturn0search0

---

# 11. Observation Architecture

Observation is the most important technical subsystem.

We should not assume that one observation method is sufficient.

The observation layer should support:

```text
                    OBSERVATION
                         │
       ┌─────────────────┼──────────────────┐
       ▼                 ▼                  ▼
   Transcript          Browser            Network
       │                 │                  │
       ▼                 ▼                  ▼
   Tool calls         CDP events        HTTP events
   messages           navigation        requests
   results            DOM changes       responses
   errors             console           DNS/TLS
       │                 │                  │
       └─────────────────┼──────────────────┘
                         ▼
                  Unified Events
```

---

# 12. Observation Method 1 — Transcript Capture

For coding agents, transcript capture is essential.

Different agents expose different formats.

For example, Vercel found that:

- Claude Code stores JSONL transcripts;
- Codex streams JSON;
- OpenCode uses another stdout format;
- tool names and message structures differ.

They therefore built a four-stage normalization process:

```text
Capture
  ↓
Parse
  ↓
Enrich
  ↓
Normalize
```

This is directly relevant to our architecture. citeturn0search0

Our system should adopt the same general architectural idea while defining our own richer event model.

---

# 13. Unified Event Model

The core internal object should be a normalized event.

Conceptually:

```typescript
type ObservationEvent = {
  runId: string
  timestamp: string
  source: ObservationSource
  type: ObservationType

  actor?: string
  tool?: ToolInfo
  request?: RequestInfo
  response?: ResponseInfo

  url?: string
  status?: number

  metadata?: Record<string, unknown>
}
```

Possible event types:

```text
agent_message
tool_call
tool_result
browser_navigation
browser_click
browser_input
browser_dom_change
network_request
network_response
web_search
web_fetch
mcp_discovery
mcp_tool_call
api_call
filesystem_read
filesystem_write
shell_command
error
credential_event
task_start
task_end
```

The exact schema will be finalized after the first implementation experiments.

---

# 14. Observation Method 2 — Browser/CDP

Browser execution should expose browser-level events.

Potential data:

- navigation;
- URL;
- request/response;
- DOM;
- console;
- page errors;
- downloads;
- screenshots;
- cookies;
- storage;
- browser tool calls.

CDP-style instrumentation is valuable because it provides visibility below the agent's natural-language transcript.

For example:

```text
Agent says:
"Searching for Stripe pricing"

Browser evidence:
  navigation → google.com
  request → search
  navigation → stripe.com/pricing
  request → pricing API
```

This lets us compare what the agent claims it did with what the browser actually did.

---

# 15. Observation Method 3 — Network Interception

Network-level observation is particularly important.

We should capture, where legally and technically appropriate:

```text
HTTP method
URL
status
headers metadata
timing
request size
response size
redirects
domain
resource type
```

We should **not** automatically store sensitive request/response bodies.

Instead:

- redact secrets;
- classify sensitive data;
- allow customer-configurable capture;
- hash where appropriate;
- store metadata by default.

Network interception can reveal:

- search engines contacted;
- websites accessed;
- APIs called;
- redirects;
- authentication failures;
- retries;
- unexpected third-party services.

---

# 16. Observation Method 4 — Filesystem

For coding agents we may observe:

- files read;
- files written;
- configuration changes;
- generated artifacts;
- installed packages.

This can help answer:

> “What information did the agent actually inspect before making its recommendation?”

Filesystem observation should remain scoped to the sandbox.

---

# 17. Observation Method 5 — Shell / Process Events

For coding agents:

```text
command
exit code
duration
stdout metadata
stderr metadata
process tree
```

We should avoid unrestricted storage of sensitive output.

The primary purpose is understanding behavior and failures.

---

# 18. Observation Method 6 — MCP

MCP should be treated as a first-class observation source.

Potential events:

```text
MCP server discovery
tool listing
tool selection
tool invocation
arguments
result
error
authentication
latency
```

This will become especially important for future SDK/MCP optimization.

Cloudflare's current MCP documentation demonstrates that agents can discover tools exposed by remote MCP servers and use them from agent runtimes. citeturn0search5turn0search6

---

# 19. Observation Method 7 — WebMCP

WebMCP should eventually be supported at the browser observation layer.

WebMCP exposes structured website tools directly to browser agents, replacing some screenshot/analyze/click workflows with typed tool calls. Cloudflare's current Browser Run implementation supports experimental WebMCP workflows. citeturn0search2turn0search7

Our system should eventually detect:

```text
Does the site expose WebMCP?
What tools exist?
What parameters exist?
Which tools were called?
Did the agent use them?
Did WebMCP improve task completion?
```

This is a future capability, not a V1 dependency.

---

# 20. Consumer AI Observation

This requires special treatment.

Consumer AI systems are different from coding CLIs.

We may not always have:

- API access;
- transcript files;
- internal tool events;
- network-level visibility;
- stable interfaces.

Therefore the architecture should support multiple observation strategies:

```text
Official API
    ↓
Browser automation
    ↓
Browser/CDP telemetry
    ↓
Visible response capture
    ↓
Network metadata
```

We should prioritize official APIs and permitted interfaces.

Browser automation should only be used where allowed and technically appropriate.

The platform should never depend on private/internal APIs that are likely to break or violate provider terms.

---

# 21. Credential Architecture

Credentials are one of the highest-risk parts of the system.

Credentials may include:

- model provider keys;
- customer API keys;
- staging credentials;
- OAuth tokens;
- MCP credentials.

Rules:

### Never store credentials in experiment prompts.

### Never expose secrets to the control plane unnecessarily.

### Inject secrets only into isolated execution environments.

### Use short-lived credentials wherever possible.

### Scope permissions to the minimum required.

### Prefer customer-provided staging environments for destructive testing.

### Record credential usage metadata, not secret values.

---

# 22. Customer Environment Strategy

For authenticated agent testing, support:

## Option A — Public website

No credentials.

## Option B — Customer staging environment

Preferred for deeper testing.

## Option C — Restricted test account

Customer provides a dedicated test account.

## Option D — Customer-hosted runner

Future enterprise option.

This allows security-sensitive customers to retain control over their infrastructure.

---

# 23. Experiment Reproducibility

Every experiment must be reproducible as far as possible.

Store:

```text
experiment_id
run_id
timestamp
agent version
model version
browser version
sandbox image
prompt version
query version
website revision
environment configuration
tool configuration
evaluation version
```

A result without its execution context is difficult to trust.

---

# 24. Nondeterminism

AI systems are probabilistic.

Therefore:

```text
1 prompt
1 run
```

is not sufficient for many measurements.

Instead:

```text
Experiment
    ↓
Prompt
    ↓
N repeated runs
    ↓
Aggregate
    ↓
Confidence / distribution
```

For example:

```text
Recommendation rate = 63%
95% confidence interval = ...
n = 50
```

The statistical framework will be defined in the Evaluation document.

---

# 25. Evaluation Architecture

Evaluation should be independent from execution.

```text
Raw observations
       ↓
Normalized events
       ↓
Evaluators
       ↓
Scores
       ↓
Evidence
       ↓
Diagnosis
```

Potential evaluator categories:

### Visibility evaluator

Did AI mention/recommend the company?

### Citation evaluator

Was the company's content cited?

### Competitor evaluator

Which competitors were mentioned/recommended?

### Task evaluator

Did the agent complete the requested task?

### Readiness evaluator

Does the site support relevant agent standards?

### Efficiency evaluator

How many:

- steps;
- tool calls;
- tokens;
- requests;
- retries;
- failures?

### Quality evaluator

Was the final answer/task result correct?

---

# 26. Evidence Model

Every evaluation should link back to evidence.

Example:

```text
Finding:
Competitor X is recommended instead.

Evidence:
- Query
- AI response
- cited sources
- search results
- agent trace
- website content
- competitor content
```

This creates an evidence graph:

```text
Finding
  │
  ├── Observation
  ├── Observation
  ├── Source
  ├── Source
  └── Evaluation
```

This is important for customer trust.

---

# 27. Diagnosis Engine

The diagnosis engine should combine:

```text
AI visibility
+
competitor evidence
+
website analysis
+
agent behavior
+
readiness checks
```

It should generate structured findings.

Example:

```text
Finding ID: F-102

Problem:
Product pricing is rarely surfaced in AI answers.

Evidence:
- 4/50 responses mention pricing
- competitor appears in 31/50
- competitor pricing page is directly cited
- customer pricing page requires additional navigation

Likely contributing factors:
- poor content discoverability
- weak semantic structure
- insufficient third-party references

Recommended actions:
1. ...
2. ...
3. ...
```

The system should distinguish:

- observed fact;
- inference;
- recommendation.

It should never present an inference as proven causation.

---

# 28. Agent Readiness Engine

The readiness engine should evaluate standards and technical signals.

Potential checks:

```text
robots.txt
sitemap
HTML accessibility
structured data
Markdown/content representations
API discovery
OAuth discovery
MCP Server Card
Agent Skills
WebMCP
agent authentication
commerce protocols
```

Cloudflare's current Agent Readiness product checks capabilities including Agent Skills, API Catalog, OAuth discovery, MCP Server Card, and WebMCP, and separately tracks agentic commerce standards. This is an important reference set for our own readiness model. citeturn0search1

Our architecture should treat these as pluggable checks rather than hard-coded score logic.

---

# 29. Readiness Check Interface

Conceptually:

```typescript
interface ReadinessCheck {
  id: string
  category: string
  detect(target: Target): Promise<CheckResult>
  explain(result: CheckResult): Explanation
}
```

This allows new standards to be added without rewriting the platform.

---

# 30. Experiment Engine

The experiment engine should support:

```text
Baseline
   ↓
Intervention
   ↓
Retest
   ↓
Comparison
   ↓
Statistical evaluation
   ↓
Decision
```

Example:

```text
Baseline:
Recommendation = 38%

Change:
Improve product documentation

Retest:
Recommendation = 56%

Result:
+18 percentage points
```

We should be careful about attributing causality.

Controlled experiment design belongs in the Evaluation document.

---

# 31. Data Architecture

At a high level:

```text
PostgreSQL
    │
    ├── organizations
    ├── users
    ├── projects
    ├── targets
    ├── competitors
    ├── experiments
    ├── runs
    ├── agents
    ├── queries
    ├── evaluations
    ├── findings
    └── recommendations

Object Storage
    │
    ├── raw transcripts
    ├── screenshots
    ├── HAR/network artifacts
    ├── logs
    └── reports
```

Large artifacts should not be stored directly inside the relational database.

---

# 32. Event Storage

The normalized event stream may become large.

Potential architecture:

```text
Execution
   ↓
Event collector
   ↓
Queue / stream
   ↓
Normalizer
   ↓
Event store
   ↓
Evaluation
```

For V1, this may be implemented more simply.

We should not introduce Kafka or another heavy distributed system until actual volume requires it.

---

# 33. Initial Technology Strategy

### V1 Technology Decisions

The V1 technology stack and infrastructure choices are finalized in
[`10-v1-implementation-plan.md`](./10-v1-implementation-plan.md).

This document defines the higher-level architecture and system boundaries.
Document 10 is authoritative for V1 implementation choices.`


### Application

- TypeScript;
- Next.js or equivalent web application;
- REST/typed API.

### Backend workers

- TypeScript/Node.js initially;
- Python only where evaluation/ML tooling provides a clear advantage.

### Database

- PostgreSQL.

### Object storage

- S3-compatible storage.

### Queue

- managed queue initially.

### Sandbox

- provider abstraction around managed microVM infrastructure.

### Browser

- Playwright/CDP-compatible browser execution.

### Observability

- OpenTelemetry-compatible internal event model where useful.

The goal is to minimize operational complexity in V1.

---

# 34. Internal API Boundaries

Suggested boundaries:

```text
/api
    ├── projects
    ├── experiments
    ├── runs
    ├── agents
    ├── evaluations
    ├── findings
    └── reports
```

Internal services/modules:

```text
orchestrator
execution
observation
normalization
evaluation
diagnosis
readiness
reporting
```

These should initially be modules rather than separate microservices.

---

# 35. Monolith First

The initial platform should be a **modular monolith + isolated execution workers**.

Not:

```text
15 microservices
```

Instead:

```text
Web/API
  │
  ├── Experiment module
  ├── Evaluation module
  ├── Diagnosis module
  ├── Readiness module
  └── Reporting module
          │
          ▼
    Execution workers
          │
          ▼
      Sandboxes
```

This gives us speed while preserving clean boundaries.

---

# 36. Queue-Based Execution

Agent execution should be asynchronous.

```text
User
 ↓
Create experiment
 ↓
Queue job
 ↓
Worker
 ↓
Sandbox
 ↓
Agent
 ↓
Observation
 ↓
Evaluation
 ↓
Result
```

The UI should not wait on a long-running agent process.

---

# 37. Failure Handling

Agent runs can fail because of:

- provider errors;
- network errors;
- sandbox failures;
- authentication;
- agent crashes;
- timeouts;
- browser crashes;
- malformed outputs.

Every run should have explicit states:

```text
queued
starting
running
collecting
evaluating
completed
failed
timeout
cancelled
```

Failures should be classified.

---

# 38. Timeouts and Resource Limits

Every execution should have:

- wall-clock timeout;
- CPU limit;
- memory limit;
- disk limit;
- network policy;
- process limit.

An agent that loops forever must not consume unlimited resources.

Vercel's current agent-testing architecture explicitly uses sandbox timeouts as a hard ceiling for autonomous agents. citeturn0search0

---

# 39. Network Security

Network policy should support:

```text
allowlist
denylist
restricted mode
full internet mode
```

Different experiments require different access.

For example:

### AI visibility

Internet access required.

### Customer staging

Only approved domains may be accessible.

### Destructive testing

Strict allowlist.

This should be configurable per experiment.

---

# 40. Privacy Architecture

Default principle:

> **Collect the minimum data required to answer the experiment.**

Sensitive data should be:

- redacted;
- encrypted;
- access-controlled;
- retention-limited.

Potential sensitive information:

- API keys;
- cookies;
- OAuth tokens;
- customer data;
- private source code;
- internal URLs;
- user information.

---

# 41. Tenant Isolation

Every object should be associated with an organization.

```text
Organization
    ↓
Project
    ↓
Experiment
    ↓
Run
    ↓
Observation
```

Authorization must be enforced at every layer.

---

# 42. Artifact Lifecycle

Raw artifacts should have configurable retention.

Example:

```text
Raw transcript       30 days
Screenshots          30 days
Normalized events    90 days
Aggregated results   long-term
Customer reports     long-term
```

Actual retention policies should be determined commercially and legally.

---

# 43. Reporting Architecture

The reporting system consumes normalized evaluation results.

```text
Evaluations
    ↓
Findings
    ↓
Recommendations
    ↓
Report Generator
    ├── Executive
    ├── Technical
    └── Experiment
```

Reports should contain evidence references.

---

# 44. Versioning

Everything that can affect an evaluation should be versioned.

Examples:

```text
Agent version
Browser version
Prompt version
Evaluator version
Readiness rules version
Normalization version
Sandbox image version
```

This prevents historical results from becoming impossible to interpret.

---

# 45. Agent Registry

The platform should maintain a registry:

```text
Agent
 ├── identity
 ├── version
 ├── runtime
 ├── install method
 ├── invocation
 ├── capabilities
 ├── transcript format
 └── adapter
```

Adding an agent should ideally require adding an adapter rather than modifying the core engine.

---

# 46. Query Registry

Queries should also be versioned.

```text
QuerySet
   ├── category
   ├── query
   ├── intent
   ├── target product
   ├── competitors
   └── version
```

Query categories may include:

- discovery;
- comparison;
- recommendation;
- transactional;
- technical;
- integration.

---

# 47. Benchmark Architecture

Benchmarks should compare:

```text
Agent A
Agent B
Agent C

on:

Query Set X
Target Y
Experiment Z
```

Metrics may include:

- recommendation;
- citation;
- task success;
- tool selection;
- latency;
- steps;
- failures.

The benchmark engine should remain independent from customer reporting.

---

# 48. Future MCP / SDK Testing Architecture

Future architecture:

```text
                    Client Product
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
            API         SDK         MCP
             │           │           │
             └───────────┼───────────┘
                         ▼
                    Agent Runner
                         │
                         ▼
                    Observation
                         │
                         ▼
                    Evaluation
```

We can then answer:

> “Can an agent discover and successfully use the interfaces our company provides?”

This becomes an important expansion of the platform.

---

# 49. Future WebMCP Architecture

```text
Browser
   │
   ├── DOM
   ├── Network
   ├── CDP
   └── WebMCP
          │
          ▼
      Agent Runner
          │
          ▼
      Observation
```

WebMCP should be evaluated as both:

1. a readiness capability;
2. an actual behavioral interface.

Cloudflare's current WebMCP work reinforces this distinction: structured browser tools can replace fragile screenshot/click interaction for supported tasks. citeturn0search3

---

# 50. Future Agent Commerce

The architecture should leave room for:

- x402;
- Universal Commerce Protocol;
- Agentic Commerce Protocol;
- payment authorization;
- transaction completion.

These should not be implemented in the initial architecture beyond keeping the readiness framework extensible.

Cloudflare currently evaluates these standards separately from its Agent Readiness score, which is a useful precedent for keeping commerce readiness distinct until the standards mature. citeturn0search1

---

# 51. V1 Architecture

V1 should be intentionally small.

```text
Web App
   │
   ▼
API
   │
   ▼
PostgreSQL
   │
   ▼
Job Queue
   │
   ▼
Execution Worker
   │
   ▼
Managed Sandbox
   │
   ├── Model/API tests
   ├── Browser tests
   └── Selected coding-agent tests
            │
            ▼
      Observation Collector
            │
            ▼
      Normalization Layer
            │
            ▼
      Basic Evaluators
            │
            ▼
      Competitive Report
```

---

# 52. V1 Scope

V1 should prove four things:

### 1. We can execute controlled AI experiments.

### 2. We can reliably observe agent behavior.

### 3. We can normalize heterogeneous observations.

### 4. We can produce commercially useful competitive findings.

V1 does not need:

- every AI provider;
- every coding agent;
- MCP optimization;
- WebMCP;
- agent commerce;
- automatic code changes;
- complex distributed infrastructure.

---

# 53. V1 Observation Priority

Implement in this order:

```text
1. Model/API response
2. Web search/source extraction
3. Browser navigation
4. Network metadata
5. Agent transcript
6. Tool calls
7. MCP
8. WebMCP
```

This gives us increasing depth without blocking the initial product.

---

# 54. V1 Agent Priority

Initial agent categories:

### Tier 1

General AI/model APIs for controlled visibility testing.

### Tier 2

Browser-based agent testing.

### Tier 3

One coding agent.

### Tier 4

Additional coding agents.

The exact providers will be selected during implementation research.

---

# 55. V1 Evaluation Priority

Start with:

```text
Mention detection
Recommendation detection
Competitor detection
Citation detection
Source extraction
Basic task success
Basic readiness checks
```

Then add:

```text
step efficiency
tool efficiency
token efficiency
latency
failure classification
causal experiments
```

---

# 56. Architecture Decision Records

Important architecture decisions should be recorded separately.

Examples:

```text
ADR-001 Sandbox provider
ADR-002 Browser runtime
ADR-003 Event schema
ADR-004 Database
ADR-005 Queue
ADR-006 Credential handling
ADR-007 Network interception
ADR-008 Transcript normalization
ADR-009 Evaluation architecture
ADR-010 Multi-tenant isolation
```

This prevents architectural reasoning from being lost.

---

# 57. Security Decision Gate

Before allowing authenticated customer testing, we must have:

- sandbox isolation;
- secret injection;
- credential redaction;
- network controls;
- tenant isolation;
- audit logs;
- retention controls;
- cancellation;
- resource limits.

Authenticated execution should not be treated as a casual extension of public-site scanning.

---

# 58. Technical Risks

## R1 — Agent formats change

Mitigation:

Adapter + normalization layer.

## R2 — Browser interfaces change

Mitigation:

Browser abstraction + CDP-compatible instrumentation.

## R3 — Consumer AI access is limited

Mitigation:

Multiple observation modes.

## R4 — Agent behavior is nondeterministic

Mitigation:

Repeated runs + statistical evaluation.

## R5 — Execution is expensive

Mitigation:

Caching, sampling, concurrency controls, quotas.

## R6 — Credentials leak

Mitigation:

Short-lived secrets + isolated execution + redaction.

## R7 — False causal conclusions

Mitigation:

Separate observations from inference and controlled experimentation.

---

# 59. What We Need to Research Before Finalizing Implementation

Before locking the V1 stack, test:

### Sandbox

- Vercel Sandbox
- Cloudflare execution/browser infrastructure
- Firecracker-based options
- other managed microVM providers

### Browser

- Playwright
- CDP
- Cloudflare Browser Run
- other remote-browser providers

### Observation

- transcript APIs/files;
- stdout/stderr;
- process tracing;
- network interception;
- HAR;
- CDP;
- OpenTelemetry.

### Agents

- Codex
- Claude Code
- OpenCode
- browser agents
- model APIs.

### AI visibility

- provider APIs;
- search APIs;
- citation extraction;
- result normalization.

### Standards

- MCP
- MCP Server Cards
- WebMCP
- Agent Skills
- API Catalog
- OAuth discovery
- agent commerce standards.

---

# 60. Recommended Development Philosophy

Build the smallest system that proves the architecture.

Do not begin with:

```text
Kubernetes
Kafka
20 microservices
massive event pipeline
complex ML infrastructure
```

Begin with:

```text
Modular application
+
PostgreSQL
+
Queue
+
Worker
+
Sandbox
+
Browser
+
Normalized events
+
Evaluators
```

Scale the architecture only when actual workload requires it.

---

# 61. Architecture Summary

The fundamental architecture is:

```text
                  CUSTOMER
                     │
                     ▼
                EXPERIMENT
                     │
                     ▼
               ORCHESTRATOR
                     │
         ┌───────────┼───────────┐
         ▼           ▼           ▼
       MODEL       BROWSER      AGENT
         │           │           │
         └───────────┼───────────┘
                     ▼
                 OBSERVE
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 TRANSCRIPT       NETWORK        BROWSER
      │              │              │
      └──────────────┼──────────────┘
                     ▼
                NORMALIZE
                     │
                     ▼
                 EVALUATE
                     │
          ┌──────────┼──────────┐
          ▼          ▼          ▼
       VISIBILITY   AGENT    READINESS
                     │
                     ▼
                 DIAGNOSE
                     │
                     ▼
                RECOMMEND
                     │
                     ▼
                EXPERIMENT
                     │
                     ▼
                  VALIDATE
```

---

# 62. Architectural North Star

The architecture should make it possible to answer this question with reproducible evidence:

> **“What did the AI system do, what did it see, what did it use, where did it fail, why did it make this decision, and did our intervention improve the outcome?”**

If the architecture can reliably answer that question, it supports the core product vision.

---

# 63. Relationship to Other Documents

This document defines **how the platform should work technically at a high level**.

It does not finalize the exact implementation.

The next documents should define:

- `04-implementation-roadmap.md` — version-by-version build plan;
- `05-evaluation-and-benchmarking.md` — scoring, statistical methodology, evaluators;
- `06-agent-readiness-spec.md` — readiness checks and standards;
- `11-research-register.md` — external research and technical decisions;
- ADR files — individual architecture decisions.

The implementation roadmap should use this architecture as its constraint and convert it into concrete engineering tasks.
