import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createSpatialRuntime, stripSpatialClasses } from "./runtime";
import type { SpatialElement, SpatialTargets } from "./types";

/** Minimal DOM-like element for the runtime's class/dataset surface. */
function makeElement() {
  const classes = new Set<string>();
  const element: SpatialElement & { _classes: Set<string> } = {
    _classes: classes,
    classList: {
      add: (...cs: string[]) => cs.forEach((c) => classes.add(c)),
      remove: (...cs: string[]) => cs.forEach((c) => classes.delete(c)),
      contains: (c: string) => classes.has(c),
      toggle: (c: string, force?: boolean) => {
        const want = force ?? !classes.has(c);
        if (want) classes.add(c);
        else classes.delete(c);
        return want;
      },
    },
    dataset: {},
  };
  return element as SpatialElement & { _classes: Set<string> };
}

function makeTargets(overrides: Partial<SpatialTargets> = {}): SpatialTargets {
  return {
    root: makeElement(),
    page: makeElement(),
    subject: makeElement(),
    ...overrides,
  };
}

type FakeDocument = { startViewTransition?: (cb: () => void | Promise<void>) => { finished: Promise<void> } };

let originalDocument: unknown;

function withFakeDocument(fake: FakeDocument) {
  originalDocument = (globalThis as Record<string, unknown>).document;
  (globalThis as Record<string, unknown>).document = fake;
}

function restoreDocument() {
  if (originalDocument === undefined) delete (globalThis as Record<string, unknown>).document;
  else (globalThis as Record<string, unknown>).document = originalDocument;
}

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  restoreDocument();
});

describe("spatial runtime — forward movement (enter)", () => {
  it("advances through preparing → moving → resolving, fires the action, then cleans up", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    let acted = 0;

    const handle = runtime.run({
      intent: "enter",
      scene: "home",
      targets,
      action: () => {
        acted += 1;
      },
    });

    expect(handle).not.toBeNull();
    // Preparing: the field quiets.
    expect(handle?.state.phase).toBe("preparing");
    expect(targets.root.classList.contains("lena-spatial")).toBe(true);
    expect(targets.root.classList.contains("lena-spatial--enter")).toBe(true);
    expect(targets.root.classList.contains("lena-phase-preparing")).toBe(true);
    expect(targets.root.classList.contains("lena-gateway-quiet")).toBe(true);
    expect(targets.root.classList.contains("lena-gateway-resolve")).toBe(false);
    expect(acted).toBe(0);

    // Moving (240ms): the center resolves and holds.
    vi.advanceTimersByTime(240);
    expect(handle?.state.phase).toBe("moving");
    expect(targets.root.classList.contains("lena-gateway-resolve")).toBe(true);
    expect(acted).toBe(0);

    // The cross fires at the end of the resolve hold (620ms).
    vi.advanceTimersByTime(379);
    expect(acted).toBe(0);
    vi.advanceTimersByTime(1);
    expect(acted).toBe(1);

    // Settled: every class is gone, the runtime is idle.
    expect(handle?.state.phase).toBe("idle");
    expect(targets.root._classes.size).toBe(0);
    expect(runtime.isIdle()).toBe(true);
    await expect(handle?.done).resolves.toBe("finished");
  });
});

describe("spatial runtime — forward movement (descend / portal)", () => {
  it("runs the portal grammar: isolate, align, cross — with the system pinned", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    let acted = 0;

    const handle = runtime.run({
      intent: "descend",
      scene: "world",
      targets,
      systemId: "property",
      action: () => {
        acted += 1;
      },
    });

    // Isolation beat: world + page mark the portal, the system is pinned.
    expect(targets.page.classList.contains("is-portal")).toBe(true);
    expect(targets.root.classList.contains("is-portal")).toBe(true);
    expect(targets.root.dataset.portal).toBe("property");
    expect(acted).toBe(0);

    // Align beat (190ms): the chosen system resolves toward the core.
    vi.advanceTimersByTime(190);
    expect(targets.root.classList.contains("is-portal-resolve")).toBe(true);
    expect(acted).toBe(0);

    // The cross fires at 480ms.
    vi.advanceTimersByTime(290);
    expect(acted).toBe(1);
    expect(targets.root.classList.contains("is-portal-resolve")).toBe(false);
    expect(targets.root.dataset.portal).toBeUndefined();
    expect(targets.root._classes.size).toBe(0);
    expect(targets.page._classes.size).toBe(0);
    await expect(handle?.done).resolves.toBe("finished");
  });
});

