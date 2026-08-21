import { z } from "zod";
import { visibilitySchema } from "./enums";

/**
 * Large artifacts (screenshots, DOM/HTML snapshots, HAR captures, transcripts) are
 * stored OUTSIDE the event stream (docs/07 §38). Events reference them by pointer so
 * the event store stays small and artifacts get their own retention/redaction policy.
 */
export const artifactKindSchema = z.enum([
  "screenshot",
  "dom_snapshot",
  "html_snapshot",
  "network_capture",
  "transcript",
  "log",
  "report",
  "other",
]);
export type ArtifactKind = z.infer<typeof artifactKindSchema>;

export const artifactRefSchema = z.object({
  artifactId: z.string(),
  kind: artifactKindSchema,
  /** Relative path within the run's artifact directory (Mode-A local storage). */
  path: z.string().optional(),
  /** Object-storage URI, once artifacts move to S3-compatible storage (Milestone 4). */
  uri: z.string().optional(),
  contentType: z.string().optional(),
  sizeBytes: z.number().int().nonnegative().optional(),
  sha256: z.string().optional(),
  visibility: visibilitySchema.default("internal"),
});
export type ArtifactRef = z.infer<typeof artifactRefSchema>;
