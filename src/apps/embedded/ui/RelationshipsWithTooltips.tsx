import type { ReactNode } from 'react';
import { SegmentedControl, followOptionLabel } from '@tinkermonkey/heimdall-ui';
import { PredicateTooltip } from './PredicateTooltip';
import type { RelationshipLinkWithTooltip } from '../data/relationships';
import {
  FOLLOW_DEPTHS,
  type ElementReach,
  type FollowDepth,
  type FollowedRelationship,
} from '../data/reach';

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

const FOLLOW_OPTIONS = FOLLOW_DEPTHS.map((d) => ({ value: d, label: followOptionLabel(d) }));

export interface FollowedRelationshipsProps {
  reach: ElementReach;
  follow: FollowDepth;
  onFollowChange: (follow: FollowDepth) => void;
  onNodeSelect: (targetId: string) => void;
}

/**
 * "Followed across layers" — the selection's reach past its direct links
 * (heimdall-ui 0.10 layered-graph semantics, see `data/reach.ts`), with the
 * follow-depth control. Rows mirror Heimdall's `GraphInspector` followed rows:
 * a `+n` hop badge and a "via X · predicate" line.
 */
export function FollowedRelationships({
  reach,
  follow,
  onFollowChange,
  onNodeSelect,
}: FollowedRelationshipsProps) {
  const { followed, nodeCount, layerCount } = reach;
  return (
    <div data-testid="inspector-followed" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
        <div className="graph-inspector__section-label" style={{ margin: 0 }}>
          Followed across layers · {followed.length}
        </div>
        <SegmentedControl
          value={follow}
          onChange={(v) => onFollowChange(Number(v) as FollowDepth)}
          options={FOLLOW_OPTIONS}
          aria-label="Follow depth"
          data-testid="inspector-follow-control"
        />
      </div>
      <div className="graph-inspector__rel-via" style={{ padding: 0 }} data-testid="inspector-reach-summary">
        reach {nodeCount} elements across {layerCount} layers
      </div>
      {followed.length > 0 ? (
        <ul className="graph-inspector__rels">
          {followed.map((rel) => (
            <RelationshipRow key={rel.id} rel={rel} onNodeSelect={onNodeSelect} />
          ))}
        </ul>
      ) : (
        <div className="graph-inspector__empty-mini">
          {follow === 0 ? 'Direct links only.' : 'Nothing further across layers.'}
        </div>
      )}
    </div>
  );
}

interface RelationshipRowProps {
  rel: RelationshipLinkWithTooltip | FollowedRelationship;
  onNodeSelect: (targetId: string) => void;
}

function RelationshipRow({ rel, onNodeSelect }: RelationshipRowProps) {
  const handleClick = () => onNodeSelect(rel.target);
  const hop = 'hop' in rel ? rel.hop : undefined;
  const via = 'via' in rel ? rel.via : undefined;

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
      {hop !== undefined && hop > 1 && (
        <span className="graph-inspector__rel-hop">+{hop - 1}</span>
      )}
      {via && (
        <span className="graph-inspector__rel-via">
          via {via.title} · {via.predicate}
        </span>
      )}
    </li>
  );
}

export default RelationshipsWithTooltips;
