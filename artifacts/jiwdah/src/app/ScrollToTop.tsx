import { useEffect } from "react";
import { useLocation } from "react-router";
import { resetOnceGuard, trackPageView } from "@/lib/analytics";
import { usePreferences } from "@/providers/preferences";

/**
 * Route change side effects in one place: scroll to the top, reset the
 * once-per-page-view guard, then record exactly one page view.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();
  const { locale } = usePreferences();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0 });
    resetOnceGuard();
    trackPageView(pathname, locale);
  }, [pathname, locale]);

  return null;
}
