/**
 * EdgeHoverTooltip — the `PredicateTooltip` card, positioned against a
 * hovered Model graph edge's predicate label.
 *
 * `RichTooltip`/`PredicateTooltip` open/close from real hover/focus events on
 * a literal `children` trigger they wrap — impossible here, since the edge
 * label is rendered internally by `GraphCanvas`'s own SVG tree (no slot to
 * wrap it in). `useEdgeInteraction` instead delegates hover detection at the
 * canvas container and hands back the hovered label element's own
 * `getBoundingClientRect()` as `anchorRect`; this component reuses
 * `RichTooltip`'s exported `computeTooltipPosition` placement math and
 * `PredicateTooltip`'s extracted `PredicateTooltipContent` card body against
 * that anchor, portaled the same way `RichTooltip` itself portals (so it
 * isn't clipped by `GraphCanvas`'s `overflow: hidden`).
 */

import { createPortal } from 'react-dom';
import { useLayoutEffect, useRef, useState } from 'react';
import { computeTooltipPosition, type TooltipPosition, type TooltipPlacement } from './RichTooltip';
import { PredicateTooltipContent } from './PredicateTooltip';

export interface EdgeHoverTooltipProps {
  /** The hovered edge label's viewport rect (see `useEdgeInteraction`). */
  anchorRect: DOMRect;
  predicate: string;
  sourceTypeLabel: string;
  destinationTypeLabel: string;
  placement?: TooltipPlacement;
}

export function EdgeHoverTooltip({
  anchorRect,
  predicate,
  sourceTypeLabel,
  destinationTypeLabel,
  placement = 'top',
}: EdgeHoverTooltipProps) {
  const cardRef = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<TooltipPosition | null>(null);

  useLayoutEffect(() => {
    if (!cardRef.current) return;
    setPosition(
      computeTooltipPosition(
        anchorRect,
        { width: cardRef.current.offsetWidth, height: cardRef.current.offsetHeight },
        placement,
      ),
    );
  }, [anchorRect, placement]);

  return createPortal(
    <div
      ref={cardRef}
      role="tooltip"
      className="rich-tooltip"
      data-placement={position?.placement ?? placement}
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? 'visible' : 'hidden',
        pointerEvents: 'none',
      }}
      data-testid="edge-predicate-tooltip-card"
    >
      <PredicateTooltipContent
        predicate={predicate}
        sourceTypeLabel={sourceTypeLabel}
        destinationTypeLabel={destinationTypeLabel}
        data-testid="edge-predicate-tooltip"
      />
    </div>,
    document.body,
  );
}

export default EdgeHoverTooltip;
