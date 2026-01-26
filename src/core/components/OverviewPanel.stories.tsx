import type { StoryDefault, Story } from '@ladle/react';
import { useState } from 'react';
import { OverviewPanel } from './OverviewPanel';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default {
  title: 'Building Blocks / Utilities / OverviewPanel',
} satisfies StoryDefault;

// Sample nodes for demonstration
const sampleNodes = [
  { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1', type: 'goal' } },
  { id: '2', position: { x: 100, y: 100 }, data: { label: 'Node 2', type: 'requirement' } },
  { id: '3', position: { x: 200, y: 0 }, data: { label: 'Node 3', type: 'process' } },
];

const sampleEdges = [
  { id: 'e1-2', source: '1', target: '2' },
  { id: 'e2-3', source: '2', target: '3' },
];

const OverviewPanelDemo = ({ nodeColor }: { nodeColor?: (node: any) => string }) => {
  const [nodes] = useNodesState(sampleNodes);
  const [edges] = useEdgesState(sampleEdges);
  const [isReady, setIsReady] = useState(false);

  return (
    <div style={{ width: 400, height: 300, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        defaultViewport={{ x: 0, y: 0, zoom: 1 }}
        minZoom={0.1}
        maxZoom={4}
        fitView
        fitViewOptions={{ padding: 0.2, duration: 0 }}
        onInit={(instance) => {
          // Wait longer for layout to stabilize before showing OverviewPanel
          setTimeout(() => {
            const viewport = instance.getViewport();
            // Only show OverviewPanel if viewport is valid (no NaN values)
            if (!isNaN(viewport.x) && !isNaN(viewport.y) && !isNaN(viewport.zoom)) {
              setIsReady(true);
            } else {
              // If still NaN, try again after another delay
              setTimeout(() => {
                const retryViewport = instance.getViewport();
                if (!isNaN(retryViewport.x) && !isNaN(retryViewport.y) && !isNaN(retryViewport.zoom)) {
                  setIsReady(true);
                }
              }, 200);
            }
          }, 200);
        }}
      >
        {isReady && <OverviewPanel nodeColor={nodeColor} />}
      </ReactFlow>
    </div>
  );
};

export const Default: Story = () => {
  return (
    <ReactFlowProvider>
      <OverviewPanelDemo />
    </ReactFlowProvider>
  );
};

export const WithNodeColor: Story = () => {
  const nodeColorFunction = (node: any) => {
    const colors: Record<string, string> = {
      goal: '#a78bfa',
      requirement: '#60a5fa',
      process: '#34d399',
      service: '#f59e0b',
      default: '#d1d5db',
    };
    return colors[node.data?.type] || colors.default;
  };

  return (
    <ReactFlowProvider>
      <OverviewPanelDemo nodeColor={nodeColorFunction} />
    </ReactFlowProvider>
  );
};

export const Minimal: Story = () => {
  return (
    <ReactFlowProvider>
      <OverviewPanelDemo />
    </ReactFlowProvider>
  );
};
