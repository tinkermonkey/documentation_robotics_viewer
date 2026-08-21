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
          <div className="graph-inspector__section-label">Outgoing · {outgoing.length}</div>
          <ul className="graph-inspector__rels">
            {outgoing.map((rel) => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                onNodeSelect={onNodeSelect}
              />
            ))}
          </ul>
        </div>
      )}
      {incoming.length > 0 && (
        <div data-testid="inspector-incoming">
          <div className="graph-inspector__section-label">Incoming · {incoming.length}</div>
          <ul className="graph-inspector__rels">
            {incoming.map((rel) => (
              <RelationshipRow
                key={rel.id}
                rel={rel}
                onNodeSelect={onNodeSelect}
              />
            ))}
          </ul>
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
        <span className="graph-inspector__rel-pred">
          {rel.predicate}
        </span>
      </PredicateTooltip>
    ) : (
      <span className="graph-inspector__rel-pred">
        {rel.predicate}
      </span>
    );

  const directionArrow = rel.direction === 'out' ? '→' : '←';
  const directionClass = `graph-inspector__rel-dir--${rel.direction}`;

  return (
    <li className="graph-inspector__rel">
      <div className={`graph-inspector__rel-dir ${directionClass}`}>{directionArrow}</div>
      {predicateBadge}
      <button
        type="button"
        className="graph-inspector__rel-target"
        data-domain={rel.targetDomain}
        onClick={handleClick}
        aria-label={`Navigate to ${rel.targetTitle}`}
      >
        <span className="graph-inspector__rel-swatch" />
        {rel.targetTitle}
      </button>
    </li>
  );
}

export default RelationshipsWithTooltips;
