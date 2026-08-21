# 06 — Agent Readiness Specification

**Status:** Draft v0.1  
**Document:** Agent Readiness Framework, Checks, Evidence & Scoring  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Product positioning:** Agent readiness is not the whole product. It is one layer of the platform that explains whether a company's digital product can be found, understood, accessed, and used effectively by AI agents.

---

# 1. Purpose

This document defines how our platform evaluates whether a company's digital product is ready for AI agents.

The framework combines:

- web discoverability;
- machine-readable content;
- agent access controls;
- API/tool discovery;
- authentication;
- agent interaction capabilities;
- MCP;
- WebMCP;
- Agent Skills;
- agentic commerce capabilities;
- observed agent behavior.

Cloudflare's current Agent Readiness framework is a major reference for this work. Cloudflare currently evaluates four primary dimensions—Discoverability, Content, Bot Access Control, and Capabilities—and additionally checks emerging agentic-commerce standards without currently counting those toward its score. citeturn0search1

Our product should **use this ecosystem as an input, not simply reproduce Cloudflare's score.**

---

# 2. Core Product Principle

The platform should answer two different questions:

### Readiness

> **Can an AI agent technically discover, understand, access, and interact with this product?**

### Experience

> **What actually happens when an AI agent tries to use it?**

These must remain separate.

A website can be technically agent-ready but still provide a poor agent experience.

Conversely, an agent may successfully use a site despite the site lacking some emerging standards.

Therefore:

```text
Agent Readiness
+
Observed Agent Experience
=
Complete Agent Intelligence
```

---

# 3. Our Readiness Model

The proposed product model is:

```text
READABLE
    ↓
DISCOVERABLE
    ↓
CALLABLE
    ↓
INTERACTIVE
    ↓
SECURE
    ↓
PAYABLE
```

These are capability categories, not necessarily a single linear sequence.

A company may be:

```text
Highly readable
Low discoverability
High security
No callable interface
```

The dashboard must expose these differences.

---

# 4. Relationship to Cloudflare

Cloudflare describes the emerging Agentic Internet around four primitives:

```text
Readable
Discoverable
Callable
Payable
```

and its Agent Readiness implementation currently evaluates concrete standards including robots.txt, sitemap.xml, Link headers, Markdown for Agents, Content Signals, Web Bot Auth, Agent Skills, API Catalogs, OAuth discovery, MCP Server Cards, and WebMCP. It also checks x402, Universal Commerce Protocol, and Agentic Commerce Protocol as additional commerce capabilities. citeturn0search0turn0search1

Our framework extends this into:

```text
Readable
Discoverable
Callable
Interactive
Secure
Payable
```

because **security and actual interaction quality are important to our customer-facing diagnosis**, even where they are not represented as separate top-level Cloudflare score dimensions.

---

# 5. READABLE

## Objective

Determine whether an AI system can efficiently consume the company's information.

The question is:

> **Can an agent understand the important information without wasting context, tokens, or requests?**

---

# 6. Readability Checks

Initial checks:

```text
HTML accessibility
Markdown availability
Markdown content negotiation
llms.txt
llms-full.txt
index.md fallbacks
semantic structure
page titles
descriptions
documentation structure
content duplication
content density
```

---

# 7. Markdown for Agents

Check whether the server responds appropriately to:

```http
Accept: text/markdown
```

Cloudflare reports that Markdown content negotiation can substantially reduce token consumption and measured up to 80% token reduction on some pages. citeturn0search1

Our system should measure:

```text
HTML size
Markdown size
Reduction %
```

and optionally:

```text
Estimated token reduction
```

The token estimate must be labeled as an estimate.

---

# 8. llms.txt

Check:

```text
/llms.txt
```

and optionally:

```text
/llms-full.txt
```

The platform should inspect:

- existence;
- accessibility;
- validity;
- useful descriptions;
- links;
- duplication;
- freshness.

Important:

**Presence alone should not receive a high score.**

A useless llms.txt should not be treated as equivalent to a well-structured one.

---

