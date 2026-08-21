# Evaluation & Benchmarking Specification

**Status:** Draft v0.1  
**Document:** Evaluation, Metrics, Scoring & Benchmarking  
**Product:** AI Discovery & Agent Experience Intelligence Platform

> **Core principle:** Every important product claim must be traceable to observed evidence, reproducible experiments, and an explicit evaluation methodology.

---

# 1. Purpose

This document defines how the platform measures:

- AI visibility;
- AI recommendation behavior;
- competitor presence;
- source/citation behavior;
- agent task performance;
- agent experience;
- agent readiness;
- optimization impact;
- benchmark performance.

The evaluation system is the foundation of product credibility.

---

# 2. Evaluation Philosophy

We must distinguish four things:

```text
OBSERVATION
What happened?

MEASUREMENT
How often/how much did it happen?

INFERENCE
What might explain it?

RECOMMENDATION
What should the customer do?
```

These must never be silently collapsed into one claim.

Example:

**Observation**

> Competitor A was recommended in 64 of 100 runs.

**Measurement**

> Competitor recommendation rate = 64%.

**Inference**

> Competitor A may have stronger discoverability for this intent.

**Recommendation**

> Investigate the competitor's cited sources and improve equivalent product information.

The system must not state the inference as proven causation unless the experiment supports it.

---

# 3. Evidence Hierarchy

Evidence should be ranked.

## Level 1 — Direct execution evidence

- agent event;
- browser event;
- network event;
- transcript;
- tool call;
- task result.

## Level 2 — External source evidence

- website page;
- search result;
- documentation;
- API metadata;
- structured data;
- MCP metadata.

## Level 3 — Derived measurement

- recommendation rate;
- task success rate;
- citation rate;
- latency;
- steps.

## Level 4 — Model-assisted interpretation

- likely cause;
- content classification;
- diagnosis;
- recommendation.

Model-generated interpretations should always retain their underlying evidence.

---

# 4. Evaluation Object Model

Every evaluation should be associated with:

```text
Organization
Project
Experiment
Run
Agent
Model
Query/Task
Target
Competitors
Evaluator Version
```

Conceptually:

```text
Evaluation
├── experiment_id
├── run_id
├── evaluator_id
├── evaluator_version
├── input
├── result
├── evidence[]
├── confidence
└── metadata
```

---

# 5. Measurement Unit

The basic unit should be the **run**.

A run is:

> One execution of one defined query/task against one defined environment using one defined agent/model configuration.

Example:

```text
Run
├── Query
├── Agent
├── Model
├── Browser
├── Target
├── Competitors
├── Environment
└── Result
```

Multiple runs create a sample.

---

# 6. Experiment Unit

An experiment groups runs under a common methodology.

```text
Experiment
├── hypothesis
├── query set
├── target
├── competitors
├── agent configuration
├── repetitions
├── evaluator version
└── analysis
```

This is the unit used for comparison and optimization testing.

---

# 7. AI Visibility Metrics

## 7.1 Mention Rate

Percentage of runs in which the target company/product is mentioned.

```text
Mention Rate =
runs mentioning target
----------------------
total valid runs
```

Example:

```text
37 / 100 = 37%
```

---

# 8. Recommendation Rate

Percentage of valid runs where the target is explicitly recommended.

```text
Recommendation Rate =
runs recommending target
------------------------
total valid runs
```

This should be stricter than mention detection.

A company being mentioned does not mean it was recommended.

---

# 9. Recommendation Position

When the AI provides ranked or ordered recommendations:

```text
Position 1
Position 2
Position 3
...
Not recommended
```

Useful metrics:

- average position;
- median position;
- top-1 rate;
- top-3 rate;
- top-5 rate.

Do not assign artificial positions when the response is not ordered.

---

# 10. Competitor Recommendation Rate

For each competitor:

```text
Competitor Recommendation Rate =
competitor recommendations
---------------------------
valid runs
```

Example:

