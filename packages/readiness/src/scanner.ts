import {
  type ReadinessCheck,
  type ReadinessReport,
  type ReadinessEvidence,
} from "@agentlens/event-schema";
import type { BrowserProvider } from "@agentlens/browser";
// Let's use crypto.randomUUID()
import * as crypto from "node:crypto";

export interface ScannerOptions {
  targetUrl: string;
  browserProvider?: BrowserProvider;
}

export class ReadinessScanner {
  public async scan(options: ScannerOptions): Promise<ReadinessReport> {
    const checks: ReadinessCheck[] = [];
    const targetUrl = new URL(options.targetUrl);
    const baseUrl = `${targetUrl.protocol}//${targetUrl.host}`;

    // Helper for simple GET checks
    const checkEndpoint = async (
      id: string,
      name: string,
      category: "readable" | "discoverable" | "callable" | "secure",
      path: string,
      expectedContentType?: string,
    ): Promise<ReadinessCheck> => {
      const url = `${baseUrl}${path}`;
      const evidence: ReadinessEvidence[] = [];
      let status: "pass" | "fail" | "not_applicable" | "unknown" = "fail";
      let reason = "Failed to fetch endpoint.";

      try {
        const response = await fetch(url, { redirect: "follow" });
        evidence.push({
          url,
          httpStatus: response.status,
          headers: {
            "content-type": response.headers.get("content-type") || "",
          },
        });

        if (response.ok) {
          if (
            expectedContentType &&
            !response.headers.get("content-type")?.includes(expectedContentType)
          ) {
            reason = `Endpoint returned 200 but content type was not ${expectedContentType}.`;
            status = "fail";
          } else {
            status = "pass";
            reason = "Endpoint exists and returned 200 OK.";
          }
        } else if (response.status === 404) {
          reason = "Endpoint not found (404).";
        } else {
          reason = `Endpoint returned HTTP ${response.status}.`;
        }
      } catch (err) {
        reason = `Network error: ${err instanceof Error ? err.message : String(err)}`;
      }

      return {
        checkId: `chk_${crypto.randomUUID()}`,
        name,
        category,
        status,
        severity: status === "pass" ? "info" : "low",
        observedAt: new Date().toISOString(),
        evidence,
        reason,
      };
    };

    // 1. llms.txt (READABLE)
    checks.push(await checkEndpoint("llms-txt", "/llms.txt detection", "readable", "/llms.txt"));

    // 2. robots.txt (DISCOVERABLE)
    checks.push(
      await checkEndpoint("robots-txt", "/robots.txt detection", "discoverable", "/robots.txt"),
    );

    // 3. sitemap.xml (DISCOVERABLE)
    checks.push(
      await checkEndpoint(
        "sitemap-xml",
        "/sitemap.xml detection",
        "discoverable",
        "/sitemap.xml",
        "xml",
      ),
    );

    // 4. API Catalog (CALLABLE)
    checks.push(
      await checkEndpoint(
        "api-catalog",
        "API Catalog detection",
        "callable",
        "/.well-known/api-catalog",
      ),
    );

    // 5. OAuth Discovery (SECURE)
    checks.push(
      await checkEndpoint(
        "oauth-discovery",
        "OAuth Discovery detection",
        "secure",
        "/.well-known/oauth-authorization-server",
      ),
    );

    // 6. Agent Skills (CALLABLE)
    checks.push(
      await checkEndpoint(
        "agent-skills",
        "Agent Skills detection",
        "callable",
        "/.well-known/agent-skills/index.json",
      ),
    );

    // 7. MCP Discovery (DISCOVERABLE)
    checks.push(
      await checkEndpoint(
        "mcp-discovery",
        "MCP Discovery detection",
        "discoverable",
        "/.well-known/mcp",
      ),
    );

    // 8. Web Bot Authentication (SECURE)
    checks.push(
      await checkEndpoint(
        "web-bot-auth",
        "Web Bot Authentication detection",
        "secure",
        "/.well-known/web-bot-authentication",
      ),
    );

    // 9. HTML Accessibility & Structured Data (READABLE)
    try {
      const htmlRes = await fetch(options.targetUrl, { headers: { Accept: "text/html" } });
      const evidence = [
        {
          url: options.targetUrl,
          httpStatus: htmlRes.status,
          headers: { "content-type": htmlRes.headers.get("content-type") || "" },
        },
      ];

      if (htmlRes.ok && htmlRes.headers.get("content-type")?.includes("html")) {
        const body = await htmlRes.text();
        const lowerBody = body.toLowerCase();

        const hasTitle = lowerBody.includes("<title");
        const hasDesc = lowerBody.includes('name="description"');
        const hasMain = lowerBody.includes("<main");
        const hasH1 = lowerBody.includes("<h1");
        const htmlScore = [hasTitle, hasDesc, hasMain, hasH1].filter(Boolean).length;

        checks.push({
          checkId: `chk_${crypto.randomUUID()}`,
          name: "HTML Accessibility",
          category: "readable",
          status: htmlScore === 4 ? "pass" : htmlScore > 0 ? "partial" : "fail",
          severity: "medium",
          observedAt: new Date().toISOString(),
          evidence,
          reason: `Found components: title=${hasTitle}, description=${hasDesc}, main=${hasMain}, h1=${hasH1}`,
        });

        const hasJsonLd = lowerBody.includes("application/ld+json");
        const hasOg = lowerBody.includes('property="og:');
        const sdScore = [hasJsonLd, hasOg].filter(Boolean).length;

        checks.push({
          checkId: `chk_${crypto.randomUUID()}`,
          name: "Structured Data",
          category: "readable",
          status: sdScore > 0 ? "pass" : "fail",
          severity: "low",
          observedAt: new Date().toISOString(),
          evidence,
          reason: `Found: json-ld=${hasJsonLd}, opengraph=${hasOg}`,
        });
      } else {
        checks.push({
          checkId: `chk_${crypto.randomUUID()}`,
          name: "HTML Accessibility",
          category: "readable",
          status: "fail",
          severity: "medium",
          observedAt: new Date().toISOString(),
          evidence,
          reason: "Failed to fetch HTML or content-type is not text/html.",
        });
        checks.push({
          checkId: `chk_${crypto.randomUUID()}`,
          name: "Structured Data",
          category: "readable",
          status: "fail",
          severity: "low",
          observedAt: new Date().toISOString(),
          evidence,
          reason: "Failed to fetch HTML or content-type is not text/html.",
        });
      }
    } catch (err) {
      const evidence = [{ url: options.targetUrl }];
      const reason = `Network error: ${err instanceof Error ? err.message : String(err)}`;
      checks.push({
        checkId: `chk_${crypto.randomUUID()}`,
        name: "HTML Accessibility",
        category: "readable",
        status: "unknown",
        severity: "medium",
        observedAt: new Date().toISOString(),
        evidence,
        reason,
      });
      checks.push({
        checkId: `chk_${crypto.randomUUID()}`,
        name: "Structured Data",
        category: "readable",
        status: "unknown",
        severity: "low",
        observedAt: new Date().toISOString(),
        evidence,
        reason,
      });
    }

    // 10. Markdown Content Negotiation (READABLE)
    try {
      const mdRes = await fetch(options.targetUrl, { headers: { Accept: "text/markdown" } });

      let mdStatus: "pass" | "fail" = "fail";
      let mdReason = "Server did not return text/markdown content.";

      const isMd = mdRes.headers.get("content-type")?.includes("markdown");
      if (isMd && mdRes.ok) {
        mdStatus = "pass";
        mdReason = "Server successfully negotiated text/markdown.";
      }

      checks.push({
        checkId: `chk_${crypto.randomUUID()}`,
        name: "Markdown Content Negotiation",
        category: "readable",
        status: mdStatus,
        severity: mdStatus === "pass" ? "info" : "medium",
        observedAt: new Date().toISOString(),
        evidence: [
          {
            url: options.targetUrl,
            httpStatus: mdRes.status,
            headers: {
              "content-type": mdRes.headers.get("content-type") || "",
            },
          },
        ],
        reason: mdReason,
      });
    } catch (err) {
      checks.push({
        checkId: `chk_${crypto.randomUUID()}`,
        name: "Markdown Content Negotiation",
        category: "readable",
        status: "unknown",
        severity: "medium",
        observedAt: new Date().toISOString(),
        evidence: [{ url: options.targetUrl }],
        reason: `Network error: ${err instanceof Error ? err.message : String(err)}`,
      });
    }

    // 11. WebMCP Detection (CALLABLE) - Requires Browser
    if (options.browserProvider) {
      let webMcpStatus: "pass" | "fail" | "unknown" = "fail";
      let webMcpReason = "document.modelContext was undefined.";
      const evidence: ReadinessEvidence[] = [{ url: options.targetUrl }];

      try {
        const session = await options.browserProvider.launch({ headless: true });
        try {
          await session.navigate(options.targetUrl);
          const hasModelContext = await session.evaluate<boolean>(
            "typeof document.modelContext !== 'undefined'",
          );
          if (hasModelContext) {
            webMcpStatus = "pass";
            webMcpReason = "document.modelContext object was detected.";
          }
        } finally {
          await session.close().catch(() => {});
        }
      } catch (err) {
        webMcpStatus = "unknown";
        webMcpReason = `Browser error: ${err instanceof Error ? err.message : String(err)}`;
      }

      checks.push({
        checkId: `chk_${crypto.randomUUID()}`,
        name: "WebMCP Detection",
        category: "callable",
        status: webMcpStatus,
        severity: webMcpStatus === "pass" ? "info" : "low",
        observedAt: new Date().toISOString(),
        evidence,
        reason: webMcpReason,
      });
    }

    return {
      targetUrl: options.targetUrl,
      generatedAt: new Date().toISOString(),
      checks,
    };
  }
}
