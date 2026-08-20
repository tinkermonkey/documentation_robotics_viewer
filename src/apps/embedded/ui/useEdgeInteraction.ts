/**
 * useEdgeInteraction — hover detection for Model graph edge predicates via
 * SVG event delegation, driving both the `uiStore.highlightedEdgeId` "hot"
 * preview and the `EdgeHoverTooltip` anchor.
 *
 * `GraphCanvas` renders every edge internally (no `renderEdge`/hover-callback
 * slot), so there's no per-edge trigger element to attach `RichTooltip`-style
 * hover wiring to directly. Instead this attaches ONE pair of
 * mouseover/mouseout handlers to the graph's container (via the returned
 * `edgeHoverHandlers`, spread onto that container) and delegates: each
 * bubbled event's `target` is walked up to the nearest `.graph-edge__label`
 * (only the predicate label itself is a hover target — not the invisible
 * hit-stroke along the whole edge, matching "hovering an edge predicate")
 * and, from there, the nearest `[data-testid^="graph-edge-"]` ancestor
 * `GraphCanvas` itself renders, whose id suffix is the edge's id.
 *
 * `mouseout`'s `relatedTarget` check mirrors `Canvas.tsx`'s
 * `collapseIfLeavingFlyout` — only clears when the pointer actually left the
 * label (not just moved between the label's own background/text children).
 */

import { useCallback, useState, type MouseEvent } from 'react';
import { useUiStore } from './uiStore';

const EDGE_TESTID_PREFIX = 'graph-edge-';

interface EdgeLabelMatch {
  edgeId: string;
  labelEl: Element;
}

function matchEdgeLabel(target: EventTarget | null): EdgeLabelMatch | null {
  if (!(target instanceof Element)) return null;
  const labelEl = target.closest('.graph-edge__label');
  if (!labelEl) return null;
  const edgeEl = labelEl.closest(`[data-testid^="${EDGE_TESTID_PREFIX}"]`);
  const testId = edgeEl?.getAttribute('data-testid');
  if (!testId) return null;
  const edgeId = testId.slice(EDGE_TESTID_PREFIX.length);
  if (!edgeId) return null;
  return { edgeId, labelEl };
}

export interface HoveredEdge {
  edgeId: string;
  anchorRect: DOMRect;
}

export interface UseEdgeInteractionResult {
  hoveredEdgeId: string | null;
  hoveredEdgeAnchor: DOMRect | null;
  /** Spread onto the graph container element to wire up delegation. */
  edgeHoverHandlers: {
    onMouseOver: (e: MouseEvent) => void;
    onMouseOut: (e: MouseEvent) => void;
  };
}

export function useEdgeInteraction(): UseEdgeInteractionResult {
  const setHighlightedEdgeId = useUiStore((s) => s.setHighlightedEdgeId);
  const [hovered, setHovered] = useState<HoveredEdge | null>(null);

  const onMouseOver = useCallback(
    (e: MouseEvent) => {
      const match = matchEdgeLabel(e.target);
      if (!match) return;
      setHighlightedEdgeId(match.edgeId);
      setHovered((prev) => {
        if (prev?.edgeId === match.edgeId) return prev;
        return { edgeId: match.edgeId, anchorRect: match.labelEl.getBoundingClientRect() };
      });
    },
    [setHighlightedEdgeId],
  );

  const onMouseOut = useCallback(
    (e: MouseEvent) => {
      const match = matchEdgeLabel(e.target);
      if (!match) return;
      if (match.labelEl.contains(e.relatedTarget as Node | null)) return;
      setHighlightedEdgeId(null);
      setHovered(null);
    },
    [setHighlightedEdgeId],
  );

  return {
    hoveredEdgeId: hovered?.edgeId ?? null,
    hoveredEdgeAnchor: hovered?.anchorRect ?? null,
    edgeHoverHandlers: { onMouseOver, onMouseOut },
  };
}
