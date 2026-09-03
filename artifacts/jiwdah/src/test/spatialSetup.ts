/**
 * jsdom shims for spatial integration tests.
 *
 * jsdom lacks the viewport APIs the spatial scenes observe; the shims below
 * give them inert, correct-enough behavior (scenes stay visible, reduced
 * motion stays off unless a test flips it). No assertion in the suite
 * depends on real layout.
 */

class InertIntersectionObserver {
  callback: IntersectionObserverCallback;
  readonly root: Element | null = null;
  readonly rootMargin: string = "0px";
  readonly thresholds: ReadonlyArray<number> = [1];
  constructor(callback: IntersectionObserverCallback, _options?: IntersectionObserverInit) {
    this.callback = callback;
  }
  observe(target: Element) {
    // Report the scene as in-view immediately, like a page above the fold.
    queueMicrotask(() => {
      const rect = target.getBoundingClientRect();
      const entry = {
        target,
        isIntersecting: true,
        intersectionRatio: 1,
        boundingClientRect: rect,
        intersectionRect: rect,
        rootBounds: null,
        time: Date.now(),
      } as unknown as IntersectionObserverEntry;
      this.callback([entry], this);
    });
  }
  unobserve() {}
  disconnect() {}
  takeRecords(): IntersectionObserverEntry[] {
    return [];
  }
}

if (typeof globalThis.IntersectionObserver === "undefined") {
  (globalThis as Record<string, unknown>).IntersectionObserver = InertIntersectionObserver;
}

if (typeof window !== "undefined" && typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addListener: () => {},
      removeListener: () => {},
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
    }) as MediaQueryList;
}
