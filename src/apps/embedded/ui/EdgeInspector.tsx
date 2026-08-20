/**
 * EdgeInspector — the sidebar detail view for a selected Model graph edge (BA
 * req 16-17): source node info, edge info, destination node info, top to
 * bottom. Rendered by `Inspector.tsx` inside its existing `DetailDrawer`
 * whenever `uiStore.selectedEdgeId` is set (in place of the single-node
 * `GraphInspector` branch), so edge and node selection share one overlay slot
 * (ADR-6: mutually exclusive).
 *
 * Composes three Heimdall components stacked exactly as `GraphEdgeInspector`'s
 * own doc comment describes ("typically source node → this → target node"):
 * `GraphInspector` (source) + `GraphEdgeInspector` (the edge itself) +
 * `GraphInspector` (destination) — same node detail + relationships a directly
 * selected node's Inspector shows, via the same `metadataForElement` /
 * `relationshipsForElement` pure transforms.
 *
 * Clicking either endpoint (in either the flanking `GraphInspector`s or the
 * `GraphEdgeInspector`'s own endpoint buttons) selects that node.
 * `onNodeSelect` is `Inspector.tsx`'s `handleSelect` — the same cross-layer-aware
 * handler the plain node-inspector branch uses — since the flanking
 * `GraphInspector`s can surface cross-layer relationship targets (unlike the
 * endpoint buttons themselves, always intra-layer per `edgesForLayer`). It
 * resolves the target's layer and calls `uiStore.navigateToElement`, which
 * clears the edge selection as part of the same mutual-exclusivity the click
 * originated from.
 *
 * Phase 5 (hover tooltips on existing surfaces): the source/destination
 * sections' element types and the edge's own predicate are each shown as an
 * interactive `graph-inspector__head-eyebrow`/`graph-edge-inspector__badge`
 * row (`NodeTypeBadge` / `PredicateTooltip`) ABOVE the corresponding Heimdall
 * panel — same pattern `Inspector.tsx` uses for its own kind badge, since
 * neither `GraphInspector` nor `GraphEdgeInspector` exposes a slot for
 * customizing their own (plain, non-interactive) badges. The flanking
 * `GraphInspector`s' own `kind` is omitted from their metadata to avoid
 * showing it twice.
 */

import { useMemo } from 'react';
import { GraphInspector, GraphEdgeInspector, type GraphEdgeMetadata } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import { NodeTypeBadge } from './NodeTypeBadge';
import { PredicateTooltip } from './PredicateTooltip';
import type { ModelDerived } from '../data/useModel';
import type { EdgeMetadata, ModelIndex } from '../data/modelGraph';
import type { SpecPayload } from '../data/specGraph';
import { relationshipsForElement, metadataForElement } from '../data/relationships';

export interface EdgeInspectorProps {
  edgeId: string;
  edge: EdgeMetadata;
  model: ModelDerived;
  index: ModelIndex;
  spec: SpecPayload | undefined;
  onNodeSelect: (nodeId: string) => void;
}

export function EdgeInspector({ edgeId, edge, model, index, spec, onNodeSelect }: EdgeInspectorProps) {
  const sourceModelNode = index.byUuid.get(edge.sourceNode.id);
  const targetModelNode = index.byUuid.get(edge.targetNode.id);

  const sourceMetadata = useMemo(
    () =>
      sourceModelNode
        ? // `kind` shown separately, above, as an interactive `NodeTypeBadge`.
          { ...metadataForElement(sourceModelNode, layerLabel(sourceModelNode.layer_id)), kind: undefined }
        : null,
    [sourceModelNode],
  );
  const targetMetadata = useMemo(
    () =>
      targetModelNode
        ? { ...metadataForElement(targetModelNode, layerLabel(targetModelNode.layer_id)), kind: undefined }
        : null,
    [targetModelNode],
  );

  const sourceRelationships = useMemo(
    () => (sourceModelNode ? relationshipsForElement(model, sourceModelNode.id, index) : []),
    [model, sourceModelNode, index],
  );
  const targetRelationships = useMemo(
    () => (targetModelNode ? relationshipsForElement(model, targetModelNode.id, index) : []),
    [model, targetModelNode, index],
  );

  const edgeData: GraphEdgeMetadata = {
    id: edgeId,
    predicate: edge.predicate,
    sourceId: edge.sourceNode.id,
    sourceTitle: edge.sourceNode.name,
    sourceDomain: edge.sourceNode.layer,
    targetId: edge.targetNode.id,
    targetTitle: edge.targetNode.name,
    targetDomain: edge.targetNode.layer,
    // Always the edge currently shown here (i.e. selected) — the graph's own
    // "hot" highlight for the same edge, ADR-3.
    variant: 'hot',
    metadata: edge.specRelationship?.cardinality
      ? { cardinality: edge.specRelationship.cardinality }
      : undefined,
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }} data-testid="edge-inspector">
      {/* Note: these wrapper testids intentionally differ from
          GraphEdgeInspector's own internal "edge-inspector-source"/
          "edge-inspector-target" endpoint-button testids below, to keep both
          queryable without a collision. */}
      <div data-testid="edge-inspector-source-node">
        {sourceModelNode && (
          <div className="graph-inspector__head-eyebrow" data-testid="edge-inspector-source-type-row">
            <NodeTypeBadge
              spec={spec}
              layerId={sourceModelNode.layer_id}
              typeId={sourceModelNode.type}
              data-testid="edge-inspector-source-type-tooltip"
            >
              <span className="graph-inspector__badge" tabIndex={0}>
                {sourceModelNode.type}
              </span>
            </NodeTypeBadge>
          </div>
        )}
        <GraphInspector
          node={sourceMetadata}
          relationships={sourceRelationships}
          onNodeSelect={onNodeSelect}
          emptyStateText="Source element unavailable."
        />
      </div>
      <div className="graph-edge-inspector__head-eyebrow" data-testid="edge-inspector-predicate-row">
        <PredicateTooltip
          predicate={edge.predicate}
          sourceTypeLabel={edge.sourceNode.type}
          destinationTypeLabel={edge.targetNode.type}
          data-testid="edge-inspector-predicate-tooltip"
        >
          <span className="graph-edge-inspector__badge" tabIndex={0}>
            {edge.predicate}
          </span>
        </PredicateTooltip>
      </div>
      <GraphEdgeInspector edge={edgeData} onNodeSelect={onNodeSelect} data-testid="edge-inspector-edge" />
      <div data-testid="edge-inspector-destination-node">
        {targetModelNode && (
          <div className="graph-inspector__head-eyebrow" data-testid="edge-inspector-destination-type-row">
            <NodeTypeBadge
              spec={spec}
              layerId={targetModelNode.layer_id}
              typeId={targetModelNode.type}
              data-testid="edge-inspector-destination-type-tooltip"
            >
              <span className="graph-inspector__badge" tabIndex={0}>
                {targetModelNode.type}
              </span>
            </NodeTypeBadge>
          </div>
        )}
        <GraphInspector
          node={targetMetadata}
          relationships={targetRelationships}
          onNodeSelect={onNodeSelect}
          emptyStateText="Destination element unavailable."
        />
      </div>
    </div>
  );
}

export default EdgeInspector;
