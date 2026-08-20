/**
 * NodeTypeTooltip — the "node type" rich hover tooltip content variant (BA
 * req 18, 21-25): the type's full specifier + definition, plus capped lists
 * of its possible inbound and outbound connection types. Built on
 * `RichTooltip` so it's the same card component regardless of which surface
 * triggers it (a Schema graph node, a NavTree row, a page view spec-node
 * section — wiring is later phases).
 *
 * Inbound/outbound connections are each capped at `maxConnections` (default
 * 6 — a "sensible maximum" per the requirement; the full list stays a click
 * away via the Inspector, same cap-with-overflow pattern `ModelCardNode`
 * already uses for cross-layer links). The remainder folds into a single
 * "+N more" row rather than being silently dropped.
 */

import type { ReactNode } from 'react';
import { RichTooltip, type TooltipPlacement } from './RichTooltip';
import { layerColor, layerLabel } from './domain';

/** One possible inbound or outbound connection for a node type. */
export interface NodeTypeConnection {
  /** DR predicate string, e.g. `aggregates`. */
  predicate: string;
  /** Human label for the connected node type. */
  typeLabel: string;
  /** The connected node type's `spec_node_id` (used as the list-key salt). */
  typeId: string;
  /** Owning layer slug of the connected type, for its domain swatch. */
  domain?: string;
}

const DEFAULT_MAX_CONNECTIONS = 6;

function ConnectionList({
  items,
  max,
  testId,
  emptyLabel,
}: {
  items: NodeTypeConnection[];
  max: number;
  testId: string;
  emptyLabel: string;
}) {
  if (items.length === 0) {
    return (
      <div className="rich-tooltip__empty" data-testid={testId}>
        {emptyLabel}
      </div>
    );
  }

  const shown = items.slice(0, max);
  const overflow = items.length - shown.length;

  return (
    <ul className="rich-tooltip__connections" data-testid={testId}>
      {shown.map((item, i) => (
        <li
          key={`${item.predicate}-${item.typeId}-${i}`}
          className="rich-tooltip__connection"
          title={`${item.predicate} · ${item.typeLabel}${item.domain ? ` (${layerLabel(item.domain)})` : ''}`}
        >
          <span
            className="rich-tooltip__connection-swatch"
            style={{ background: layerColor(item.domain) }}
          />
          <span className="rich-tooltip__connection-predicate">{item.predicate}</span>
          <span className="rich-tooltip__connection-type">{item.typeLabel}</span>
        </li>
      ))}
      {overflow > 0 && (
        <li className="rich-tooltip__overflow" data-testid={`${testId}-overflow`}>
          +{overflow} more
        </li>
      )}
    </ul>
  );
}

export interface NodeTypeTooltipProps {
  /** The trigger element the tooltip attaches to. */
  children: ReactNode;
  /** The node type's full specifier (`spec_node_id`, e.g. `data-model.objectschema`). */
  specifier: string;
  /** Human title, e.g. `Object Schema`. */
  title: string;
  description?: string;
  /** Possible inbound connection types, uncapped — this component applies the cap. */
  inbound: NodeTypeConnection[];
  /** Possible outbound connection types, uncapped — this component applies the cap. */
  outbound: NodeTypeConnection[];
  /** Max rows rendered per direction before folding into a "+N more" row (default 6). */
  maxConnections?: number;
  placement?: TooltipPlacement;
  className?: string;
  'data-testid'?: string;
}

export function NodeTypeTooltip({
  children,
  specifier,
  title,
  description,
  inbound,
  outbound,
  maxConnections = DEFAULT_MAX_CONNECTIONS,
  placement,
  className,
  'data-testid': testId = 'node-type-tooltip',
}: NodeTypeTooltipProps) {
  const content = (
    <div className="rich-tooltip__body" data-testid={`${testId}-content`}>
      <div className="rich-tooltip__title">{title}</div>
      <div className="rich-tooltip__specifier">{specifier}</div>
      {description && <p className="rich-tooltip__description">{description}</p>}

      <div className="rich-tooltip__section-label">Inbound connections</div>
      <ConnectionList
        items={inbound}
        max={maxConnections}
        testId={`${testId}-inbound`}
        emptyLabel="No inbound connection types"
      />

      <div className="rich-tooltip__section-label">Outbound connections</div>
      <ConnectionList
        items={outbound}
        max={maxConnections}
        testId={`${testId}-outbound`}
        emptyLabel="No outbound connection types"
      />
    </div>
  );

  return (
    <RichTooltip
      content={content}
      placement={placement}
      className={className}
      data-testid={testId}
    >
      {children}
    </RichTooltip>
  );
}

export default NodeTypeTooltip;
