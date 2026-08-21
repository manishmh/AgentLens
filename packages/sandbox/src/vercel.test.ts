import { beforeEach, describe, expect, it, vi } from "vitest";
import { SandboxUnsupportedFeatureError } from "./types";
import { toVercelNetworkPolicy, VercelSandboxProvider, vercelSandboxCapabilities } from "./vercel";

const sdkMock = vi.hoisted(() => ({
  create: vi.fn(),
}));

vi.mock("@vercel/sandbox", () => ({
  Sandbox: {
    create: sdkMock.create,
  },
}));

function dirent(name: string, type: "file" | "directory") {
  return {
    name,
    isDirectory: () => type === "directory",
    isFile: () => type === "file",
  };
}

function createFakeVercelSandbox() {
  const files = new Map<string, Buffer>();
  files.set("/vercel/sandbox/artifacts/a.txt", Buffer.from("a"));
  files.set("/vercel/sandbox/artifacts/nested/b.txt", Buffer.from("bb"));

  return {
    name: "agentlens-test-sandbox",
    cwd: "/vercel/sandbox",
    writeFiles: vi.fn(async (written: { path: string; content: string | Uint8Array }[]) => {
      for (const file of written) {
        files.set(
          file.path,
          typeof file.content === "string" ? Buffer.from(file.content) : Buffer.from(file.content),
        );
      }
    }),
    readFileToBuffer: vi.fn(async ({ path }: { path: string }) => files.get(path) ?? null),
    runCommand: vi.fn(async () => ({
      exitCode: 0,
      durationMs: 7,
      stdout: async () => "ok\n",
      stderr: async () => "",
    })),
    fs: {
      readdir: vi.fn(async (path: string) => {
        if (path === "/vercel/sandbox/artifacts") {
          return [dirent("a.txt", "file"), dirent("nested", "directory")];
        }
        if (path === "/vercel/sandbox/artifacts/nested") {
          return [dirent("b.txt", "file")];
        }
        throw new Error(`missing directory: ${path}`);
      }),
    },
    stop: vi.fn(async () => undefined),
    delete: vi.fn(async () => undefined),
  };
}