| Company | Recommendation Rate |
|---|---:|
| Target | 32% |
| Competitor A | 64% |
| Competitor B | 48% |
| Competitor C | 21% |

---

# 11. Competitive Share of Recommendations

For queries where multiple recommendations are possible:

```text
Recommendation Share =
target recommendations
----------------------
all detected recommendations
```

This is different from recommendation rate.

Both should be retained.

---

# 12. Citation Rate

Percentage of responses that cite or link to the target's owned sources.

Possible categories:

```text
Direct target citation
Target documentation citation
Third-party citation about target
No target citation
```

Do not combine these into one metric without preserving the underlying category.

---

# 13. Source Share

Measure which sources appear in AI responses.

```text
Source frequency =
runs citing source
-----------------
valid runs
```

This creates a source landscape.

Example:

```text
G2             41%
Reddit         28%
Company docs   22%
TechCrunch     17%
Competitor blog 14%
```

Percentages may overlap because one response can contain multiple sources.

---

# 14. Source Influence

Source presence is not necessarily causal influence.

Therefore the platform should distinguish:

```text
Observed source
```

from:

```text
Likely influential source
```

The latter requires stronger evidence and should initially be labeled as inference.

---

# 15. Query-Level Visibility

Every aggregate score must be decomposable.

Example:

```text
Overall recommendation rate: 42%

Query A: 80%
Query B: 60%
Query C: 20%
Query D: 10%
```

This allows the customer to identify specific opportunities.

---

# 16. Intent-Level Visibility

Queries should be classified by intent.

Suggested categories:

```text
Discovery
Comparison
Recommendation
Transactional
Technical
Integration
```

Calculate metrics separately.

Example:

```text
Discovery:      61%
Comparison:     48%
Recommendation: 35%
Transactional:  19%
Technical:      54%
Integration:    72%
```

This is more actionable than one global number.

---

# 17. AI Visibility Score

A composite score may eventually be useful.

However:

> **Do not create a composite score before validating that customers understand and value the underlying metrics.**

V1 should primarily expose the raw metrics.

If a composite score is introduced later, its formula must be public within the product documentation.

---

# 18. Agent Task Metrics

For agent tasks, measure:

```text
Task success
Task failure
Task abandonment
Steps
Tool calls
Retries
Errors
Time
Pages visited
Network requests
```

---

# 19. Task Success Rate

```text
Task Success Rate =
successful runs
---------------
valid runs
```

Success criteria must be defined before execution.

Example:

```text
Task:
Find annual pricing.

Success:
Correct annual price identified.

Failure:
Wrong price / unable to locate / incorrect interpretation.
```

---

# 20. Partial Success

Some tasks are neither complete success nor complete failure.

Example:

```text
Agent found pricing
but failed to identify annual billing.
```

Support:

```text
success
partial
failure
```

Partial success should not automatically count as success.

---

# 21. Step Efficiency

Measure:

```text
Total agent actions
```

Possible actions:

- navigation;
- click;
- input;
- tool call;
- search;
- API call.

Compare equivalent successful tasks.

Lower steps may indicate better agent usability, but fewer steps are not automatically better if the task quality decreases.

---

# 22. Error Rate

```text
Error Rate =
runs containing relevant errors
-------------------------------
valid runs
```

Classify errors:

```text
navigation
authentication
tool
API
browser
content
agent reasoning
customer environment
unknown
```

---

# 23. Retry Rate

```text
Retry Rate =
runs requiring retries
----------------------
valid runs
```

Retries may indicate:

- unclear interface;
- poor errors;
- missing information;
- agent uncertainty;
- network instability.

Retry rate is diagnostic, not automatically a website-quality score.

---

# 24. Time to Task Completion

Measure:

```text
start timestamp
        ↓
successful completion timestamp
```

Report:

- mean;
- median;
- p90;
- p95 where sample size supports it.

Median is generally more robust to extreme runs.

---

# 25. Agent Journey Metrics

For browser tasks, calculate:

```text
pages visited
domains visited
backtracks
dead ends
failed interactions
successful interactions
```

