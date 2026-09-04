import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "@/lib/analytics";
import {
  buildSpatialState,
  spatialRuntime,
  useReducedMotion,
  worldMemory,
  type SpatialTargets,
} from "@/lib/spatial";

/**
 * Gateway interaction from the homepage into LENA World.
 *
 * The real CTA ("Enter the world") attaches to this handler. The choreography
 * is owned by the canonical spatial runtime with the `enter` intent:
 *
 *   1. the homepage field quiets (orbit + copy fade, LENA house resolves),
 *   2. the LENA center resolves,
 *   3. navigation happens — on the View Transitions API when safely
 *      supported, otherwise directly.
 *
 * Reduced-motion visitors cross immediately with a minimal beat. No scroll
 * hijacking; the transition is an enhancement, never a blocker.
 */
export function useGatewayToWorld() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  return useCallback(() => {
    track("world_entered", { surface: "home_primary_cta" });

    const root = document.querySelector<HTMLElement>(".lena-public");
    if (!root) {
      navigate("/world", {
        state: buildSpatialState({ origin: "/", intent: "enter" }),
      });
      return;
    }

    worldMemory.remember({ entryContext: "gateway" });

    const targets: SpatialTargets = { root: root as unknown as SpatialTargets["root"] };
    spatialRuntime.run({
      intent: "enter",
      scene: "home",
      targets,
      reducedMotion: reduced,
      action: () =>
        navigate("/world", {
          state: buildSpatialState({ origin: "/", intent: "enter" }),
        }),
    });
  }, [navigate, reduced]);
}
