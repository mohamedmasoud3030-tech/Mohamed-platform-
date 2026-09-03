/**
 * LENA Spatial Motion Tokens — the small, coherent grammar of movement.
 *
 * The CSS custom properties in `styles/spatial-tokens.css` are the same
 * grammar expressed for stylesheets. When a value lives in both places the
 * two must agree; change one, change the other, in the same commit.
 *
 * Grammar in one breath:
 *   durations  — four speeds, nothing else
 *   easing     — settle (forward), emerge (backward), drift (ambient)
 *   depth      — recede / approach / dominant scale steps
 *   presence   — three opacity tiers
 *   beats      — the per-scene tempo of approach → resolve
 */

/** Seconds. */
export const spatialDuration = {
  /** Micro feedback: press responses, focus rings. */
  fast: 0.28,
  /** One beat: a single class change lands. */
  beat: 0.42,
  /** Standard spatial move: one scene step. */
  standard: 0.62,
  /** Deep move: crossing between major spaces. */
  deep: 0.9,
  /** Settle: the world comes to rest after arriving. */
  settle: 1.1,
} as const;

/** CSS cubic-bezier quartets. */
export const spatialEase = {
  /** Forward motion: confident arrival that lands and stops. */
  settle: "cubic-bezier(0.22, 1, 0.36, 1)",
  /** Backward motion: releasing outward, a touch faster off the mark. */
  emerge: "cubic-bezier(0.16, 0.84, 0.26, 1)",
  /** Ambient life: slow breathing, orbits, drift. */
  drift: "cubic-bezier(0.4, 0, 0.2, 1)",
} as const;

/** Depth steps — scale only. Position travel stays in scene CSS. */
export const spatialDepth = {
  /** A receding field. */
  recede: 0.96,
  /** The resting plane. */
  rest: 1,
  /** A destination gaining presence. */
  approach: 1.08,
  /** The portal resolve: the subject takes over the view. */
  dominant: 1.5,
} as const;

/** Presence tiers — opacity only. */
export const spatialPresence = {
  /** Fully present. */
  near: 1,
  /** Far but readable. */
  far: 0.68,
  /** Present but yielding authority. */
  faded: 0.16,
  /** Gone. */
  hidden: 0,
} as const;

/** Stagger between siblings inside a scene (seconds). */
export const spatialStagger = {
  item: 0.08,
} as const;

/**
 * Beats — how long each phase holds before the next, per scene and intent.
 * These are the authoritative tempos; the runtime times everything from here.
 *
 * `preparing` = the scene prepares (quiets, isolates the subject).
 * `moving`    = the movement itself (corridor, recession, approach).
 * Navigation, when any, fires at the start of `resolving`.
 */
export interface SpatialBeatProfile {
  preparing: number;
  moving: number;
}

export type SpatialSceneKey = "home" | "world" | "chamber";

export const spatialBeats = {
  home: {
    // The gateway: the field quiets (240ms), the center resolves and holds
    // (380ms), the cross fires at 620ms — inside the 450–750ms target.
    enter: { preparing: 240, moving: 380 },
    descend: { preparing: 240, moving: 380 },
  },
  world: {
    // The portal: isolate (is-portal), align (is-portal-resolve), then cross.
    descend: { preparing: 190, moving: 290 },
    // Emerging back toward the house: quick, outward.
    emerge: { preparing: 60, moving: 220 },
    // Quiet emphasis on a remembered world — no crossing at all.
    approach: { preparing: 0, moving: 720 },
  },
  chamber: {
    // Emerging back into the larger field.
    emerge: { preparing: 60, moving: 200 },
  },
} as const satisfies Record<SpatialSceneKey, Record<string, SpatialBeatProfile>>;

/** Ambient emphasis duration for an `approach` beat that does not navigate. */
export const approachSettle = 950;

/** Reduced-motion: a single minimal beat, nothing travels. */
export const reducedBeat = 90;
