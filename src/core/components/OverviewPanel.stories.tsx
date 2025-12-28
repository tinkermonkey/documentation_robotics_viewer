import type { StoryDefault, Story } from '@ladle/react';
import { OverviewPanel } from './OverviewPanel';
import { ReactFlow, ReactFlowProvider, useNodesState, useEdgesState } from '@xyflow/react';
import '@xyflow/react/dist/style.css';

export default {
  title: 'Core Components / OverviewPanel',
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

  return (
    <div style={{ width: 400, height: 300, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <ReactFlow nodes={nodes} edges={edges} fitView>
        <OverviewPanel nodeColor={nodeColor} />
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