This helps identify where agents struggle.

---

# 26. Agent Experience Failure Point

A failure should be mapped to the first meaningful blocking point where possible.

Example:

```text
Search
 ↓
Homepage
 ↓
Pricing
 ↓
Signup
 ↓
Authentication ← blocking point
```

This is more useful than simply reporting:

> “Task failed.”

---

# 27. Agent Readiness Metrics

Readiness should be evaluated as individual capabilities.

Initial categories:

```text
Readable
Discoverable
Callable
Interactive
Secure
Payable
```

Each category contains specific checks.

---

# 28. Readiness Check

Every check should return:

```text
check_id
category
status
severity
evidence
recommendation
timestamp
version
```

Status:

```text
pass
partial
fail
not_applicable
unknown
```

---

# 29. Readiness Evidence

Example:

```text
Check:
MCP Server Card

Result:
PASS

Evidence:
[discovered metadata]

Observed:
server name
version
tools
authentication metadata
```

A score without evidence should not be considered trustworthy.

---

# 30. Readiness Score

If introduced, the score should be calculated from versioned checks.

Conceptually:

```text
Readiness Score =
weighted capability results
```

Weights should not be arbitrary.

Possible weighting dimensions:

- agent relevance;
- customer impact;
- security importance;
- standard maturity.

Weights should be versioned.

---

# 31. Standards Maturity

Not every emerging standard deserves equal weight.

Each readiness check should have a maturity field:

```text
experimental
emerging
adopted
mature
```

This prevents an experimental standard from disproportionately affecting a customer's score.

---

# 32. Confidence

Every derived finding should have confidence metadata.

Example:

```text
High
Medium
Low
```

Confidence should reflect:

- sample size;
- evaluator certainty;
- evidence quality;
- ambiguity;
- repeatability.

It should not simply be an LLM-generated confidence score.

---

# 33. Sample Size

A single run is not enough to establish a stable behavioral metric.

The system should display:

```text
n = number of valid runs
```

Example:

```text
Recommendation Rate
42%
n = 100
```

---

# 34. Valid Runs

Not every execution should enter the denominator.

Invalid runs may include:

- provider outage;
- sandbox failure;
- customer environment unavailable;
- malformed experiment;
- unsupported agent failure.

However:

> Invalid-run filtering must be explicit and auditable.

Do not silently remove unfavorable results.

---

# 35. Run Exclusion

Every excluded run should have:

```text
run_id
exclusion_reason
excluded_by
timestamp
```

The dashboard should allow inspection of exclusions.

---

# 36. Repeated Measurements

Because AI systems are nondeterministic:

```text
same query
same configuration
multiple runs
```

should be supported.

Example:

```text
Query A
 ├── Run 1
 ├── Run 2
 ├── Run 3
 ├── ...
 └── Run 50
```

---

# 37. Randomization

Where experiments compare conditions, randomization may reduce systematic bias.

Example:

```text
Control
Treatment
```

Runs can be randomized across execution order when appropriate.

This is especially useful when provider behavior or external web conditions change over time.

---

# 38. Control and Treatment

Optimization experiments should use:

```text
Control:
Existing website/interface

Treatment:
Modified website/interface
```

Then compare equivalent query/task sets.

---

# 39. Before/After Testing

Simple before/after testing is useful but weaker than controlled experiments.

Example:

```text
Before: 31%
After: 49%
```

This shows correlation with the intervention, not necessarily causation.

Reports should say:

> “Observed improvement after the change.”

Not:

> “The change caused the improvement.”

unless the methodology supports causal attribution.

---

# 40. Experiment Effect

For a metric:

```text
Absolute change =
Treatment - Control
```

Example:

```text
49% - 31% = +18 percentage points
```

Also report relative change when useful:

```text
(49 - 31) / 31 = +58.1%
```

Always label percentage points vs percent change.

---

# 41. Statistical Testing

The exact statistical methodology will depend on the metric.

Potential methods:

### Binary outcomes

