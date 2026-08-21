# 07 — Agent Observation & Instrumentation Specification

**Status:** Draft v0.1  
**Document:** Agent Observation, Sandbox, Browser, Network & Transcript Architecture  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Core technical objective:** Observe how AI agents interact with a digital product without requiring modifications to the agent itself.

---

Mode A — Controlled External Observation
Mode B — Customer-Side Instrumentation

Mode A:
We observe the agent from the outside.

Mode B:
The customer explicitly instruments the environment
where the agent is operating.

# 1. Purpose

This document defines the technical approach for observing AI-agent behavior.

The platform must capture enough information to answer:

- What did the agent try to do?
- What did it search for?
- What pages did it visit?
- What tools did it call?
- What network requests occurred?
- What information did it receive?
- Where did it fail?
- Why did it choose a competitor?
- How efficiently did it complete the task?
- What changed between two experiments?

The observation system is the technical foundation of the product.

---

# 2. Core Principle

We should not require customers to modify:

- Claude;
- ChatGPT;
- Codex;
- Claude Code;
- Gemini;
- browser agents;
- third-party autonomous agents.

Instead:

```text
Agent
   ↓
Controlled Environment
   ↓
Observation Layer
   ↓
Event Stream
   ↓
Evaluation
```

The agent should behave as naturally as possible.

---

# 3. Observation Philosophy

There are four primary observation layers:

```text
1. Agent / transcript layer
2. Browser / CDP layer
3. Network layer
4. Environment / sandbox layer
```

No single layer is sufficient.

The strongest implementation combines them.

---

# 4. Observation Layers

## Layer 1 — Transcript / Agent Output

Observe:

- prompts;
- responses;
- tool calls;
- tool results;
- reasoning-visible metadata where legitimately available;
- final answer;
- errors.

Important:

> The platform must not attempt to capture hidden chain-of-thought.

We should collect only information legitimately exposed by the agent interface/API, such as tool calls, outputs, messages, and execution events.

---

## Layer 2 — Browser / CDP

Observe:

- navigation;
- page loads;
- DOM events;
- clicks;
- inputs;
- screenshots;
- console errors;
- downloads;
- storage;
- network events.

Chrome DevTools Protocol (CDP) is a major candidate for Chromium-based browser observation.

---

## Layer 3 — Network

Observe:

```text
HTTP requests
HTTP responses
DNS
redirects
API calls
MCP calls where observable
headers
status codes
content types
timing
```

Network observation is especially important because many agent decisions occur outside visible browser interaction.

---

## Layer 4 — Sandbox

Observe:

- processes;
- filesystem changes;
- environment variables;
- subprocesses;
- installed packages;
- browser processes;
- outbound network connections;
- resource usage.

This is particularly important for:

```text
Codex
Claude Code
coding agents
SDK agents
MCP clients
```

---

# 5. Two Major Product Modes

The observation system should support two major modes.

## Mode A — Web Agent Testing

Target:

```text
ChatGPT browser
Claude browser
Gemini browser
browser-use agents
computer-use agents
```

Focus:

```text
search
discovery
browser
network
interaction
task completion
```

---

## Mode B — Developer Agent Testing

Target:

```text
Codex
Claude Code
Cursor-like coding agents
custom agent frameworks
MCP clients
SDK agents
```

Focus:

```text
research
tool discovery
MCP
API
SDK
filesystem
commands
implementation
tests
```

This second mode is a future expansion but should influence the architecture from V0.

---

# 6. Sandbox Requirements

The sandbox must provide:

```text
strong isolation
browser support
network control
filesystem isolation
process isolation
credential injection
snapshots
replayability
resource limits
observability
```

The sandbox should be replaceable.

We should avoid coupling the product to one infrastructure provider.

---

# 7. Sandbox Strategy

Recommended architecture:

```text
                    Control Plane
                         │
                ┌────────┴────────┐
                │                 │
          Job Scheduler      Experiment DB
                │
                ▼
          Sandbox Manager
                │
       ┌────────┼────────┐
       ▼        ▼        ▼
    Runner A Runner B Runner C
       │        │        │
       ▼        ▼        ▼
     Agent    Agent    Agent
```

The control plane should know how to start and stop environments without needing to know every sandbox implementation detail.

---

# 8. Sandbox Abstraction

Create an internal interface:

```text
SandboxProvider

create()
start()
stop()
destroy()
snapshot()
restore()
exec()
networkPolicy()
injectCredentials()
collectArtifacts()
```

Potential future providers:

```text
Cloud sandbox
Container runtime
MicroVM
Browser sandbox
Customer-hosted runner
```

---

# 9. Recommended Initial Sandbox

The initial implementation should prioritize:

1. browser support;
2. strong isolation;
3. network observability;
4. filesystem/process access;
5. snapshots;
6. credential injection;
7. easy scaling.

The final provider choice should be based on measured fit rather than brand preference.

---

# 10. Browser Architecture

Use a Chromium-compatible browser where possible.

Architecture:

```text
Agent
  ↓
Browser Controller
  ↓
Chromium
  ↓
CDP
  ↓
Observation Collector
```

The browser should be instrumented without changing website behavior.

---

# 11. CDP Domains

Potentially useful CDP domains:

```text
Page
Network
Runtime
DOM
Browser
Target
Console
Performance
Storage
Security
```

Only enable what is necessary.

---

# 12. Browser Events

Normalize events such as:

```text
page_started
navigation
page_loaded
request_started
request_finished
response_received
click
input
scroll
download
console_error
page_failed
browser_error
```

Example:

```json
{
  "type": "navigation",
  "url": "https://example.com/pricing",
  "timestamp": "...",
  "runId": "..."
}
```

---

# 13. Network Observation

The network collector should record metadata first.

Example:

```json
{
  "method": "GET",
  "url": "https://example.com/api/products",
  "status": 200,
  "contentType": "application/json",
  "durationMs": 143
}
```

Do not automatically store full request/response bodies.

Bodies may contain:

- credentials;
- personal data;
- customer secrets;
- payment information.

---

# 14. Network Body Capture

Body capture should be:

```text
disabled by default
```

or selectively enabled for controlled test domains.

Possible policy:

```text
Allowlist domains
+
content-type filter
+
size limit
+
redaction
```

---

# 15. HTTP Replay

Where useful, preserve sanitized request metadata for debugging.

Example:

```text
Request
 ↓
headers
 ↓
method
 ↓
URL
 ↓
response status
 ↓
timing
```

Replay must never accidentally reuse production credentials or destructive requests.

---

# 16. DNS Observation

DNS can help identify:

- external APIs;
- analytics;
- third-party services;
- authentication providers;
- competitor/search services.

Record:

```text
hostname
resolved address
timestamp
```

Avoid unnecessary storage of sensitive network information.

---

# 17. Search Observation

Search behavior is one of the most important product signals.

When an agent searches for a product:

```text
Query
 ↓
Search engine
 ↓
Results
 ↓
Selected result
 ↓
Visited page
 ↓
Final recommendation
```

The system should capture the observable parts of this chain.

---

# 18. Search Result Capture

Where legally and technically appropriate, capture:

```text
query
result URLs
result order
selected URL
timestamp
```

Do not claim that an observed search ranking explains an AI model's internal reasoning.

---

# 19. Search Provider Abstraction

Different agents may use different search systems.

Create:

```text
SearchObservationAdapter
```

Potential providers:

```text
Bing
Google
Brave
Perplexity-style search
provider-native search
custom search
```

The adapter should normalize:

```text
query
results
ranking
source
timestamp
```

---

# 20. Agent Transcript Observation

The platform should support transcripts when the agent exposes them.

Capture:

```text
user/task instruction
assistant-visible message
tool call
tool result
final answer
error
```

Example:

```text
Agent:
"Find the best payment provider for this business."

Tool:
web_search("payment providers")

Tool result:
...

Agent:
"Stripe is the best option..."
```

This can be used for recommendation analysis.

---

# 21. Hidden Reasoning

Do not attempt to collect or reconstruct private chain-of-thought.

The product should rely on observable evidence:

```text
queries
tool calls
visited sources
actions
outputs
final answer
```

This is sufficient for useful behavioral analytics.

---

# 22. Tool Call Observation

For MCP/API/tool agents:

```text
tool discovered
tool selected
arguments generated
tool executed
result returned
error
retry
```

Example:

```text
Tool:
create_payment_link

Arguments:
currency = USD
amount = 1000

Result:
400 invalid currency
```

This is highly valuable for diagnosing tool usability.

---

# 23. MCP Observation

