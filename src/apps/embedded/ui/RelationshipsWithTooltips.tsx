/**
 * RelationshipsWithTooltips — wrapper for rendering relationship lists with
 * predicate tooltips. Heimdall's GraphInspector doesn't expose a slot for
 * customizing predicate rendering, so this component re-renders the
 * relationship list with PredicateTooltip-wrapped predicates.
 *
 * Mirrors GraphInspector's own layout and styling but wraps each predicate
 * badge with PredicateTooltip so hovering shows the rich card (definition +
 * source → predicate → destination diagram).
 */

import type { ReactNode } from 'react';
import { PredicateTooltip } from './PredicateTooltip';
import type { RelationshipLinkWithTooltip } from '../data/relationships';

export interface RelationshipsWithTooltipsProps {
  relationships: RelationshipLinkWithTooltip[];
  onNodeSelect: (targetId: string) => void;
}

export function RelationshipsWithTooltips({
  relationships,
  onNodeSelect,
}: RelationshipsWithTooltipsProps) {
  if (relationships.length === 0) return null;

  // Group by direction matching GraphInspector's layout.
  const outgoing = relationships.filter((r) => r.direction === 'out');
  const incoming = relationships.filter((r) => r.direction === 'in');

  return (
    <>
      {outgoing.length > 0 && (
        <div data-testid="inspector-outgoing">
          <div className="graph-inspector__section-label">Outgoing</div>
          <div className="graph-inspector__relationships">
            {outgoing.map((rel) => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                onNodeSelect={onNodeSelect}
              />
            ))}
          </div>
        </div>
      )}
      {incoming.length > 0 && (
        <div data-testid="inspector-incoming">
          <div className="graph-inspector__section-label">Incoming</div>
          <div className="graph-inspector__relationships">
            {incoming.map((rel) => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                onNodeSelect={onNodeSelect}
              />
            ))}
          </div>
        </div>
      )}
    </>
  );
}

interface RelationshipRowProps {
  rel: RelationshipLinkWithTooltip;
  onNodeSelect: (targetId: string) => void;
}

function RelationshipRow({ rel, onNodeSelect }: RelationshipRowProps) {
  const handleClick = () => onNodeSelect(rel.target);

  // Wrap the predicate with PredicateTooltip when tooltip data is available.
  const predicateBadge: ReactNode =
    rel.sourceTypeLabel && rel.destinationTypeLabel ? (
      <PredicateTooltip
        predicate={rel.predicate}
        sourceTypeLabel={rel.sourceTypeLabel}
        destinationTypeLabel={rel.destinationTypeLabel}
        data-testid={`relationship-predicate-tooltip-${rel.id}`}
      >
        <span className="graph-inspector__relationship-predicate">
          {rel.predicate}
        </span>
      </PredicateTooltip>
    ) : (
      <span className="graph-inspector__relationship-predicate">
        {rel.predicate}
      </span>
    );

  return (
    <div className="graph-inspector__relationship" key={rel.id}>
      {predicateBadge}
      <button
        type="button"
        className="graph-inspector__relationship-target"
        onClick={handleClick}
        aria-label={`Navigate to ${rel.targetTitle}`}
      >
        {rel.targetTitle}
      </button>
    </div>
  );
}

export default RelationshipsWithTooltips;