- confidence intervals for proportions;
- two-proportion tests;
- Bayesian alternatives where justified.

### Continuous outcomes

- bootstrap confidence intervals;
- non-parametric comparisons;
- parametric methods when assumptions hold.

### Paired runs

Use paired methods when the same query/task is evaluated under both conditions.

The implementation should select methods based on experiment design rather than applying one test everywhere.

---

# 42. Confidence Intervals

For major metrics, report uncertainty when sample size supports it.

Example:

```text
Recommendation rate:
42%

95% CI:
33%–51%

n = 100
```

The UI should avoid false precision.

Do not display:

```text
42.173%
```

when the experiment does not justify that level of precision.

---

# 43. Bootstrap Analysis

Bootstrap methods may be useful for metrics such as:

- average position;
- task completion time;
- step counts;
- composite metrics.

Use them when the underlying distribution is non-normal or complex.

---

# 44. Multiple Comparisons

Large query sets may create many statistical comparisons.

If testing many hypotheses simultaneously, control false discovery where appropriate.

Potential methods:

- Benjamini-Hochberg;
- family-wise error control;
- hierarchical testing.

The choice should depend on the experiment design.

---

# 45. Time-Based Drift

AI behavior changes over time.

Therefore historical metrics must include:

```text
measurement timestamp
model/provider version
query version
website version
```

A drop in visibility may be caused by:

- model change;
- search index change;
- competitor change;
- website change;
- customer change.

The system should avoid assuming the customer's website caused every change.

---

# 46. Environment Metadata

Every benchmark should capture:

```text
AI provider
model
model version if available
agent version
browser version
sandbox image
region if relevant
prompt version
query version
website revision
evaluator version
```

This is necessary for reproducibility.

---

# 47. Benchmark Definition

A benchmark is a fixed methodology designed to compare performance.

Example:

```text
Benchmark:
Payment Provider Discovery v1

Queries:
100

Providers:
3

Agents:
2

Repetitions:
10

Metrics:
recommendation
citation
task success
latency
```

---

# 48. Benchmark Versioning

Benchmarks must be immutable once published.

Example:

```text
payment-discovery-v1
payment-discovery-v2
```

If the query set or evaluator changes substantially, create a new version.

---

# 49. Agent Benchmark

Compare agents on equivalent tasks.

Example:

```text
                  Agent A   Agent B
Task Success        82%       76%
Median Steps          9        13
Median Time         31s       45s
Error Rate           8%       14%
```

Do not interpret one metric in isolation.

---

# 50. Model Benchmark

Similarly:

```text
Model A
Model B
Model C
```

under the same:

- queries;
- environment;
- task;
- evaluator.

Model/provider differences must be clearly labeled.

---

# 51. Website Benchmark

Eventually compare customer implementations against an internal benchmark.

Possible dimensions:

```text
AI visibility
agent task success
agent steps
readiness
documentation
tool usability
```

Avoid ranking websites purely from one aggregate score.

---

# 52. MCP / SDK Benchmark

Future benchmark:

```text
Tool discovery
Tool selection
Argument accuracy
Execution success
Error recovery
Task completion
```

Example:

```text
MCP Tool Success = 91%
Wrong Tool Selection = 7%
Argument Error = 5%
```

This becomes important for developer-focused customers.

---

# 53. WebMCP Benchmark

Compare:

```text
Traditional browser interaction
vs
WebMCP interaction
```

Measure:

- task success;
- steps;
- latency;
- errors;
- tool calls;
- recovery.

The purpose is to determine whether structured interfaces materially improve agent performance.

---

# 54. Evaluator Architecture

Evaluators should be pluggable.

```text
Evaluator
├── id
├── version
├── input schema
├── output schema
├── evaluate()
└── evidence requirements
```

Examples:

```text
MentionEvaluator
RecommendationEvaluator
CitationEvaluator
CompetitorEvaluator
TaskSuccessEvaluator
ReadinessEvaluator
EfficiencyEvaluator
```

