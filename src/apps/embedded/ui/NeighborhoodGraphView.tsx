import { useMemo, useCallback } from 'react';
import { GraphCanvas, type GraphNodeData, type GraphEdgeData } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import type { NeighborhoodGraph, NeighborhoodNode } from '../data/neighborhoodGraph';
import { PillNode } from './PillNode';
import { useSpec } from '../data/useSpec';

interface NeighborhoodGraphViewProps {
  neighborhood: NeighborhoodGraph;
  isSpecView: boolean;
}

function nodesToGraphData(nodes: NeighborhoodNode[]): GraphNodeData[] {
  return nodes.map((n) => ({
    id: n.id,
    label: n.name,
    kind: n.kind,
    domainColor: n.layer,
  }));
}

function edgesToGraphData(nodes: NeighborhoodNode[], edges: NeighborhoodGraph['edges']): GraphEdgeData[] {
  const centerNode = nodes.find((n) => n.isCenter);
  if (!centerNode) return [];

  return edges.map((e) => ({
    id: e.id,
    sourceId: e.direction === 'out' ? centerNode.id : e.targetId,
    targetId: e.direction === 'out' ? e.targetId : centerNode.id,
    label: e.predicate,
  }));
}

export function NeighborhoodGraphView({
  neighborhood,
  isSpecView,
}: NeighborhoodGraphViewProps) {
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);
  const { raw: specRaw } = useSpec();

  const graphNodes = useMemo(() => nodesToGraphData(neighborhood.nodes), [neighborhood.nodes]);
  const graphEdges = useMemo(() => edgesToGraphData(neighborhood.nodes, neighborhood.edges), [neighborhood.nodes, neighborhood.edges]);

  const handleNodeClick = useCallback(
    (nodeId: string) => {
      const node = neighborhood.nodes.find((n) => n.id === nodeId);
      if (!node) return;

      if (node.isCenter) return;

      if (isSpecView) {
        navigateToSpecNode(nodeId, node.layer);
      } else {
        navigateToElement(nodeId, node.layer);
      }
    },
    [neighborhood.nodes, isSpecView, navigateToElement, navigateToSpecNode],
  );

  const renderNode = useCallback(
    (node: GraphNodeData, selected: boolean) => {
      const nodeInfo = neighborhood.nodes.find((n) => n.id === node.id);
      const isCenter = nodeInfo?.isCenter ?? false;

      return (
        <PillNode
          id={node.id}
          label={node.label}
          kind={node.kind}
          domainColor={node.domainColor}
          selected={selected}
          onSelect={isCenter ? undefined : handleNodeClick}
          spec={specRaw}
          typeId={isSpecView ? node.id.split('.')[1] : undefined}
        />
      );
    },
    [neighborhood.nodes, isSpecView, handleNodeClick, specRaw],
  );

  if (neighborhood.empty) {
    return null;
  }

  return (
    <div
      style={{
        height: 280,
        width: '100%',
        position: 'relative',
        border: '1px solid rgb(var(--canvas-border))',
        borderRadius: 8,
        background: 'rgb(var(--canvas-card))',
        marginBottom: 20,
      }}
      data-testid="neighborhood-graph-view"
    >
      <GraphCanvas
        nodes={graphNodes}
        edges={graphEdges}
        renderNode={renderNode}
        onNodeSelect={handleNodeClick}
        layout="force"
        nodeMargin={40}
        centerOnSelect={false}
        fitView={true}
        fitPadding={20}
        showToolbar={false}
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
        }}
      />
    </div>
  );
}

export default NeighborhoodGraphView;
