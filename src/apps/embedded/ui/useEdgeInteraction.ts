/**
 * useEdgeInteraction — the single hook wrapping `GraphCanvas`'s click-to-select
 * edge surface behind one boundary, so if Heimdall's edge-selection props
 * ever change again, only this hook changes — `Canvas.tsx` just spreads
 * `edgeSelectionProps` onto `GraphCanvas` and never touches
 * `uiStore.selectedEdgeId`/`selectEdge` directly.
 *
 * Click-to-select is a native `GraphCanvas` prop pair — `selectedEdgeId`/
 * `onEdgeSelect` fire with a plain edge id and draw the accent-color
 * `.selected` state + keyboard/aria.
 *
 * There is deliberately no hover half here (there was one, briefly, wired to
 * heimdall-ui 0.8.0's `onEdgeHover` — see issue #536/PR #537's initial
 * version): it drove `uiStore.setHighlightedEdgeId`, which is also what
 * `Canvas.tsx`'s `edges` memo keys its `variant: 'hot'` highlight off of —
 * that memo runs on EVERY layer render (`nodes`/`edges` feed `GraphCanvas`'s
 * force-layout effect directly), so wiring hover into it turned every
 * pointer pass over an edge's now-much-larger native hit area (the whole
 * edge, not just the old DOM-hacked predicate label) into a full force-layout
 * recompute. `highlightedEdgeId` is a deliberate, rare, click-triggered
 * highlight — see `uiStore.navigateToElementWithEdge` ("clicking an edge
 * predicate reference navigates to the edge's source node with the edge
 * highlighted") — not a per-pointer-move hover preview, so hover no longer
 * touches it. `GraphCanvas`'s own CSS already renders a (non-accent) `:hover`
 * state for free regardless: `.graph-edge:hover .graph-edge__line{stroke-width:
 * 1.75}`. The predicate hover tooltip itself is unaffected — `Canvas.tsx`'s
 * `edgeTooltip` render-prop gets the hovered edge directly from `GraphCanvas`
 * (heimdall-ui 0.8.0+) and needs no `onEdgeHover` wiring of its own to work.
 */

import { useUiStore } from './uiStore';

export interface UseEdgeInteractionResult {
  selectedEdgeId: string | null;
  /** Spread directly onto `GraphCanvas` to wire up native click-to-select. */
  edgeSelectionProps: {
    selectedEdgeId: string | undefined;
    onEdgeSelect: (edgeId: string) => void;
  };
}

export function useEdgeInteraction(): UseEdgeInteractionResult {
  const selectedEdgeId = useUiStore((s) => s.selectedEdgeId);
  const selectEdge = useUiStore((s) => s.selectEdge);

  return {
    selectedEdgeId,
    edgeSelectionProps: { selectedEdgeId: selectedEdgeId ?? undefined, onEdgeSelect: selectEdge },
  };
}
