import { useCallback, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { track } from "@/lib/analytics";
import {
  buildSpatialState,
  useReducedMotion,
  worldMemory,
  type SpatialElement,
  type SpatialTargets,
} from "@/lib/spatial";
import { spatialRuntime } from "@/lib/spatial";

/**
 * Cinematic exit from LENA World into one system — the `descend` intent on
 * the canonical spatial runtime:
 *
 *   1. the world and the chosen system isolate together (is-portal),
 *   2. the chosen system aligns with the Sacred Core (is-portal-resolve),
 *   3. the cross fires into the system's calm chamber.
 *
 * Selection has already established meaning; this transition turns the final
 * action into spatial approach rather than a dead link. Navigation remains
 * deterministic and accessible: the runtime is single-flight (fast clicks
 * cannot stack), cancellable, self-cleaning, and reduced-motion skips the
 * choreography entirely.
 *
 * The event is optional: the in-scene "open chamber" action passes its own
 * anchor, while the world's system list calls the same transition from
 * outside the scene — one owner, every exit.
 */
export function useWorldPortalTransition() {
  const navigate = useNavigate();
  const reduced = useReducedMotion();

  return useCallback(
    (destination: string, systemId: string, event?: MouseEvent<HTMLElement>) => {
      if (event) event.preventDefault();

      const world =
        (event ? event.currentTarget.closest<HTMLElement>(".lena-world") : null) ??
        document.querySelector<HTMLElement>(".lena-world");
      const page = world?.closest<HTMLElement>(".lena-world-page") ?? null;
      const selected = world?.querySelector<HTMLElement>(".lena-world-entity.is-selected") ?? null;

      track("primary_action_clicked", {
        surface: "world_portal",
        context: systemId,
      });

      // The chamber is the first deep destination of the journey: this is
      // where the first-time spatial introduction is considered experienced.
      worldMemory.remember({ systemId });
      worldMemory.markIntroSeen();

      const fallback = () =>
        navigate(destination, {
          state: buildSpatialState({ origin: "/world", intent: "descend", systemId }),
        });

      if (!world) {
        fallback();
        return;
      }

      if (selected) selected.setAttribute("aria-busy", "true");

      const targets: SpatialTargets = {
        root: world as unknown as SpatialElement,
        page: page as unknown as SpatialTargets["page"],
        subject: selected as unknown as SpatialTargets["subject"],
      };

      const handle = spatialRuntime.run({
        intent: "descend",
        scene: "world",
        targets,
        systemId,
        reducedMotion: reduced,
        action: fallback,
      });
      if (!handle) return; // a transition is already in flight — the click is absorbed

      handle.done.then(() => {
        selected?.removeAttribute("aria-busy");
      });
    },
    [navigate, reduced],
  );
}
