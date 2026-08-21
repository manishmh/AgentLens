# 11 — Research Register & External References

**Status:** Research baseline v0.1  
**Purpose:** Central research register for the product. The implementation agent may use this document to understand why architectural and product decisions were made, what existing products already solve, and which ideas should influence future versions.

> **Important:** This is a research/reference document, not an implementation specification. `10-v1-implementation-plan.md` remains authoritative for V1 implementation choices.

---

# 1. Product Research Thesis

Our product is not simply an AEO/GEO monitoring tool.

The working thesis is:

> **A testing and intelligence platform that measures how AI agents experience a company's digital product.**

The system should eventually connect four layers:

```text
AI visibility
      +
Agent behavior
      +
Digital-product readiness
      +
Optimization experiments
```

The important distinction is:

```text
Traditional AEO/GEO:
"Does AI mention my company?"

Our platform:
"Why did the agent choose or ignore my company,
what did it actually do, what did it see,
what blocked it, and did our intervention improve the outcome?"
```

---

# 2. Research Categories

Research is grouped into:

```text
A. Agent-ready web / Cloudflare
B. AI search / AEO / GEO
C. Agent execution and observation
D. Browser-agent benchmarks
E. Agent evaluation
F. Agent observability
G. Sandboxes and computer environments
H. MCP / SDK / tool discovery
I. Competitors and adjacent products
J. Product architecture lessons
```

---

# 3. Cloudflare — Agent Readiness

## Source

Cloudflare — Introducing the Agent Readiness score

https://blog.cloudflare.com/agent-readiness/

Published April 17, 2026.

## What it provides

Cloudflare introduced an Agent Readiness score and `isitagentready.com` to help websites understand whether agents can:

```text
discover the site
understand its content
authenticate
access appropriate information
use capabilities
pay where required
```

Cloudflare also connects the work to Radar data, measuring adoption of agent standards across the Internet.

## Key product lesson

A website can be technically online while still being poorly usable by agents.

Therefore our product needs a **technical readiness layer** in addition to behavioral testing.

## What we should adopt

```text
Agent readiness audit
Discoverability checks
Content accessibility
Machine-readable content checks
Authentication readiness
Capability discovery
Payment readiness
WebMCP readiness
Agent access controls
```

## What we should NOT copy directly

Cloudflare's score should not become our entire product.

Their strength is:

```text
Internet-scale infrastructure
+
traffic intelligence
+
standards adoption
+
edge controls
```

Our strength should be:

```text
controlled agent experiments
+
behavioral observation
+
competitive diagnosis
+
optimization experiments
```

---

# 4. Cloudflare — AEO

## Source

Cloudflare — From ranking to recommended: get your site ready to thrive in the age of AI agents

https://blog.cloudflare.com/aeo/

Published August 6, 2026.

## Key idea

Traditional SEO asks:

```text
Can users find my page?
```

Agent-era discovery asks:

```text
Will an AI assistant discover,
understand and recommend my business?
```

Cloudflare describes an agentic audience that can research and act on behalf of users.

## Product lesson

We need to distinguish:

```text
Discovery
→ Retrieval
→ Understanding
→ Recommendation
→ Action
```

A company can fail at any stage.

This directly supports our competitor-diagnosis model.

---

# 5. Cloudflare — Agentic Internet

## Source

Cloudflare — Building an open Agentic Internet: readable, discoverable, callable, and payable

https://blog.cloudflare.com/the-agentic-internet/

Published August 6, 2026.

## Framework

Cloudflare's model:

```text
Readable
Discoverable
Callable
Payable
```

## Product relevance

This is useful as a readiness framework.

Our product can measure:

### Readable

Can an agent efficiently access useful information?

### Discoverable

Can agents find the company/product?

### Callable

Can agents actually invoke capabilities?

### Payable

Can an agent complete a transaction when appropriate?

## Strategic extension

Cloudflare describes the infrastructure required for the Agentic Internet.

We can measure whether a **specific company's implementation works in practice**.

---