describe("spatial runtime — interruption safety", () => {
  it("is single-flight: a second intent while one is in flight is absorbed", () => {
    const runtime = createSpatialRuntime();
    const first = runtime.run({ intent: "enter", scene: "home", targets: makeTargets(), action: () => {} });
    const second = runtime.run({ intent: "descend", scene: "world", targets: makeTargets(), action: () => {} });
    expect(first).not.toBeNull();
    expect(second).toBeNull();
    expect(runtime.isIdle()).toBe(false);
  });

  it("cancel clears every class and lets the next transition run", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    const handle = runtime.run({
      intent: "descend",
      scene: "world",
      targets,
      systemId: "rental",
      action: () => {
        throw new Error("should not navigate after cancel");
      },
    });

    expect(targets.root.classList.contains("is-portal")).toBe(true);
    handle?.cancel();
    expect(handle?.state.phase).toBe("idle");
    expect(targets.root._classes.size).toBe(0);
    expect(targets.page._classes.size).toBe(0);
    expect(targets.root.dataset.portal).toBeUndefined();
    expect(runtime.isIdle()).toBe(true);
    await expect(handle?.done).resolves.toBe("canceled");

    // The world is usable again: a fresh transition completes normally.
    let acted = 0;
    const again = runtime.run({
      intent: "enter",
      scene: "home",
      targets: makeTargets(),
      action: () => {
        acted += 1;
      },
    });
    vi.advanceTimersByTime(620);
    expect(acted).toBe(1);
    await expect(again?.done).resolves.toBe("finished");
  });

  it("cancelActive from outside (route change) leaves no stale state", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    const handle = runtime.run({ intent: "enter", scene: "home", targets, action: () => {} });
    runtime.cancelActive();
    expect(runtime.isIdle()).toBe(true);
    expect(targets.root._classes.size).toBe(0);
    await expect(handle?.done).resolves.toBe("canceled");
  });

  it("stripSpatialClasses removes any leftover class, including legacy ones", () => {
    const root = makeElement();
    root.classList.add("lena-spatial", "lena-phase-moving", "lena-gateway-quiet", "is-portal", "is-portal-resolve");
    root.dataset.portal = "property";
    root.classList.add("lena-unrelated");
    stripSpatialClasses(root);
    expect(root.classList.contains("lena-spatial")).toBe(false);
    expect(root.classList.contains("lena-phase-moving")).toBe(false);
    expect(root.classList.contains("lena-gateway-quiet")).toBe(false);
    expect(root.classList.contains("is-portal")).toBe(false);
    expect(root.classList.contains("is-portal-resolve")).toBe(false);
    expect(root.dataset.portal).toBeUndefined();
    expect(root.classList.contains("lena-unrelated")).toBe(true);
  });
});

describe("spatial runtime — reduced motion", () => {
  it("never adds movement classes; the move happens after one minimal beat", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    let acted = 0;

    const handle = runtime.run({
      intent: "enter",
      scene: "home",
      targets,
      reducedMotion: true,
      action: () => {
        acted += 1;
      },
    });

    expect(acted).toBe(0);
    expect(targets.root._classes.size).toBe(0);
    vi.advanceTimersByTime(89);
    expect(acted).toBe(0);
    vi.advanceTimersByTime(1);
    expect(acted).toBe(1);
    expect(targets.root._classes.size).toBe(0);
    await expect(handle?.done).resolves.toBe("finished");
  });

  it("an in-scene intent with no action ends immediately", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    const handle = runtime.run({
      intent: "focus",
      scene: "chamber",
      targets,
      reducedMotion: true,
    });
    expect(runtime.isIdle()).toBe(true);
    expect(targets.root._classes.size).toBe(0);
    await expect(handle?.done).resolves.toBe("finished");
  });

  it("rides a plain View Transition crossfade where the browser offers one", async () => {
    const calls: string[] = [];
    withFakeDocument({
      startViewTransition: (cb) => {
        calls.push("vt-start");
        cb();
        return { finished: Promise.resolve() };
      },
    });

    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    const handle = runtime.run({
      intent: "descend",
      scene: "world",
      targets,
      systemId: "rental",
      reducedMotion: true,
      action: () => calls.push("navigate"),
    });

    expect(calls).toEqual(["vt-start", "navigate"]);
    expect(targets.root._classes.size).toBe(0);
    await expect(handle?.done).resolves.toBe("finished");
  });
});