---

# 55. Deterministic vs LLM Evaluators

Prefer deterministic evaluation when possible.

Examples:

- URL detection;
- exact company name;
- HTTP status;
- task completion condition;
- tool call;
- schema validation.

Use LLM-assisted evaluation when interpretation is required.

Examples:

- whether a recommendation is genuinely favorable;
- semantic comparison;
- intent classification.

LLM evaluator outputs should be validated and versioned.

---

# 56. LLM Evaluator Guardrails

When using an LLM evaluator:

- provide explicit rubric;
- provide evidence;
- require structured output;
- record evaluator model/version;
- test against labeled fixtures;
- measure evaluator agreement;
- monitor evaluator drift.

Do not let an LLM evaluator become an opaque source of truth.

---

# 57. Human Validation

During early product development, maintain a human validation set.

Example:

```text
100 responses
Human labels
      ↓
Compare automated evaluator
```

Measure:

```text
precision
recall
F1
agreement
```

for applicable classification tasks.

---

# 58. Evaluation Regression Suite

Maintain fixed examples.

Every evaluator change must run against:

```text
Known positive
Known negative
Ambiguous
Edge cases
Competitor mentions
Indirect references
```

This prevents evaluator regressions.

---

# 59. Adversarial Evaluation

Test cases should include:

- company aliases;
- abbreviations;
- misspellings;
- competitor comparisons;
- negative mentions;
- neutral mentions;
- quoted text;
- sarcasm where relevant;
- multiple companies in one response.

This is especially important for recommendation detection.

---

# 60. Recommendation Classification

A recommendation evaluator should distinguish:

```text
positive recommendation
neutral mention
negative mention
comparison only
conditional recommendation
unclear
```

Example:

> “Stripe is popular, but for your requirements I would choose Adyen.”

Stripe mention ≠ Stripe recommendation.

---

# 61. Citation Classification

Distinguish:

```text
official source
third-party source
competitor source
search result
social/community source
unknown
```

This allows the diagnosis engine to reason about source ecosystems.

---

# 62. Evidence Provenance

Every metric should be traceable:

```text
Metric
 ↓
Evaluations
 ↓
Runs
 ↓
Observations
 ↓
Raw artifact
```

A customer should be able to drill from:

> “Recommendation rate = 42%”

to the actual response that produced the result.

---

# 63. Reproducibility

A run should ideally be replayable with:

```text
same prompt
same query
same agent version
same environment
same evaluator version
```

Perfect reproduction is not always possible because external AI/web systems change.

Therefore the platform should distinguish:

```text
exact replay
controlled rerun
historical comparison
```

---

# 64. External Web Volatility

Web results can change between runs.

Record:

- timestamp;
- source URLs;
- response metadata;
- screenshots where appropriate;
- page snapshots where legally appropriate.

This allows us to understand changes that are external to the customer.

---

# 65. AI Provider Volatility

Provider/model behavior may change without a visible model-version change.

Therefore trend reports should say:

> “Observed behavior changed between measurements.”

rather than assuming a specific model update caused it.

---

# 66. Scorecard Structure

Customer scorecards should have:

```text
Executive Summary

AI Visibility
├── Mention
├── Recommendation
├── Position
└── Competitors

Sources
├── Citations
├── Source distribution
└── Missing sources

Agent Experience
├── Task success
├── Failure points
├── Steps
└── Errors

Agent Readiness
├── Readable
├── Discoverable
├── Callable
├── Interactive
├── Secure
└── Payable

Recommendations
└── Prioritized actions
```

---

# 67. Recommended V1 Metrics

Do not expose everything.

V1 should focus on:

```text
Recommendation Rate
Mention Rate
Competitor Recommendation Rate
Recommendation Position
Citation Rate
Top Sources
Query-Level Results
```

These directly support the initial commercial proposition.

---

# 68. Recommended V2 Metrics

Add:

```text
Task Success
Failure Point
Steps
Retries
Errors
Latency
Agent Journey
```

---