# 6. Cloudflare Radar — What It Is

## Main product

https://radar.cloudflare.com/

Cloudflare Radar is a public Internet intelligence product built from Cloudflare's large-scale network and other datasets.

It covers areas including:

```text
Traffic
AI Insights
Bots
Security
Connectivity
Routing
DNS
Internet quality
Domain information
Reports
```

The important architectural lesson is that Radar turns large-scale infrastructure telemetry into:

```text
raw network data
        ↓
classification
        ↓
aggregations
        ↓
time series
        ↓
interactive dimensions
        ↓
public intelligence product
```

This is a useful model for our own future data product.

---

# 7. Cloudflare Radar — AI Insights

Current Radar AI Insights includes:

```text
AI bot & crawler traffic
HTTP traffic by bot
Crawl purpose
Content type
Markdown-for-agents savings
Response status
HTML requests by client type
Crawl-to-refer ratio
AI bot transparency
Generative AI service popularity
AI user agents in robots.txt
Adoption of AI agent standards
```

Source:

https://radar.cloudflare.com/ai-insights

## Important observation

Radar is not merely showing "AI traffic."

It creates multiple analytical dimensions:

```text
who
+
why
+
what content
+
how much
+
how successful
+
how it changes over time
```

That dimensional approach is highly relevant to our product.

---

# 8. Cloudflare Radar — API Model

Radar exposes APIs for AI bot analytics.

AI bot traffic can be grouped by:

```text
USER_AGENT
CRAWL_PURPOSE
INDUSTRY
VERTICAL
CONTENT_TYPE
RESPONSE_STATUS
RESPONSE_STATUS_CATEGORY
```

It also supports filters and time-series analysis.

Source:

https://developers.cloudflare.com/api/resources/radar/subresources/ai/subresources/bots/methods/summary_v2/

## Product lesson

Our future data model should make dimensions first-class.

For example:

```text
Agent
Model
Provider
Task
Query
Domain
Competitor
Page
Action
Outcome
Content type
Crawl purpose
Time
Region
```

This will allow much richer analysis than one visibility score.

---

# 9. Cloudflare Radar — Markdown for Agents

Radar exposes a metric for:

> median response-size reduction when serving Markdown instead of HTML to AI bots and crawlers.

This is particularly relevant to our product.

Potential customer question:

```text
Does providing agent-optimized content
actually improve retrieval?
```

Our system can eventually test:

```text
HTML baseline
vs
Markdown representation
```

and observe:

```text
retrieval
page selection
task success
recommendation
```

This converts an infrastructure recommendation into a measurable experiment.

---

# 10. Cloudflare Radar — Crawl vs Referral

Radar exposes a crawl-to-refer ratio:

```text
HTML page crawl requests
/
HTML page referrals
```

This suggests a useful conceptual distinction:

```text
Agent retrieves content
```

versus:

```text
Agent actually uses that content
to produce downstream value.
```

For our product, this becomes:

```text
retrieval
→
interaction
→
recommendation
→
conversion/action
```

We should not equate crawling with successful AI visibility.

---

# 11. Cloudflare Radar — Agent Standards Adoption

Radar shows adoption of AI-agent standards across a large set of scanned domains.

It explicitly notes that standards are not universally applicable; for example, x402 is relevant to paid content and WebMCP to sites exposing tools.

## Product lesson

Our readiness system must be:

```text
context-aware
```

rather than:

```text
one checklist for every website
```

Example:

```text
E-commerce site
→ payment/callability checks

Documentation site
→ readability/discoverability checks

SaaS application
→ authentication/callability/MCP checks
```

---

# 12. Cloudflare — Verified Bots

Cloudflare defines verified bots using transparent identification and non-abusive behavior.

Source:

https://developers.cloudflare.com/bots/concepts/bot/verified-bots/

Key concepts:

```text
honest self-identification
stable identity
robots.txt compliance
reasonable request rates
non-evasive behavior
```

## Product relevance

Our execution infrastructure should preserve agent identity and experiment metadata.

