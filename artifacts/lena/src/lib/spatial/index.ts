/**
 * LENA Spatial Continuity — public API.
 *
 * One barrel for the whole subsystem so pages import a single, stable
 * surface: the memory runtime, the transition runtime, the motion tokens
 * and the navigation layer.
 */

export type {
  LenaSpace,
  SpatialDirection,
  SpatialElement,
  SpatialIntent,
  SpatialNavState,
  SpatialPhase,
  SpatialRoute,
  SpatialScene,
  SpatialSpace,
  SpatialTargets,
} from "./types";

export {
  approachSettle,
  reducedBeat,
  spatialBeats,
  spatialDepth,
  spatialDuration,
  spatialEase,
  spatialPresence,
  spatialStagger,
  type SpatialBeatProfile,
} from "./tokens";

export {
  createSpatialRuntime,
  spatialRuntime,
  stripSpatialClasses,
  type SpatialRuntime,
  type SpatialTransitionHandle,
  type SpatialTransitionOptions,
  type SpatialTransitionState,
} from "./runtime";

export {
  emptySpatialMemory,
  SPATIAL_MEMORY_VERSION,
  type SpatialEntryContext,
  type SpatialInnerDestination,
  type SpatialMemory,
  type SpatialMemoryInput,
  type SpatialNavigationRecord,
} from "./memory/types";

export {
  createLocalStorageStorage,
  createMemoryStorage,
  parseStoredMemory,
  serializeMemory,
  SPATIAL_MEMORY_KEY,
  type SpatialMemoryStorage,
} from "./memory/storage";

export {
  createWorldMemory,
  worldMemory,
  type WorldMemoryRuntime,
} from "./memory/worldMemory";

export { useIsFirstVisit, useWorldMemory } from "./memory/react";

export {
  resolveContinuation,
  resolveRememberedFocus,
  type Continuation,
  type WorldRegistry,
} from "./continuation";

export {
  buildSpatialState,
  detectDirection,
  parentPathOf,
  parseSpatialRoute,
  readHistoryIndex,
  readSpatialState,
  resetNavigationDirectionTracking,
  trackNavigationIndex,
  useNavigationDirection,
  useReducedMotion,
  useSpatialContext,
  useSpatialRoute,
  type NavigationDirection,
  type SpatialContext,
} from "./navigation/context";

export {
  recordEntryContext,
  useSpatialNavigate,
  type SpatialBackOptions,
  type SpatialBackResult,
  type SpatialGoOptions,
} from "./navigation/navigate";
