# Implementation Roadmap

**Status:** Draft v0.1  
**Document:** Version-by-Version Implementation Plan  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Goal:** Turn the product strategy and technical architecture into the smallest sequence of implementation milestones that can validate the business before we overbuild.

---

# 1. Implementation Philosophy

We will build in **validated layers**, not by attempting the entire platform at once.

The implementation order is:

```text
Research
  ↓
Infrastructure proof
  ↓
AI visibility MVP
  ↓
Competitive diagnosis
  ↓
Agent observation
  ↓
Agent readiness
  ↓
Optimization experiments
  ↓
MCP / SDK / WebMCP
  ↓
Continuous intelligence
```

Every phase should answer a concrete question.

If a phase does not produce useful evidence for the business or unlock the next technical layer, we should reconsider it.

---

# 2. Version Structure

| Version | Focus | Primary Question |
|---|---|---|
| V0 | Technical Proof | Can we reliably execute and observe AI systems? |
| V1 | AI Visibility MVP | Can we measure AI recommendations and competitors? |
| V1.5 | Diagnosis | Can we explain why the customer is losing? |
| V2 | Agent Experience | Can we observe real agent interactions? |
| V2.5 | Agent Readiness | Can we measure technical readiness? |
| V3 | Optimization | Can we test whether changes improve outcomes? |
| V4 | MCP / SDK / WebMCP | Can we optimize agent-facing interfaces? |
| V5 | Continuous Platform | Can this become a recurring intelligence product? |
| Future | Agentic Commerce | Can we measure transaction-oriented agent experiences? |

These version numbers are planning labels, not public product names.

> **Version terminology:** The versions in this roadmap describe product
> capability maturity. `10-v1-implementation-plan.md` describes the
> engineering implementation sequence for the first executable V1
> foundation. These are related but are not identical numbering systems.

---

# 3. V0 — Technical Proof

## Objective

Prove that the fundamental execution and observation architecture works before building the customer-facing product.

## Must prove

1. Create isolated sandbox.
2. Run an agent/model.
3. Execute a controlled task.
4. Capture output.
5. Capture browser activity.
6. Capture network metadata.
7. Normalize events.
8. Store the run.
9. Reproduce the run.
10. Generate a basic evaluation.

## Minimal architecture

```text
CLI / Internal UI
      ↓
Experiment
      ↓
Worker
      ↓
Sandbox
      ↓
Agent
      ↓
Observation
      ↓
Normalized Events
      ↓
Evaluation
      ↓
JSON Report
```

## Deliverable

A single command or internal UI can run:

> “Find the best payment provider for a SaaS company and compare Stripe with competitors.”

The system should return:

- agent output;
- sources;
- visited URLs;
- browser events;
- network metadata;
- normalized trace;
- basic evaluation.

---

# 4. V0 Technical Tasks

## V0.1 Repository

Create:

```text
apps/
  web/

packages/
  core/
  agents/
  execution/
  observation/
  evaluation/
  readiness/

workers/
  runner/

docs/
  ...
```

Keep modules inside one repository initially.

---

## V0.2 Database

Create the minimum schema:

```text
organizations
projects
experiments
runs
agents
events
evaluations
artifacts
```

Do not build the complete customer schema yet.

---

## V0.3 Sandbox Adapter

Implement:

```text
SandboxProvider
  create()
  exec()
  writeFile()
  readFile()
  collectArtifacts()
  destroy()
```

First provider should remain behind the abstraction.

---

## V0.4 Agent Adapter

Implement one agent/runtime first.

```text
AgentAdapter
  install()
  configure()
  run()
  capture()
  normalize()
```

Do not implement multiple coding agents before the first adapter works end-to-end.

---

## V0.5 Observation Collector

Implement:

- stdout/stderr;
- transcript capture;
- browser navigation;
- network metadata.

---

## V0.6 Normalization

Convert raw observations into:

```text
ObservationEvent
```

with:

- timestamp;
- source;
- type;
- run ID;
- metadata.

---

## V0.7 Evaluation

Implement only:

```text
task_started
task_completed
task_failed
sources_used
URLs_visited
```

This is enough to prove the evaluation pipeline.

---

# 5. V0 Exit Criteria

V0 is complete when:

- sandbox creation works reliably;
- agent execution works;
- browser execution works;
- events are captured;
- events can be normalized;
- runs can be stored;
- a run can be replayed/analyzed;
- evaluation produces deterministic structured output;
- failures are classified.

