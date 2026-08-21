# 09 — V1 Product & Commercial Specification

**Status:** Draft v0.1  
**Document:** V1 Product Scope, Customer Workflow, Commercial Model & Go-to-Market  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Product tagline:** “A testing and intelligence platform that measures how AI agents experience a company's digital product.”

---

# 1. Purpose

This document translates the technical architecture into the first commercially viable product.

The goal of V1 is not to build every capability described in the technical roadmap.

The goal is to prove that companies will pay to understand:

```text
How AI agents discover their product
        ↓
What they see
        ↓
What they do
        ↓
What they recommend
        ↓
Why competitors may win
        ↓
What can be improved
        ↓
Whether the improvement actually works
```

---

# 2. Product Vision

Companies already optimize digital products for:

```text
humans
search engines
analytics platforms
conversion funnels
```

A new optimization layer is emerging:

```text
AI agents
```

Our product provides the measurement and optimization infrastructure for that layer.

---

# 3. What We Sell

We sell **AI agent experience intelligence**.

The customer does not primarily buy:

- browser automation;
- a scraper;
- an AI chatbot;
- an analytics dashboard;
- an SEO crawler.

They buy answers to questions such as:

> Why is ChatGPT recommending my competitor instead of me?

> Can AI agents discover my product?

> What information does an agent see when researching my company?

> Which sources influence the recommendation?

> Where does the agent fail?

> Is my website agent-ready?

> What should I change?

> Did the change improve my visibility or agent task success?

---

# 4. Primary Customer

Initial ideal customers:

```text
B2B SaaS
Fintech
Developer tools
AI companies
E-commerce
Travel
Marketplaces
Payments
Enterprise software
```

The strongest early customers are businesses where:

```text
AI recommendations
+
product discovery
+
competitive choice
```

can materially affect revenue.

---

# 5. Initial Buyer

Likely buyers:

### Primary

```text
Head of Growth
SEO / AEO lead
Digital marketing lead
Product marketing
AI strategy lead
```

### Secondary

```text
CTO
VP Engineering
Developer Relations
Platform/Product team
```

The product should therefore have both:

```text
business-facing insights
```

and:

```text
technical evidence
```

---

# 6. Customer Problem

Current analytics can tell a company:

```text
Google traffic decreased.
Conversion decreased.
Page performance decreased.
```

But they generally cannot answer:

```text
What did the AI agent see?

Why did the AI choose another company?

Which sources did it use?

Could the agent find our product?

Could the agent understand our product?

Could the agent actually use our product?

```

This is the gap we target.

---

# 7. Core Product Loop

The product should operate as:

```text
Measure
  ↓
Observe
  ↓
Diagnose
  ↓
Recommend
  ↓
Optimize
  ↓
Retest
  ↓
Measure improvement
```

This loop is more valuable than a one-time score.

---

# 8. V1 Product Promise

V1 should promise:

> **We can show you how AI agents experience your digital product, where they fail or choose competitors, and what evidence explains the result.**

Do not promise:

> “We know exactly why the model thinks what it thinks.”

The latter is generally unobservable.

---

# 9. V1 Core Modules

V1 should contain five major modules:

```text
1. Agent Testing
2. Agent Journey / Evidence
3. Agent Readiness
4. Recommendation & Competitor Analysis
5. Optimization Experiments
```

---

# 10. Module 1 — Agent Testing

Customer creates a test:

```text
Task:
"Find the best payment provider for a SaaS startup."

Target:
customer.com

Agent:
selected agent/model

Environment:
browser

Runs:
N
```

The platform executes the task.

---

# 11. Module 2 — Agent Journey

After execution show:

```text
Task
 ↓
Search
 ↓
Search results
 ↓
Sources
 ↓
Pages visited
 ↓
Interactions
 ↓
Errors
 ↓
Final recommendation
```

This is the evidence layer.

---

# 12. Example Journey

```text
Task:
"Find a payment provider for an Indian SaaS company."

Agent searched:
"best payment providers for SaaS"

Results:
1. Competitor A
2. Competitor B
3. Customer

Agent visited:
Competitor A
Competitor B

Customer:
Not visited

Final:
Competitor A
```

The platform should surface this as a measurable discovery failure.

---

# 13. Module 3 — Agent Readiness

