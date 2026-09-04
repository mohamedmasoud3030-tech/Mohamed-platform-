import { useEffect, useRef } from "react";

/**
 * Shared Spatial Language v1 hook — viewport-aware animation gating.
 *
 * Both the homepage Orbit and the World scene use the same contract:
 *   - the scene assembles once when it first enters the viewport,
 *   - expensive continuous work pauses while the scene is offscreen,
 *   - reduced-motion permanently disables travel.
 *
 * Returns a ref to attach to the scene root and the current gates.
 */
export function useSpatialScene<T extends HTMLElement = HTMLDivElement>(options?: { margin?: string }) {
  const rootRef = useRef<T | null>(null);
  const visibleRef = useRef(false);
  const enteredRef = useRef(false);
  const reducedRef = useRef(false);
  const margin = options?.margin ?? "48px";

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    reducedRef.current = mq.matches;
    const onMq = (event: MediaQueryListEvent) => {
      reducedRef.current = event.matches;
    };
    mq.addEventListener?.("change", onMq);

    const io = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry.isIntersecting) {
          if (!enteredRef.current) {
            enteredRef.current = true;
            root.classList.add("is-visible");
          }
          visibleRef.current = true;
          root.classList.remove("is-away");
        } else {
          visibleRef.current = false;
          root.classList.add("is-away");
        }
      },
      { threshold: 0.08, rootMargin: margin },
    );
    io.observe(root);

    return () => {
      io.disconnect();
      mq.removeEventListener?.("change", onMq);
    };
  }, [margin]);

  return { rootRef, visibleRef, enteredRef, reducedRef };
}
