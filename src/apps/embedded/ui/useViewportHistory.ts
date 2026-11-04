import { useCallback, useEffect, useRef } from 'react';
import type {
  GraphViewport,
  GraphViewportCause,
  GraphViewportHandle,
  GraphViewportSnapshot,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { roundViewport, sameViewport } from './graphViewport';

/**
 * Connects the Model/Schema GraphCanvas to `uiStore.graphViewport`, which the
 * router mirrors into `?vp=` (see router.tsx). Spread the result onto
 * GraphCanvas.
 *
 * - Records a viewport when the user stops panning/zooming (`onViewportDwell`)
 *   and when the canvas moves itself (`onViewportNavigate`: centerOnSelect,
 *   toolbar fit, fullscreen fit). The mount fit isn't recorded, so a plain
 *   link stays plain until someone actually moves.
 * - Restores the stored viewport at mount (`initialViewport`, for reloads and
 *   deep links) and when it changes from outside, i.e. back/forward, through a
 *   silent `setViewport` so the restore doesn't record a new entry. The silent
 *   call also cancels the pending centerOnSelect report when the same
 *   back/forward step restores a selection.
 */
export function useViewportHistory(canvasKey: string) {
  const graphViewport = useUiStore((s) => s.graphViewport);
  const setGraphViewport = useUiStore((s) => s.setGraphViewport);
  const viewportRef = useRef<GraphViewportHandle>(null);
  // The viewport the canvas is showing as far as we know: the last one it
  // reported or the last one we applied. A store value equal to this came
  // from the canvas itself and must not be applied back to it.
  const shownRef = useRef<{ key: string; vp: GraphViewport } | null>(null);

  const scoped = graphViewport && graphViewport.scope === canvasKey ? graphViewport : null;

  const record = useCallback(
    (snapshot: GraphViewportSnapshot) => {
      const vp = roundViewport(snapshot);
      shownRef.current = { key: canvasKey, vp };
      setGraphViewport({ scope: canvasKey, ...vp });
    },
    [canvasKey, setGraphViewport],
  );

  const onViewportNavigate = useCallback(
    (snapshot: GraphViewportSnapshot, cause: GraphViewportCause) => {
      if (cause.kind === 'fit' && cause.reason === 'mount') return;
      record(snapshot);
    },
    [record],
  );

  useEffect(() => {
    if (!scoped) return;
    const shown = shownRef.current;
    if (shown && shown.key === canvasKey && sameViewport(shown.vp, scoped)) return;
    const vp: GraphViewport = { center: scoped.center, zoom: scoped.zoom };
    shownRef.current = { key: canvasKey, vp };
    // Before the canvas has framed its first layout this just replaces that
    // framing, same as initialViewport, so the mount case is harmless too.
    viewportRef.current?.setViewport(vp, { silent: true, animate: true });
  }, [scoped, canvasKey]);

  return {
    viewportRef,
    initialViewport: scoped ? { center: scoped.center, zoom: scoped.zoom } : undefined,
    onViewportDwell: record,
    onViewportNavigate,
  };
}
