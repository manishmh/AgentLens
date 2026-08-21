import { chromium, type Browser, type BrowserContext, type Page, type CDPSession } from "playwright";
import type { ObservationEngine } from "@agentlens/observation";
import type { SandboxHandle } from "@agentlens/sandbox";
import { EventSource, EventType } from "@agentlens/event-schema";
import { newArtifactId } from "@agentlens/shared";
import type {
  BrowserLaunchSpec,
  BrowserProvider,
  BrowserSession,
  ScreenshotOptions,
} from "./types";

export class PlaywrightBrowserSession implements BrowserSession {
  private readonly requestMap = new Map<string, { timestamp: number; url: string }>();

  constructor(
    private readonly page: Page,
    private readonly context: BrowserContext,
    private readonly browser: Browser,
    private readonly cdp: CDPSession,
    private readonly observation: ObservationEngine,
    private readonly sandbox: SandboxHandle
  ) {
    this.setupNetworkObservation();
    this.setupPageObservation();
  }

  private setupNetworkObservation() {
    this.cdp.on("Network.requestWillBeSent", (event) => {
      this.requestMap.set(event.requestId, { timestamp: event.timestamp, url: event.request.url });
      
      this.observation.record({
        source: EventSource.Network,
        type: EventType.NetworkRequest,
        payload: {
          requestId: event.requestId,
          method: event.request.method,
          url: event.request.url,
          resourceType: event.type,
        },
      });
      
      if (event.redirectResponse) {
        const reqInfo = this.requestMap.get(event.requestId);
        const durationMs = (event.timestamp - (reqInfo ? reqInfo.timestamp : event.timestamp)) * 1000;
        this.observation.record({
          source: EventSource.Network,
          type: EventType.NetworkResponse,
          payload: {
            requestId: event.requestId,
            url: event.redirectResponse.url,
            status: event.redirectResponse.status,
            contentType: event.redirectResponse.mimeType,
            durationMs: durationMs > 0 ? durationMs : undefined,
          },
        });
        // Update timestamp for the new request
        this.requestMap.set(event.requestId, { timestamp: event.timestamp, url: event.request.url });
      }
    });

    this.cdp.on("Network.responseReceived", (event) => {
      const reqInfo = this.requestMap.get(event.requestId);
      const durationMs = reqInfo ? (event.timestamp - reqInfo.timestamp) * 1000 : undefined;
      
      this.observation.record({
        source: EventSource.Network,
        type: EventType.NetworkResponse,
        payload: {
          requestId: event.requestId,
          url: event.response.url,
          status: event.response.status,
          contentType: event.response.mimeType,
          durationMs: durationMs !== undefined && durationMs > 0 ? durationMs : undefined,
        },
      });
    });

    this.cdp.on("Network.loadingFailed", (event) => {
      const reqInfo = this.requestMap.get(event.requestId);
      const durationMs = reqInfo ? (event.timestamp - reqInfo.timestamp) * 1000 : undefined;
      const url = reqInfo ? reqInfo.url : this.page.url();
      
      // Emit a 0 status to indicate failure (aborted, blocked, network error)
      this.observation.record({
        source: EventSource.Network,
        type: EventType.NetworkResponse,
        payload: {
          requestId: event.requestId,
          url,
          status: 0,
          durationMs: durationMs !== undefined && durationMs > 0 ? durationMs : undefined,
        },
      });
      this.requestMap.delete(event.requestId);
    });
    
    this.cdp.on("Network.loadingFinished", (event) => {
      this.requestMap.delete(event.requestId);
    });
  }

  private setupPageObservation() {
    this.page.on("pageerror", (err) => {
      this.observation.record({
        source: EventSource.Browser,
        type: EventType.BrowserError,
        payload: { message: err.message },
      });
    });
    
    this.page.on("framenavigated", (frame) => {
      if (frame === this.page.mainFrame()) {
        this.observation.record({
          source: EventSource.Browser,
          type: EventType.BrowserNavigation,
          payload: { url: frame.url() },
        });
      }
    });
  }

