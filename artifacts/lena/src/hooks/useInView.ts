import { useEffect, useRef, useState } from "react";

/**
 * Hook to detect when an element enters the viewport.
 * Returns a ref to attach to the element and a boolean indicating visibility.
 *
 * @param options IntersectionObserver options
 * @param once If true, stops observing after first intersection
 */
export function useInView(
  options: IntersectionObserverInit = { threshold: 0.1, rootMargin: "0px 0px -50px 0px" },
  once: boolean = true
): [React.RefObject<HTMLElement | null>, boolean] {
  const ref = useRef<HTMLElement | null>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setIsInView(true);
        if (once) observer.unobserve(element);
      } else if (!once) {
        setIsInView(false);
      }
    }, options);

    observer.observe(element);
    return () => observer.disconnect();
  }, [options.threshold, options.rootMargin, once]);

  return [ref, isInView];
}

/**
 * Hook to animate elements when they enter the viewport.
 * Adds a CSS class when visible.
 */
export function useScrollAnimation(
  className: string = "is-visible",
  options?: IntersectionObserverInit
) {
  const [ref, isInView] = useInView(options);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    if (isInView) {
      element.classList.add(className);
    } else {
      element.classList.remove(className);
    }
  }, [isInView, className, ref]);

  return ref;
}