MCP observation should capture:

```text
server discovery
server metadata
tool list
resource list
prompt list
tool selection
arguments
results
errors
latency
```

Where the protocol and environment allow observation.

---

# 24. MCP Quality Metrics

Calculate:

```text
Tool Discovery Rate
Tool Selection Accuracy
Argument Validity
Tool Execution Success
Error Recovery Rate
Task Success
```

These become part of the future developer-agent product.

---

# 25. Filesystem Observation

For coding agents:

Record:

```text
file created
file modified
file deleted
command executed
test executed
build executed
dependency installed
```

Example:

```text
research
 ↓
package install
 ↓
src/api.ts modified
 ↓
npm test
 ↓
test failure
 ↓
fix
 ↓
npm test
 ↓
success
```

This gives us a complete implementation journey without requiring the agent to report it.

---

# 26. Process Observation

Capture process metadata:

```text
PID
command
start
end
exit code
duration
```

Avoid storing sensitive command arguments where they may contain secrets.

---

# 27. Environment Variables

Environment variables must be classified.

```text
SAFE
SENSITIVE
SECRET
```

Never place raw secrets into the event stream.

Instead:

```text
OPENAI_API_KEY = [REDACTED]
```

---

# 28. Credential Injection

Credentials should be injected at runtime.

Architecture:

```text
Customer Secret Store
       ↓
Credential Broker
       ↓
Sandbox
       ↓
Agent
```

The control plane should not expose raw secrets unnecessarily.

---

# 29. Credential Scope

Use least privilege.

Examples:

```text
read-only API token
test account
sandbox payment credential
limited OAuth scope
temporary token
```

Never use production credentials for V1 experiments unless there is a strong, explicitly controlled reason.

---

# 30. Test Accounts

Prefer customer-provided test environments.

Examples:

```text
staging
sandbox API
demo tenant
test organization
test payment account
```

The platform should provide setup instructions for creating safe test environments.

---

# 31. Network Policy

Each run should have a configurable policy:

```text
allowlist
blocklist
internet enabled
internet disabled
domain restrictions
port restrictions
```

Example:

```text
Allowed:
customer.com
api.customer.com
docs.customer.com

Blocked:
internal-production.example
```

---

# 32. Destructive Actions

Default policy:

```text
No production deletion
No real payment
No irreversible changes
No credential rotation
No account destruction
```

The system should support approval gates for sensitive tasks.

---

# 33. Human Approval

For high-risk actions:

```text
Agent requests action
       ↓
Policy engine
       ↓
Approval required
       ↓
Human approves/rejects
       ↓
Continue
```

This is especially important for:

- payments;
- account changes;
- deployments;
- production writes.

---

# 34. Event Model

All observations should use a common event schema.

Example:

```json
{
  "eventId": "...",
  "runId": "...",
  "timestamp": "...",
  "source": "browser",
  "type": "navigation",
  "payload": {},
  "sensitivity": "normal"
}
```

---

# 35. Event Sources

Recommended:

```text
agent
browser
network
filesystem
process
sandbox
search
mcp
api
evaluator
```

---

# 36. Event Ordering

Events should use:

```text
event timestamp
monotonic runtime timestamp
sequence number
```

This helps reconstruct the exact agent journey.

---

# 37. Event Correlation

Every event should contain:

```text
organizationId
projectId
experimentId
runId
agentId
sessionId
```

This allows:

```text
experiment
 ↓
run
 ↓
session
 ↓
event
```

---

# 38. Artifact Storage

Separate large artifacts from event metadata.

```text
Event Store
    ↓
Metadata

Artifact Store
    ↓
Screenshots
HTML snapshots
logs
sanitized responses
transcripts
```

This keeps the event system efficient.

---

# 39. Screenshots

Screenshots can be useful for:

- debugging;
- evidence;
- visual agent interaction;
- failure analysis.

Capture:

```text
on failure
on important transition
on explicit configuration
```

Do not capture continuously unless necessary.

---

# 40. DOM Snapshots

DOM snapshots can help diagnose:

- missing content;
- inaccessible controls;
- confusing page structure;
- interaction failures.

They may contain personal or sensitive information.

Apply:

```text
redaction
domain policy
retention policy
```

---

# 41. HTML Snapshots

Use snapshots for reproducibility when permitted.

Potential use:

```text
Before optimization
After optimization
```

