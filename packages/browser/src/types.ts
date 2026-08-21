/**
 * Browser provider abstraction (docs/10 §5, §14, docs/07 §10).
 *
 * V1 uses Chromium + Playwright + CDP behind this interface. Keeping browser control
 * behind a provider means the browser runtime can change (docs/03 R2) without touching
 * the agent, observation, or evaluation layers. The concrete Playwright/CDP provider —
 * which also drives CDP-level observation into the ObservationEngine — is implemented
 * in Milestone 2; V1 Milestone 0 establishes only the contract.
 */

export interface Viewport {
  width: number;
  height: number;
}

export interface BrowserLaunchSpec {
  headless?: boolean;
  viewport?: Viewport;
  userAgent?: string;
  locale?: string;
  timezone?: string;
  /** Fresh, isolated profile per run unless a run explicitly opts into persistence (docs/07 §52). */
  persistentProfile?: boolean;
}

export interface ScreenshotOptions {
  fullPage?: boolean;
}

/** A single instrumented browser page/session. Actions map to canonical browser.* events. */
export interface BrowserSession {
  navigate(url: string): Promise<void>;
  click(selector: string): Promise<void>;
  type(selector: string, text: string): Promise<void>;
  scroll(x: number, y: number): Promise<void>;
  screenshot(options?: ScreenshotOptions): Promise<Uint8Array>;
  /** Current DOM/HTML content, for page/DOM snapshots (docs/07 §40–41). */
  content(): Promise<string>;
  url(): string;
  close(): Promise<void>;
}

export interface BrowserProvider {
  readonly name: string;
  /** Browser engine name, e.g. "chromium". Pinned for reproducibility (docs/10 §5). */
  readonly browser: string;
  /** Pinned browser version string (docs/10 §5, docs/07 §49). */
  readonly version: string;
  launch(spec?: BrowserLaunchSpec): Promise<BrowserSession>;
}
