/**
 * NodeContextSubGraph Component
 * Renders a mini React Flow instance showing the selected node and its 1-hop neighborhood
 * with layer color-coded nodes, predicate edge labels, and click-to-navigate behavior
 */

import React, { useMemo } from 'react';
import { ReactFlow, ReactFlowProvider, Background, useReactFlow } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '@/core/nodes';
import { edgeTypes } from '@/core/edges';
import type { AppNode, AppEdge } from '@/core/types/reactflow';

export interface NodeContextSubGraphProps {
  focalElementId: string;
  nodes: AppNode[];
  edges: AppEdge[];
  onNodeClick: (elementId: string) => void;
}

/**
 * Internal component that uses React Flow hooks
 * Must be rendered inside ReactFlowProvider
 */
const SubGraphContent: React.FC<Omit<NodeContextSubGraphProps, 'focalElementId'> & { focalElementId: string }> = ({
  focalElementId,
  nodes,
  edges,
  onNodeClick,
}) => {
  const { fitView } = useReactFlow();

  React.useEffect(() => {
    // Fit view to show all nodes
    setTimeout(() => {
      fitView({ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 });
    }, 0);
  }, [nodes, fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      onNodeClick={(_, node) => {
        const elementId = (node.data as any).elementId;
        if (elementId && elementId !== focalElementId) {
          onNodeClick(elementId);
        }
      }}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
      minZoom={0.3}
      maxZoom={1.5}
    >
      <Background />
    </ReactFlow>
  );
};

/**
 * NodeContextSubGraph component
 * Shows the selected node and its 1-hop neighborhood in a mini graph
 */
export const NodeContextSubGraph: React.FC<NodeContextSubGraphProps> = ({
  focalElementId,
  nodes,
  edges,
  onNodeClick,
}) => {
  return (
    <div
      data-testid="node-context-subgraph"
      className="h-64 w-full rounded border border-gray-200 dark:border-gray-700 overflow-hidden"
    >
      <ReactFlowProvider>
        <SubGraphContent
          focalElementId={focalElementId}
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    </div>
  );
};

NodeContextSubGraph.displayName = 'NodeContextSubGraph';
