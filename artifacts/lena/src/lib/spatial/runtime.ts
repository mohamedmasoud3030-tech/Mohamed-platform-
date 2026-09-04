/**
 * LENA Spatial Transition Runtime — the single owner of spatial movement.
 *
 * One grammar, one state machine, every surface:
 *
 *   - intents     — approach / enter / descend / focus / return / emerge
 *   - phases      — idle → preparing → moving → resolving → idle
 *   - beats       — authored in `tokens.ts`, not scattered through pages
 *   - reduced     — a first-class mode: no travel, a short crossfade instead
 *   - interruption — single-flight, cancellable, self-cleaning
 *
 * Pages express intent ("I am descending into the property chamber") and the
 * runtime decides which classes touch which elements, when, and how to clean
 * up. CSS owns the look; this file owns the timing and the state.
 *
 * The runtime is deliberately framework-agnostic: it touches a minimal
 * element surface (classes + dataset) and the View Transitions API, so it is
 * fully testable without a browser and safe to cancel from any React effect.
 */

import { approachSettle, reducedBeat, spatialBeats, type SpatialBeatProfile } from "./tokens";
import type {
  SpatialElement,
  SpatialIntent,
  SpatialPhase,
  SpatialScene,
  SpatialTargets,
} from "./types";

/** The universal classes the runtime manages on the scene root. */
const BASE_CLASS = "lena-spatial";
const phaseClass = (phase: SpatialPhase) => `lena-phase-${phase}`;
const intentClass = (intent: SpatialIntent) => `lena-spatial--${intent}`;

export interface SpatialTransitionOptions {
  /** The intent, expressed once by the caller. */
  intent: SpatialIntent;
  /** Which scene runs the choreography. */
  scene: SpatialScene;
  /** The elements the choreography may touch. */
  targets: SpatialTargets;
  /** Which system the movement is about, when one exists. */
  systemId?: string;
  /** The actual navigation. Fired at the resolving beat. Omit for in-scene
   *  intents (focus / return / approach). */
  action?: () => void | Promise<void>;
  /** Override reduced-motion detection (tests, explicit contexts). */
  reducedMotion?: boolean;
}

export interface SpatialTransitionState {
  id: number;
  intent: SpatialIntent;
  scene: SpatialScene;
  /** Live: updates as the transition advances. */
  phase: SpatialPhase;
  systemId?: string;
}

export interface SpatialTransitionHandle {
  state: SpatialTransitionState;
  /** Cancel before completion: clears timers and every class the runtime added. */
  cancel(): void;
  /** Resolves "finished" or "canceled". Never rejects. */
  done: Promise<"finished" | "canceled">;
}

export interface SpatialRuntime {
  /** Start a transition. Returns null when one is already in flight. */
  run(options: SpatialTransitionOptions): SpatialTransitionHandle | null;
  /** Cancel whatever is in flight (route change, unmount, a new intent). */
  cancelActive(): void;
  isIdle(): boolean;
}

/** One class-set the choreography applies on a single element. */
interface ClassStep {
  element: SpatialElement;
  add: string[];
  dataset?: Record<string, string | null>;
}

type PhaseName = "preparing" | "moving" | "resolving";

/**
 * A choreography: the beats plus a declarative map of which classes each
 * phase touches. Written per (scene, intent) so the whole movement grammar
 * is readable in one place.
 */
interface Choreography {
  beats: SpatialBeatProfile;
  steps: (phase: PhaseName, targets: SpatialTargets, systemId?: string) => ClassStep[];
  /** Self-settling: no action; the effect lingers, then lifts by itself. */
  selfSettling?: boolean;
}

