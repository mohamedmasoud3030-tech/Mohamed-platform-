import { useCallback } from "react";
import { useNavigate } from "react-router";
import { track } from "@/lib/analytics";

/**
 * Gateway interaction from the homepage into LENA World.
 *
 * The real CTA ("Enter LENA") attaches to this handler. The sequence:
 *   1. the homepage field quiets (orbit + copy fade, LENA house resolves),
 *   2. the LENA center expands,
 *   3. navigation happens — via the View Transitions API when safely
 *      supported (capturing the quieted homepage and cross-fading into the
 *      World surface), otherwise via a timed CSS fallback.
 *
 * Total target ~450–750ms. Under reduced-motion we navigate immediately.
 * No scroll hijacking; the transition is an enhancement, never a blocker.
 */
export function useGatewayToWorld() {
  const navigate = useNavigate();

  return useCallback(() => {
    const root = document.querySelector(".lena-public");
    if (!root) {
      navigate("/world");
      return;
    }

    // Reduced motion: navigate immediately with a minimal opacity change.
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      root.classList.add("lena-gateway-quiet");
      window.setTimeout(() => {
        root.classList.remove("lena-gateway-quiet");
        navigate("/world");
      }, 90);
      return;
    }

    track("world_entered", { surface: "home_primary_cta" });

    const cleanup = () => {
      root.classList.remove("lena-gateway-quiet", "lena-gateway-resolve");
    };
    const go = () => {
      cleanup();
      navigate("/world");
    };

    // 1. Quiet the field first so the preserved frame shows the LENA center.
    root.classList.add("lena-gateway-quiet");

    const canViewTransition = typeof document.startViewTransition === "function";

    if (canViewTransition) {
      // 2. Let the field fade, then capture and cross-fade into the World.
      window.setTimeout(() => {
        root.classList.add("lena-gateway-resolve");
        const vt = document.startViewTransition(() => {
          navigate("/world");
        });
        vt.finished.then(cleanup).catch(cleanup);
      }, 240);
    } else {
      // CSS-only fallback: field quiets, center resolves, then navigate.
      window.setTimeout(() => {
        root.classList.add("lena-gateway-resolve");
      }, 240);
      window.setTimeout(go, 620);
    }
  }, [navigate]);
}
