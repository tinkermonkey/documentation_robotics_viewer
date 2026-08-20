/**
 * PillNode — the default pill-style presentation for graph nodes, rendered via
 * `GraphCanvas`'s `renderNode` in place of Heimdall's stock `GraphNode` so the
 * `kind` label can be wrapped in a `NodeTypeBadge` hover tooltip (see
 * `ModelCardNode`'s doc comment for the card-mode equivalent). Reuses
 * `GraphNode`'s own markup/class names (`.graph-node`, `.graph-node__swatch`,
 * `data-domain`, `data-kind`) verbatim — including its click/keyboard
 * selection handling and collapse/expand toggle — so it's visually and
 * behaviorally identical to the stock pill except for the added tooltip.
 *
 * Used for BOTH pill-mode Model nodes (`kind` is the node's own type, matching
 * `ModelCardNode`'s badge) and Schema-view node-type nodes, where the node
 * itself IS a node type: `kind` there is the generic label `'spec node'`
 * (see `data/specGraph.ts`'s `nodeTypesForLayer`), so the tooltip's type
 * lookup needs the node's own id's short name instead — passed via `typeId`,
 * which defaults to `kind` when omitted.
 */

import { Icon } from '@tinkermonkey/heimdall-ui';
import type { SpecPayload } from '../data/specGraph';
import { NodeTypeBadge } from './NodeTypeBadge';

export interface PillNodeProps {
  id: string;
  label: string;
  kind?: string;
  domainColor?: string;
  selected?: boolean;
  onSelect?: (id: string) => void;
  /** `/api/spec` payload, feeding the `kind` label's `NodeTypeTooltip`. */
  spec?: SpecPayload;
  /** Node type short name for the tooltip lookup, when it differs from `kind`
   *  (Schema view — see the module doc comment). Defaults to `kind`. */
  typeId?: string;
  hasChildren?: boolean;
  collapsed?: boolean;
  hiddenDescendantCount?: number;
  onToggleCollapse?: () => void;
}

export function PillNode({
  id,
  label,
  kind,
  domainColor = 'default',
  selected = false,
  onSelect,
  spec,
  typeId,
  hasChildren = false,
  collapsed = false,
  hiddenDescendantCount = 0,
  onToggleCollapse,
}: PillNodeProps) {
  const resolvedTypeId = typeId ?? kind;

  const className = ['graph-node', selected && 'selected'].filter(Boolean).join(' ');

  return (
    <div
      className={className}
      data-domain={domainColor}
      data-kind={kind}
      data-testid={`pill-node-${id}`}
      onClick={(e) => {
        e.stopPropagation();
        onSelect?.(id);
      }}
      onKeyDown={(e) => {
        if (e.target !== e.currentTarget) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          e.stopPropagation();
          onSelect?.(id);
        }
      }}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      aria-pressed={onSelect ? selected : undefined}
    >
      <span className="graph-node__swatch" />
      <span className="graph-node__label">{label}</span>
      {kind &&
        (resolvedTypeId ? (
          <NodeTypeBadge
            spec={spec}
            layerId={domainColor}
            typeId={resolvedTypeId}
            data-testid={`pill-node-kind-tooltip-${id}`}
          >
            <span className="graph-node__kind" tabIndex={0}>
              {kind}
            </span>
          </NodeTypeBadge>
        ) : (
          <span className="graph-node__kind">{kind}</span>
        ))}
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
          <Icon name={collapsed ? 'chevronRight' : 'chevronDown'} size={12} />
        </button>
      )}
    </div>
  );
}

export default PillNode;