function makeChoreography(scene: SpatialScene, intent: SpatialIntent): Choreography | null {
  const beats = (spatialBeats[scene] as Record<string, SpatialBeatProfile>)[intent];
  if (!beats) return null;

  if (scene === "home" && (intent === "enter" || intent === "descend")) {
    // The gateway: the field quiets, the center resolves (the resolve class
    // holds through the crossing so the View Transition snapshot captures
    // the awakened core), then we cross.
    return {
      beats,
      steps: (phase, { root, page }) => {
        const steps: ClassStep[] = [{ element: root, add: ["lena-gateway-quiet"] }];
        if (page) steps.push({ element: page, add: ["lena-gateway-quiet"] });
        if (phase === "moving") {
          steps.push({ element: root, add: ["lena-gateway-resolve"] });
        }
        return steps;
      },
    };
  }

  if (scene === "world" && intent === "descend") {
    // The portal: the world and the chosen system isolate together
    // (is-portal), the system aligns with the Sacred Core
    // (is-portal-resolve), then the cross fires.
    return {
      beats,
      steps: (phase, { root, page }, systemId) => {
        const steps: ClassStep[] = [];
        if (phase === "preparing") {
          if (page) steps.push({ element: page, add: ["is-portal"] });
          steps.push({
            element: root,
            add: ["is-portal"],
            dataset: systemId ? { portal: systemId } : undefined,
          });
        } else if (phase === "moving") {
          steps.push({ element: root, add: ["is-portal-resolve"] });
        }
        return steps;
      },
    };
  }

  if (scene === "world" && intent === "emerge") {
    // Leaving the world back toward the house: the field recedes outward.
    return {
      beats,
      steps: (phase, { root, page }) => {
        if (phase === "preparing") return [];
        const steps: ClassStep[] = [{ element: root, add: ["is-emerging"] }];
        if (page) steps.push({ element: page, add: ["is-emerging"] });
        return steps;
      },
    };
  }

  if (scene === "world" && intent === "approach") {
    // Quiet emphasis: a remembered world gains presence, no crossing.
    return {
      beats,
      selfSettling: true,
      steps: (phase, { root, subject }) => {
        if (phase === "preparing") return [];
        const steps: ClassStep[] = [{ element: root, add: ["is-approach"] }];
        if (subject) steps.push({ element: subject, add: ["is-approached"] });
        return steps;
      },
    };
  }

  if (scene === "chamber" && intent === "emerge") {
    // Leaving the chamber back into the larger field.
    return {
      beats,
      steps: (_phase, { root }) => [{ element: root, add: ["is-emerging"] }],
    };
  }

  // Generic in-scene intents (focus / return): the runtime manages the
  // universal phase markers; CSS transitions on the persistent state classes
  // (set by the page) do the visible work.
  return {
    beats,
    selfSettling: true,
    steps: () => [],
  };
}

/** Fallback tempo for (scene, intent) pairs without an authored beat profile. */
const FALLBACK_BEATS: SpatialBeatProfile = { preparing: 120, moving: 120 };

let nextId = 1;

function detectReducedMotion(): boolean {
  if (typeof window === "undefined" || typeof window.matchMedia !== "function") return false;
  try {
    return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  } catch {
    return false;
  }
}

type ViewTransitionSupport =
  | { supported: false; start?: undefined }
  | { supported: true; start: (cb: () => void | Promise<void>) => { finished: Promise<void> } };

function viewTransitionSupport(): ViewTransitionSupport {
  const doc = typeof document === "undefined" ? null : document;
  if (!doc || typeof doc.startViewTransition !== "function") return { supported: false };
  return {
    supported: true,
    start: (cb) => doc.startViewTransition(cb),
  };
}

/** Remove every class/dataset key a run applied, and any legacy leftovers. */
function cleanupAll(entry: ClassStep[]) {
  for (const step of entry) {
    for (const cls of step.add) step.element.classList.remove(cls);
    for (const [key, value] of Object.entries(step.dataset ?? {})) {
      if (value !== null) delete step.element.dataset[key];
    }
  }
}

/**
 * Create an isolated runtime. The app uses the shared singleton
 * (`spatialRuntime`) so the single-flight guard holds across components.
 */