The platform should evaluate whether a customer's digital product is prepared for agent interaction.

Initial dimensions:

```text
Readable
Discoverable
Understandable
Callable
Interactive
Secure
Payable
```

The exact dimensions can evolve as standards mature.

---

# 14. Readiness Assessment

The system should combine:

```text
static inspection
+
live agent testing
+
browser observation
+
network evidence
+
structured data
+
API/MCP analysis
```

This differentiates our readiness assessment from a simple website crawler.

---

# 15. Module 4 — Competitor Analysis

A core commercial feature.

For a given customer query:

```text
Customer
Competitor A
Competitor B
Competitor C
```

compare:

```text
discovery
sources
ranking
page quality
information availability
agent interaction
task completion
final recommendation
```

---

# 16. Competitor Diagnosis

Example finding:

> Competitor A was recommended in 7/10 runs.

Evidence:

```text
Competitor A:
- appeared earlier in search
- had clearer pricing information
- had structured product information
- agent successfully completed task

Customer:
- appeared in results
- pricing page failed to expose required information
- product comparison was unclear
```

---

# 17. Module 5 — Optimization Experiments

The product should not stop at recommendations.

Example:

```text
Baseline
 ↓
Customer changes product page
 ↓
Run experiment
 ↓
Compare
 ↓
Measure
```

Possible optimization areas:

```text
content
structured data
metadata
documentation
pricing information
API
MCP
WebMCP
agent-facing interfaces
```

---

# 18. Experiment Example

### Baseline

```text
Agent recommendation:
Competitor

Task success:
40%

Discovery:
4/10
```

### Optimization

Improve:

```text
pricing structure
product comparison
structured metadata
documentation
```

### Retest

```text
Agent recommendation:
Customer

Task success:
80%

Discovery:
9/10
```

The platform reports the measured change.

---

# 19. V1 Dashboard

Recommended dashboard structure:

```text
Overview
├── Agent Visibility
├── Agent Readiness
├── Competitors
├── Experiments
└── Recent Runs
```

---

# 20. Overview Dashboard

Show:

```text
Agent Recommendation Rate
Agent Discovery Rate
Task Success Rate
Agent Readiness Score
Competitor Win Rate
Experiment Improvement
```

Avoid vanity metrics.

Every major metric should connect to an actionable question.

---

# 21. Agent Visibility

Measure:

```text
How often was the customer discovered?
How often was it recommended?
Which competitors won?
Which queries produced failure?
```

---

# 22. Agent Recommendation Rate

Example:

```text
Customer recommended:
62 / 100 runs

Recommendation rate:
62%
```

Break down by:

```text
agent
model
query
country
language
time
```

where data is available and reliable.

---

# 23. Discovery Rate

Define:

> Percentage of relevant test runs in which the agent encountered the customer's product.

This is different from recommendation.

Example:

```text
Discovered:
80%

Recommended:
45%
```

This tells us the customer is visible but not winning.

---

# 24. Task Success

Measure whether the agent successfully completed the requested task.

Example:

```text
Task:
Find pricing and determine whether product supports feature X.

Success:
Yes
```

Possible reasons for failure:

```text
content unavailable
page inaccessible
interaction failure
authentication failure
API failure
agent error
```

---

# 25. Agent Experience Score

A composite score may eventually combine:

```text
discoverability
understandability
interaction success
task completion
technical accessibility
```

However:

> V1 should avoid creating a single opaque score that hides the evidence.

Show component metrics alongside any aggregate score.

---

# 26. Evidence-First UX

Every finding should allow the customer to inspect:

```text
Finding
 ↓
Evidence
 ↓
Agent journey
 ↓
Source
 ↓
Recommendation
```

Example:

> Customer lost to Competitor A.

Click:

```text
Search query
 ↓
Search results
 ↓
Selected sources
 ↓
Visited pages
 ↓
Agent interaction
 ↓
Final response
```

---

# 27. AI-Generated Insights

AI can summarize observed evidence.

Example:

> “Your pricing page was discovered, but the agent could not determine whether enterprise pricing supports annual billing. Competitor A exposed this information directly.”

The AI insight must link to observed evidence.

---

# 28. AI Insight Trust Model

Every insight should include:

```text
Evidence
Confidence
Observed / Inferred
```