Do not move to large-scale product development before this works.

---

# 6. V1 — AI Visibility MVP

## Objective

Build the first commercially meaningful product.

The customer should be able to discover:

> **“Is AI recommending my company or my competitors?”**

## Core capabilities

### Input

Customer provides:

- domain;
- company/product;
- competitors;
- query set.

### Output

The platform produces:

- AI mention rate;
- recommendation rate;
- competitor recommendation rate;
- citations;
- cited sources;
- query-level results;
- comparison report.

---

# 7. V1 Query Engine

Create a query system supporting:

```text
Discovery
Comparison
Recommendation
Transactional
Technical
Integration
```

Example:

```text
“What is the best payment processor for a SaaS startup?”

“Stripe vs Adyen for SaaS?”

“Which payment provider has the best developer experience?”

“How do I implement recurring payments?”
```

Queries should be versioned.

---

# 8. V1 AI Provider Layer

Do not tightly couple the product to one model.

Create:

```text
AIProvider
  execute()
  collectResponse()
  extractSources()
  normalize()
```

Possible providers:

- OpenAI;
- Anthropic;
- Google;
- other supported AI/search surfaces.

The actual initial provider list should be finalized during implementation research.

---

# 9. V1 Evaluation

Implement:

### Mention

Was the company mentioned?

### Recommendation

Was it recommended?

### Competitor

Which competitors were recommended?

### Citation

Was the company cited?

### Source

Which sources influenced the answer?

### Position

Where did the company appear in the recommendation set?

---

# 10. V1 Dashboard

Minimum UI:

```text
Project
  ├── Overview
  ├── Queries
  ├── Competitors
  ├── AI Visibility
  ├── Sources
  └── Runs
```

Do not build a huge analytics dashboard.

The first screen should answer:

> **Are we winning or losing AI recommendations?**

---

# 11. V1 Report

Example:

```text
AI Visibility: 42%

Competitor A: 71%
Competitor B: 58%
Our Product: 42%

Top lost opportunities:
1. Query X
2. Query Y
3. Query Z

Top sources:
1. Source A
2. Source B
3. Source C
```

Every result should be traceable to the underlying AI response.

---

# 12. V1 Commercial Test

Before adding sophisticated agent infrastructure, use V1 to test the business.

Offer:

> **AI Visibility & Competitive Audit**

Potential workflow:

```text
Customer
   ↓
Domain + competitors
   ↓
Run benchmark
   ↓
Generate report
   ↓
Human review
   ↓
Customer presentation
```

This gives us early commercial feedback.

---

# 13. V1 Exit Criteria

V1 is successful when:

- customers can run an audit;
- results are repeatable enough to be useful;
- competitor comparisons work;
- reports are understandable;
- findings contain evidence;
- at least a few real companies have tested it;
- we know which findings customers care about.

The commercial validation matters more than feature count.

---

# 14. V1.5 — Competitive Diagnosis

## Objective

Move from:

> “You are losing.”

to:

> “Here are the strongest evidence-backed reasons you are losing.”

---

# 15. Diagnosis Inputs

Combine:

```text
AI responses
+
citations
+
search results
+
customer website
+
competitor websites
+
structured data
+
documentation
```

Potential additional signals:

- page accessibility;
- content structure;
- product information;
- documentation quality;
- authority/reference coverage.

---

# 16. Diagnosis Output

Example:

```text
Finding:

Competitor A is recommended 64% of the time,
while our product is recommended 28%.

Observed evidence:

- Competitor A has clearer pricing information.
- Competitor A is cited by more high-authority sources.
- Our documentation requires additional navigation.
- AI responses frequently rely on third-party comparisons.

Confidence:

Medium

Recommended actions:

1. ...
2. ...
3. ...
```

Important:

**The system must separate observed evidence from inferred causes.**

---

# 17. V1.5 Website Analyzer

Implement crawlers/checks for:

```text
HTML
metadata
structured data
sitemap
robots.txt
documentation
links
content structure
canonical URLs
status codes
headers
```

This is the beginning of the Agent Readiness layer.

---

# 18. V2 — Agent Experience

## Objective

Test what actually happens when an AI agent tries to use a customer's product.

This is where the product becomes significantly different from a normal AEO platform.

Example task:

> “Find the cheapest annual plan and start the signup process.”

The system observes the entire journey.

---

# 19. V2 Agent Runner

Support:

```text
Browser Agent
      ↓
Sandbox
      ↓
Browser
      ↓
Customer Website
```

Agent tasks should be defined as:

```text
Task
  ├── objective
  ├── starting URL
  ├── allowed domains
  ├── credentials
  ├── timeout
  └── success criteria
```

---

# 20. V2 Observation

Capture:

```text
Agent transcript
Browser navigation
Clicks
Inputs
DOM observations
Network requests
Responses metadata
Tool calls
Errors
Screenshots
Task completion
```

The goal is to reconstruct:

> **What the agent actually experienced.**

---

# 21. V2 Task Evaluation

Example:

```text
Task:
Find pricing and identify annual plan.

Result:
SUCCESS

Steps:
14

Pages:
5

Retries:
2

Errors:
1

Time:
38 sec
```

This becomes the foundation of agent experience analytics.

---

# 22. V2 Agent Experience Dashboard

Add:

```text
Agent Experience
  ├── Tasks
  ├── Success Rate
  ├── Failure Points
  ├── Agent Journeys
  ├── Network
  └── Evidence
```

A journey visualization should show:

```text
Search
 ↓
Homepage
 ↓
Pricing
 ↓
Docs
 ↓
Signup
 ↓
Failure
```

---

# 23. V2.5 — Agent Readiness

## Objective

Turn technical readiness into a structured evaluation system.

Start with checks such as:

```text
robots.txt
sitemap
structured data
API discovery
OAuth discovery
MCP metadata
Agent Skills
WebMCP
documentation
semantic HTML
```

Each check should have:

```text
check
result
evidence
severity
recommendation
```

---

# 24. Readiness Score

Do not create one arbitrary score immediately.

First expose categories:

```text
Readable
Discoverable
Callable
Interactive
Secure
Payable
```

Then determine whether a combined score is statistically and commercially useful.

Cloudflare's Agent Readiness work is a direct reference for this category, but our system should connect readiness to observed behavior rather than treating compliance as the final product. citeturn0search1

---

# 25. V3 — Optimization Experiments

## Objective

Measure whether changes actually improve AI behavior.

Example:

```text
Baseline
   ↓
Change website
   ↓
Retest
   ↓
Compare
```

Metrics:

```text
Recommendation rate
Citation rate
Task success
Steps
Errors
Latency
```

---

# 26. V3 Experiment System

Support:

```text
Experiment
 ├── hypothesis
 ├── baseline
 ├── intervention
 ├── test set
 ├── repetitions
 ├── evaluator
 └── result
```

Example:

> Hypothesis: Adding structured product information improves AI recommendation visibility.

---

# 27. V3 Recommendation Engine

Recommendations should be prioritized by:

```text
Impact
Confidence
Effort
Evidence
```

Example:

| Finding | Impact | Confidence | Effort |
|---|---:|---:|---:|
| Improve pricing discoverability | High | High | Low |
| Add structured product data | Medium | High | Low |
| Improve external references | High | Medium | Medium |

---

# 28. V3 Validation

The platform should be able to say:

```text
Before:
Recommendation = 31%

After:
Recommendation = 49%

Change:
+18 percentage points

Sample:
100 runs

Confidence:
...
```

The exact statistical methodology belongs in the Evaluation & Benchmarking document.

---

# 29. V4 — MCP / SDK / WebMCP Intelligence

## Objective

Expand from website optimization to agent-facing interfaces.

Analyze:

```text
API
SDK
MCP
WebMCP
Agent Skills
```

---

# 30. V4 MCP Testing

Test:

```text
Discovery
 ↓
Tool selection
 ↓
Argument generation
 ↓
Execution
 ↓
Result interpretation
 ↓
Recovery
```

Identify:

- unclear tool descriptions;
- bad schemas;
- unnecessary calls;
- authentication problems;
- poor errors;
- missing capabilities;
- poor documentation.

---

# 31. V4 SDK Testing

For developer products:

```text
Agent
 ↓
Documentation
 ↓
SDK
 ↓
Code generation
 ↓
Build
 ↓
Tests
 ↓
Failure
```

Measure:

- documentation discovery;
- correct API selection;
- generated code quality;
- compile failures;
- runtime failures;
- retry behavior.

This is where the earlier Vercel coding-agent AEO work becomes particularly relevant.

---

# 32. V4 WebMCP Testing

For browser agents:

```text
Without WebMCP
    ↓
Screenshots / DOM / clicks

With WebMCP
    ↓
Structured tool calls
```

