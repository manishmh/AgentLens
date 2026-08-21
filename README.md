# AgentLens

**AI Agent Experience Intelligence** — a testing and intelligence platform that measures
how AI agents experience a company's digital product.

AgentLens runs controlled AI-agent experiments inside infrastructure we control and
observes how an agent discovers, researches, evaluates, and interacts with a product,
then turns that execution into structured, evidence-backed findings.

> V1 implements **Mode A — External Agent Simulation**. Mode B (customer instrumentation
> via SDK/MCP/OpenTelemetry) is a future capability; the canonical event model is designed
> so both modes eventually feed the same pipeline. See `docs/` for the full specification.

## Pipeline

```
Agent → Sandbox → Browser + Tools → Observation → Canonical Events → Evaluation → Evidence-backed Finding
```

## Monorepo layout

```
packages/
  shared          Ids, run/observation/evaluation statuses, env config
  event-schema    Canonical event model + Run manifest (Zod) — the shared contract
  observation     ObservationEngine: sequencing, ordering, Observation Completeness
  sandbox         SandboxProvider interface + LocalSandboxProvider (dev/test)
  browser         BrowserProvider interface (Playwright/CDP impl: Milestone 2)
  agent-runtime   AgentRuntime interface + SyntheticAgentRuntime (pipeline fixture)
  evaluation      Evaluator interface + deterministic RuleEvaluator
services/
  runner          Orchestrator: create → execute → observe → evaluate → persist run.json
apps/
  web             Dashboard placeholder (Milestone 9, not yet built)
infra/            Local dev dependencies (Postgres/Redis/MinIO) — not yet wired
docs/             Product & technical specification (authoritative)
```

## Status — Milestone 0

The repository foundation, the canonical event schema, the provider/runtime interface
contracts, and an end-to-end **synthetic** run are in place. The synthetic agent proves the
observation/evidence pipeline (run.json is fully reconstructable) **without** external
services. The locked V1 providers — Vercel Sandbox, Vercel AI SDK 7, Chromium/Playwright +
CDP, PostgreSQL/Prisma, Redis/BullMQ, S3 — are introduced in later milestones behind the
interfaces established here.

## Getting started

```bash
pnpm install
pnpm run runner:demo            # runs the synthetic pipeline → .artifacts/<runId>/run.json
pnpm run check                  # format:check + lint + typecheck + test
```

Requires Node.js 22+ and pnpm 9. See `docs/10-v1-implementation-plan.md` for the build plan.
