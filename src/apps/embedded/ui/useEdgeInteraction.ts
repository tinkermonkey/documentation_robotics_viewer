/**
 * useEdgeInteraction — the single hook wrapping ALL of `GraphCanvas`'s edge
 * interaction surface (hover highlight + click-to-select) behind one
 * boundary, so if Heimdall's edge-interaction props ever change again, only
 * this hook changes — `Canvas.tsx` just spreads its returned prop bags onto
 * `GraphCanvas` and never touches `uiStore.selectedEdgeId`/`selectEdge`/
 * `setHighlightedEdgeId` directly.
 *
 * Both hover and click-to-select are native `GraphCanvas` (heimdall-ui
 * 0.8.0+) props — `onEdgeHover`/`onEdgeSelect` fire with a plain edge id
 * (`selectedEdgeId` pairs with `onEdgeSelect` to draw the accent-color
 * `.selected` state). Previously (0.7.0) `GraphCanvas` had no per-edge hover
 * callback, so hover was faked with a DOM-delegation hack listening for
 * Heimdall's internal `.graph-edge__label` class / `graph-edge-{id}`
 * data-testid convention directly — see issue #536 / git history for that
 * version. `onEdgeHover` replaces it outright: no DOM coupling, and it also
 * fires for the whole edge (its invisible hit-stroke included), not just the
 * predicate label.
 */

import { useCallback } from 'react';
import { useUiStore } from './uiStore';

export interface UseEdgeInteractionResult {
  /** Spread directly onto `GraphCanvas` to wire up native hover highlighting. */
  edgeHoverProps: {
    onEdgeHover: (edgeId: string | undefined) => void;
  };
  selectedEdgeId: string | null;
  /** Spread directly onto `GraphCanvas` to wire up native click-to-select. */
  edgeSelectionProps: {
    selectedEdgeId: string | undefined;
    onEdgeSelect: (edgeId: string) => void;
  };
}

export function useEdgeInteraction(): UseEdgeInteractionResult {
  const setHighlightedEdgeId = useUiStore((s) => s.setHighlightedEdgeId);
  const selectedEdgeId = useUiStore((s) => s.selectedEdgeId);
  const selectEdge = useUiStore((s) => s.selectEdge);

  const onEdgeHover = useCallback(
    (edgeId: string | undefined) => setHighlightedEdgeId(edgeId ?? null),
    [setHighlightedEdgeId],
  );

  return {
    edgeHoverProps: { onEdgeHover },
    selectedEdgeId,
    edgeSelectionProps: { selectedEdgeId: selectedEdgeId ?? undefined, onEdgeSelect: selectEdge },
  };
}
