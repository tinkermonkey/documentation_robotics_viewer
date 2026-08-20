/**
 * useEdgeInteraction — the single hook encapsulating ALL SVG-level coupling to
 * `GraphCanvas`'s edges (hover, leave, and click-to-select) for the Model view.
 * If Heimdall ever changes how edge interaction is exposed (event delegation
 * today for hover; native `selectedEdgeId`/`onEdgeSelect` props for click),
 * only this hook changes — `Canvas.tsx` just spreads its returned prop bags
 * onto `GraphCanvas` and never touches either mechanism directly.
 *
 * Hover: `GraphCanvas` renders every edge internally (no `renderEdge`/hover-callback
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
 *
 * Click-to-select: `GraphCanvas` (heimdall-ui 0.7.0+) exposes native
 * `selectedEdgeId`/`onEdgeSelect` props, so there's no delegation to do —
 * this hook still owns wiring them to `uiStore.selectedEdgeId`/`selectEdge`
 * and hands back a ready-to-spread `edgeSelectionProps` bag so the native
 * props stay behind the same hook boundary as the delegated hover handlers.
 *
 * HEIMDALL DEPENDENCY: This hook depends on Heimdall's internal CSS class
 * `.graph-edge__label` and data-testid format `graph-edge-{id}`. If Heimdall
 * upgrades change these conventions, matchEdgeLabel will return null for all
 * events and edge hover/highlighting will silently stop working. The hook
 * logs warnings to the browser console when the DOM structure doesn't match
 * expectations, making such breakage detectable in CI/E2E runs.
 */

import { useCallback, useState, type MouseEvent } from 'react';
import { useUiStore } from './uiStore';

const EDGE_TESTID_PREFIX = 'graph-edge-';
const EDGE_LABEL_CLASS = 'graph-edge__label';

interface EdgeLabelMatch {
  edgeId: string;
  labelEl: Element;
}

/**
 * Walks up the DOM from an event target to find an edge predicate label and
 * its parent edge element, extracting the edge ID from the data-testid.
 *
 * Returns null if either Heimdall's CSS class or data-testid format is not
 * found, logging a warning to help detect Heimdall upgrade breakage.
 */
function matchEdgeLabel(target: EventTarget | null): EdgeLabelMatch | null {
  if (!(target instanceof Element)) return null;

  const labelEl = target.closest(`.${EDGE_LABEL_CLASS}`);
  if (!labelEl) {
    // Not a hover event on an edge label; silent no-match for non-edge targets.
    return null;
  }

  const edgeEl = labelEl.closest(`[data-testid^="${EDGE_TESTID_PREFIX}"]`);
  if (!edgeEl) {
    console.warn(
      `[useEdgeInteraction] Found .${EDGE_LABEL_CLASS} element but no parent [data-testid^="${EDGE_TESTID_PREFIX}"] ancestor. ` +
      `Heimdall's edge DOM structure may have changed.`,
      { labelEl, edgeEl }
    );
    return null;
  }

  const testId = edgeEl.getAttribute('data-testid');
  if (!testId) {
    console.warn(
      `[useEdgeInteraction] Found [data-testid^="${EDGE_TESTID_PREFIX}"] element but data-testid attribute is missing. ` +
      `Heimdall's edge rendering may have changed.`,
      { edgeEl }
    );
    return null;
  }

  const edgeId = testId.slice(EDGE_TESTID_PREFIX.length);
  if (!edgeId) {
    console.warn(
      `[useEdgeInteraction] data-testid="${testId}" does not have a non-empty suffix after "${EDGE_TESTID_PREFIX}". ` +
      `Heimdall's edge ID format may have changed.`,
      { testId }
    );
    return null;
  }

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
  const [hovered, setHovered] = useState<HoveredEdge | null>(null);

  const onMouseOver = useCallback(
    (e: MouseEvent) => {
      const match = matchEdgeLabel(e.target);
      if (!match) {
        // Silent return for non-edge targets; matchEdgeLabel logs warnings
        // if the Heimdall DOM structure is broken.
        return;
      }
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
      if (!match) {
        // Silent return for non-edge targets; matchEdgeLabel logs warnings
        // if the Heimdall DOM structure is broken.
        return;
      }
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
    selectedEdgeId,
    edgeSelectionProps: { selectedEdgeId: selectedEdgeId ?? undefined, onEdgeSelect: selectEdge },
  };
}