This allows the evaluation system to compare actual page changes.

---

# 42. Transcript Storage

Store only the observable transcript required for evaluation.

Classify:

```text
public
customer-sensitive
secret
```

Secrets should be redacted before persistence.

---

# 43. Redaction Pipeline

All captured data should pass through:

```text
Collector
 ↓
Normalizer
 ↓
Secret detector
 ↓
PII detector
 ↓
Redactor
 ↓
Storage
```

Redaction should happen as early as practical.

---

# 44. Secret Detection

Detect patterns such as:

```text
API keys
Bearer tokens
OAuth tokens
private keys
password fields
cookies
session IDs
connection strings
```

Do not depend exclusively on regexes.

Use layered detection.

---

# 45. PII

Potential PII:

```text
email
phone
address
name
account ID
payment information
```

Customer configuration should determine whether specific fields are allowed.

---

# 46. Data Retention

Default approach:

```text
raw events:
short retention

screenshots:
short retention

sanitized evaluation:
longer retention

aggregate metrics:
long retention
```

Exact periods should be defined in the Security & Privacy document.

---

# 47. Observability Cost

Agent runs can produce enormous event volumes.

Therefore use:

```text
event sampling
compression
batching
artifact separation
configurable verbosity
```

Example modes:

```text
minimal
standard
debug
```

---

# 48. Run Profiles

### Minimal

```text
final result
navigation
errors
metrics
```

### Standard

```text
browser
network metadata
tool calls
screenshots on failure
```

### Debug

```text
full browser events
extended network metadata
DOM snapshots
process logs
```

Debug should require explicit activation.

---

# 49. Reproducibility

Each run should capture:

```text
agent version
browser version
OS image
sandbox image
prompt version
query version
website revision
evaluator version
configuration
```

This allows controlled reruns.

---

# 50. Snapshots

Sandbox snapshots should support:

```text
clean environment
pre-task environment
post-task environment
```

Example:

```text
Base snapshot
      ↓
Task
      ↓
Modified state
      ↓
Discard
```

This prevents cross-run contamination.

---

# 51. Cross-Run Isolation

Every run should have isolated:

```text
filesystem
browser profile
cookies
local storage
process namespace
credentials
temporary files
```

No state should leak between customer runs.

---

# 52. Browser Profiles

Each run should use a fresh browser profile unless the experiment explicitly requires persistent state.

Examples:

```text
Run A → Profile A
Run B → Profile B
```

---

# 53. Authentication State

For workflows requiring login:

```text
Test account
 ↓
Credential broker
 ↓
Temporary browser session
 ↓
Agent
```

Session artifacts must be destroyed after the run unless explicitly retained.

---

# 54. Agent Identity

Each execution should have an internal identity:

```text
agentRunId
```

Metadata:

```text
provider
model
agent framework
version
configuration
```

Do not imply that an internal label represents the exact proprietary agent implementation if it is unknown.

---

# 55. Browser-Agent Adapters

Create a common interface:

```text
AgentAdapter

prepare()
launch()
sendTask()
observe()
stop()
collect()
```

Potential adapters:

```text
Browser-use
Computer-use model
Provider browser agent
Custom agent
```

---

# 56. Coding-Agent Adapters

Future interface:

```text
CodingAgentAdapter

prepareWorkspace()
launch()
sendTask()
observe()
collectChanges()
runTests()
stop()
```

Potential targets:

```text
Codex
Claude Code
custom coding agents
MCP-based agents
```

---

# 57. Provider Independence

Do not build the observation architecture around one AI provider.

The internal model should be:

```text
Agent Adapter
      ↓
Common Event Model
      ↓
Common Evaluators
```

This enables provider comparisons.

---

# 58. Agent Selection

A customer experiment may specify:

```text
agent = provider/model
```

or:

```text
agent group = web agents
```

The scheduler chooses available adapters.

---

# 59. Browser Automation vs Agent Observation

Do not confuse:

```text
automation
```

with:

```text
observation
```

Playwright/CDP can observe and control browser behavior.

But the actual AI agent should remain responsible for decisions.

The test system should not secretly replace agent decisions with deterministic automation.

---

# 60. Instrumentation Boundary

Our system controls:

```text
sandbox
browser
network
credentials
task
environment
observation
evaluation
```

The agent controls:

