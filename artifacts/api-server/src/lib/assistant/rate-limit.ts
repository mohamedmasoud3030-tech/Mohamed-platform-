/**
 * In-memory sliding-window rate limit for the assistant.
 *
 * The inquiry form persists its limit in Postgres because a refused inquiry is
 * a business event. Assistant turns are ephemeral small talk around public
 * content, so an in-process window is enough — Vercel's per-instance fan-out
 * only ever loosens the limit, never tightens it, and the provider budget cap
 * (a paid key) is the real bound.
 */

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();

  constructor(
    private readonly limit: number,
    private readonly windowMs: number,
  ) {}

  /** Returns true when the call is allowed and records it. */
  check(key: string, now: number = Date.now()): boolean {
    const previous = this.hits.get(key);
    const recent = (previous ?? []).filter((timestamp) => now - timestamp < this.windowMs);
    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    this.hits.set(key, recent);

    // Amortised sweep so abandoned keys cannot grow the map unbounded.
    if (this.hits.size > 1024) {
      for (const [sweptKey, timestamps] of this.hits) {
        const live = timestamps.filter((timestamp) => now - timestamp < this.windowMs);
        if (live.length === 0) this.hits.delete(sweptKey);
        else this.hits.set(sweptKey, live);
      }
    }
    return true;
  }
}
