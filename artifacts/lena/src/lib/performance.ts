/**
 * LENA Performance & SEO Enhancements
 *
 * This module provides utilities for:
 * - Intersection Observer for lazy animations
 * - Smooth scroll behavior
 * - Performance monitoring
 */

/**
 * Hook to detect when an element enters the viewport.
 * Useful for triggering animations only when visible.
 */
export function useIntersectionObserver(
  callback: () => void,
  options: IntersectionObserverInit = { threshold: 0.1 }
) {
  if (typeof window === "undefined") return null;

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        callback();
        observer.unobserve(entry.target);
      }
    });
  }, options);

  return observer;
}

/**
 * Smooth scroll to element with offset for fixed header
 */
export function smoothScrollTo(
  elementId: string,
  offset: number = 100
): void {
  const element = document.getElementById(elementId);
  if (!element) return;

  const elementPosition = element.getBoundingClientRect().top;
  const offsetPosition = elementPosition + window.pageYOffset - offset;

  window.scrollTo({
    top: offsetPosition,
    behavior: "smooth",
  });
}

/**
 * Prefetch critical resources for better perceived performance
 */
export function prefetchResources(urls: string[]): void {
  if (typeof document === "undefined") return;

  urls.forEach((url) => {
    const link = document.createElement("link");
    link.rel = "prefetch";
    link.href = url;
    document.head.appendChild(link);
  });
}

/**
 * Track page load performance metrics
 */
export function trackPerformance(): void {
  if (typeof window === "undefined" || !window.performance) return;

  window.addEventListener("load", () => {
    const timing = window.performance.timing;
    const loadTime = timing.loadEventEnd - timing.navigationStart;

    // Log performance (can be sent to analytics)
    if (process.env.NODE_ENV === "development") {
      console.log(`Page load time: ${loadTime}ms`);
    }
  });
}
