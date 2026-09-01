import { useEffect } from "react";
import { useLocation } from "react-router";
import { resetOnceGuard, trackPageView } from "@/lib/analytics";
import { usePreferences } from "@/providers/preferences";

/**
 * Route change side effects in one place.
 *
 * Normal route changes start at the top. A route with a valid hash (e.g.
 * /services#property) scrolls to that section after it mounts — waiting for the
 * (lazy) route chunk to actually render the target, so the scroll never races
 * the Suspense fallback. An invalid hash fails safely at the top. Reduced-motion
 * users get an instant jump instead of smooth scrolling.
 */
const HASH_RETRY_LIMIT = 40; // ~650ms — lazy route chunks must have time to mount

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();
  const { locale } = usePreferences();

  useEffect(() => {
    resetOnceGuard();
    trackPageView(pathname, locale);

    const id = hash.replace(/^#/, "");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const scrollToTarget = (target: HTMLElement) => {
      target.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
    };

    if (id) {
      // The route may still be resolving its lazy chunk; retry a few frames.
      let attempts = 0;
      const tryScroll = () => {
        const target = document.getElementById(id);
        if (target) {
          scrollToTarget(target);
          return;
        }
        attempts += 1;
        if (attempts < HASH_RETRY_LIMIT) requestAnimationFrame(tryScroll);
        else window.scrollTo({ top: 0, left: 0 });
      };
      tryScroll();
    } else {
      window.scrollTo({ top: 0, left: 0 });
    }
  }, [pathname, hash, locale]);

  return null;
}