describe("spatial runtime — View Transitions (full motion)", () => {
  it("wraps the navigation in startViewTransition at the resolving beat", async () => {
    const calls: string[] = [];
    withFakeDocument({
      startViewTransition: (cb) => {
        calls.push("vt-start");
        cb();
        calls.push("cb-done");
        return { finished: Promise.resolve() };
      },
    });

    const runtime = createSpatialRuntime();
    const targets = makeTargets();
    const handle = runtime.run({
      intent: "enter",
      scene: "home",
      targets,
      action: () => calls.push("navigate"),
    });

    expect(calls).toEqual([]);
    vi.advanceTimersByTime(620);
    expect(calls).toEqual(["vt-start", "navigate", "cb-done"]);
    // The resolve classes hold through the crossfade…
    expect(targets.root.classList.contains("lena-gateway-resolve")).toBe(true);
    // …and are cleaned up once the browser's transition finishes.
    await expect(handle?.done).resolves.toBe("finished");
    expect(targets.root._classes.size).toBe(0);
  });

  it("keeps the world single-flight while the crossfade is still settling", async () => {
    let releaseFinished: (() => void) | null = null;
    withFakeDocument({
      startViewTransition: (cb) => {
        cb();
        return {
          finished: new Promise<void>((resolve) => {
            releaseFinished = resolve;
          }),
        };
      },
    });

    const runtime = createSpatialRuntime();
    const handle = runtime.run({
      intent: "enter",
      scene: "home",
      targets: makeTargets(),
      action: () => {},
    });
    vi.advanceTimersByTime(620);
    // Crossfade still running: the world is still moving.
    expect(runtime.isIdle()).toBe(false);
    expect(
      runtime.run({ intent: "descend", scene: "world", targets: makeTargets(), action: () => {} }),
    ).toBeNull();
    releaseFinished?.();
    await expect(handle?.done).resolves.toBe("finished");
    expect(runtime.isIdle()).toBe(true);
  });
});

describe("spatial runtime — self-settling intents (approach)", () => {
  it("emphasizes the subject, holds, then lifts by itself", async () => {
    const runtime = createSpatialRuntime();
    const targets = makeTargets();

    const handle = runtime.run({
      intent: "approach",
      scene: "world",
      targets,
      systemId: "property",
    });

    // World approach beat: emphasis begins in the moving phase.
    vi.advanceTimersByTime(50);
    expect(targets.root.classList.contains("is-approach")).toBe(true);
    expect(targets.subject.classList.contains("is-approached")).toBe(true);

    // Still held mid-way…
    vi.advanceTimersByTime(500);
    expect(targets.root.classList.contains("is-approach")).toBe(true);

    // …and lifted after the hold (720ms moving + 950ms settle = 1670ms).
    vi.advanceTimersByTime(1119);
    expect(targets.root.classList.contains("is-approach")).toBe(true);
    vi.advanceTimersByTime(1);
    expect(targets.root._classes.size).toBe(0);
    expect(targets.subject._classes.size).toBe(0);
    expect(runtime.isIdle()).toBe(true);
    await expect(handle?.done).resolves.toBe("finished");
  });

  it("an approach started while another transition runs is absorbed", () => {
    const runtime = createSpatialRuntime();
    const busy = runtime.run({
      intent: "enter",
      scene: "home",
      targets: makeTargets(),
      action: () => {},
    });
    const absorbed = runtime.run({
      intent: "approach",
      scene: "world",
      targets: makeTargets(),
    });
    expect(busy).not.toBeNull();
    expect(absorbed).toBeNull();
  });
});
