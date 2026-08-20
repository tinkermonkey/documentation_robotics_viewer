/**
 * NodeTypeBadge — resolves a node type's `NodeTypeTooltip` content from
 * `/api/spec` (`data/specGraph.ts`'s `nodeTypeTooltipData`) and wraps a given
 * trigger in it, so every surface that references a node type (the graph's
 * `ModelCardNode` kind badge, the node `Inspector`'s kind badge, the
 * `EdgeInspector`'s source/destination kind badges, and `PageView` table
 * cells) shows the identical rich tooltip Phase 3 built, without each surface
 * re-deriving the spec lookup itself.
 *
 * Renders `children` unwrapped (no tooltip) when the type isn't published in
 * the spec — an unknown type, or the spec hasn't loaded yet — rather than a
 * tooltip with no content.
 */

import type { ReactNode } from 'react';
import { NodeTypeTooltip } from './NodeTypeTooltip';
import type { TooltipPlacement } from './RichTooltip';
import { nodeTypeTooltipData, type SpecPayload } from '../data/specGraph';

export interface NodeTypeBadgeProps {
  spec: SpecPayload | undefined;
  /** Owning layer slug, e.g. `data-model`. */
  layerId: string;
  /** Short type name, e.g. `objectschema` (NOT the dotted `spec_node_id`). */
  typeId: string;
  /** The trigger — wrapped in `RichTooltip` via `NodeTypeTooltip` when resolved. */
  children: ReactNode;
  placement?: TooltipPlacement;
  className?: string;
  'data-testid'?: string;
}

export function NodeTypeBadge({
  spec,
  layerId,
  typeId,
  children,
  placement,
  className,
  'data-testid': testId,
}: NodeTypeBadgeProps) {
  const data = nodeTypeTooltipData(spec, layerId, `${layerId}.${typeId}`);
  if (!data) return <>{children}</>;

  return (
    <NodeTypeTooltip
      specifier={data.specifier}
      title={data.title}
      description={data.description}
      inbound={data.inbound}
      outbound={data.outbound}
      placement={placement}
      className={className}
      data-testid={testId}
    >
      {children}
    </NodeTypeTooltip>
  );
}

export default NodeTypeBadge;
