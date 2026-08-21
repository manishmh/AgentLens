import { stat } from "node:fs/promises";
import { describe, expect, it } from "vitest";
import { LocalSandboxProvider } from "./local";
import { SandboxUnsupportedFeatureError } from "./types";

describe("LocalSandboxProvider", () => {
  it("times out commands using the configured exec timeout", async () => {
    const sandbox = await new LocalSandboxProvider().create();
    try {
      const result = await sandbox.exec(
        process.execPath,
        ["-e", "setTimeout(() => undefined, 1_000)"],
        { timeoutMs: 20 },
      );

      expect(result.timedOut).toBe(true);
      expect(result.exitCode).not.toBe(0);
    } finally {
      await sandbox.destroy().catch(() => undefined);
    }
  });

  it("collects artifacts recursively from the workspace", async () => {
    const sandbox = await new LocalSandboxProvider().create();
    try {
      await sandbox.writeFile("artifacts/a.txt", "a");
      await sandbox.writeFile("artifacts/nested/b.txt", "bb");

      const artifacts = await sandbox.collectArtifacts("artifacts");
      expect(artifacts.map((artifact) => artifact.path).sort()).toEqual([
        "artifacts/a.txt",
        "artifacts/nested/b.txt",
      ]);
      expect(artifacts.map((artifact) => artifact.sizeBytes).sort()).toEqual([1, 2]);
    } finally {
      await sandbox.destroy().catch(() => undefined);
    }
  });

  it("prevents workspace path escapes", async () => {
    const sandbox = await new LocalSandboxProvider().create();
    try {
      expect(() => sandbox.resolve("../outside.txt")).toThrow(/escapes sandbox workspace/);
      await expect(stat(sandbox.resolve("."))).resolves.toBeTruthy();
    } finally {
      await sandbox.destroy().catch(() => undefined);
    }
  });

  it("fails closed for network and resource policies it cannot enforce", async () => {
    const provider = new LocalSandboxProvider();

    await expect(provider.create({ network: { mode: "none" } })).rejects.toBeInstanceOf(
      SandboxUnsupportedFeatureError,
    );
    await expect(
      provider.create({ network: { mode: "allowlist", domains: ["example.com"] } }),
    ).rejects.toBeInstanceOf(SandboxUnsupportedFeatureError);
    await expect(provider.create({ limits: { maxProcesses: 1 } })).rejects.toBeInstanceOf(
      SandboxUnsupportedFeatureError,
    );
  });
});