# 9. URL-Based Markdown Fallbacks

Check whether important pages expose agent-friendly equivalents such as:

```text
/page
/page.md
/page/index.md
```

Cloudflare describes using `index.md` fallbacks because not all tested agents automatically request Markdown through content negotiation. citeturn0search1

This is therefore a useful compatibility check rather than merely a standards-compliance check.

---

# 10. Content Quality

The readiness scanner should inspect whether important content is:

- clearly titled;
- semantically structured;
- internally linked;
- discoverable;
- concise enough for agent consumption;
- free of unnecessary navigation noise;
- explicit about product capabilities;
- explicit about pricing where appropriate;
- explicit about integrations.

This moves beyond protocol compliance toward practical agent usability.

---

# 11. Agent-Facing Documentation

For developer products, evaluate:

```text
Getting Started
Installation
API Reference
Authentication
Examples
Errors
SDKs
MCP
Changelog
Limits
Pricing
```

The system should identify missing or difficult-to-discover information.

---

# 12. DISCOVERABLE

## Objective

Determine whether agents can efficiently discover the resources they need.

Question:

> **Can an agent find the right resource without excessive crawling, guessing, or search?**

---

# 13. Discoverability Checks

Initial checks:

```text
robots.txt
sitemap.xml
Link headers
canonical URLs
internal linking
well-known endpoints
API Catalog
Agent Skills index
MCP discovery
```

---

# 14. robots.txt

Check:

```text
/robots.txt
```

Evaluate:

- availability;
- syntax;
- sitemap references;
- AI-agent rules;
- conflicting directives;
- accessibility.

Cloudflare notes that robots.txt is widespread, but most implementations were designed for traditional crawlers rather than AI agents. citeturn0search1

Therefore:

> **robots.txt exists ≠ agent-ready.**

---

# 15. Sitemap

Check:

```text
/sitemap.xml
```

Evaluate:

- availability;
- valid URLs;
- important product/documentation pages;
- freshness;
- broken entries.

Potential future capability:

Compare sitemap coverage against the site's actual important content.

---

# 16. HTTP Link Headers

Check for useful discovery relationships such as:

```http
Link: </.well-known/api-catalog>; rel="api-catalog"
```

Cloudflare specifically uses RFC 8288 Link headers as part of its discoverability checks. citeturn0search1

---

# 17. Well-Known Discovery

Inspect:

```text
/.well-known/
```

for relevant resources.

Potential checks:

```text
api-catalog
agent-skills
mcp
oauth
web bot authentication
```

The scanner must maintain a versioned registry because this ecosystem is evolving quickly.

---

# 18. Agent Skills

Check:

```text
/.well-known/agent-skills/index.json
```

where supported.

Evaluate:

- index availability;
- valid skill references;
- descriptions;
- task relevance;
- documentation quality.

Cloudflare describes Agent Skills as a discoverable way for agents to learn what capabilities a site provides. citeturn0search1

---

# 19. CALLABLE

## Objective

Determine whether an agent can perform actions through structured interfaces rather than reverse-engineering human interfaces.

Question:

> **Can an agent call the product's capabilities directly?**

---

# 20. Callable Checks

Potential interfaces:

```text
Public API
API Catalog
MCP
MCP Server Card
WebMCP
Agent Skills
SDK
```

---

# 21. API Catalog

Check for:

```text
/.well-known/api-catalog
```

Cloudflare's Agent Readiness implementation uses API Catalogs based on RFC 9727 to provide a discoverable location for APIs and their specifications. citeturn0search1

Evaluate:

- existence;
- schema validity;
- API links;
- documentation links;
- status information;
- authentication information.

---

# 22. MCP Server

Check for an MCP endpoint where appropriate.

Evaluate:

```text
discovery
transport
authentication
tools
descriptions
schemas
errors
documentation
```

---

# 23. MCP Tool Quality

Presence of MCP should not automatically produce a high score.

Evaluate:

### Tool discoverability

Can the agent understand what tools exist?

### Tool naming

Are names explicit?

