/**
 * ModelCardNode — the card-style presentation for Model graph nodes (ADR-1:
 * card nodes via `GraphCanvas`'s `renderNode`, fed by a `CardData` side-channel
 * map keyed by node id — see `data/modelGraph.ts`'s `nodesWithCardData`).
 *
 * Reuses the default `GraphNode`'s own class names/attributes (`.graph-node`,
 * `.graph-node__swatch`, `data-domain`, `data-kind`) so the existing
 * hover/selected/domain-swatch CSS (`domain-and-nav.css`) and the click-target
 * conventions other tests already rely on keep working unmodified; a
 * `graph-node--card` modifier switches the layout from the pill's inline row to
 * a stacked card. Root click/keyboard handling (Enter/Space, `role="button"`,
 * `aria-pressed`) is copied verbatim from the compiled default `GraphNode` so
 * card nodes meet the same keyboard/focus accessibility as pill nodes.
 *
 * Inter-layer connections are enumerated up to `CARD_CROSS_LINK_CAP` (5); any
 * remainder shows a literal "…" overflow indicator. The full, untruncated
 * relationship list is a click away — clicking anywhere on the card selects
 * the node (same as a pill), which opens the Inspector's `GraphInspector`,
 * fed by `relationships.ts`'s uncapped `relationshipsForElement`.
 *
 * The `kind` badge is a `NodeTypeBadge` trigger (Phase 5: hover tooltips on
 * existing surfaces) — hovering/focusing it shows the same rich node-type
 * tooltip as every other surface that references a type, resolved from
 * `spec` (the `/api/spec` payload, optional — `NodeTypeBadge` falls back to a
 * plain, non-interactive badge when it or the type is unresolved).
 */

import type { CardData } from '../data/modelGraph';
import type { SpecPayload } from '../data/specGraph';
import { layerColor, layerLabel } from './domain';
import { NodeTypeBadge } from './NodeTypeBadge';

export interface ModelCardNodeProps {
  id: string;
  label: string;
  kind?: string;
  domainColor?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  cardData?: CardData;
  /** `/api/spec` payload, feeding the `kind` badge's `NodeTypeTooltip`. */
  spec?: SpecPayload;
  /** Structural-hierarchy passthrough (GraphCanvas's GraphNodeHierarchyMeta) — mirrors
   *  the default GraphNode's own collapse/expand affordance when a caller wires it up. */
  hasChildren?: boolean;
  collapsed?: boolean;
  hiddenDescendantCount?: number;
  onToggleCollapse?: () => void;
}

export function ModelCardNode({
  id,
  label,
  kind,
  domainColor = 'default',
  selected = false,
  onSelect,
  cardData,
  spec,
  hasChildren = false,
  collapsed = false,
  hiddenDescendantCount = 0,
  onToggleCollapse,
}: ModelCardNodeProps) {
  const intraCount = cardData?.intraCount ?? 0;
  const crossLinks = cardData?.crossLinks ?? [];
  const crossTotal = cardData?.crossTotal ?? 0;
  const hasOverflow = crossTotal > crossLinks.length;

  const className = ['graph-node', 'graph-node--card', selected && 'selected']
    .filter(Boolean)
    .join(' ');

  return (
    <div
      className={className}
      data-domain={domainColor}
      data-kind={kind}
      data-testid={`model-card-node-${id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(id);
      }}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          e.stopPropagation();
          onSelect?.(id);
        }
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
    >
      <div className="graph-node__card-header">
        <span className="graph-node__swatch" />
        <span className="graph-node__label">{label}</span>
        {kind && (
          <NodeTypeBadge
            spec={spec}
            layerId={domainColor}
            typeId={kind}
            data-testid={`model-card-kind-tooltip-${id}`}
          >
            <span className="graph-node__kind" tabIndex={0}>
              {kind}
            </span>
          </NodeTypeBadge>
        )}
        {hasChildren && onToggleCollapse && (
          <button
            type="button"
            className="graph-node__collapse-toggle"
            aria-label={collapsed ? 'Expand' : 'Collapse'}
            aria-expanded={!collapsed}
            onClick={(e) => {
              e.stopPropagation();
              onToggleCollapse();
            }}
          >
            {collapsed && hiddenDescendantCount > 0 && (
              <span className="graph-node__hidden-badge">{hiddenDescendantCount}</span>
            )}
          </button>
        )}
      </div>

      <div className="graph-node__card-stats" data-testid={`model-card-stats-${id}`}>
        <span className="graph-node__card-stat" data-testid={`model-card-intra-count-${id}`}>
          {intraCount} intra-layer
        </span>
        <span className="graph-node__card-stat" data-testid={`model-card-cross-count-${id}`}>
          {crossTotal} inter-layer
        </span>
      </div>

      {crossLinks.length > 0 && (
        <ul className="graph-node__cross-links" data-testid={`model-card-cross-links-${id}`}>
          {crossLinks.map((link, i) => (
            <li
              key={`${link.predicate}-${link.targetId}-${i}`}
              className="graph-node__cross-link"
              title={`${link.predicate} · ${link.targetName} (${layerLabel(link.targetLayer)})`}
            >
              <span
                className="graph-node__cross-link-swatch"
                style={{ background: layerColor(link.targetLayer) }}
              />
              <span className="graph-node__cross-link-label">
                {link.predicate} · {link.targetName}
              </span>
            </li>
          ))}
          {hasOverflow && (
            <li
              className="graph-node__cross-link graph-node__cross-link--overflow"
              data-testid={`model-card-overflow-${id}`}
              aria-label={`${crossTotal - crossLinks.length} more inter-layer connections`}
            >
              …
            </li>
          )}
        </ul>
      )}
    </div>
  );
}

export default ModelCardNode;