Long-term, we should also study:

```text
Web Bot Auth
agent identity
agent permissions
crawler transparency
```

These become important when our product eventually interacts with real production sites.

---

# 13. Cloudflare Computer

## Source

https://blog.cloudflare.com/cloudflare-computer/

Repository:

https://github.com/cloudflare/computer

Cloudflare describes `@cloudflare/computer` as an early-preview agent runtime where the platform handles the mechanics of running code in isolates, containers, or web browsers.

## Why it matters

The important idea is:

> Give an agent a computer, not merely a container.

A capable agent environment may include:

```text
filesystem
shell
packages
browser
tools
persistent state
```

## Our decision

Do not use Cloudflare Computer as V1 infrastructure.

Use it as architectural research for:

```text
future computer runtime
filesystem abstraction
agent workspace
multi-environment execution
```

---

# 14. Vercel — AI SDK 7

## Source

https://vercel.com/blog/ai-sdk-7

AI SDK 7 provides:

```text
agent development
tool execution
MCP
sandbox support
durable workflows
timeouts
agent harness integration
telemetry
```

It supports established harnesses including:

```text
Codex
Claude Code
Deep Agents
OpenCode
Pi
```

## Product relevance

This strongly supports our choice of AI SDK as the V1 agent abstraction.

However:

```text
AI SDK telemetry
≠
our canonical observation layer
```

We need our own evidence system.

---

# 15. Vercel — AEO Tracking for Coding Agents

## Source

https://vercel.com/blog/how-we-built-aeo-tracking-for-coding-agents

This is one of the most directly relevant references for our architecture.

Vercel describes a system that:

```text
creates an ephemeral sandbox
→ installs an agent CLI
→ injects credentials / routes provider calls
→ runs the agent
→ captures its transcript
→ normalizes agent-specific output
→ extracts URLs/tools/recommendations
→ evaluates AEO
```

## Major lesson

The most important technical insight is:

> **Agent execution infrastructure and transcript normalization are separate problems.**

Different agents produce different:

```text
transcript formats
tool names
message structures
CLI behavior
```

Vercel solves this using:

```text
capture
→ parse
→ normalize
→ enrich
→ analyze
```

## We should adopt this pattern

Our architecture should have:

```text
Agent Adapter
      ↓
Raw Trace
      ↓
Parser
      ↓
Canonical Event
      ↓
Enrichment
      ↓
Evaluation
```

This is one of the strongest references supporting our V1 architecture.

---

# 16. Vercel — Important Security/Cost Pattern

Vercel routes provider calls through AI Gateway rather than necessarily giving each agent direct provider credentials.

This gives:

```text
centralized logging
rate limiting
cost tracking
provider abstraction
```

## Product lesson

For our execution plane, credentials should be:

```text
short-lived
scoped
isolated
observable
revocable
```

We should avoid placing long-lived customer credentials directly inside agents.

---

# 17. OpenAI Agents SDK

Sources:

https://openai.github.io/openai-agents-python/

https://openai.github.io/openai-agents-js/

OpenAI's Agents SDK includes:

```text
agents
tools
handoffs
guardrails
sessions
MCP
sandbox execution
tracing
```

Its tracing captures:

```text
agent runs
turns
LLM generations
tool calls
handoffs
guardrails
custom events
```

## Product lesson

Agent SDK tracing is valuable, but provider-specific.

Our canonical event model should sit above provider-specific traces.

---

# 18. OpenAI Tracing

OpenAI's tracing model uses:

```text
Trace
 ↓
Spans
 ↓
Agent
 ↓
Turn
 ↓
Generation / Tool / Handoff
```

This is useful for our internal trace schema.

We should borrow the conceptual hierarchy:

```text
Run
 ↓
Agent Step
 ↓
Action
 ↓
External Effect
```

while retaining browser/network evidence that an agent SDK cannot see.

---

# 19. LangSmith

Source:

https://docs.langchain.com/

LangSmith provides framework-agnostic:

```text
tracing
evaluation
monitoring
feedback
debugging
```

It supports multiple agent frameworks and providers.

## Lesson

Observability products typically separate:

```text
trace collection
evaluation
monitoring
diagnosis
```

Our product should follow the same separation.

## Difference

LangSmith primarily observes the customer's agent application.

We want to observe:

```text
agent
+
browser
+
web
+
digital product
+
competitors
```

That is a substantially different observation boundary.

---

# 20. BrowserGym / WebArena

## WebArena

Repository:

https://github.com/web-arena-x/webarena

WebArena provides a self-hostable realistic web environment for autonomous-agent research.

It supports:

```text
browser environments
tasks
evaluation
execution trajectories
Playwright traces
reproducible experiments
```

The project now recommends AgentLab/BrowserGym infrastructure for more advanced parallel experiments.

## Key lesson

Web-agent evaluation needs:

```text
task definitions
controlled environment
action trajectories
reproducibility
evaluation harness
```

This directly influences our experiment model.

---

# 21. WebArena Human Trajectories

WebArena provides human trajectories stored as Playwright traces.

These traces can expose:

```text
HTML
network traffic
interaction history
```

## Product opportunity

Long-term we can compare:

```text
human trajectory
vs
agent trajectory
```

to identify:

```text
navigation inefficiency
unnecessary actions
information discovery failures
interaction friction
```

This could become a powerful future metric.

---

# 22. WebArena Failure Taxonomy Research

A 2026 WebArena proposal discusses moving beyond a single success/failure score toward:

```text
per-step action traces
failure taxonomy
planning
navigation
state tracking
recovery
```

Source:

https://github.com/web-arena-x/webarena/issues/267

## Product lesson

Our evaluator should not simply say:

```text
Task failed.
```

It should eventually classify:

```text
discovery failure
retrieval failure
navigation failure
interaction failure
state failure
tool failure
recovery failure
information failure
recommendation failure
```

This is highly aligned with our product.

---

# 23. AgentBench

AgentBench is relevant as broader research into evaluating LLM agents across environments.

Research principle:

```text
agent quality
=
performance across tasks/environments
```

The main lesson for us is to avoid designing a score that only works for one task type.

Our evaluation framework should support:

```text
task-specific criteria
+
common cross-task metrics
```

---

# 24. LLM-as-a-Judge Research

## Survey

A Survey on LLM-as-a-Judge:

https://arxiv.org/abs/2411.15594

LLM-as-a-Judge can provide scalable evaluation, but reliability depends heavily on:

```text
rubric design
consistency
bias mitigation
calibration
ground truth
```

## Product rule

Never use an LLM judge as the sole source of truth when deterministic evidence exists.

Prefer:

```text
Observed evidence
+
deterministic evaluator
+
LLM interpretation
```

---

# 25. Agent-as-a-Judge

Research:

https://arxiv.org/abs/2601.05111

Agent-as-a-Judge extends LLM evaluation with:

```text
planning
tool use
verification
multi-step evaluation
```

## Future relevance

For complex agent behavior, our evaluator may eventually use an evaluator agent that can:

```text
inspect trace
inspect website
inspect evidence
verify claims
produce diagnosis
```

But V1 should remain mostly deterministic.

---

# 26. WebDevJudge

Research:

https://arxiv.org/abs/2510.18560

WebDevJudge finds an important limitation:

> LLM judges can diverge significantly from human experts on complex web tasks.

## Product lesson

For customer-facing findings:

```text
LLM-generated explanation
```

must be grounded in:

```text
actual trace evidence
```

and should carry confidence.

---

# 27. AEO/GEO Market

The market is already moving beyond simple SEO.

Examples include:

```text
HubSpot AEO
Profound
Scrunch
Peec
Otterly
AEO Platform
GoVISIBLE
other AI visibility platforms
```

The common product pattern is:

```text
track prompts
→ measure mentions/citations
→ compare competitors
→ recommend optimization
```

## Market gap we should target

Most products primarily measure:

```text
answer visibility
citation
share of voice
brand sentiment
```

Our differentiation should be:

```text
visibility
+
agent execution
+
behavioral trace
+
website interaction
+
technical readiness
+
root-cause diagnosis
+
controlled optimization experiments
```

---

# 28. HubSpot AEO

Source:

https://www.hubspot.com/products/aeo/ai-visibility

HubSpot tracks:

```text
ChatGPT
Perplexity
Gemini
```

and provides:

```text
AI visibility score
competitor comparison
citation analysis
recommendations
```

## Lesson

This validates the commercial demand for:

```text
visibility
competitor comparison
recommendations
```

## Our differentiation

We should go deeper into:

```text
agent journey
website retrieval
interaction
evidence
root cause
```

---

# 29. Ahrefs AI Visibility Research

Source:

https://ahrefs.com/blog/ai-brand-visibility-correlations/

Ahrefs analyzed 75,000 brands across AI surfaces.

Their work explores correlations between AI visibility and external signals such as:

```text
brand mentions
YouTube presence
link authority
advertising
brand strength
```

## Product lesson

Do not assume website optimization alone explains AI visibility.

Potential evidence sources include:

```text
website
third-party sources
reviews
social/video
brand mentions
documentation
community
structured data
```

Our eventual diagnosis engine should aggregate external evidence.

---

# 30. AEO Research Platforms

Examples:

```text
AEO Platform
AuraMetrics
AEO Vision
AEO Hunt
Aeoix
```

These demonstrate growing demand for:

```text
AI visibility measurement
share of model
citation analysis
cross-engine comparison
AI-search audits
```

## Product lesson

We should treat:

```text
prompt
```

as a first-class object.

Each prompt should have:

```text
intent
industry
product category
competitors
engine
model
mode
timestamp
result
citations
recommendation
```

---

# 31. Important New Insight — Retrieval vs Recommendation

A key distinction emerging from AI visibility research is:

```text
brand retrieved
```

is not identical to:

```text
brand recommended
```

This suggests a funnel:

```text
Query
 ↓
Discovery
 ↓
Retrieval
 ↓
Page access
 ↓
Information extraction
 ↓
Candidate consideration
 ↓
Recommendation
 ↓
Action
```

Our product should measure this funnel.

This is stronger than a single visibility score.

---

# 32. Search Engine / AI Engine Differences

Different AI systems can behave differently.

Potential differences include:

```text
whether live web search is triggered
retrieval strategy
citation behavior
source ranking
query expansion
result selection
model knowledge
```

Therefore:

```text
one AI engine ≠ universal AI behavior
```

Our experiments must record:

```text
engine
model
mode
search availability
date
locale
```

---

# 33. Consumer AI vs Coding Agents

Our primary commercial focus remains:

```text
consumer-facing AI experiences
```

Examples:

```text
ChatGPT
Claude
Gemini
Perplexity
AI shopping/research agents
computer-use agents
```

Coding agents remain an important future expansion:

```text
Codex
Claude Code
OpenCode
```

because companies also need their:

```text
SDK
documentation
MCP
API
integration experience
```

to work for developer agents.

---

# 34. Future MCP / SDK Analytics

Our future product can observe:

```text
agent
 ↓
search
 ↓
documentation
 ↓
SDK
 ↓
MCP
 ↓
tool
 ↓
implementation
```

Metrics:

```text
tool discovery
tool selection
argument correctness
tool errors
latency
documentation usefulness
implementation success
test success
```

This becomes a second major product line.

---

# 35. Future Passive Production Intelligence

Long-term architecture:

```text
Customer production environment
        ↓
Agent traffic / telemetry
        ↓
Observation gateway
        ↓
Our platform
```

This could reveal real-world:

```text
agent traffic
retrieval
tool usage
failures
conversion
```

But it requires much stronger:

```text
privacy
security
identity
data minimization
customer integrations
```

Therefore it is not V1.

---

# 36. Research-Informed Product Funnel

The research supports this product flow:

```text
1. Audit
   ↓
2. Test
   ↓
3. Observe
   ↓
4. Diagnose
   ↓
5. Recommend
   ↓
6. Optimize
   ↓
7. Retest
   ↓
8. Monitor
```

This should be the core commercial loop.

---

# 37. What We Should Build From This Research

## Adopt now

```text
Agent runtime abstraction
Sandboxed execution
Transcript normalization
Canonical events
Browser/CDP observation
Search observation
Evidence-backed evaluation
Agent readiness audit
Competitor comparison
Multi-run experiments
```

## V1.5 / V2

```text
Cross-engine monitoring
External-source intelligence
Automated optimization suggestions
Recurring tests
Alerts
Share-of-model analytics
Human vs agent trajectory comparison
```

## Future

```text
MCP analytics
SDK analytics
Coding-agent analytics
Production/passive observation
Agent identity
WebMCP testing
Payment/callability testing
Agent-as-a-Judge
Internet-scale intelligence
```

---

# 38. What We Should NOT Build

Avoid becoming:

```text
another SEO crawler
another generic LLM observability platform
another chatbot analytics tool
another simple AEO score generator
another browser automation wrapper
```

Our core differentiator should remain:

> **Evidence-backed measurement of how agents actually experience and choose between digital products.**

---

# 39. Research-Driven Data Model

Research suggests the following first-class entities:

```text
Organization
Project
Website
Competitor
Agent
Model
Engine
Task
Prompt
Experiment
Run
Step
Event
Search
Source
Page
Artifact
Evaluation
Finding
Recommendation
Change
Outcome
```

The most important relationship:

```text
Task
 ↓
Run
 ↓
Events
 ↓
Evidence
 ↓
Evaluation
 ↓
Finding
 ↓
Recommendation
 ↓
Change
 ↓
New Run
 ↓
Outcome
```

---

# 40. Research-Driven Scoring Model

Do not collapse everything into one score initially.

Use multiple dimensions:

```text
Discovery Score
Retrieval Score
Interaction Score
Information Score
Recommendation Score
Task Success Score
Agent Readiness Score
Competitive Share Score
```

A composite score can be introduced later.

---

# 41. Radar-Inspired Analytics Model

Use dimensions and time series:

```text
Agent
Model
Engine
Industry
Vertical
Task
Query
Content Type
Crawl Purpose
Response Status
Domain
Competitor
Region
Time
```

This allows future dashboards such as:

```text
AI visibility by engine
Agent failures by category
Competitor win rate
Retrieval by content type
Agent-readiness adoption
Recommendation trends
```

---

# 42. Research Priority

When deciding whether new research belongs in the product, ask:

```text
Does it help us observe agents?
Does it help us evaluate agents?
Does it help us explain outcomes?
Does it help us optimize websites/products?
Does it create a defensible dataset?
```

If none apply, it is probably not core.

---

# 43. Reference Table

| Research | Main lesson | Product use |
|---|---|---|
| Cloudflare Agent Readiness | Agent-facing web standards | Readiness audit |
| Cloudflare AEO | AI recommendation matters | Visibility/recommendation |
| Cloudflare Agentic Internet | Readable/discoverable/callable/payable | Readiness framework |
| Cloudflare Radar | Internet-scale telemetry → intelligence | Future external intelligence |
| Cloudflare Computer | Agents need computer environments | Future runtime research |
| Vercel AI SDK 7 | Unified agent/harness infrastructure | V1 runtime |
| Vercel AEO tracking | Sandbox + transcript normalization | V1 architecture |
| OpenAI Agents SDK | Agent tracing/evaluation | Adapter/reference |
| LangSmith | Trace/evaluate/monitor pattern | Observability reference |
| WebArena | Reproducible web-agent evaluation | Benchmark methodology |
| BrowserGym | Browser-agent experimentation | Future benchmark infrastructure |
| LLM-as-a-Judge research | Judge reliability limits | Evaluation design |
| Agent-as-a-Judge | Tool-using evaluation | Future evaluator |
| WebDevJudge | LLM judge can diverge from humans | Evidence requirement |
| HubSpot AEO | Commercial visibility demand | Competitive research |
| Ahrefs AI research | External signals matter | Future intelligence |
| AEO/GEO platforms | Prompt/citation/share-of-voice monitoring | Market benchmark |

