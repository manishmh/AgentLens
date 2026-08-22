import { describe, expect, it, beforeAll, afterAll } from "vitest";
import { ReadinessScanner } from "./scanner";
import { createServer, type Server } from "node:http";
import type { BrowserProvider, BrowserSession } from "@agentlens/browser";
import { readinessReportSchema, type ReadinessReport } from "@agentlens/event-schema";

class MockBrowserProvider implements BrowserProvider {
  name = "mock";
  browser = "mock";
  version = "1";
  async launch(): Promise<BrowserSession> {
    return {
      navigate: async () => {},
      click: async () => {},
      type: async () => {},
      scroll: async () => {},
      screenshot: async () => new Uint8Array(),
      content: async () => "",
      url: () => "http://localhost",
      evaluate: async <T>(script: string): Promise<T> => {
        if (script.includes("typeof document.modelContext !== 'undefined'")) {
          return true as unknown as T;
        }
        return false as unknown as T;
      },
      close: async () => {},
    };
  }
}

describe("ReadinessScanner", () => {
  let server: Server;
  let port: number;
  let targetUrl: string;

  beforeAll(async () => {
    return new Promise<void>((resolve) => {
      server = createServer((req, res) => {
        const url = new URL(req.url || "/", `http://${req.headers.host}`);

        if (url.pathname === "/llms.txt") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("mock llms");
          return;
        }
        if (url.pathname === "/robots.txt") {
          res.writeHead(200, { "Content-Type": "text/plain" });
          res.end("User-agent: *");
          return;
        }
        if (url.pathname === "/sitemap.xml") {
          res.writeHead(200, { "Content-Type": "application/xml" });
          res.end("<urlset></urlset>");
          return;
        }
        if (url.pathname === "/.well-known/api-catalog") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("{}");
          return;
        }
        if (url.pathname === "/.well-known/oauth-authorization-server") {
          res.writeHead(404);
          res.end();
          return;
        }
        if (url.pathname === "/.well-known/agent-skills/index.json") {
          res.writeHead(500);
          res.end();
          return;
        }
        if (url.pathname === "/.well-known/mcp") {
          res.writeHead(200, { "Content-Type": "application/json" });
          res.end("{}");
          return;
        }
        if (url.pathname === "/.well-known/web-bot-authentication") {
          res.writeHead(404);
          res.end();
          return;
        }
        if (url.pathname === "/") {
          if (req.headers.accept === "text/markdown") {
            res.writeHead(200, { "Content-Type": "text/markdown" });
            res.end("# Hello");
          } else {
            res.writeHead(200, { "Content-Type": "text/html" });
            res.end(
              '<html><head><title>Test</title><meta name="description" content="Test"></head><body><main><h1>Test</h1><script type="application/ld+json">{}</script></main></body></html>',
            );
          }
          return;
        }

        res.writeHead(404);
        res.end();
      });

      server.listen(0, () => {
        const addr = server.address();
        port = typeof addr === "object" && addr ? addr.port : 0;
        targetUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  afterAll(() => {
    server.close();
  });

  it("scans successfully and returns validated ReadinessReport", async () => {
    const scanner = new ReadinessScanner();
    const report = await scanner.scan({
      targetUrl,
      browserProvider: new MockBrowserProvider(),
    });

    // Should match schema
    readinessReportSchema.parse(report);

    expect(report.targetUrl).toBe(targetUrl);
    expect(report.checks.length).toBeGreaterThan(0);

    const getStatus = (name: string) => report.checks.find((c) => c.name === name)?.status;

    // llms.txt (exists)
    expect(getStatus("/llms.txt detection")).toBe("pass");
    // robots.txt (exists)
    expect(getStatus("/robots.txt detection")).toBe("pass");
    // sitemap.xml (exists, valid content type)
    expect(getStatus("/sitemap.xml detection")).toBe("pass");
    // api-catalog (exists)
    expect(getStatus("API Catalog detection")).toBe("pass");
    // oauth-discovery (404)
    expect(getStatus("OAuth Discovery detection")).toBe("fail");
    // agent-skills (500)
    expect(getStatus("Agent Skills detection")).toBe("fail");
    // mcp-discovery (exists)
    expect(getStatus("MCP Discovery detection")).toBe("pass");
    // web-bot-auth (404)
    expect(getStatus("Web Bot Authentication detection")).toBe("fail");
    // HTML Accessibility (all present)
    expect(getStatus("HTML Accessibility")).toBe("pass");
    // Structured Data (json-ld present)
    expect(getStatus("Structured Data")).toBe("pass");
    // Markdown content negotiation (returns text/markdown)
    expect(getStatus("Markdown Content Negotiation")).toBe("pass");
    // WebMCP (mock browser returns true)
    expect(getStatus("WebMCP Detection")).toBe("pass");
  });

  it("handles network errors gracefully", async () => {
    const scanner = new ReadinessScanner();
    const report = await scanner.scan({
      targetUrl: "http://localhost:1", // guaranteed network failure
    });

    readinessReportSchema.parse(report);
    expect(report.checks.every((c) => c.status === "fail" || c.status === "unknown")).toBe(true);
  });

  it("is deterministic on repeated scans", async () => {
    const scanner = new ReadinessScanner();
    const report1 = await scanner.scan({ targetUrl });
    const report2 = await scanner.scan({ targetUrl });

    // clean timestamps and UUIDs
    const clean = (report: ReadinessReport) => {
      const { generatedAt: _generatedAt, ...rest } = report;
      const cleanChecks = rest.checks.map((c) => {
        const { checkId: _cId, observedAt: _oAt, ...cRest } = c;
        return cRest;
      });
      return { ...rest, checks: cleanChecks };
    };

    expect(clean(report1)).toEqual(clean(report2));
  });
});
