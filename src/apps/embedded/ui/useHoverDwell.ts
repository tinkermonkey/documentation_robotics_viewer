import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Tracks which item the pointer has rested on for at least `delayMs`.
 * Feed `onHover` from a hover-change callback (an id, or undefined on
 * leave); `dwelledId` becomes that id once it has stayed hovered for the
 * full delay, and clears as soon as the hover moves or ends.
 *
 * Used by Canvas to hold the graph's edge predicate tooltip back for
 * `PREDICATE_TOOLTIP_DELAY_MS`, fed from GraphCanvas's `onEdgeHover`.
 */
export function useHoverDwell(delayMs: number) {
  const [dwelledId, setDwelledId] = useState<string | undefined>();
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const onHover = useCallback(
    (id: string | undefined) => {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = null;
      setDwelledId((current) => (current === id ? current : undefined));
      if (id === undefined) return;
      timerRef.current = setTimeout(() => {
        timerRef.current = null;
        setDwelledId(id);
      }, delayMs);
    },
    [delayMs],
  );

  useEffect(
    () => () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    },
    [],
  );

  return { dwelledId, onHover };
}