describe("VercelSandboxProvider", () => {
  beforeEach(() => {
    sdkMock.create.mockReset();
    sdkMock.create.mockResolvedValue(createFakeVercelSandbox());
  });

  it("declares the isolation and policy capabilities Vercel Sandbox can honor", () => {
    const provider = new VercelSandboxProvider();

    expect(provider.capabilities).toEqual(vercelSandboxCapabilities);
    expect(provider.capabilities.processIsolation).toBe(true);
    expect(provider.capabilities.filesystemIsolation).toBe(true);
    expect(provider.capabilities.networkPolicy.none).toBe(true);
    expect(provider.capabilities.networkPolicy.allowlist).toBe(true);
  });

  it("maps AgentLens network policies to Vercel Sandbox network policies", () => {
    expect(toVercelNetworkPolicy(undefined)).toBe("allow-all");
    expect(toVercelNetworkPolicy({ mode: "internet" })).toBe("allow-all");
    expect(toVercelNetworkPolicy({ mode: "none" })).toBe("deny-all");
    expect(toVercelNetworkPolicy({ mode: "allowlist", domains: [] })).toBe("deny-all");
    expect(toVercelNetworkPolicy({ mode: "allowlist", domains: ["example.com"] })).toEqual({
      allow: ["example.com"],
    });
  });

  it("rejects domain denylist policies instead of weakening them", () => {
    expect(() =>
      toVercelNetworkPolicy({ mode: "denylist", domains: ["tracking.example"] }),
    ).toThrow(SandboxUnsupportedFeatureError);
  });

  it("passes supported policy, timeout, and lifecycle options to Vercel Sandbox", async () => {
    const provider = new VercelSandboxProvider({
      credentials: {
        token: "token",
        teamId: "team",
        projectId: "project",
      },
      namePrefix: "agentlens-test",
      defaultRuntime: "node22",
      deleteOnDestroy: true,
    });

    const sandbox = await provider.create({
      limits: { wallClockTimeoutMs: 1_234 },
      network: { mode: "allowlist", domains: ["example.com"] },
      env: { NON_SECRET: "value" },
      labels: { a: "1", b: "2", c: "3", d: "4", e: "5", f: "6" },
    });

    expect(sdkMock.create).toHaveBeenCalledWith({
      token: "token",
      teamId: "team",
      projectId: "project",
      name: expect.stringMatching(/^agentlens-test-/),
      timeout: 1_234,
      networkPolicy: { allow: ["example.com"] },
      env: { NON_SECRET: "value" },
      tags: { a: "1", b: "2", c: "3", d: "4", e: "5" },
      persistent: false,
      region: undefined,
      failoverRegions: undefined,
      runtime: "node22",
    });

    const vercelSandbox = await sdkMock.create.mock.results[0]?.value;
    await sandbox.destroy();

    expect(vercelSandbox.stop).toHaveBeenCalledOnce();
    expect(vercelSandbox.delete).toHaveBeenCalledOnce();
  });

  it("executes commands, collects artifacts, and prevents path escape through the handle", async () => {
    const sandbox = await new VercelSandboxProvider().create({ network: { mode: "none" } });
    await sandbox.writeFile("artifacts/new.txt", "new");

    const read = await sandbox.readFile("artifacts/new.txt");
    const exec = await sandbox.exec("node", ["-e", "console.log('ok')"], {
      cwd: ".",
      env: { A: "B" },
      timeoutMs: 50,
    });
    const artifacts = await sandbox.collectArtifacts("artifacts");

    const vercelSandbox = await sdkMock.create.mock.results[0]?.value;
    expect(vercelSandbox.writeFiles).toHaveBeenCalledWith([
      { path: "/vercel/sandbox/artifacts/new.txt", content: "new" },
    ]);
    expect(new TextDecoder().decode(read)).toBe("new");
    expect(vercelSandbox.runCommand).toHaveBeenCalledWith({
      cmd: "node",
      args: ["-e", "console.log('ok')"],
      cwd: "/vercel/sandbox",
      env: { A: "B" },
      timeoutMs: 50,
    });
    expect(exec).toEqual({
      exitCode: 0,
      stdout: "ok\n",
      stderr: "",
      durationMs: 7,
      timedOut: false,
    });
    expect(artifacts.map((artifact) => [artifact.path, artifact.sizeBytes])).toEqual([
      ["artifacts/a.txt", 1],
      ["artifacts/nested/b.txt", 2],
    ]);
    expect(() => sandbox.resolve("../outside.txt")).toThrow(/escapes sandbox workspace/);
  });

  it("reports Vercel command timeout failures without throwing from exec", async () => {
    const vercelSandbox = createFakeVercelSandbox();
    vercelSandbox.runCommand.mockRejectedValueOnce(new Error("Command timed out"));
    sdkMock.create.mockResolvedValueOnce(vercelSandbox);

    const sandbox = await new VercelSandboxProvider().create();
    const result = await sandbox.exec("sleep", ["10"], { timeoutMs: 20 });

    expect(result.exitCode).toBe(-1);
    expect(result.timedOut).toBe(true);
    expect(result.stderr).toMatch(/timed out/);
  });

  it("rejects unsupported resource policies before provisioning", async () => {
    const provider = new VercelSandboxProvider();

    await expect(provider.create({ limits: { maxMemoryMb: 512 } })).rejects.toBeInstanceOf(
      SandboxUnsupportedFeatureError,
    );
    await expect(provider.create({ limits: { maxProcesses: 8 } })).rejects.toBeInstanceOf(
      SandboxUnsupportedFeatureError,
    );
    await expect(provider.create({ limits: { maxDiskMb: 1_024 } })).rejects.toBeInstanceOf(
      SandboxUnsupportedFeatureError,
    );
    await expect(
      provider.create({ network: { mode: "denylist", domains: ["example.com"] } }),
    ).rejects.toBeInstanceOf(SandboxUnsupportedFeatureError);
    expect(sdkMock.create).not.toHaveBeenCalled();
  });
});