### Description quality

Does the description explain when to use the tool?

### Schema quality

Are parameters typed and constrained?

### Required fields

Are required arguments actually necessary?

### Return quality

Does the result contain useful structured information?

### Error quality

Can an agent recover?

---

# 24. WebMCP

WebMCP allows a website to expose tools directly to browser agents through the page.

Cloudflare describes WebMCP as allowing agents to discover and call explicit page-level tools instead of guessing through HTML and DOM interactions. citeturn0search4

Check:

```javascript
document.modelContext
```

where supported.

Evaluate:

- tool registration;
- tool names;
- descriptions;
- schemas;
- execution;
- errors;
- authentication/session behavior.

---

# 25. INTERACTIVE

## Objective

Measure whether an agent can actually complete useful workflows.

This is deliberately different from protocol readiness.

Example:

A site may have:

```text
MCP: PASS
```

but:

```text
Task completion: FAIL
```

The product should surface both.

---

# 26. Interaction Tests

Example task categories:

```text
Find information
Compare products
Find pricing
Create account
Start checkout
Configure product
Generate report
Book appointment
Update account
Call API
```

Tasks should be customer-specific.

---

# 27. Interaction Success

For each task:

```text
success
partial
failure
```

Record:

```text
steps
time
errors
retries
tool calls
pages
network activity
failure point
```

These metrics are defined in the Evaluation & Benchmarking specification.

---

# 28. Agent Journey

Visualize:

```text
Discovery
 ↓
Page
 ↓
Documentation
 ↓
Tool
 ↓
Authentication
 ↓
Action
 ↓
Result
```

This provides the customer with an explanation of what the agent actually experienced.

---

# 29. Human UI vs Agent Interface

Evaluate whether the agent is forced to use:

```text
visual UI
DOM guessing
screenshots
```

when a structured interface could exist.

Potential finding:

> “Agents require 17 browser actions to complete a task that could be exposed as a single structured tool.”

This is more valuable than simply saying:

> “WebMCP is missing.”

---

# 30. SECURE

## Objective

Determine whether agents can access capabilities safely and explicitly.

Question:

> **Can a customer give an agent appropriate access without handing it excessive credentials or relying on unsafe browser-session sharing?**

---

# 31. Security Checks

Potential checks:

```text
OAuth discovery
scoped permissions
token expiration
authentication metadata
HTTPS
credential exposure
session behavior
authorization boundaries
tool permissions
```

---

# 32. OAuth Discovery

Where OAuth is relevant, inspect:

```text
RFC 8414
RFC 9728
```

Cloudflare includes OAuth authorization-server discovery in its current capabilities checks. citeturn0search1

The platform should evaluate:

- discovery;
- issuer;
- endpoints;
- scopes;
- compatibility;
- errors.

---

# 33. Credential Handling

Our product should distinguish:

```text
Public access
User-authorized access
Scoped token
Long-lived credential
Browser session
```

A site requiring a customer's entire browser session should be flagged as a higher-friction integration pattern.

---

# 34. Web Bot Authentication

Where applicable, evaluate cryptographic bot identity.

Cloudflare describes Web Bot Auth as a way for bots to cryptographically identify themselves to websites. citeturn0search0

Checks may include:

```text
signature directory
request signature
verification support
```

This should be marked:

```text
Not applicable
```

for sites that do not need it.

---

# 35. PAYABLE

## Objective

Determine whether an agent can complete economic transactions.

This category should remain separate from the basic readiness score until standards mature.

Cloudflare currently checks x402, Universal Commerce Protocol, and Agentic Commerce Protocol but does not count them toward its main Agent Readiness score. citeturn0search1

We should follow the same principle initially.

---

# 36. Commerce Checks

Potential future checks:

```text
x402
Universal Commerce Protocol
Agentic Commerce Protocol
agent-compatible checkout
payment authorization
transaction confirmation
refund/cancellation flows
```

---

# 37. Why Payable Is Separate

Commerce standards are evolving rapidly.

Therefore:

```text
Payable capability
```