Example:

```text
Confidence: High
Evidence: 8/10 runs

Observation:
Agent failed to find pricing.

Inference:
Missing structured pricing information may contribute.
```

---

# 29. Automated Recommendations

Recommendations should be specific.

Bad:

> Improve your website for AI.

Good:

> Add a machine-readable pricing summary that exposes plan names, prices, billing intervals, and eligibility conditions.

Better:

> After adding the pricing summary, rerun Experiment #12 to measure whether agent task success improves.

---

# 30. Optimization Service

Long term, the product can offer implementation services.

Potential services:

```text
AEO optimization
Agent-readiness optimization
Structured-data implementation
Documentation optimization
API optimization
MCP optimization
WebMCP implementation
Agent-facing interface development
```

This creates a service revenue layer alongside SaaS.

---

# 31. Cloudflare-Aligned Optimization

Cloudflare's agent-readiness direction is relevant to our product.

Their broader framing includes making the web:

```text
readable
discoverable
callable
payable
```

Our role can be:

```text
Measure readiness
 ↓
Identify gaps
 ↓
Implement improvements
 ↓
Measure agent outcomes
```

We should treat Cloudflare-style readiness as an input to our optimization system, not as the entire product.

---

# 32. MCP Optimization — Future

Future product capability:

```text
Customer MCP
     ↓
Agent interaction
     ↓
Observe
     ↓
Measure
     ↓
Diagnose
     ↓
Optimize MCP
     ↓
Retest
```

Potential metrics:

```text
tool discovery
tool selection
argument correctness
tool success
error recovery
task completion
```

---

# 33. SDK Optimization — Future

The same model can apply to SDKs.

Example:

```text
Stripe SDK
 ↓
Coding agent
 ↓
Research
 ↓
Implementation
 ↓
Tool/API usage
 ↓
Tests
```

We can measure:

```text
documentation discovery
API discovery
SDK selection
implementation success
errors
retries
test success
```

This is a future product line.

---

# 34. Developer-Agent Product — Future

Primary V1 focus:

```text
AI agents used by everyday users
```

Examples:

```text
ChatGPT
Claude
Gemini
browser agents
computer-use agents
```

Future expansion:

```text
Codex
Claude Code
coding agents
MCP clients
SDK agents
```

The architecture should support both, but marketing should not confuse the initial product.

---

# 35. Why Consumer AI Comes First

Most companies are interested in:

```text
Will AI recommend us to customers?
```

rather than:

```text
Will a coding agent implement our SDK correctly?
```

Therefore:

```text
Consumer-facing AI discovery
```

is the stronger initial commercial wedge.

Developer-agent analytics can become an expansion.

---

# 36. Customer Workflow

```text
Create account
 ↓
Add company/product
 ↓
Verify domain
 ↓
Choose competitors
 ↓
Choose target queries/tasks
 ↓
Choose AI agents
 ↓
Run baseline
 ↓
Review findings
 ↓
Apply recommendations
 ↓
Run experiment
 ↓
Compare results
 ↓
Schedule recurring tests
```

---

# 37. Onboarding

V1 onboarding should be fast.

Customer enters:

```text
Company URL
Company name
Industry
Primary products
Competitors
```

The platform can suggest:

```text
queries
competitors
test tasks
readiness checks
```

Customer approves them before execution.

---

# 38. Test Creation

A test should contain:

```text
Name
Task
Target
Agent
Environment
Success criteria
Number of runs
```

Example:

```text
Name:
Payment Provider Discovery

Task:
"Find the best payment provider for a SaaS startup."

Success:
Customer appears in final recommendation.

Runs:
10
```

---

# 39. Recurring Monitoring

Eventually customers should be able to schedule:

```text
daily
weekly
monthly
```

tests.

This creates recurring product value.

---

# 40. Alerts

Potential alerts:

> Recommendation rate dropped 18%.

> Competitor A began appearing in more agent answers.

> Customer stopped appearing for a high-value query.

> Agent task success decreased after website deployment.

---

# 41. Reporting

Customer reports should include:

```text
Executive summary
Key findings
Competitor changes
Agent journeys
Readiness gaps
Recommended actions
Experiment results
```

Export formats:

```text
PDF
CSV
JSON
API
```

---

# 42. Commercial Packaging

