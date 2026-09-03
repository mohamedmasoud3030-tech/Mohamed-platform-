/**
 * LENA Spatial Continuity — shared vocabulary.
 *
 * One small typed contract shared by the spatial memory runtime, the
 * transition runtime and the navigation layer. Everything spatial in LENA
 * (which space we are in, which direction we moved, what we intend) is
 * expressed in these terms so the pieces stay composable.
 */

/** The semantic intents of movement through LENA. Exact choreography is the runtime's business. */
export type SpatialIntent =
  | "approach" // the destination gains presence; no scene change yet
  | "enter" // the current field recedes and the destination takes over
  | "descend" // the visitor moves deeper inside a world
  | "focus" // context remains visible while one object becomes dominant
  | "return" // depth reverses one level (inward focus released)
  | "emerge"; // depth reverses out toward a larger field

/** Coarse phase vocabulary for any spatial transition. */
export type SpatialPhase = "idle" | "preparing" | "moving" | "resolving";

/** Direction of movement in the world, independent of browser history. */
export type SpatialDirection = "forward" | "back";

/** The three route-level LENA spaces. The home gateway is the threshold. */
export type LenaSpace = "home" | "world" | "chamber";

/** Which surface the transition choreography runs on. */
export type SpatialScene = "home" | "world" | "chamber";

/** A LENA route, resolved from the router-relative pathname. */
export interface SpatialRoute {
  space: LenaSpace;
  /** Present for chambers only. */
  systemId?: string;
  /** Router-relative path, e.g. "/world/property". */
  path: string;
}

/** The minimal element surface the transition runtime touches. Structurally
 *  satisfied by `Element`; fakes in tests implement the same shape. */
export interface SpatialElement {
  classList: {
    add: (...classes: string[]) => void;
    remove: (...classes: string[]) => void;
    contains: (cls: string) => boolean;
    toggle: (cls: string, force?: boolean) => void;
  };
  dataset: Record<string, string>;
}

/** Elements a transition may address. */
export interface SpatialTargets {
  /** The scene root that receives phase and intent classes. */
  root: SpatialElement;
  /** An optional page wrapper (e.g. .lena-world-page) for copy recession. */
  page?: SpatialElement | null;
  /** The subject that approaches / becomes dominant (e.g. a world entity). */
  subject?: SpatialElement | null;
}

/** Typed payload LENA stores in router `location.state` for spatial arrivals.
 *  Never required for routing correctness — the URL always stands alone. */
export interface SpatialNavState {
  spatial: {
    /** Router-relative path we moved from. */
    origin: string;
    /** The intent that brought the visitor to this route. */
    intent: SpatialIntent;
    /** Which system the movement is about, when one exists. */
    systemId?: string;
    /** Whether this was a forward move or a back move. */
    mode: SpatialDirection;
  };
}
