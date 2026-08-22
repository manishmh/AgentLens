import { describe, expect, it } from "vitest";
import { createServer, type Server } from "node:http";
import { PlaywrightBrowserProvider } from "./playwright";
import { ObservationEngine } from "@agentlens/observation";
import { LocalSandboxProvider } from "@agentlens/sandbox";
import type { EventContext } from "@agentlens/event-schema";

const mockContext: EventContext = {
  organizationId: "org-123",
  projectId: "proj-123",
  runId: "run-123",
  agentId: "agent-123",
  sessionId: "session-123",
};

describe("PlaywrightBrowserProvider", () => {
  it("launches a browser and records basic events", async () => {
    const sandboxProvider = new LocalSandboxProvider();
    const sandbox = await sandboxProvider.create();

    try {
      const observation = new ObservationEngine(mockContext);
      const provider = new PlaywrightBrowserProvider(observation, sandbox);

      const session = await provider.launch({ headless: true });

      try {
        await session.navigate("about:blank");
        const url = session.url();
        expect(url).toBe("about:blank");

        await session.content();
        await session.screenshot();
      } finally {
        await session.close();
      }

      const events = observation.events();
      const types = events.map((e) => e.type);
      if (observation.dropped().length > 0) {
        throw new Error("Events dropped: " + JSON.stringify(observation.dropped(), null, 2));
      }

      expect(types).toContain("browser.started");
      expect(types).toContain("browser.navigation");
      expect(types).toContain("page.snapshot");
      expect(types).toContain("screenshot");
    } finally {
      await sandbox.destroy();
    }
  });

  it("observes real CDP network events (success, redirect, error)", async () => {
    let server: Server;
    const port = 39871;
    await new Promise<void>((resolve) => {
      server = createServer((req, res) => {
        if (req.url === "/redirect") {
          res.writeHead(302, { Location: "/success" });
          res.end();
        } else if (req.url === "/success") {
          res.writeHead(200, { "Content-Type": "text/html" });
          res.end("<h1>Success</h1>");
        } else {
          // close connection to simulate network error
          req.socket.destroy();
        }
      }).listen(port, resolve);
    });

    const sandboxProvider = new LocalSandboxProvider();
    const sandbox = await sandboxProvider.create();

    try {
      const observation = new ObservationEngine(mockContext);
      const provider = new PlaywrightBrowserProvider(observation, sandbox);
      const session = await provider.launch({ headless: true });

      try {
        await session.navigate(`http://127.0.0.1:${port}/redirect`);

        try {
          await session.navigate(`http://127.0.0.1:${port}/fail`);
        } catch {
          // Expected navigation failure
        }
      } finally {
        await session.close();
      }

      const events = observation.events();
      const networkEvents = events.filter((e) => e.type.startsWith("network."));

      // We should have requests for /redirect, /success, and /fail
      const requestEvents = networkEvents.filter((e) => e.type === "network.request") as Array<{
        type: string;
        payload: { url: string; requestId: string };
      }>;
      const urls = requestEvents.map((e) => e.payload.url);
      expect(urls).toContain(`http://127.0.0.1:${port}/redirect`);
      expect(urls).toContain(`http://127.0.0.1:${port}/success`);
      expect(urls).toContain(`http://127.0.0.1:${port}/fail`);

      const responseEvents = networkEvents.filter((e) => e.type === "network.response") as Array<{
        type: string;
        payload: { url: string; status: number; requestId: string };
      }>;

      // Look for the redirect response (302)
      const redirectResponse = responseEvents.find((e) => e.payload.status === 302);
      expect(redirectResponse).toBeDefined();
      expect(redirectResponse!.payload.url).toBe(`http://127.0.0.1:${port}/redirect`);

      // Look for the success response (200)
      const successResponse = responseEvents.find((e) => e.payload.status === 200);
      expect(successResponse).toBeDefined();
      expect(successResponse!.payload.url).toBe(`http://127.0.0.1:${port}/success`);

      // Look for the failure response (0)
      const failResponse = responseEvents.find((e) => e.payload.status === 0);
      expect(failResponse).toBeDefined();
      expect(failResponse!.payload.url).toBe(`http://127.0.0.1:${port}/fail`);

      // Ensure requestId correlates request and response
      expect(redirectResponse!.payload.requestId).toBe(
        requestEvents.find((r) => r.payload.url.endsWith("/redirect"))?.payload.requestId,
      );
      expect(failResponse!.payload.requestId).toBe(
        requestEvents.find((r) => r.payload.url.endsWith("/fail"))?.payload.requestId,
      );
    } finally {
      await sandbox.destroy();
      server!.close();
    }
  });
});