Initial model should be usage-based with subscription tiers.

Core usage units may include:

```text
agent runs
experiments
queries
tracked competitors
retention
```

Avoid charging purely by page count.

The value is agent intelligence, not crawling volume.

---

# 43. Proposed Initial Tiers

### Starter

For startups and small teams.

```text
limited projects
limited agent runs
basic readiness
basic reports
```

### Growth

For teams actively optimizing AI discovery.

```text
more runs
competitor analysis
experiments
recurring monitoring
advanced reports
```

### Business

For larger organizations.

```text
higher limits
multiple projects
team access
advanced analytics
API
longer retention
```

### Enterprise

```text
custom usage
SSO
RBAC
private execution
customer-hosted runners
custom retention
security controls
support
```

Pricing should be validated with customer interviews before being finalized.

---

# 44. Usage Metric

A strong pricing metric should correlate with value.

Candidate:

```text
Agent Runs
```

Possible secondary dimensions:

```text
number of tracked queries
number of agents
number of competitors
data retention
```

Avoid excessive pricing complexity in V1.

---

# 45. Services Revenue

A second revenue stream can be:

```text
Optimization Services
```

Examples:

```text
Agent-readiness audit
AEO implementation
Content optimization
Structured-data implementation
MCP optimization
WebMCP implementation
Agent-facing API development
```

---

# 46. Product + Services Model

```text
SaaS
 ↓
Find problems
 ↓
Customer wants help
 ↓
Optimization service
 ↓
Implementation
 ↓
Experiment
 ↓
Measured outcome
```

This creates a strong feedback loop.

---

# 47. Long-Term Business Model

Potential structure:

```text
Platform subscription
+
Usage
+
Optimization services
+
Enterprise deployment
+
API access
+
Benchmark intelligence
```

---

# 48. Competitive Positioning

We should not position as:

```text
"AI SEO tool"
```

alone.

Better:

> **AI agent experience intelligence and optimization platform.**

This encompasses:

```text
AEO
agent readiness
agent testing
agent analytics
competitor intelligence
optimization
```

---

# 49. Initial Differentiation

Potential differentiation:

### 1. Live agent testing

Not only static analysis.

### 2. Evidence

Show what actually happened.

### 3. Competitor diagnosis

Explain where competitors win.

### 4. Optimization loop

Measure changes after implementation.

### 5. Cross-agent benchmarking

Compare behavior across AI systems.

---

# 50. What We Should NOT Build in V1

Avoid:

```text
full MCP optimization suite
full coding-agent platform
customer-hosted runners
browser extension
real-world passive agent tracking
complex enterprise deployment
massive crawler
```

These can consume significant engineering resources before product-market fit.

---

# 51. V1 Technical Scope

V1 should support:

```text
controlled browser agent
sandbox
CDP
network metadata
search observation
agent-visible transcript/tool events
event storage
readiness checks
competitor comparison
evaluation
dashboard
reports
```

---

# 52. V1 Commercial Scope

Customer can:

```text
create project
define competitors
define tasks
run agent tests
inspect journeys
see recommendations
run experiments
compare baseline vs treatment
export report
```

---

# 53. V1 Success Criteria

Technical:

```text
Reliable agent execution
Reliable observation
Low event loss
Secure sandbox
Reproducible runs
```

Product:

```text
Customer understands findings
Customer can identify actionable problems
Customer can verify improvements
```

Business:

```text
Customers run repeated tests
Customers invite teammates
Customers pay for continued monitoring
Customers request optimization help
```

---

# 54. North Star Metric

A candidate North Star:

> **Verified Agent Experience Improvements**

Definition:

```text
Number of customer issues where:
1. problem was observed,
2. optimization was applied,
3. experiment was rerun,
4. measurable improvement was verified.
```

This is stronger than simply counting scans.

---

# 55. Supporting Metrics

### Acquisition

```text
trial signups
demo requests
```

### Activation

```text
first experiment completed
first useful finding
```

### Engagement

```text
runs per customer
experiments per customer
tracked queries
```

### Retention

```text
weekly active projects
recurring experiments
```

### Revenue

```text
MRR
ARPA
expansion
services revenue
```

---

# 56. Go-To-Market Wedge

A practical initial offer:

> **Free AI Agent Visibility Audit**

