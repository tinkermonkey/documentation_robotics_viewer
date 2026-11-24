import { useCallback, useEffect, useRef } from 'react';
import type {
  GraphViewport,
  GraphViewportCause,
  GraphViewportHandle,
  GraphViewportSnapshot,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore, type ViewportMoveCause } from './uiStore';
import { roundViewport, sameViewport } from './graphViewport';

/**
 * Connects a graph canvas (the Model/Schema GraphCanvas, the Impact lanes, the
 * C4 diagram, which reports the same events) to `uiStore.graphViewport`, which
 * the router mirrors into `?vp=` (see router.tsx). Spread the result onto it.
 * Each recorded viewport carries its cause, a graph move the router's history
 * policy reads: a dwell or fit replaces the entry, a recentre coalesces with
 * the selection it centres on.
 *
 * - Records a viewport when the user stops panning/zooming (`onViewportDwell`)
 *   and when the canvas moves itself (`onViewportNavigate`: the mount fit,
 *   centerOnSelect, toolbar fit, fullscreen fit). The mount fit is recorded
 *   too (#619): the router replaces the entry with it, so every entry holds a
 *   viewport for Back to restore.
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
    (snapshot: GraphViewportSnapshot, cause: ViewportMoveCause) => {
      const vp = roundViewport(snapshot);
      shownRef.current = { key: canvasKey, vp };
      setGraphViewport({ scope: canvasKey, ...vp }, cause);
    },
    [canvasKey, setGraphViewport],
  );

  const onViewportDwell = useCallback(
    (snapshot: GraphViewportSnapshot) => record(snapshot, { kind: 'dwell' }),
    [record],
  );

  // Every canvas move is recorded, the mount fit too (#619): it replaces the
  // entry, so each entry carries the view it was left at and Back can put it back.
  const onViewportNavigate = useCallback(
    (snapshot: GraphViewportSnapshot, cause: GraphViewportCause) => record(snapshot, cause),
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
    onViewportDwell,
    onViewportNavigate,
  };
}
