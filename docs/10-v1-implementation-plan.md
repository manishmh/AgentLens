# 10 — V1 Implementation Plan

**Status:** Execution Specification v0.2  
**Purpose:** The implementation agent should use this document as the authoritative V1 build plan.
> **Research reference:** Before implementing V1, consult
> [`11-research-register.md`](./11-research-register.md) for the external
> research, architectural rationale, competitive analysis, and
> future-technology considerations behind this implementation plan.

**Research reference:** Before implementing V1, consult 11-research-register.md for the external research, architectural rationale, competitive analysis, and future-technology considerations behind this implementation plan. 

**V1 objective:** Run an AI agent in an isolated environment against a real web task, observe its externally visible behavior, convert that execution into structured evidence, evaluate the outcome, and expose actionable findings.

---

# 1. V1 Engineering Goal

The first product capability is:

```text
Agent
  ↓
Sandbox
  ↓
Browser + Tools
  ↓
Observation
  ↓
Canonical Events
  ↓
Evaluation
  ↓
Evidence-backed Finding
```

The implementation must prioritize the observation/evidence pipeline before building the full dashboard.

---

# 2. Locked V1 Technology Stack

These are the V1 choices. The implementation agent must use them unless an explicit architecture decision is made later.

| Area | V1 Choice |
|---|---|
| Language | TypeScript |
| Runtime | Node.js 22+ |
| Frontend | Next.js + React + TypeScript |
| Styling | Tailwind CSS |
| Agent framework | Vercel AI SDK 7 |
| Agent abstraction | AI SDK Agent / Harness interfaces |
| Sandbox | Vercel Sandbox |
| Sandbox abstraction | `SandboxProvider` |
| Browser | Chromium |
| Browser automation | Playwright |
| Browser instrumentation | Chrome DevTools Protocol (CDP) |
| Backend | Node.js / TypeScript |
| API | TypeScript service |
| Database | PostgreSQL |
| ORM | Prisma |
| Queue | Redis + BullMQ |
| Object storage | S3-compatible storage |
| Validation | Zod |
| Telemetry | OpenTelemetry |
| Evaluation | TypeScript rules + LLM evaluator |
| Event format | Canonical JSON + Zod schemas |
| Deployment | Hybrid control plane + execution plane |

AI SDK 7 provides agent execution, sandbox support, harness integration, MCP support, and telemetry capabilities. It also provides `HarnessAgent` abstractions for established agents such as Codex and Claude Code, which supports the future developer-agent roadmap. citeturn0search3turn0search4

---

# 3. Locked Sandbox Decision

## V1 Sandbox

Use:

```text
Vercel Sandbox
```

The sandbox must be accessed through:

```text
SandboxProvider
```

so that the execution plane is not permanently coupled to the provider.

### Required capabilities

```text
process isolation
filesystem isolation
network controls
resource limits
browser execution
artifact extraction
long-running execution
future MCP compatibility
future coding-agent compatibility
```

### Future path

```text
V1
Vercel Sandbox

Future
Firecracker / microVM-based execution
or another independently deployable sandbox
```

The future migration must not require rewriting the agent, browser, observation, or evaluation layers.

---

# 4. Locked Agent Runtime

Use:

```text
Vercel AI SDK 7
```

The implementation must create an internal:

```text
AgentRuntime
```

interface.

Conceptually:

```text
AgentRuntime
├── start()
├── execute(task)
├── status()
├── stop()
└── metadata()
```

V1 should implement one browser-oriented runtime first.

Future adapters:

```text
OpenAI Agents SDK
Anthropic/Claude
Codex
Claude Code
OpenCode
other agent harnesses
```

AI SDK 7 explicitly supports integrating established harnesses including Codex and Claude Code. citeturn0search3

---

# 5. Locked Browser Runtime

Use:

```text
Chromium
+
Playwright
+
CDP
```

Architecture:

```text
Agent
 ↓
Playwright
 ↓
Chromium
 ↓
CDP
 ↓
Observation Engine
```

Playwright handles reliable browser control.

CDP provides deeper browser-level instrumentation.

The browser version must be pinned for reproducibility.

---

# 6. Observation Architecture

Our own observation layer is the core product infrastructure.

Third-party telemetry must not be the canonical source of truth.

Capture multiple observation layers:

```text
                    AGENT
                      │
          ┌───────────┴───────────┐
          │                       │
     Agent Events            Tool Events
          │                       │
          └───────────┬───────────┘
                      │
                   Browser
                      │
             ┌────────┼────────┐
             │        │        │
            CDP   Playwright  Network
             │        │        │
             └────────┼────────┘
                      │
               Observation
                  Engine
                      │
               Canonical Events
```

---

# 7. What V1 Observes

Capture:

```text
task
agent metadata
agent actions
tool calls
tool results
search queries
search results
visited URLs
navigation
clicks
inputs
scrolls
page lifecycle
DOM/page evidence
screenshots
network request metadata
network response metadata
console errors
browser errors
timestamps
final answer
```

Do not attempt to capture private chain-of-thought.

The platform measures observable behavior and evidence.

---

# 8. Evidence Boundary

Every finding must distinguish:

### Observed

```text
Agent searched for X.
Agent opened competitor.com.
Agent did not open customer.com.
Agent recommended competitor.com.
```

### Inferred

```text
Competitor's clearer pricing information may have contributed
to the recommendation.
```

The system must never present an inference as direct observation.

---

# 9. Canonical Event Schema

Every event must contain at minimum:

```text
event_id
run_id
timestamp
sequence
event_type
source
payload
visibility
```

Initial event types:

```text
run.started
run.finished

agent.started
agent.action
agent.message
agent.tool_call
agent.tool_result
agent.finished

browser.started
browser.navigation
browser.click
browser.input
browser.scroll
browser.error

search.query
search.results
search.selection

network.request
network.response

page.snapshot
screenshot

evaluation.completed
finding.created
```

All schemas must be validated with Zod.

Provider-specific events must be normalized:

```text
Provider Event
      ↓
Adapter
      ↓
Canonical Event
```

---

# 10. Run Model

Every execution produces:

```text
Run
├── metadata
├── task
├── environment
├── agent
├── browser
├── events
├── artifacts
├── evaluation
└── findings
```

Store reproducibility metadata:

```text
agent runtime version
model
browser version
sandbox image/runtime
task version
timestamp
region
locale
timezone
network policy
experiment configuration
```

---

# 11. First Prototype

The first engineering milestone is intentionally small.

Execute:

```text
"Find the pricing information for X."
```

inside the sandbox.

Produce:

```text
run.json
screenshots/
artifacts/
```

`run.json` must contain:

```text
metadata
task
agent
events[]
result
```

The prototype is successful when the complete observable journey can be reconstructed from the stored run.

---

# 12. Milestone 0 — Repository

Create:

```text
agent-intelligence/
│
├── apps/
│   └── web/
│
├── services/
│   ├── api/
│   ├── runner/
│   ├── observer/
│   ├── evaluator/
│   └── scheduler/
│
├── packages/
│   ├── agent-runtime/
│   ├── browser/
│   ├── sandbox/
│   ├── event-schema/
│   ├── evaluation/
│   └── shared/
│
├── infra/
│
├── docs/
│
└── tests/
```

Set up:

```text
TypeScript
Node.js 22+
ESM
pnpm
linting
formatting
unit tests
environment configuration
Docker development dependencies
```

---

# 13. Milestone 1 — Sandbox + Agent Runner

Implement:

```text
SandboxProvider
AgentRuntime
sandbox lifecycle
resource limits
network policy
timeouts
cleanup
artifact extraction
```

The runner must:

```text
create sandbox
 ↓
start agent
 ↓
execute task
 ↓
collect artifacts
 ↓
stop agent
 ↓
destroy sandbox
```

Tests must verify:

```text
timeout
cleanup
filesystem isolation
network restrictions
process isolation
artifact extraction
```

---

# 14. Milestone 2 — Browser

Implement:

```text
Chromium
Playwright
CDP
```

Capabilities:

```text
launch
navigate
click
input
scroll
screenshot
DOM access
page lifecycle
close
```

The browser provider must be independently testable.

---

# 15. Milestone 3 — Observation Engine

Implement:

```text
navigation observer
interaction observer
search observer
screenshot collector
page snapshot collector
network observer
console/error observer
```

Normalize all outputs into canonical events.

The observation engine must work independently of the dashboard.

---

# 16. Milestone 4 — Event Pipeline

Implement:

```text
event validation
event ordering
event ingestion
redaction
persistent storage
artifact storage
run reconstruction
```

Required internal metric:

```text
Observation Completeness
```

Example:

```text
expected events: 100
captured events: 97
completeness: 97%
```

Agent execution failure and observation failure must be represented separately.

---

# 17. Milestone 5 — Evaluation

Implement an:

```text
Evaluator
```

with:

```text
evaluate(run, task, successCriteria)
```

V1 evaluation types:

```text
binary
categorical
numeric
evidence-based
```

Initial metrics:

```text
task success
customer discovered
customer recommended
competitor recommended
required information found
interaction success
```

Example:

```json
{
  "task_success": true,
  "customer_discovered": true,
  "customer_recommended": false,
  "competitor_recommended": true
}
```

---

# 18. Milestone 6 — Findings

Create a finding model:

```text
finding_id
run_id
category
severity
observation
evidence
inference
recommendation
confidence
```

Example:

```text
Category:
Discovery

Observation:
Customer appeared in search results but was not visited.

Evidence:
8/10 runs.

Inference:
The agent may have found competitor information more directly.

Recommendation:
Improve relevant machine-readable product information and
supporting content.

Confidence:
Medium
```

Deterministic rules establish factual findings.

LLMs summarize and prioritize evidence.

---

# 19. Milestone 7 — Agent Readiness

Agent readiness is a diagnostic layer, not the entire product.

Initial checks:

```text
robots.txt
sitemap.xml
AI crawler access
HTML accessibility
Markdown availability
Markdown content negotiation
llms.txt
machine-readable content
structured data
metadata
documentation
API discovery
OAuth discovery
MCP discovery
WebMCP readiness
authentication
agent capabilities
```

Cloudflare's current Agent Readiness work is the primary external reference for this layer. Cloudflare evaluates areas including Discoverability, Content, Bot Access Control, and Capabilities, while its broader Agentic Internet framing uses readable, discoverable, callable, and payable primitives. citeturn0search0turn0search1turn0search2

Our implementation must extend beyond compliance into observed behavior.

---

# 20. Milestone 8 — Competitor Intelligence

Implement:

```text
competitor configuration
query groups
multi-run aggregation
discovery rate
recommendation rate
source frequency
page visits
task success
information completeness
```

The system should answer:

> Why did the agent recommend the competitor instead of the customer?

The answer must be backed by evidence.

---

# 21. Milestone 9 — Dashboard

Only after the execution/evaluation pipeline works.

V1 pages:

```text
/projects
/projects/:id
/projects/:id/runs
/projects/:id/runs/:id
/projects/:id/competitors
/projects/:id/readiness
/projects/:id/experiments
```

First dashboard priority:

```text
Run detail
```

Display:

```text
task
outcome
agent
timeline
searches
pages
actions
screenshots
evidence
findings
```

UX structure:

```text
Summary
 ↓
Finding
 ↓
Evidence
 ↓
Raw detail
```

---

# 22. Milestone 10 — Experiments

Implement:

```text
baseline
treatment
repeat runs
comparison
change summary
```

Initial comparison:

```text
before
vs
after
```

Do not claim causal improvement unless the experiment design supports the claim.

---

# 23. Storage Architecture

Use:

```text
PostgreSQL
+
S3-compatible object storage
```

PostgreSQL stores:

```text
organizations
projects
experiments
runs
event metadata
evaluations
findings
```

Object storage stores:

```text
screenshots
DOM snapshots
HTML
large traces
network captures
reports
```

Use:

```text
Redis + BullMQ
```

for asynchronous execution jobs.

---

# 24. Control Plane / Execution Plane

Separate the system into:

### Control Plane

```text
web app
API
authentication
projects
experiments
scheduling
billing
results
```

### Execution Plane

```text
sandbox
agent
browser
network
observation
artifacts
```

The execution plane must remain independently deployable.

---

# 25. Deployment Model

Use a hybrid deployment model.

```text
Control Plane
Next.js + Node.js API
PostgreSQL
Redis
Object Storage

Execution Plane
Vercel Sandbox
Agent Runner
Chromium
Observation Engine
```

Do not make the entire product dependent on serverless request execution.

Long-running agent jobs always execute asynchronously.

---

# 26. Telemetry

Use:

```text
OpenTelemetry
```

for platform/service telemetry.

AI SDK telemetry may supplement this, but it is not our canonical evidence source.

Track:

```text
run latency
sandbox startup time
browser failures
queue latency
event loss
artifact failures
evaluation failures
```

---

# 27. Security Requirements

Before external customer access:

```text
tenant isolation
domain verification
SSRF protection
network policy
credential isolation
secret redaction
resource limits
timeouts
rate limits
audit logging
artifact authorization
```

Never expose credentials unnecessarily to the agent.

---

# 28. V1 Scope Boundary

V1 includes:

```text
browser-based AI agent testing
agent observation
search observation
website interaction
agent visibility
agent readiness
competitor diagnosis
evidence
recommendations
basic experiments
dashboard
```

V1 does not include:

```text
passive production agent traffic
full coding-agent analytics
MCP optimization
SDK optimization
WebMCP implementation
customer-hosted runners
advanced statistical experimentation
large-scale crawling
```

These are future implementations.

---

# 29. Future Architecture Compatibility

The V1 abstractions must leave room for:

```text
ChatGPT-style web agents
Claude web agents
Gemini web agents
computer-use agents
Codex
Claude Code
MCP clients
SDK agents
API agents
```

Future MCP analytics:

```text
MCP server
 ↓
Agent
 ↓
Tool calls
 ↓
Observation
 ↓
Evaluation
```

Future coding-agent analytics:

```text
Coding agent
 ↓
Search
 ↓
Documentation
 ↓
SDK
 ↓
MCP
 ↓
Code
 ↓
Tests
```

Metrics can include:

```text
tool discovery
tool selection
argument correctness
errors
latency
documentation usefulness
implementation success
test success
```

---

# 30. Cloudflare Research Integration

Cloudflare's work is part of our product model, not a competing implementation to copy.

Use Cloudflare research to inform:

```text
agent-readiness checks
readability
discoverability
callability
payability
machine-readable content
AI access controls
agent-facing standards
```

Cloudflare's AEO work is especially relevant because it tests realistic customer prompts against leading assistants and measures recommendation/citation outcomes. citeturn0search1

Our differentiation is:

```text
Cloudflare:
Is the site ready?
Are AI assistants recommending it?

Our platform:
What did the agent actually do?
What did it see?
Where did it fail?
Why did the competitor win?
What should change?
Did the change improve the result?
```

---

# 31. Cloudflare Computer Research

The Cloudflare Computer repository is a useful future architecture reference for agent workspaces and filesystem-backed execution.

It currently describes a virtual filesystem backed by Durable Objects/SQLite with Worker and container backends, but the repository explicitly labels the package preview-only and not suitable for production at present. citeturn0search10turn0search11

Therefore:

```text
V1:
Do not use Cloudflare Computer as core infrastructure.

Research:
Use it to inform future workspace/filesystem architecture.

Future:
Evaluate it again if the project becomes production-ready.
```

---

# 32. Vercel Research Integration

Vercel AI SDK 7 is directly relevant to our V1 architecture because it provides:

```text
agent execution
sandbox support
tool approvals
durability
MCP
telemetry
agent harness integration
```

It also provides a `HarnessAgent` abstraction capable of integrating established agent harnesses such as Codex and Claude Code. citeturn0search3

Our rule remains:

```text
Use AI SDK for agent execution/orchestration.

Do not use AI SDK telemetry as the canonical observation layer.

Build our own evidence layer.
```

---

# 33. V1 Definition of Done

V1 is ready for private pilots when:

### Execution

```text
Agent runs reliably.
```

### Observation

```text
Agent journey is reconstructable.
```

### Evidence

```text
Important findings have inspectable evidence.
```

### Evaluation

```text
Task outcomes can be measured consistently.
```

### Diagnosis

```text
Customer can understand why an agent failed
or preferred a competitor.
```

### Experiment

```text
Customer can compare baseline and treatment.
```

### Security

```text
Customer environments and credentials are isolated.
```

---

# 34. First Engineering Task

Build:

> **A minimal isolated browser-agent runner using Vercel Sandbox + Vercel AI SDK 7 + Chromium/Playwright + CDP that executes one web task and emits a canonical event trace.**

Required output:

```text
run.json
screenshots/
artifacts/
```

Required success condition:

```text
The complete observable journey can be reconstructed
from the stored run.
```

After this passes:

```text
network observation
 ↓
canonical event pipeline
 ↓
evaluation
 ↓
findings
 ↓
dashboard
```

---

# 35. Implementation Rules

The implementation agent must:

```text
1. Follow the locked stack above.
2. Not substitute major infrastructure without an explicit ADR.
3. Keep provider abstractions where specified.
4. Keep observation independent from agent framework telemetry.
5. Store evidence for important findings.
6. Separate observations from inferences.
7. Keep future MCP/coding-agent compatibility without implementing them in V1.
8. Build and test one milestone before starting the next.
9. Keep implementation minimal and avoid unnecessary dependencies.
10. Update documentation when an implementation decision changes.
```

---

# 36. Final V1 Build Sequence

```text
1. Repository
        ↓
2. Sandbox
        ↓
3. Agent runtime
        ↓
4. Chromium
        ↓
5. Playwright
        ↓
6. CDP observation
        ↓
7. Network observation
        ↓
8. Canonical events
        ↓
9. Storage
        ↓
10. Evaluation
        ↓
11. Findings
        ↓
12. Dashboard
        ↓
13. Competitor intelligence
        ↓
14. Experiments
        ↓
15. Security hardening
        ↓
16. Private design-partner pilots
```

---

## Future Observation Mode — Customer Instrumentation

The V1 architecture must remain compatible with a second observation mode
where customers send agent telemetry from their own infrastructure.

Potential integrations:

- SDK
- MCP instrumentation
- Connector instrumentation
- OpenTelemetry

This is not a V1 implementation requirement.

Both Mode A and Mode B must ultimately use the same canonical event model.

# 37. Core Engineering Principle

The implementation is successful only if the platform can reliably answer:

> **What did the AI agent do, what did it see, what did it use, where did it fail, what evidence explains the outcome, and did our intervention improve the result?**

That evidence pipeline is the core technical foundation of the product.