should be reported independently until there is sufficient adoption and methodological confidence to incorporate it into a combined score.

---

# 38. Readiness Check Schema

Every check should use a common structure:

```json
{
  "checkId": "...",
  "category": "...",
  "status": "pass",
  "severity": "medium",
  "standard": "...",
  "version": "...",
  "evidence": [],
  "observedAt": "...",
  "recommendation": "..."
}
```

Possible statuses:

```text
PASS
PARTIAL
FAIL
NOT_APPLICABLE
UNKNOWN
```

---

# 39. Evidence Model

Every check must preserve evidence.

Examples:

```text
HTTP response
HTTP headers
URL
HTML snippet
JSON metadata
MCP metadata
tool schema
browser observation
network event
```

The UI should allow the customer to inspect the evidence behind a finding.

---

# 40. Severity

Recommended:

```text
CRITICAL
HIGH
MEDIUM
LOW
INFO
```

Severity should reflect practical agent/customer impact, not merely whether a standard is missing.

---

# 41. Standard Maturity

Each check should also have:

```text
experimental
emerging
adopted
mature
```

This prevents customers from receiving misleading advice such as:

> “You are failing because you don't support an experimental standard.”

---

# 42. Applicability

Not every check applies to every company.

Example:

```text
E-commerce:
Payable = relevant

Documentation site:
Payable = probably not relevant

Public API:
API Catalog = highly relevant

Static marketing site:
MCP = potentially irrelevant
```

The engine should determine applicability based on:

- site type;
- product type;
- detected capabilities;
- customer configuration.

---

# 43. Readiness Scoring

V1 should expose **category scores and raw checks**.

Example:

```text
Readable       82
Discoverable   71
Callable       34
Interactive    58
Secure         76
Payable        N/A
```

Avoid hiding everything behind one number.

---

# 44. Overall Score

A combined score may eventually be calculated:

```text
Overall Agent Readiness
```

but only after:

1. category weights are validated;
2. applicability is reliable;
3. standards mature;
4. customer feedback confirms the score is useful.

The formula must be versioned.

Example:

```text
Agent Readiness v1.0
Agent Readiness v1.1
```

Historical scores should remain reproducible.

---

# 45. Readiness vs AEO

These are different product measurements.

### Agent Readiness

> Can agents use the product?

### AEO / AI Visibility

> Are AI systems recommending the product?

### Agent Experience

> What happens when an agent actually tries?

Together:

```text
Readiness
     +
Visibility
     +
Experience
     ↓
Agent Intelligence
```

This distinction is central to our product differentiation.

---

# 46. Diagnosis Layer

Readiness checks should feed the diagnosis engine.

Example:

```text
Observation:
Competitor recommended 68%.

Readiness:
Competitor has structured product information.

Our site:
No structured product information.

External sources:
Competitor cited by 4 high-authority sources.

Diagnosis:
Potential discoverability/content disadvantage.

Recommendation:
Improve product information and external source coverage.

Experiment:
Retest recommendation rate.
```

The platform should never claim that the readiness finding alone proves why the competitor won.

---

# 47. Optimization Layer

Every readiness failure should potentially map to:

```text
Finding
 ↓
Recommended change
 ↓
Implementation guidance
 ↓
Experiment
 ↓
Measured result
```

This is where our product moves beyond auditing.

---

# 48. Agent Readiness API

Future API:

```http
POST /v1/readiness/scan
```

Input:

```json
{
  "url": "https://example.com"
}
```

Output:

```json
{
  "score": 71,
  "categories": {
    "readable": 82,
    "discoverable": 71,
    "callable": 34,
    "interactive": 58,
    "secure": 76
  },
  "checks": []
}
```

---

# 49. Continuous Readiness Monitoring

Eventually support:

```text
Weekly scan
       ↓
Compare previous scan
       ↓
Detect regression
       ↓
Alert
```

Examples:

> “Markdown negotiation stopped working after your deployment.”

> “Your MCP Server Card is no longer discoverable.”