  async navigate(url: string): Promise<void> {
    try {
      await this.page.goto(url);
      // Note: framenavigated will catch this, but we could also record it here if we wanted.
    } catch (err: unknown) {
      this.observation.record({
        source: EventSource.Browser,
        type: EventType.BrowserError,
        payload: { message: `Navigation failed: ${err instanceof Error ? err.message : String(err)}` },
      });
      throw err;
    }
  }

  async click(selector: string): Promise<void> {
    this.observation.record({
      source: EventSource.Browser,
      type: EventType.BrowserClick,
      payload: { selector },
    });
    await this.page.click(selector);
  }

  async type(selector: string, text: string): Promise<void> {
    this.observation.record({
      source: EventSource.Browser,
      type: EventType.BrowserInput,
      payload: { selector, redacted: true },
    });
    await this.page.fill(selector, text);
  }

  async scroll(x: number, y: number): Promise<void> {
    this.observation.record({
      source: EventSource.Browser,
      type: EventType.BrowserScroll,
      payload: { x, y },
    });
    await this.page.mouse.wheel(x, y);
  }

  async screenshot(options?: ScreenshotOptions): Promise<Uint8Array> {
    const buffer = await this.page.screenshot({ fullPage: options?.fullPage });
    const u8 = new Uint8Array(buffer);
    
    const screenshotPath = `screenshots/${newArtifactId()}.png`;
    await this.sandbox.writeFile(screenshotPath, u8);
    
    this.observation.record({
      source: EventSource.Browser,
      type: EventType.Screenshot,
      payload: {
        artifact: {
          artifactId: newArtifactId(),
          kind: "screenshot",
          path: screenshotPath,
          contentType: "image/png",
          sizeBytes: u8.byteLength,
          visibility: "internal",
        },
      },
    });
    
    return u8;
  }

  async content(): Promise<string> {
    const html = await this.page.content();
    const snapshotPath = `artifacts/snapshot-${newArtifactId()}.html`;
    await this.sandbox.writeFile(snapshotPath, html);
    
    this.observation.record({
      source: EventSource.Browser,
      type: EventType.PageSnapshot,
      payload: {
        url: this.url(),
        artifact: {
          artifactId: newArtifactId(),
          kind: "html_snapshot",
          path: snapshotPath,
          contentType: "text/html",
          sizeBytes: Buffer.byteLength(html),
          visibility: "customer_sensitive",
        },
      },
    });
    
    return html;
  }

  url(): string {
    return this.page.url();
  }

  async close(): Promise<void> {
    try {
      await this.context.close();
    } finally {
      await this.browser.close();
    }
  }
}

export class PlaywrightBrowserProvider implements BrowserProvider {
  readonly name = "playwright";
  readonly browser = "chromium";
  readonly version = "1.62.1"; // Fixed to match package.json version approximately

  constructor(
    private readonly observation: ObservationEngine,
    private readonly sandbox: SandboxHandle
  ) {}

  async launch(spec?: BrowserLaunchSpec): Promise<BrowserSession> {
    try {
      this.observation.record({
        source: EventSource.Browser,
        type: EventType.BrowserStarted,
        payload: { browser: this.browser, version: this.version },
      });

      const browser = await chromium.launch({
        headless: spec?.headless ?? true,
      });
      
      try {
        const context = await browser.newContext({
          viewport: spec?.viewport,
          userAgent: spec?.userAgent,
          locale: spec?.locale,
          timezoneId: spec?.timezone,
        });
        
        const page = await context.newPage();
        
        const cdp = await context.newCDPSession(page);
        await cdp.send("Network.enable");

        return new PlaywrightBrowserSession(page, context, browser, cdp, this.observation, this.sandbox);
      } catch (err: unknown) {
        await browser.close().catch(() => {});
        throw err;
      }
    } catch (err: unknown) {
      this.observation.record({
        source: EventSource.Browser,
        type: EventType.BrowserError,
        payload: { message: `Browser launch failed: ${err instanceof Error ? err.message : String(err)}` },
      });
      throw err;
    }
  }
}
