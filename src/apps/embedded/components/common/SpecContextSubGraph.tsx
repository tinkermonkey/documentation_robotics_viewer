/**
 * SpecContextSubGraph Component
 * Renders a mini React Flow instance showing the selected spec node type
 * and its 1-hop neighborhood of related spec node types
 */

import React from 'react';
import { ReactFlow, ReactFlowProvider, Background, useReactFlow, Controls } from '@xyflow/react';
import type { Node, Edge } from '@xyflow/react';

// Import React Flow styles - skip in test/Node.js environment where CSS cannot be parsed
if (typeof document !== 'undefined') {
  import('@xyflow/react/dist/style.css').catch(() => {
    // Silently fail if CSS cannot be loaded
  });
}

export interface SpecContextSubGraphProps {
  focalSpecNodeId: string;
  nodes: Node[];
  edges: Edge[];
  onNodeClick?: (specNodeId: string) => void;
}

/**
 * Internal component that uses React Flow hooks
 * Must be rendered inside ReactFlowProvider
 */
const SubGraphContent: React.FC<SpecContextSubGraphProps> = ({
  focalSpecNodeId,
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
      nodesDraggable={false}
      nodesConnectable={false}
      elementsSelectable={true}
      onNodeClick={(_, node) => {
        const specNodeId = (node.data as Record<string, unknown>).specNodeId as string | undefined;
        if (specNodeId && specNodeId !== focalSpecNodeId && onNodeClick) {
          onNodeClick(specNodeId);
        }
      }}
      fitView
      fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
      minZoom={0.3}
      maxZoom={1.5}
    >
      <Background />
      <Controls showInteractive={false} />
    </ReactFlow>
  );
};

/**
 * SpecContextSubGraph component
 * Shows the selected spec node type and its 1-hop neighborhood in a mini graph
 */
export const SpecContextSubGraph: React.FC<SpecContextSubGraphProps> = ({
  focalSpecNodeId,
  nodes,
  edges,
  onNodeClick,
}) => {
  return (
    <div
      data-testid="spec-context-subgraph"
      role="region"
      aria-label="Context graph showing related spec node types"
      className="h-64 w-full rounded border border-gray-200 dark:border-gray-700 overflow-hidden bg-white dark:bg-gray-800"
    >
      <ReactFlowProvider>
        <SubGraphContent
          focalSpecNodeId={focalSpecNodeId}
          nodes={nodes}
          edges={edges}
          onNodeClick={onNodeClick}
        />
      </ReactFlowProvider>
    </div>
  );
};

SpecContextSubGraph.displayName = 'SpecContextSubGraph';