> “A new API endpoint is not represented in your API Catalog.”

---

# 50. Change Detection

Store:

```text
previous result
current result
diff
```

Example:

```text
Before:
MCP PASS

After:
MCP FAIL

Likely cause:
Endpoint changed
```

The platform should provide evidence, not certainty about the cause.

---

# 51. Cloudflare-Inspired Checks We Should Include

Our initial compatibility layer should cover the major standards Cloudflare currently evaluates:

```text
robots.txt
sitemap.xml
Link headers
Markdown content negotiation
Content Signals
AI bot rules
Web Bot Auth
Agent Skills
API Catalog
OAuth discovery
MCP Server Card
WebMCP
```

Cloudflare's current implementation explicitly uses these categories/checks. citeturn0search1

This gives us ecosystem compatibility without making our product a copy of Cloudflare's dashboard.

---

# 52. What We Add Beyond a Static Readiness Scanner

Our differentiated layer is:

```text
Static scan
      +
Live agent execution
      +
AI recommendation measurement
      +
Competitive comparison
      +
Source intelligence
      +
Optimization experiments
```

This is critical.

A static scanner can tell a company:

> “You don't have WebMCP.”

Our platform should eventually answer:

> “Your agents took 14 additional actions because they had to navigate your UI manually. A structured interface could reduce this workflow to 3 calls. We tested the change and task success increased from 71% to 89%.”

That is substantially more actionable.

---

# 53. Readiness Report

Customer report structure:

```text
Executive Summary

Overall Readiness

Readable
  ✓ Markdown
  ✗ Documentation structure

Discoverable
  ✓ Sitemap
  ✓ robots.txt
  ✗ API Catalog

Callable
  ✓ API
  ✗ MCP
  ✗ WebMCP

Interactive
  ✓ Search
  ✗ Checkout workflow

Secure
  ✓ HTTPS
  ✓ OAuth discovery
  ⚠ Broad permissions

Payable
  Not evaluated
```

---

# 54. Recommendation Format

Each recommendation:

```text
Finding
Evidence
Why it matters
Priority
Suggested implementation
Expected measurement
```

Example:

```text
Finding:
No structured interface exists for product search.

Evidence:
Agent required 9 browser interactions.

Why it matters:
Agents must interpret the human UI.

Priority:
High

Suggested implementation:
Expose a structured search capability.

Expected measurement:
Compare task success and interaction count.
```

---

# 55. Automated Implementation Guidance

Cloudflare's current Agent Readiness tool provides prompts that customers can give to coding agents to implement fixes. citeturn0search1

We should eventually provide a similar capability, but with an important difference:

```text
Diagnosis
 ↓
Generate implementation patch/instructions
 ↓
Customer applies change
 ↓
Run experiment
 ↓
Verify improvement
```

The recommendation must therefore be connected to measurement.

---

# 56. Agent-First Self-Description

Our own platform should follow the standards it recommends.

Eventually expose:

```text
/.well-known/agent-skills/index.json
/.well-known/mcp.json
```

and agent-friendly documentation.

The platform itself should be a demonstration of agent readiness.

---

# 57. Readiness Test Architecture

```text
Crawler
   ↓
HTTP Analyzer
   ↓
Well-Known Analyzer
   ↓
Content Analyzer
   ↓
API Analyzer
   ↓
MCP Analyzer
   ↓
WebMCP Analyzer
   ↓
Auth Analyzer
   ↓
Readiness Evaluator
   ↓
Evidence Store
   ↓
Diagnosis Engine
```

---

# 58. Live Agent Architecture

Readiness scans should eventually connect to:

```text
Readiness Scan
       ↓
Generate Candidate Tasks
       ↓
Agent Runner
       ↓
Observe
       ↓
Evaluate
       ↓
Compare
```

This lets the system test whether detected capabilities actually work.

---

# 59. Example: MCP

Static result:

```text
MCP:
PASS
```

Live test:

```text
Tool discovered:
PASS

Tool selected:
PASS

Arguments generated:
FAIL

Execution:
FAIL

Task:
FAIL
```