Measure whether WebMCP:

- reduces steps;
- reduces errors;
- improves task success;
- reduces ambiguity;
- improves reliability.

---

# 33. V5 — Continuous Intelligence

## Objective

Turn one-time testing into recurring infrastructure.

Continuous monitoring:

```text
Daily / Weekly
      ↓
Run benchmark
      ↓
Compare history
      ↓
Detect changes
      ↓
Alert
```

Detect:

- AI recommendation changes;
- competitor changes;
- source changes;
- website changes;
- agent failures;
- readiness regressions.

---

# 34. V5 Alerts

Examples:

> “Competitor A overtook you on 7 tracked queries.”

> “Your AI recommendation rate dropped 12% this week.”

> “A recent website deployment caused agent task success to fall.”

> “Your MCP tool schema changed and agents are now failing more frequently.”

---

# 35. Future — Agentic Commerce

Only after the core product has strong adoption.

Potential areas:

```text
Agent discovery
 ↓
Product discovery
 ↓
Checkout
 ↓
Payment authorization
 ↓
Transaction
```

Potential standards may include emerging agent-commerce protocols.

This should remain a future research track until standards stabilize.

---

# 36. Research Track

Implementation should run alongside a continuously updated research register.

Track:

### AI

- model APIs;
- AI search;
- browsing agents;
- agent protocols.

### Browser

- Playwright;
- CDP;
- browser-use;
- remote browsers.

### Infrastructure

- microVMs;
- Firecracker;
- managed sandboxes;
- Cloudflare Workers / Browser infrastructure.

### Agent interfaces

- MCP;
- WebMCP;
- Agent Skills;
- API catalogs;
- OAuth discovery.

### Commerce

- x402;
- UCP;
- ACP;
- future protocols.

Each research item should record:

```text
Technology
Source
Date
What it does
Relevance
Pros
Cons
Decision
```

---

# 37. Development Order

The actual engineering order should be:

```text
STEP 1
Repository + documentation

STEP 2
Database + basic API

STEP 3
Sandbox abstraction

STEP 4
One agent adapter

STEP 5
Observation collector

STEP 6
Event normalization

STEP 7
Basic evaluator

STEP 8
AI visibility engine

STEP 9
Competitive report

STEP 10
Customer-facing dashboard

STEP 11
Browser agent

STEP 12
Network/CDP observation

STEP 13
Readiness checks

STEP 14
Experiment engine

STEP 15
MCP/SDK/WebMCP
```

---

# 38. What We Should NOT Build Yet

Do not start with:

- Kubernetes;
- Kafka;
- multi-region infrastructure;
- custom LLM;
- vector database;
- complex ML ranking;
- automatic website modifications;
- dozens of agent integrations;
- full MCP ecosystem support;
- agent commerce;
- enterprise SSO;
- complicated billing.

These can come later.

---

# 39. Definition of Done

A feature is not complete when:

> “The code runs.”

It is complete when:

```text
Implementation
+
Tests
+
Observation
+
Evaluation
+
Documentation
```

are present.

For agent features specifically:

```text
Can reproduce
Can observe
Can evaluate
Can explain
Can report
```

---

# 40. Testing Strategy

Every major component should have:

### Unit tests

For deterministic logic.

### Integration tests

For:

- sandbox;
- browser;
- database;
- queue.

### Fixture tests

For agent transcripts and network events.

### End-to-end tests

For full experiment runs.

### Regression tests

For evaluator changes.

---

# 41. Fixture-Driven Development

Agent outputs are nondeterministic, so fixtures are important.

Create fixtures for:

```text
Claude transcript
Codex transcript
Browser trace
Network trace
MCP trace
AI response
Search result
```

Evaluator changes can then be tested without running an expensive live agent every time.

---

# 42. Cost Controls

Agent experiments can become expensive.

Implement:

```text
per-run budget
per-experiment budget
organization quota
concurrency limit
timeout
sampling
caching where valid
```

Track:

```text
model cost
sandbox cost
browser cost
storage cost
network cost
```

This data is required for future pricing decisions.

---

# 43. Security Milestones

Before public V1:

- sandbox isolation;
- network restrictions;
- secret redaction;
- tenant authorization;
- artifact access control;
- audit logging.

Before authenticated agent testing:

- short-lived credentials;
- dedicated test accounts;
- customer environment isolation;
- destructive-action protections.

Before enterprise:

- stronger compliance/security controls;
- customer-managed environments;
- audit exports;
- advanced retention controls.

---

# 44. Product Validation Gates

Each version must pass both technical and commercial gates.

## V0

Technical proof.

## V1

Customers understand the report.

## V1.5

Customers find diagnosis actionable.

## V2

Customers value real agent behavior testing.

## V3

Customers value optimization experiments.

## V4

Developer-facing customers value MCP/SDK optimization.

## V5

Customers pay for continuous monitoring.

If a gate fails, stop and investigate before adding more features.

---

# 45. Recommended First Build

The first actual implementation should be extremely small:

```text
1 project
1 experiment
1 sandbox
1 agent
1 browser
1 website
1 task
1 observation pipeline
1 evaluator
1 report
```

Example task:

> “Find the pricing page for Stripe and identify the annual plan.”

The system should produce:

```text
Task
 ↓
Agent
 ↓
Browser
 ↓
Observed events
 ↓
Normalized trace
 ↓
Evaluation
 ↓
Report
```

Once that works, expand to multiple queries and competitors.

---

# 46. V0 → V1 Transition

Do not build the complete dashboard immediately.

First build:

```text
CLI
 ↓
JSON result
 ↓
HTML/Markdown report
```

Then build the dashboard after the evaluation model is stable.

This reduces UI work while the core technical model is still changing.

---

# 47. First Commercial Prototype

The first sellable prototype can be partially manual.

Architecture:

```text
Automated collection
        ↓
Automated evaluation
        ↓
Automated report
        ↓
Human diagnosis/review
        ↓
Customer
```

This is acceptable.

The objective is to validate the value of the intelligence before automating every step.

---

# 48. Long-Term Architecture Evolution

The expected evolution is:

```text
V0
Modular monolith
+
single worker

        ↓

V1
Multiple workers
+
queue

        ↓

V2
Dedicated browser workers
+
artifact storage

        ↓

V3
Evaluation pipeline
+
experiment infrastructure

        ↓

V4
Specialized agent/MCP workers

        ↓

V5
Distributed execution
+
large event pipeline
```

Infrastructure complexity should follow actual workload.

---

# 49. Implementation Principles

### Principle 1

Build the observation layer early.

### Principle 2

Normalize external formats immediately.

### Principle 3

Keep execution providers replaceable.

### Principle 4

Keep evaluators deterministic wherever possible.

### Principle 5

Store evidence for every important finding.

### Principle 6

Treat AI results as probabilistic measurements.

### Principle 7

Never expose credentials unnecessarily.

### Principle 8

Use real customer workflows to determine priority.

### Principle 9

Do not build future technology merely because it exists.

### Principle 10

Every phase must produce a measurable business or technical learning.

---

# 50. Final Implementation Sequence

The complete intended sequence is:

```text
                    RESEARCH
                       │
                       ▼
                V0 TECHNICAL PROOF
                       │
                       ▼
              V1 AI VISIBILITY
                       │
                       ▼
          V1.5 COMPETITIVE DIAGNOSIS
                       │
                       ▼
             V2 AGENT EXPERIENCE
                       │
                       ▼
             V2.5 AGENT READINESS
                       │
                       ▼
            V3 OPTIMIZATION TESTS
                       │
                       ▼
          V4 MCP / SDK / WEBMCP
                       │
                       ▼
            V5 CONTINUOUS INTELLIGENCE
                       │
                       ▼
              FUTURE COMMERCE
```

The critical rule is:

> **Do not advance because the roadmap says so. Advance because the previous stage has produced enough technical evidence and customer value to justify the next investment.**

---

# 51. Immediate Next Steps

The next engineering work should be:

### Step 1

Finalize repository structure.

### Step 2

Create the V0 architecture skeleton.

### Step 3

Implement the `SandboxProvider` abstraction.

This should be defined in `packages/execution/src/sandbox.ts` with the interface used throughout the system.

See [`10-v1-implementation-plan.md`](./10-v1-implementation-plan.md)
for the authoritative V1 implementation specification.

### Step 4

Implement a functional sandbox provider behind the abstraction.

### Step 5

Run one agent inside it.

### Step 6

Run one agent inside it.

### Step 7

Capture the first transcript.

### Step 8

Capture browser/network events.

### Step 9

Create the first normalized event schema.

### Step 10

Build the first evaluator.

### Step 11

Run the first end-to-end experiment.

Only after this should we begin building the full V1 product.
