import { SegmentedControl, followOptionLabel } from '@tinkermonkey/heimdall-ui';
import { PredicateTooltip } from './PredicateTooltip';
import { layerColor, layerLabel } from './domain';
import type { RelationshipLinkWithTooltip } from '../data/relationships';
import type { ElementReach, FollowedRelationship } from '../data/reach';
import { FOLLOW_DEPTHS, type FollowDepth } from '../data/followDepth';

export interface RelationshipsWithTooltipsProps {
  relationships: RelationshipLinkWithTooltip[];
  onNodeSelect: (targetId: string) => void;
  /** The selected element's layer slug. Rows whose target lives in another
   *  layer name that layer, so cross-layer links read as such. */
  originLayer?: string;
}

export function RelationshipsWithTooltips({
  relationships,
  onNodeSelect,
  originLayer,
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
                originLayer={originLayer}
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
                originLayer={originLayer}
              />
            ))}
          </ul>
        </div>
      )}
    </>
  );
}

const FOLLOW_OPTIONS = FOLLOW_DEPTHS.map((d) => ({ value: d, label: followOptionLabel(d) }));

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

export interface FollowedRelationshipsProps {
  reach: ElementReach;
  follow: FollowDepth;
  onFollowChange: (follow: FollowDepth) => void;
  onNodeSelect: (targetId: string) => void;
}

/**
 * "Followed across layers" — the selection's reach past its direct links
 * (heimdall-ui 0.10 layered-graph semantics, see `data/reach.ts`), with the
 * follow-depth control, a reach strip (elements reached per layer, in layer
 * colours) and one row per followed element. A followed row's predicate
 * belongs to the link from the element it was reached through, not to the
 * selection, so it sits on the "via" line (as in Heimdall's `ReachInspector`)
 * rather than leading the row like a direct relationship.
 */
export function FollowedRelationships({
  reach,
  follow,
  onFollowChange,
  onNodeSelect,
}: FollowedRelationshipsProps) {
  const { followed, nodeCount, layerCount, byLayer } = reach;
  const stripLabel = `Reached by layer: ${byLayer
    .map((l) => `${layerLabel(l.layerId)} ${l.count}`)
    .join(', ')}`;
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
      {byLayer.length > 0 && (
        <div className="drv-reach-strip" role="img" aria-label={stripLabel} data-testid="inspector-reach-strip">
          {byLayer.map((l) => (
            <span
              key={l.layerId}
              className="drv-reach-strip__seg"
              style={{ flexGrow: l.count, background: layerColor(l.layerId) }}
              title={`${layerLabel(l.layerId)} · ${l.count}`}
              data-layer={l.layerId}
            />
          ))}
        </div>
      )}
      <div className="graph-inspector__rel-via" style={{ padding: 0 }} data-testid="inspector-reach-summary">
        reach {plural(nodeCount, 'element')} across {plural(layerCount, 'layer')}
      </div>
      {followed.length > 0 ? (
        <ul className="graph-inspector__rels">
          {followed.map((rel) => (
            <FollowedRow key={rel.id} rel={rel} onNodeSelect={onNodeSelect} />
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

/** The predicate, wrapped in its rich tooltip when the type pair is known. */
function PredicateLabel({ rel }: { rel: RelationshipLinkWithTooltip }) {
  const badge = <span className="graph-inspector__rel-pred">{rel.predicate}</span>;
  return rel.sourceTypeLabel && rel.destinationTypeLabel ? (
    <PredicateTooltip
      predicate={rel.predicate}
      sourceTypeLabel={rel.sourceTypeLabel}
      destinationTypeLabel={rel.destinationTypeLabel}
      data-testid={`relationship-predicate-tooltip-${rel.id}`}
    >
      {badge}
    </PredicateTooltip>
  ) : (
    badge
  );
}

interface RelationshipRowProps {
  rel: RelationshipLinkWithTooltip;
  onNodeSelect: (targetId: string) => void;
  originLayer?: string;
}

function RelationshipRow({ rel, onNodeSelect, originLayer }: RelationshipRowProps) {
  const directionArrow = rel.direction === 'out' ? '→' : '←';
  const directionClass = `graph-inspector__rel-dir--${rel.direction}`;
  const otherLayer =
    originLayer && rel.targetDomain && rel.targetDomain !== originLayer
      ? layerLabel(rel.targetDomain)
      : undefined;

  return (
    <li className="graph-inspector__rel">
      <div className={`graph-inspector__rel-dir ${directionClass}`}>{directionArrow}</div>
      <PredicateLabel rel={rel} />
      <button
        type="button"
        className="graph-inspector__rel-target"
        data-domain={rel.targetDomain}
        onClick={() => onNodeSelect(rel.target)}
        aria-label={`Navigate to ${rel.targetTitle}${otherLayer ? `, ${otherLayer} layer` : ''}`}
      >
        <span className="graph-inspector__rel-swatch" />
        {rel.targetTitle}
      </button>
      {otherLayer && (
        <span className="drv-rel-layer" aria-hidden="true" data-testid={`inspector-rel-layer-${rel.id}`}>
          {otherLayer}
        </span>
      )}
    </li>
  );
}

function FollowedRow({ rel, onNodeSelect }: { rel: FollowedRelationship; onNodeSelect: (targetId: string) => void }) {
  const past = rel.hop - 1;
  // Read the link from the element it was reached through: → means
  // "via-element <predicate> this one", ← the reverse.
  const arrow = rel.direction === 'out' ? '→' : '←';
  const layer = layerLabel(rel.targetDomain);
  const ariaLabel =
    `Navigate to ${rel.targetTitle}, ${layer} layer, ${plural(past, 'layer')} past direct, ` +
    (rel.direction === 'out'
      ? `via ${rel.via.title}, which ${rel.via.predicate} it`
      : `via ${rel.via.title}, which it ${rel.via.predicate}`);

  return (
    <li className="graph-inspector__rel" data-testid={`inspector-followed-row-${rel.target}`}>
      <button
        type="button"
        className="graph-inspector__rel-target"
        data-domain={rel.targetDomain}
        onClick={() => onNodeSelect(rel.target)}
        aria-label={ariaLabel}
      >
        <span className="graph-inspector__rel-swatch" />
        {rel.targetTitle}
      </button>
      <span className="graph-inspector__rel-hop" aria-hidden="true">+{past}</span>
      <span className="graph-inspector__rel-via">
        via {rel.via.title}{' '}
        <span className={`graph-inspector__rel-dir--${rel.direction}`} aria-hidden="true">{arrow}</span>{' '}
        <PredicateLabel rel={rel} />
      </span>
    </li>
  );
}

export default RelationshipsWithTooltips;
