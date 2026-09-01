import { useCallback, useRef, type MouseEvent } from "react";
import { useNavigate } from "react-router";
import { track } from "@/lib/analytics";

/**
 * Cinematic exit from LENA World into one system.
 *
 * Selection has already established meaning; this transition turns the final
 * action into spatial approach rather than a dead link:
 *   1. unrelated systems + page copy recede,
 *   2. the chosen signal path becomes a corridor,
 *   3. the chosen body approaches the Sacred Core / viewer,
 *   4. navigation lands in the system's calm World chamber.
 *
 * Navigation remains deterministic and accessible. Reduced-motion skips the
 * choreography entirely. View Transitions enhance the final hand-off when the
 * browser supports them; the CSS path is the authoritative fallback.
 */
export function useWorldPortalTransition() {
  const navigate = useNavigate();
  const inFlight = useRef(false);

  return useCallback(
    (event: MouseEvent<HTMLAnchorElement>, destination: string, systemId: string) => {
      event.preventDefault();
      if (inFlight.current) return;

      const world = event.currentTarget.closest<HTMLElement>(".lena-world");
      const page = world?.closest<HTMLElement>(".lena-world-page") ?? null;
      const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
      const arrivalState = { fromWorldPortal: true, systemId };

      track("primary_action_clicked", {
        surface: "world_portal",
        context: systemId,
      });

      if (!world || reduce) {
        navigate(destination, { state: arrivalState });
        return;
      }

      inFlight.current = true;
      world.dataset.portal = systemId;
      world.classList.add("is-portal");
      page?.classList.add("is-portal");

      const selected = world.querySelector<HTMLElement>(".lena-world-entity.is-selected");
      selected?.setAttribute("aria-busy", "true");

      const cleanup = () => {
        world.classList.remove("is-portal", "is-portal-resolve");
        delete world.dataset.portal;
        page?.classList.remove("is-portal");
        selected?.removeAttribute("aria-busy");
        inFlight.current = false;
      };

      // First beat: isolate the chosen system. Second beat: approach / awaken.
      window.setTimeout(() => {
        world.classList.add("is-portal-resolve");
      }, 190);

      const canViewTransition = typeof document.startViewTransition === "function";
      if (canViewTransition) {
        window.setTimeout(() => {
          const transition = document.startViewTransition(() => {
            navigate(destination, { state: arrivalState });
          });
          transition.finished.then(cleanup).catch(cleanup);
        }, 480);
      } else {
        window.setTimeout(() => {
          navigate(destination, { state: arrivalState });
          // Usually the World unmounts immediately. This is only a safety net
          // for a prevented navigation or a same-document destination.
          window.setTimeout(cleanup, 320);
        }, 680);
      }
    },
    [navigate],
  );
}