---

# 44. Primary References

## Cloudflare

- Agent Readiness  
  https://blog.cloudflare.com/agent-readiness/

- AEO  
  https://blog.cloudflare.com/aeo/

- Agentic Internet  
  https://blog.cloudflare.com/the-agentic-internet/

- Cloudflare Computer  
  https://blog.cloudflare.com/cloudflare-computer/

- Cloudflare Computer repository  
  https://github.com/cloudflare/computer

- Cloudflare Radar  
  https://radar.cloudflare.com/

- Radar AI Insights  
  https://radar.cloudflare.com/ai-insights

- Radar API  
  https://developers.cloudflare.com/api/resources/radar/

- Radar AI Bots API  
  https://developers.cloudflare.com/api/resources/radar/subresources/ai/subresources/bots/methods/summary_v2/

- Verified Bots  
  https://developers.cloudflare.com/bots/concepts/bot/verified-bots/

## Vercel

- AI SDK 7  
  https://vercel.com/blog/ai-sdk-7

- AI SDK 7 changelog  
  https://vercel.com/changelog/ai-sdk-7

- AEO tracking for coding agents  
  https://vercel.com/blog/how-we-built-aeo-tracking-for-coding-agents

## Agent infrastructure / evaluation

- OpenAI Agents SDK  
  https://openai.github.io/openai-agents-python/

- OpenAI Agents SDK TypeScript  
  https://openai.github.io/openai-agents-js/

- OpenAI tracing  
  https://openai.github.io/openai-agents-js/guides/tracing/

- LangSmith  
  https://docs.langchain.com/

- WebArena  
  https://github.com/web-arena-x/webarena

- WebArena resources / traces  
  https://github.com/web-arena-x/webarena/tree/main/resources

## Evaluation research

- LLM-as-a-Judge survey  
  https://arxiv.org/abs/2411.15594

- Agent-as-a-Judge  
  https://arxiv.org/abs/2601.05111

- WebDevJudge  
  https://arxiv.org/abs/2510.18560

## Market research

- HubSpot AI Visibility  
  https://www.hubspot.com/products/aeo/ai-visibility

- Ahrefs AI brand visibility research  
  https://ahrefs.com/blog/ai-brand-visibility-correlations/

- AEO Platform research  
  https://www.aeo-platform.com/research

---

# 45. Research Maintenance Rule

This file should be updated whenever:

```text
a major agent runtime launches
a new agent protocol becomes relevant
a major AEO/GEO competitor launches
Cloudflare changes Agent Readiness/Radar
Vercel changes AI SDK/harness infrastructure
browser-agent architecture changes
new evaluation methodology becomes credible
our architecture changes because of external research
```

Each new entry should record:

```text
Source
Date
What changed
What we learned
What we adopt
What we reject
V1/V2/Future impact
```

---

## Competitor Research

- Armature  
  https://armature.ai/

- Scope  
  https://www.scopesays.ai/

- Scrunch  
  https://scrunch.com/

- Limy  
  https://limy.ai/

- Axioma  
  https://axioma.ai/

Mode A validation:
Scope

Mode B validation:
Armature

Agent-aware delivery/control:
Scrunch

# 46. Final Research Conclusion

The strongest signal from the research is that the market is converging on several separate capabilities:

```text
AI visibility monitoring
+
agent execution
+
agent observability
+
web readiness
+
evaluation
+
optimization
```

Most existing products emphasize one or two.

Our opportunity is to connect them:

```text
Measure
   ↓
Observe
   ↓
Explain
   ↓
Optimize
   ↓
Experiment
   ↓
Verify
```

That loop — rather than a single AI visibility score — should remain the foundation of the product.