Final customer result:

> “MCP is technically exposed, but the current tool schema causes agents to generate invalid arguments.”

This is the level of diagnosis we want.

---

# 60. Example: Markdown

Static result:

```text
Markdown negotiation:
PASS
```

Live observation:

```text
Agent:
does not request Markdown
```

The product should not report:

> “Agents always consume your Markdown.”

Instead:

> “Your server supports Markdown negotiation, but the tested agent did not use it.”

This distinction is essential.

---

# 61. Example: WebMCP

Static:

```text
WebMCP:
PASS
```

Live:

```text
Tool discovery: PASS
Tool call: PASS
Task completion: PASS
Steps reduced: 13 → 4
```

This produces a strong optimization finding.

---

# 62. Versioning

Every readiness scan must store:

```text
scanner version
standards registry version
check version
```

Example:

```text
scanner: 0.3.0
standards: 2026-08
```

This is necessary because standards change.

---

# 63. Standards Registry

Create an internal registry:

```text
standard
category
specification
status
maturity
check
evidence
documentation
introduced
deprecated
```

This allows us to add standards without rewriting the scanner.

---

# 64. Standards Research Process

For every new standard:

```text
Research
 ↓
Assess maturity
 ↓
Implement experimental check
 ↓
Validate
 ↓
Add to registry
 ↓
Expose as optional check
 ↓
Promote to scored check
```

Never immediately add a newly announced protocol to the core score.

---

# 65. V1 Implementation Scope

V1 should implement:

### Readable

- HTML basics;
- Markdown negotiation;
- llms.txt detection;
- sitemap/content checks.

### Discoverable

- robots.txt;
- sitemap;
- canonical URLs;
- Link headers.

### Callable

- API detection;
- basic API Catalog;
- MCP detection.

### Secure

- HTTPS;
- basic OAuth discovery.

### Interactive

Not a static score yet.

Instead use a small set of live agent tasks.

### Payable

Report as informational only.

---

# 66. V2 Scope

Add:

```text
Agent Skills
WebMCP
advanced MCP analysis
live agent interaction
authentication workflows
failure-point analysis
```

---

# 67. V3 Scope

Add:

```text
readiness experiments
before/after measurements
optimization recommendations
continuous monitoring
readiness regression alerts
```

---

# 68. V4 Scope

Add:

```text
MCP quality benchmarking
SDK quality benchmarking
WebMCP optimization
agent-specific compatibility
developer workflow testing
```

---

# 69. V5 Scope

Add:

```text
continuous agent ecosystem monitoring
agent/provider comparisons
cross-company benchmarks
industry benchmarks
commerce readiness
```

---

# 70. Non-Goals

This framework is not intended to:

- guarantee AI recommendations;
- guarantee search ranking;
- guarantee agent success;
- certify security;
- replace security audits;
- replace accessibility audits;
- replace SEO;
- declare one standard universally superior;
- predict proprietary model behavior with certainty.

---

# 71. Final Product Model

The final platform should conceptually measure:

```text
                 AI INTELLIGENCE
                       │
        ┌──────────────┼──────────────┐
        │              │              │
        ▼              ▼              ▼
   VISIBILITY      READINESS      EXPERIENCE
        │              │              │
        │              │              │
   Are agents      Can agents     What happens
   recommending?   use us?        when they try?
        │              │              │
        └──────────────┼──────────────┘
                       ▼
                  DIAGNOSIS
                       │
                       ▼
                OPTIMIZATION
                       │
                       ▼
                  EXPERIMENT
                       │
                       ▼
                   MEASURE
```

This is the central architecture of the product's intelligence layer.

---

# 72. Final Principle

> **Agent readiness is not a checklist. It is a measurable capability model.**

A standards scan tells us what a website exposes.

An agent execution tells us what actually works.

Our product should combine both.

The long-term objective is therefore:

```text
Detect
 ↓
Measure
 ↓
Explain
 ↓
Optimize
 ↓
Verify
```

That loop is the core differentiator of our product.
