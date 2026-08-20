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
 * `GraphEdgeInspector`'s own endpoint buttons) selects that node —
 * `onNodeSelect` is `uiStore.selectGraphNode`, which clears the edge selection
 * as part of the same mutual-exclusivity the click originated from.
 */

import { useMemo } from 'react';
import { GraphInspector, GraphEdgeInspector, type GraphEdgeMetadata } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import type { ModelDerived } from '../data/useModel';
import type { EdgeMetadata, ModelIndex } from '../data/modelGraph';
import { relationshipsForElement, metadataForElement } from '../data/relationships';

export interface EdgeInspectorProps {
  edgeId: string;
  edge: EdgeMetadata;
  model: ModelDerived;
  index: ModelIndex;
  onNodeSelect: (nodeId: string) => void;
}

export function EdgeInspector({ edgeId, edge, model, index, onNodeSelect }: EdgeInspectorProps) {
  const sourceModelNode = index.byUuid.get(edge.sourceNode.id);
  const targetModelNode = index.byUuid.get(edge.targetNode.id);

  const sourceMetadata = useMemo(
    () =>
      sourceModelNode
        ? metadataForElement(sourceModelNode, layerLabel(sourceModelNode.layer_id))
        : null,
    [sourceModelNode],
  );
  const targetMetadata = useMemo(
    () =>
      targetModelNode
        ? metadataForElement(targetModelNode, layerLabel(targetModelNode.layer_id))
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
        <GraphInspector
          node={sourceMetadata}
          relationships={sourceRelationships}
          onNodeSelect={onNodeSelect}
          emptyStateText="Source element unavailable."
        />
      </div>
      <GraphEdgeInspector edge={edgeData} onNodeSelect={onNodeSelect} data-testid="edge-inspector-edge" />
      <div data-testid="edge-inspector-destination-node">
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
