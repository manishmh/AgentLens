import {
  EventSource,
  EventType,
  type EvaluationResult,
  type RunManifest,
  type Task,
} from "@agentlens/event-schema";
import { ObservationEngine, EventPipeline } from "@agentlens/observation";
import type { CollectedArtifact, SandboxProvider, SandboxSpec } from "@agentlens/sandbox";
import type { AgentRuntime } from "@agentlens/agent-runtime";
import type { Evaluator } from "@agentlens/evaluation";
import {
  ExecutionStatus,
  FailureCategory,
  RunStatus,
  newAgentId,
  newRunId,
  newSessionId,
} from "@agentlens/shared";
import { buildArtifactIndex, persistRun } from "./persist";

export interface RunConfig {
  organizationId: string;
  projectId: string;
  experimentId?: string;
  task: Task;
  target?: string;
  competitors?: string[];
  provider: SandboxProvider;
  agent: AgentRuntime;
  evaluator?: Evaluator;
  sandboxSpec?: SandboxSpec;
  /** Root dir for run output (run.json + artifacts). Defaults to `.artifacts`. */
  outputRoot?: string;
}

export interface RunOutcome {
  manifest: RunManifest;
  outputDir: string;
}

class RunTimeoutError extends Error {
  constructor(timeoutMs: number) {
    super(`Execution exceeded ${timeoutMs}ms timeout`);
    this.name = "RunTimeoutError";
  }
}

function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number | undefined,
  onTimeout: (err: RunTimeoutError) => void,
): Promise<T> {
  if (!timeoutMs) return promise;
  return new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => {
      const err = new RunTimeoutError(timeoutMs);
      onTimeout(err);
      reject(err);
    }, timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (err: unknown) => {
        clearTimeout(timer);
        reject(err);
      },
    );
  });
}

/**
 * Execute one run end-to-end (docs/07 §70, docs/10 §13):
 *   create sandbox → start agent → execute task → collect artifacts → evaluate →
 *   stop agent → destroy sandbox → persist run.json.
 *
 * Execution status and observation status are tracked independently (docs/10 §16), so a
 * run that executed but was poorly observed is not reported as fully observed.
 */
export async function executeRun(config: RunConfig): Promise<RunOutcome> {
  const runId = newRunId();
  const sessionId = newSessionId();
  const agentId = newAgentId();
  const outputRoot = config.outputRoot ?? ".artifacts";
  const meta = config.agent.metadata();
  const createdAt = new Date().toISOString();
  const startedMs = performance.now();

  const observation = new ObservationEngine({
    organizationId: config.organizationId,
    projectId: config.projectId,
    experimentId: config.experimentId,
    runId,
    sessionId,
    agentId,
  });

  observation.record({
    source: EventSource.Run,
    type: EventType.RunStarted,
    payload: { taskId: config.task.taskId, taskTitle: config.task.title },
  });

  const sandbox = await config.provider.create(config.sandboxSpec);

  let executionStatus: string = ExecutionStatus.Success;
  let failureCategory: string | undefined;
  let collected: CollectedArtifact[] = [];

  try {
    await config.agent.start();
    const abortController = new AbortController();
    const execResult = await withTimeout(
      config.agent.execute({
        task: config.task,
        observation,
        sandbox,
        signal: abortController.signal,
      }),
      config.sandboxSpec?.limits?.wallClockTimeoutMs,
      (err) => abortController.abort(err),
    );
    if (!execResult.ok) {
      executionStatus = ExecutionStatus.Failed;
      failureCategory = execResult.failureCategory ?? FailureCategory.Agent;
    }
  } catch (err) {
    const timedOut = err instanceof Error && err.message.includes("timeout");
    executionStatus = timedOut ? ExecutionStatus.Timeout : ExecutionStatus.Failed;
    failureCategory = timedOut ? FailureCategory.Sandbox : FailureCategory.Agent;
    observation.record({
      source: EventSource.Agent,
      type: EventType.BrowserError,
      payload: { message: err instanceof Error ? err.message : String(err) },
    });
  } finally {
    await config.agent.stop().catch(() => undefined);
  }

  // Collect evidence artifacts BEFORE the sandbox is destroyed.
  try {
    collected = await sandbox.collectArtifacts(".");
  } catch {
    collected = [];
  }

  const observationSummary = observation.summary();
  const durationMs = performance.now() - startedMs;

  observation.record({
    source: EventSource.Run,
    type: EventType.RunFinished,
    payload: {
      executionStatus,
      observationStatus: observationSummary.status,
      // evaluationStatus is determined later
      evaluationStatus: "skipped",
      durationMs,
    },
  });

  await sandbox.destroy().catch(() => undefined);

  const pipeline = new EventPipeline();
  // Pipeline ensures validation, redaction, and chronological ordering.
  pipeline.ingest(observation.events());
  
  // Combine artifact metadata from events with the physical collected buffers
  const artifacts = buildArtifactIndex(Array.from(pipeline.artifacts()), collected);

  const runStatus =
    executionStatus === ExecutionStatus.Success ? RunStatus.Completed : RunStatus.Failed;

  const manifest = pipeline.reconstruct({
    schemaVersion: "1",
    metadata: {
      runId,
      organizationId: config.organizationId,
      projectId: config.projectId,
      experimentId: config.experimentId,
      sessionId,
      createdAt,
      finishedAt: new Date().toISOString(),
      durationMs,
      status: runStatus,
      executionStatus,
      observationStatus: observationSummary.status,
      evaluationStatus: "skipped", // placeholder
      failureCategory,
      visibility: "customer_sensitive",
    },
    task: config.task,
    environment: {
      agentRuntime: meta.runtime,
      agentRuntimeVersion: meta.version,
      model: meta.model,
      sandboxProvider: config.provider.name,
      sandboxImage: config.sandboxSpec?.image,
      taskVersion: config.task.version,
      locale: Intl.DateTimeFormat().resolvedOptions().locale,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      networkPolicy: JSON.stringify(config.sandboxSpec?.network ?? { mode: "internet" }),
      experimentConfig: config.competitors ? { competitors: config.competitors } : undefined,
    },
    agent: {
      agentId,
      provider: meta.provider,
      runtime: meta.runtime,
      model: meta.model,
      version: meta.version,
    },
    browser: undefined,
    observation: observationSummary,
    artifacts,
    findings: [],
  });

  // Evaluate over the fully reconstructed RunManifest
  let evaluation: EvaluationResult | undefined;
  if (config.evaluator) {
    try {
      evaluation = await config.evaluator.evaluate({
        run: manifest,
        task: config.task,
        successCriteria: config.task.successCriteria,
      });
      manifest.evaluation = evaluation;
      manifest.metadata.evaluationStatus = evaluation.status;
      // We do not inject an EvaluationCompleted event into the already reconstructed 
      // manifest events array, as that would bypass pipeline validation.
    } catch {
      manifest.metadata.evaluationStatus = "failed";
    }
  }

  const outputDir = await persistRun(outputRoot, manifest, collected);
  return { manifest, outputDir };
}