# 69. Recommended V3 Metrics

Add:

```text
Experiment Effect
Confidence Interval
Baseline vs Treatment
Drift
Readiness
Optimization Impact
```

---

# 70. Recommended V4 Metrics

Add:

```text
MCP Discovery
Tool Selection
Tool Success
Argument Accuracy
SDK Code Success
Build Success
WebMCP Task Improvement
```

---

# 71. Customer-Facing Language

Avoid overly technical claims.

Instead of:

> “Your semantic discoverability coefficient is 0.41.”

Prefer:

> “AI recommends your product in 41% of relevant queries.”

Instead of:

> “Your agent execution entropy is high.”

Prefer:

> “Agents require 2.4× more steps to complete this task.”

---

# 72. Evidence-First Recommendations

Every recommendation should contain:

```text
Problem
Evidence
Impact
Confidence
Suggested action
Expected outcome
```

Example:

```text
Problem:
Agents frequently fail to find pricing.

Evidence:
7/20 tasks failed at pricing discovery.

Impact:
High

Confidence:
High

Action:
Improve pricing page discoverability and structured information.

Expected outcome:
Retest required.
```

Do not promise an outcome before testing it.

---

# 73. Causal Claims Policy

The platform should classify claims:

### Observed

Directly measured.

### Correlated

Variables changed together.

### Supported causal

Experiment design provides evidence for causality.

### Hypothesis

Plausible explanation requiring testing.

This terminology should appear in internal evaluation logic.

---

# 74. Evaluation Data Retention

Store:

```text
Raw observation
Normalized event
Evaluation
Aggregate metric
```

Raw artifacts can have shorter retention.

Aggregated results can be retained longer.

Retention should be configurable.

---

# 75. Evaluation Security

Evaluation data can contain:

- customer content;
- private URLs;
- credentials metadata;
- source code;
- agent outputs.

Access should follow tenant permissions.

Evaluator workers should receive only the data required for their task.

---

# 76. Minimum V0 Evaluation

The first implementation only needs:

```text
Task Success
Source Count
URLs Visited
Errors
Run Duration
```

This proves the evaluation pipeline.

---

# 77. Minimum V1 Evaluation

Add:

```text
Mention
Recommendation
Competitor
Citation
Source
Position
```

This proves the commercial AI visibility product.

---

# 78. Minimum V2 Evaluation

Add:

```text
Task Success
Partial Success
Failure Point
Steps
Retries
Errors
Latency
```

This proves agent experience analytics.

---

# 79. Minimum V3 Evaluation

Add:

```text
Control
Treatment
Effect
Confidence Interval
Drift
```

This proves optimization experimentation.

---

# 80. Minimum V4 Evaluation

Add:

```text
MCP discovery
Tool selection
Tool execution
SDK implementation
WebMCP comparison
```

This proves agent-interface optimization.

---

# 81. Evaluation Roadmap

```text
V0
Basic execution evaluation

      ↓

V1
AI visibility evaluation

      ↓

V1.5
Competitive diagnosis

      ↓

V2
Agent behavior evaluation

      ↓

V2.5
Readiness evaluation

      ↓

V3
Statistical experimentation

      ↓

V4
MCP / SDK / WebMCP evaluation

      ↓

V5
Continuous benchmarking
```

---

# 82. Final Evaluation Principle

The platform's credibility depends on one rule:

> **Every important number should answer three questions:**

```text
What exactly was measured?
How was it measured?
What evidence supports it?
```

If we cannot answer those questions, the number should not be presented as a reliable product metric.

---

# 83. Immediate Implementation

The first evaluator stack should therefore be:

```text
Run
 ↓
Raw Observation
 ↓
Normalized Event
 ↓
MentionEvaluator
 ↓
RecommendationEvaluator
 ↓
CompetitorEvaluator
 ↓
CitationEvaluator
 ↓
SourceEvaluator
 ↓
Aggregate
 ↓
Evidence-backed Report
```

This is the evaluation foundation for the rest of the platform.