export function createSpatialRuntime(): SpatialRuntime {
  let active: {
    entry: ClassStep[];
    handle: SpatialTransitionHandle;
    settle: (result: "finished" | "canceled") => void;
  } | null = null;

  const runtime: SpatialRuntime = {
    isIdle: () => active === null,

    cancelActive() {
      if (!active) return;
      const current = active;
      active = null;
      current.settle("canceled");
    },

    run(options) {
      // Interruption guard: LENA moves once at a time. A second intent while
      // one is in flight is absorbed, never queued — the pointer stays free.
      if (active) return null;

      const reduced = options.reducedMotion ?? detectReducedMotion();
      const vt = viewTransitionSupport();
      const id = nextId++;

      const state: SpatialTransitionState = {
        id,
        intent: options.intent,
        scene: options.scene,
        phase: "idle",
        systemId: options.systemId,
      };

      let resolveDone!: (result: "finished" | "canceled") => void;
      const done = new Promise<"finished" | "canceled">((resolve) => {
        resolveDone = resolve;
      });

      const timers: number[] = [];
      const later = (fn: () => void, ms: number) => {
        timers.push(setTimeout(fn, ms) as unknown as number);
      };

      const root = options.targets.root;
      const targets: SpatialTargets = {
        root,
        page: options.targets.page ?? null,
        subject: options.targets.subject ?? null,
      };
      const choreo = makeChoreography(options.scene, options.intent) ?? {
        beats: FALLBACK_BEATS,
        selfSettling: !options.action,
        steps: () => [],
      };

      /** Everything the run applied — the single list cleanup walks. */
      const entry: ClassStep[] = [];
      let settled = false;
      const settle = (result: "finished" | "canceled") => {
        if (settled) return;
        settled = true;
        for (const t of timers) clearTimeout(t);
        if (active && active.handle === handle) active = null;
        state.phase = "idle";
        cleanupAll(entry);
        resolveDone(result);
      };

      const handle: SpatialTransitionHandle = {
        state,
        done,
        cancel() {
          settle("canceled");
        },
      };
      active = { entry, handle, settle };

      /** Apply universal markers + the scene choreography for one phase. */
      const enterPhase = (phase: PhaseName) => {
        state.phase = phase;
        const universal: ClassStep = {
          element: root,
          add: [BASE_CLASS, intentClass(options.intent), phaseClass(phase)],
        };
        entry.push(universal);
        root.classList.add(BASE_CLASS, intentClass(options.intent), phaseClass(phase));
        for (const stale of ["preparing", "moving", "resolving"].map(phaseClass)) {
          if (stale !== phaseClass(phase)) root.classList.remove(stale);
        }
        for (const step of choreo.steps(phase, targets, options.systemId)) {
          entry.push(step);
          for (const cls of step.add) step.element.classList.add(cls);
          for (const [key, value] of Object.entries(step.dataset ?? {})) {
            if (value === null) delete step.element.dataset[key];
            else step.element.dataset[key] = value;
          }
        }
      };

      const finish = () => settle("finished");

      /**
       * Fire the navigation at the resolving beat. With View Transitions the
       * choreography classes are held until the browser's crossfade finishes,
       * so the snapshot captures the resolved state — then the runtime
       * cleans up and settles.
       */
      const navigate = () => {
        const act = options.action;
        if (!act) return;
        if (vt.supported) {
          const promise = vt.start(() => {
            try {
              act();
            } catch {
              /* a navigation error must never trap the world */
            }
          });
          promise.finished
            .then(finish)
            .catch(finish);
          return;
        }
        try {
          act();
        } catch {
          /* same rule */
        }
        finish();
      };

      const holdAndSettle = () => {
        later(finish, approachSettle);
      };

      // Reduced motion: nothing travels. With a navigation, the move happens
      // after one minimal beat — or rides a plain View Transition crossfade
      // where the browser offers one. No movement classes are ever added, so
      // only opacity changes, which is exactly what reduced motion allows.
      if (reduced && options.action) {
        const act = options.action;
        if (vt.supported) {
          const promise = vt.start(() => {
            try {
              act();
            } catch {
              /* same rule */
            }
          });
          promise.finished
            .then(finish)
            .catch(finish);
        } else {
          later(() => {
            try {
              act();
            } finally {
              finish();
            }
          }, reducedBeat);
        }
        return handle;
      }

      // Reduced motion without an action: nothing visible to do at all.
      if (reduced && !options.action) {
        finish();
        return handle;
      }

      enterPhase("preparing");
      const { preparing, moving } = choreo.beats;

      if (preparing > 0) later(() => enterPhase("moving"), preparing);
      else enterPhase("moving");

      later(() => {
        enterPhase("resolving");
        if (options.action) {
          navigate();
        } else if (choreo.selfSettling) {
          holdAndSettle();
        } else {
          finish();
        }
      }, preparing + moving);

      return handle;
    },
  };

  return runtime;
}

/** The shared runtime: one movement at a time, app-wide. */
export const spatialRuntime = createSpatialRuntime();

/** Strip every class the runtime may have left behind. The route-level
 *  cleanup uses this as a last-resort safety net. */
export function stripSpatialClasses(root: SpatialElement | null | undefined) {
  if (!root) return;
  for (const cls of [
    BASE_CLASS,
    phaseClass("idle"),
    phaseClass("preparing"),
    phaseClass("moving"),
    phaseClass("resolving"),
    intentClass("approach"),
    intentClass("enter"),
    intentClass("descend"),
    intentClass("focus"),
    intentClass("return"),
    intentClass("emerge"),
    "lena-gateway-quiet",
    "lena-gateway-resolve",
    "is-portal",
    "is-portal-resolve",
    "is-emerging",
    "is-approach",
    "is-approached",
  ]) {
    root.classList.remove(cls);
  }
  delete root.dataset.portal;
}
