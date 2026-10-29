/**
 * PredicateTooltip — the "edge" rich hover tooltip content variant: the
 * predicate's own definition plus a generic
 * source-type → predicate → destination-type diagram for the specific edge
 * being hovered. Built on `RichTooltip` so it's the same card component
 * regardless of which surface triggers it (graph edge, sidebar row, page
 * view relationship row — wiring is later phases; this component only needs
 * the edge's already-resolved type labels + predicate string).
 *
 * Definition text comes from `data/predicateDefinitions.ts` (DR's predicate
 * catalog); an unrecognized predicate still renders the diagram with a
 * fallback message rather than hiding the tooltip.
 */

import type { ReactNode } from 'react';
import { RichTooltip, type TooltipPlacement } from './RichTooltip';
import { predicateDefinition } from '../data/predicateDefinitions';

/** How long the pointer must rest on a predicate before its explanation
 *  opens. Long on purpose: predicates are also click targets (navigate /
 *  select the edge), and a quick tooltip covered them while users were
 *  aiming. Keyboard focus still opens it immediately (see RichTooltip). Used
 *  for both PredicateTooltip and the graph's edge tooltip (Canvas.tsx). */
export const PREDICATE_TOOLTIP_DELAY_MS = 3000;

export interface PredicateTooltipProps {
  /** The trigger element the tooltip attaches to. */
  children: ReactNode;
  /** DR predicate string for the hovered edge, e.g. `depends-on`. */
  predicate: string;
  /** Human label for the edge's source node type, e.g. `Object Schema`. */
  sourceTypeLabel: string;
  /** Human label for the edge's destination node type. */
  destinationTypeLabel: string;
  placement?: TooltipPlacement;
  className?: string;
  'data-testid'?: string;
}

export interface PredicateTooltipContentProps {
  predicate: string;
  sourceTypeLabel: string;
  destinationTypeLabel: string;
  'data-testid'?: string;
}

/**
 * The tooltip card's body markup, extracted from `PredicateTooltip` so a
 * caller that can't compose `RichTooltip`'s trigger-wrapping (e.g. a graph
 * edge rendered internally by `GraphCanvas`, with no `children` slot to wrap —
 * see `Canvas.tsx`'s `renderEdgeTooltip`, passed as `GraphCanvas`'s native
 * `edgeTooltip` prop) can still reuse the exact same content.
 */
export function PredicateTooltipContent({
  predicate,
  sourceTypeLabel,
  destinationTypeLabel,
  'data-testid': testId = 'predicate-tooltip',
}: PredicateTooltipContentProps) {
  const definition = predicateDefinition(predicate);

  return (
    <div className="rich-tooltip__body" data-testid={`${testId}-content`}>
      <div className="rich-tooltip__title">{predicate}</div>
      <p className="rich-tooltip__description">
        {definition?.description ?? 'No definition available for this predicate.'}
      </p>
      <div className="rich-tooltip__section-label">Relationship</div>
      <div className="rich-tooltip__diagram" data-testid={`${testId}-diagram`}>
        <span className="rich-tooltip__diagram-node">{sourceTypeLabel}</span>
        <span className="rich-tooltip__diagram-arrow" aria-hidden="true">
          →
        </span>
        <span className="rich-tooltip__diagram-predicate">{predicate}</span>
        <span className="rich-tooltip__diagram-arrow" aria-hidden="true">
          →
        </span>
        <span className="rich-tooltip__diagram-node">{destinationTypeLabel}</span>
      </div>
    </div>
  );
}

export function PredicateTooltip({
  children,
  predicate,
  sourceTypeLabel,
  destinationTypeLabel,
  placement,
  className,
  'data-testid': testId = 'predicate-tooltip',
}: PredicateTooltipProps) {
  return (
    <RichTooltip
      content={
        <PredicateTooltipContent
          predicate={predicate}
          sourceTypeLabel={sourceTypeLabel}
          destinationTypeLabel={destinationTypeLabel}
          data-testid={testId}
        />
      }
      placement={placement}
      className={className}
      openDelay={PREDICATE_TOOLTIP_DELAY_MS}
      data-testid={testId}
    >
      {children}
    </RichTooltip>
  );
}

export default PredicateTooltip;