Customer provides:

```text
company
URL
3–5 competitors
```

We run:

```text
relevant AI tasks
readiness checks
competitor comparison
```

Deliver:

```text
Agent Visibility Report
```

Then convert to:

```text
continuous monitoring
```

---

# 57. Lead Generation

Potential channels:

```text
LinkedIn
developer communities
SEO/AEO communities
AI engineering communities
startup communities
direct outreach
technical content
open-source tooling
```

---

# 58. Content Strategy

Publish benchmark-driven content such as:

> “How 10 AI agents discover payment providers.”

> “Why AI recommends Stripe over competing payment platforms.”

> “Agent-readiness benchmark of SaaS websites.”

> “What happens when AI agents try to use modern websites?”

This creates both credibility and inbound demand.

---

# 59. Open Benchmark Strategy

Eventually publish anonymized aggregate benchmarks.

Example:

```text
Agent Website Readiness Index
```

This can become a marketing asset.

Do not expose customer-sensitive data.

---

# 60. Business Moat

Long-term moat:

```text
Agent execution data
+
agent behavior data
+
website readiness data
+
competitor data
+
experiment outcomes
+
cross-agent benchmarks
```

The valuable dataset is:

> **What changes actually improve AI-agent outcomes?**

---

# 61. Why the Dataset Matters

Over time we can learn:

```text
Which content patterns help agents?
Which page structures fail?
Which APIs are easiest for agents?
Which MCP designs work?
Which documentation structures improve implementation?
Which changes increase recommendations?
```

This can improve the product's recommendations.

---

# 62. Risk: False Causality

Do not claim:

> “Adding schema increased recommendations by 32%.”

unless the experiment supports causality.

Prefer:

> “Recommendation rate increased from 41% to 55% after the tested changes.”

Then explain:

```text
experiment design
sample size
confidence
limitations
```

---

# 63. Experiment Design

Experiments should eventually support:

```text
baseline
treatment
control
repeat runs
randomization where possible
```

V1 can begin with:

```text
before / after
```

but the architecture should not prevent stronger experimentation later.

---

# 64. Customer Trust

The product should be transparent about:

```text
what was tested
which agent was used
when it ran
what was observed
what was inferred
what remains unknown
```

This is essential for an intelligence product.

---

# 65. V1 Roadmap

```text
V0
│
├── Sandbox
├── Browser agent
├── CDP
├── Network observation
└── Basic evaluator

V1
│
├── Agent visibility
├── Readiness
├── Competitors
├── Evidence
├── Dashboard
└── Experiments

V1.5
│
├── Recurring monitoring
├── Alerts
├── Better competitor analysis
└── Reports

V2
│
├── Multi-agent benchmarking
├── Statistical evaluation
├── Optimization workflows
└── API

V3
│
├── Coding agents
├── MCP
├── SDK analytics
└── Developer-agent intelligence

V4
│
├── WebMCP
├── Agent-facing interfaces
└── Advanced optimization

V5
│
├── Customer-hosted execution
├── Enterprise deployment
└── Continuous agent observability
```

---

# 66. Product Boundary

The product should sit between:

```text
Company Digital Product
```

and:

```text
AI Agent Ecosystem
```

Architecture:

```text
             AI AGENTS
                 │
                 ▼
        ┌──────────────────┐
        │ OUR PLATFORM      │
        │                  │
        │ Test             │
        │ Observe          │
        │ Measure          │
        │ Diagnose         │
        │ Optimize         │
        │ Verify           │
        └────────┬─────────┘
                 │
                 ▼
          COMPANY PRODUCT
```

---

# 67. Final Commercial Thesis

The emerging internet will increasingly have two audiences:

```text
Humans
AI agents
```

Companies will need to understand both.

Traditional analytics tells companies how humans interact with their products.

Our platform tells companies:

> **How AI agents discover, understand, interact with, and recommend their products — and how to improve that experience.**

That is the commercial opportunity.

---

# 68. Final Product Definition

> **A testing and intelligence platform that measures how AI agents experience a company's digital product.**

The platform should evolve from:

```text
Testing
```

to:

```text
Testing
+
Intelligence
+
Optimization
+
Continuous Monitoring
```

and ultimately become the measurement layer for the **agentic internet**.
