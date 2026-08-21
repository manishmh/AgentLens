import { randomUUID } from "node:crypto";

/** Nominal ("branded") string type so ids of different kinds are not interchangeable. */
export type Brand<T, B extends string> = T & { readonly __brand: B };

export type OrganizationId = Brand<string, "OrganizationId">;
export type ProjectId = Brand<string, "ProjectId">;
export type ExperimentId = Brand<string, "ExperimentId">;
export type RunId = Brand<string, "RunId">;
export type SessionId = Brand<string, "SessionId">;
export type AgentId = Brand<string, "AgentId">;
export type EventId = Brand<string, "EventId">;
export type FindingId = Brand<string, "FindingId">;
export type ArtifactId = Brand<string, "ArtifactId">;

const mint =
  <B extends string>(prefix: string) =>
  (): Brand<string, B> =>
    `${prefix}_${randomUUID()}` as Brand<string, B>;

export const newOrganizationId = mint<"OrganizationId">("org");
export const newProjectId = mint<"ProjectId">("proj");
export const newExperimentId = mint<"ExperimentId">("exp");
export const newRunId = mint<"RunId">("run");
export const newSessionId = mint<"SessionId">("sess");
export const newAgentId = mint<"AgentId">("agent");
export const newEventId = mint<"EventId">("evt");
export const newFindingId = mint<"FindingId">("find");
export const newArtifactId = mint<"ArtifactId">("art");
