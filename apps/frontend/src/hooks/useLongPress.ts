import { useCallback, useRef, useState } from "react";

interface UseLongPressOptions {
  thresholdMs?: number;
  disabled?: boolean;
}

export interface UseLongPressResult {
  progress: number;
  isPressing: boolean;
  handlers: {
    onMouseDown: () => void;
    onMouseUp: () => void;
    onMouseLeave: () => void;
    onTouchStart: () => void;
    onTouchEnd: () => void;
  };
}

export function useLongPress(onComplete: () => void, options: UseLongPressOptions = {}): UseLongPressResult {
  const { thresholdMs = 2000, disabled = false } = options;
  const [progress, setProgress] = useState(0);
  const [isPressing, setIsPressing] = useState(false);
  const startedAtRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const firedRef = useRef(false);

  const stop = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    startedAtRef.current = null;
    setIsPressing(false);
    setProgress(0);
  }, []);

  const tick = useCallback(() => {
    if (startedAtRef.current === null) return;
    const elapsed = Date.now() - startedAtRef.current;
    const ratio = Math.min(1, elapsed / thresholdMs);
    setProgress(ratio);
    if (ratio >= 1) {
      if (!firedRef.current) {
        firedRef.current = true;
        onComplete();
      }
      stop();
      return;
    }
    rafRef.current = requestAnimationFrame(tick);
  }, [onComplete, stop, thresholdMs]);

  const start = useCallback(() => {
    if (disabled || startedAtRef.current !== null) return;
    firedRef.current = false;
    startedAtRef.current = Date.now();
    setIsPressing(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [disabled, tick]);

  return {
    progress,
    isPressing,
    handlers: {
      onMouseDown: start,
      onMouseUp: stop,
      onMouseLeave: stop,
      onTouchStart: start,
      onTouchEnd: stop,
    },
  };
}
