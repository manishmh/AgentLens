/**
 * Per-run clock providing the two time bases every event needs (docs/07 §36):
 * a wall-clock ISO timestamp and a monotonic `runtimeMs` offset from run start,
 * plus a monotonically increasing sequence number.
 */
export class RunClock {
  private seq = 0;
  private readonly monotonicOrigin: number;

  constructor() {
    this.monotonicOrigin = performance.now();
  }

  /** Milliseconds since run start, monotonic (immune to wall-clock adjustments). */
  runtimeMs(): number {
    return Math.max(0, performance.now() - this.monotonicOrigin);
  }

  wallClock(): string {
    return new Date().toISOString();
  }

  nextSequence(): number {
    return this.seq++;
  }
}
