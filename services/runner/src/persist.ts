import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import type { ArtifactRef, CanonicalEvent, RunManifest } from "@agentlens/event-schema";
import type { CollectedArtifact } from "@agentlens/sandbox";

function sha256(bytes: Uint8Array): string {
  return createHash("sha256").update(bytes).digest("hex");
}

/** Extract artifact references embedded in screenshot / page.snapshot events. */
export function artifactRefsFromEvents(events: readonly CanonicalEvent[]): ArtifactRef[] {
  const refs: ArtifactRef[] = [];
  for (const e of events) {
    const artifact = (e.payload as { artifact?: ArtifactRef }).artifact;
    if (artifact && artifact.artifactId) refs.push(artifact);
  }
  return refs;
}

/**
 * Build the run-level artifact index, matching event-referenced artifacts to the files
 * actually collected from the sandbox and enriching them with size + content hash.
 */
export function buildArtifactIndex(
  refs: ArtifactRef[],
  collected: CollectedArtifact[],
): ArtifactRef[] {
  const byPath = new Map(collected.map((c) => [c.path, c]));
  return refs.map((ref) => {
    const file = ref.path ? byPath.get(ref.path) : undefined;
    if (!file) return ref;
    return { ...ref, sizeBytes: file.sizeBytes, sha256: sha256(file.content) };
  });
}

/**
 * Persist a run to the local filesystem (Milestone 0 storage — object storage arrives
 * in Milestone 4). Produces the docs/10 §11 output layout:
 *   <outputRoot>/<runId>/run.json
 *   <outputRoot>/<runId>/screenshots/...
 *   <outputRoot>/<runId>/artifacts/...
 */
export async function persistRun(
  outputRoot: string,
  manifest: RunManifest,
  collected: CollectedArtifact[],
): Promise<string> {
  const outputDir = join(outputRoot, manifest.metadata.runId);
  await mkdir(outputDir, { recursive: true });

  for (const file of collected) {
    const dest = join(outputDir, file.path);
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, file.content);
  }

  await writeFile(join(outputDir, "run.json"), JSON.stringify(manifest, null, 2), "utf8");
  return outputDir;
}
