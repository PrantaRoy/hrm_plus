import { useEffect, useRef, useState } from "react";

/**
 * Reveals an element once when it scrolls into view. Returns a ref to attach and
 * a boolean that flips to true on first intersection (and stays true).
 */
export function useInView<T extends HTMLElement = HTMLDivElement>(
  options: IntersectionObserverInit = { threshold: 0.15, rootMargin: "0px 0px -10% 0px" }
): [React.RefObject<T>, boolean] {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || inView) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setInView(true);
        observer.disconnect();
      }
    }, options);
    observer.observe(el);
    // Safety net: never leave content permanently hidden if the observer
    // misfires (e.g. content mounted below the fold after an async fetch).
    const fallback = window.setTimeout(() => setInView(true), 2500);
    return () => {
      observer.disconnect();
      window.clearTimeout(fallback);
    };
    // options is a fresh object each render; intentionally run once per mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView]);

  return [ref, inView];
}