```text
reasoning
navigation choices
tool selection
queries
actions
final answer
```

This separation is essential for valid experiments.

---

# 61. Observation Without Agent Modification

The ideal architecture:

```text
                ┌──────────────┐
                │     Agent    │
                └──────┬───────┘
                       │
             normal interaction
                       │
                ┌──────▼───────┐
                │ Target System │
                └──────┬───────┘
                       │
        ┌──────────────┼──────────────┐
        ▼              ▼              ▼
     Browser        Network        Sandbox
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                Observation Bus
                       ▼
                   Evaluators
```

This is the preferred model.

---

# 62. Observation Limitations

We cannot observe everything.

Potential blind spots:

```text
hidden model reasoning
provider-internal retrieval
private ranking logic
internal tool orchestration
external infrastructure outside sandbox
encrypted traffic without endpoint access
```

The product must clearly distinguish:

```text
observed
inferred
unknown
```

---

# 63. Evidence Classification

Every finding should have:

```text
OBSERVED
INFERRED
UNKNOWN
```

Example:

```text
Observed:
Agent searched "best payment providers."

Observed:
Competitor appeared in result.

Observed:
Agent recommended competitor.

Unknown:
Exact internal reason the model preferred competitor.
```

This is a critical trust mechanism.

---

# 64. Failure Classification

Failures should be categorized:

```text
agent
website
network
authentication
tool
content
search
sandbox
provider
unknown
```

This prevents blaming the customer for infrastructure failures.

---

# 65. Failure Attribution

Example:

```text
Task failed.

Network:
PASS

Browser:
PASS

Authentication:
FAIL

Therefore:
Likely authentication failure.
```

Use:

```text
likely
```

unless evidence establishes the cause.

---

# 66. Observation Quality Score

Each run should have an observation-quality indicator.

Example:

```text
High:
Browser + network + transcript + tool events

Medium:
Browser + network

Low:
Final response only
```

A recommendation analysis based only on a final response should have lower evidence quality than one backed by search, navigation, and source events.

---

# 67. Event Privacy Levels

Recommended:

```text
PUBLIC
INTERNAL
CUSTOMER_SENSITIVE
SECRET
```

Secrets should never reach ordinary analytics pipelines.

---

# 68. Multi-Tenant Isolation

Every event must be scoped to:

```text
organizationId
projectId
```

Storage, queues, artifacts, and access control must enforce tenant boundaries.

---

# 69. Control Plane vs Data Plane

### Control Plane

Handles:

```text
users
projects
experiments
scheduling
configuration
billing
permissions
```

### Data Plane

Handles:

```text
agent execution
sandbox
browser
network
events
artifacts
evaluation
```

This separation should be preserved as the platform scales.

---

# 70. Execution Pipeline

Recommended flow:

```text
Create Experiment
       ↓
Validate Configuration
       ↓
Create Run
       ↓
Provision Sandbox
       ↓
Inject Test Credentials
       ↓
Launch Agent
       ↓
Start Observers
       ↓
Execute Task
       ↓
Collect Events
       ↓
Stop Agent
       ↓
Sanitize Data
       ↓
Evaluate
       ↓
Store Results
       ↓
Generate Report
```

---

# 71. V0 Implementation

V0 should prove the observation pipeline with a controlled browser agent.

Capture:

```text
task
navigation
network metadata
screenshots on failure
final result
duration
errors
```

Do not implement every observer immediately.

---

# 72. V1 Implementation

Add:

```text
CDP event stream
search observation
source tracking
transcript/tool observation
structured event store
evaluation integration
```

---

# 73. V1.5 Implementation

Add:

```text
competitor tracking
source graph
query journey
failure-point diagnosis
```

---

# 74. V2 Implementation

Add:

```text
multiple agents
multiple models
repeat runs
benchmarking
statistical comparison
```

---

# 75. V3 Implementation

Add:

```text
coding-agent sandbox
filesystem observation
process observation
MCP observation
SDK task evaluation
```

---

# 76. V4 Implementation

Add:

```text
WebMCP observation
MCP optimization experiments
agent interface comparison
cross-agent benchmarks
```

---

# 77. V5 Implementation

Add:

```text
customer-hosted runners
advanced enterprise isolation
long-running agent sessions
continuous agent monitoring
```

---

# 78. Testing Strategy

The observation system itself needs tests.

### Unit tests

Test:

