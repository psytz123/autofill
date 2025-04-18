import { useState, useEffect, useRef, RefObject } from 'react';

interface IntersectionObserverOptions {
  root?: Element | null;
  rootMargin?: string;
  threshold?: number | number[];
  triggerOnce?: boolean;
}

/**
 * Custom hook for detecting element intersection with viewport
 * Used for implementing lazy loading, infinite scroll, etc.
 */
export function useIntersectionObserver({
  root = null,
  rootMargin = '0px',
  threshold = 0,
  triggerOnce = false,
}: IntersectionObserverOptions = {}) {
  const [entry, setEntry] = useState<IntersectionObserverEntry | null>(null);
  const [isIntersecting, setIsIntersecting] = useState(false);
  const [hasTriggered, setHasTriggered] = useState(false);
  const elementRef = useRef<Element | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  const updateEntry = ([entry]: IntersectionObserverEntry[]): void => {
    setEntry(entry);
    setIsIntersecting(entry.isIntersecting);
    
    // If triggerOnce is true, we stop observing after the first intersection
    if (triggerOnce && entry.isIntersecting && !hasTriggered) {
      setHasTriggered(true);
      if (elementRef.current && observerRef.current) {
        observerRef.current.unobserve(elementRef.current);
      }
    }
  };

  useEffect(() => {
    const hasIOSupport = !!window.IntersectionObserver;

    if (!hasIOSupport) {
      // Fallback for browsers without IntersectionObserver support
      setIsIntersecting(true);
      return;
    }

    // Disconnect previous observer if element changes
    if (observerRef.current) {
      observerRef.current.disconnect();
    }

    // Skip if triggerOnce is true and we've already triggered
    if (triggerOnce && hasTriggered) {
      return;
    }

    observerRef.current = new IntersectionObserver(updateEntry, {
      root,
      rootMargin,
      threshold,
    });

    const { current: currentObserver } = observerRef;

    if (elementRef.current) {
      currentObserver.observe(elementRef.current);
    }

    return () => currentObserver.disconnect();
  }, [root, rootMargin, threshold, triggerOnce, hasTriggered]);

  // Function to set the reference manually
  const setRef = (element: Element | null) => {
    if (elementRef.current && observerRef.current) {
      observerRef.current.unobserve(elementRef.current);
    }

    elementRef.current = element;

    if (element && observerRef.current && !(triggerOnce && hasTriggered)) {
      observerRef.current.observe(element);
    }
  };

  return { setRef, entry, isIntersecting };
}

export default useIntersectionObserver;