```text
event normalization
redaction
classification
aggregation
```

### Integration tests

Test:

```text
browser
network
sandbox
credential broker
agent adapter
```

### Replay tests

Use recorded event streams to ensure evaluator results remain stable.

---

# 79. Synthetic Agent Tests

Before real AI agents:

```text
Synthetic agent
      ↓
known actions
      ↓
expected events
```

This makes the observation system easier to validate.

Example:

```text
navigate
click
request API
fail
```

Expected event sequence:

```text
navigation
request
response
click
error
```

---

# 80. Golden Runs

Maintain fixed benchmark runs.

Every instrumentation change should verify:

```text
events not missing
event ordering preserved
redaction works
metrics unchanged unless intentionally changed
```

---

# 81. Observability of the Observer

The platform should monitor itself.

Metrics:

```text
event loss
collector latency
sandbox startup time
browser startup time
agent startup time
artifact upload time
evaluation latency
```

A benchmark result is less trustworthy if the observation system itself failed.

---

# 82. Event Loss

If events are lost:

```text
run quality = degraded
```

Do not silently present the run as fully observed.

Example:

```text
Observation completeness:
91%
```

---

# 83. Run Completeness

A run should report:

```text
execution_status
observation_status
evaluation_status
```

Example:

```text
Execution: SUCCESS
Observation: DEGRADED
Evaluation: COMPLETE_WITH_LIMITATIONS
```

---

# 84. Cost Controls

Agent experiments can be expensive.

Support:

```text
max duration
max token budget
max browser actions
max network bytes
max process CPU
max memory
max concurrent runs
```

---

# 85. Experiment Safety Limits

Default:

```text
maximum runtime
maximum retries
maximum tool calls
maximum network traffic
```

The scheduler should terminate runaway agents.

---

# 86. Future: Customer-Side Agent Observation

Long term, the product may support:

```text
Customer environment
        ↓
Observation SDK
        ↓
Secure telemetry
        ↓
Our platform
```

This could capture real agent interactions that occur outside our sandbox.

However:

> This should be a later capability because it introduces substantially greater privacy, security, and deployment complexity.

---

# 87. Future: Browser Extension / Proxy

Potential future mechanisms:

```text
browser extension
secure proxy
remote browser gateway
enterprise gateway
```

These could observe real-world agent interactions where technically and legally appropriate.

They should not be part of the initial architecture.

---

# 88. Future: Agent SDK Instrumentation

For customers running their own agents, provide optional SDK instrumentation:

```text
agent.start()
agent.tool()
agent.search()
agent.finish()
```

This should be considered an optional integration, not a dependency of the core product.

---

# 89. Core Technical Moat

Our strongest long-term asset is not simply:

```text
browser automation
```

It is:

```text
Observation Data
      +
Evaluation Data
      +
Benchmark Data
      +
Cross-Agent Comparisons
      +
Optimization Outcomes
```

Over time this can create a proprietary dataset of how AI agents actually interact with digital products.

---

# 90. Final Architecture

```text
                         CONTROL PLANE
                              │
                ┌─────────────┴─────────────┐
                │                           │
          Experiment DB                Scheduler
                │                           │
                └─────────────┬─────────────┘
                              │
                       Sandbox Manager
                              │
                 ┌────────────┴────────────┐
                 │                         │
            Web Agent                 Dev Agent
                 │                         │
              Browser                 Workspace
                 │                         │
          ┌──────┼──────┐          ┌──────┼──────┐
          │      │      │          │      │      │
        CDP   Network  Search    FS     Process  MCP
          │      │      │          │      │      │
          └──────┴──────┴──────────┴──────┴──────┘
                              │
                       Observation Bus
                              │
                    Normalization / Redaction
                              │
                    ┌─────────┴─────────┐
                    │                   │
               Event Store         Artifact Store
                    │                   │
                    └─────────┬─────────┘
                              │
                         Evaluators
                              │
                         Metrics
                              │
                         Diagnosis
                              │
                       Optimization
                              │
                         Experiments
```

---

# 91. Final Principle

The observation architecture should make the platform capable of saying:

> **“We observed exactly what the agent did.”**

rather than:

> **“We think the agent probably did this.”**

The platform should always preserve the distinction between:

```text
Observed
Measured
Inferred
Unknown
```

That distinction is fundamental to the credibility of the product.
