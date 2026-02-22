import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GoalNode } from '@/core/nodes/motivation/GoalNode';
import { CrossLayerEdge } from '@/core/edges/CrossLayerEdge';
import { createGoalNodeData } from '@catalog/fixtures/nodeDataFixtures';
import { LayerType } from '@/core/types/layers';
import { ReferenceType } from '@/core/types/model';

const meta = {
  title: 'C Graphs / Edges / Base / CrossLayerEdge',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeTypes = { goal: GoalNode };
const edgeTypes = { crossLayer: CrossLayerEdge };

// Horizontal layout: source left, target right
const HORIZONTAL_NODES: Node[] = [
  { id: 'source', type: 'goal', position: { x: 50, y: 100 }, data: createGoalNodeData({ label: 'Motivation', elementId: 'goal-source' }) as Record<string, unknown> },
  { id: 'target', type: 'goal', position: { x: 350, y: 100 }, data: createGoalNodeData({ label: 'Business', elementId: 'goal-target' }) as Record<string, unknown> },
];

// Vertical layout: source above, target below
const VERTICAL_NODES: Node[] = [
  { id: 'source', type: 'goal', position: { x: 200, y: 50 }, data: createGoalNodeData({ label: 'Top Layer', elementId: 'goal-vsource' }) as Record<string, unknown> },
  { id: 'target', type: 'goal', position: { x: 200, y: 280 }, data: createGoalNodeData({ label: 'Bottom Layer', elementId: 'goal-vtarget' }) as Record<string, unknown> },
];

function GraphDemoInner({ initialNodes, edge }: { initialNodes: Node[]; edge: Edge }) {
  const [nodes] = useNodesState(initialNodes);
  const [edges] = useEdgesState([edge]);
  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      nodeTypes={nodeTypes}
      edgeTypes={edgeTypes}
      fitView
      fitViewOptions={{ padding: 0.3 }}
      panOnDrag={false}
      zoomOnScroll={false}
      nodesDraggable={false}
      elementsSelectable={false}
      nodesFocusable={false}
    />
  );
}

function GraphDemo({ edge, vertical = false }: { edge: Edge; vertical?: boolean }) {
  const nodes = vertical ? VERTICAL_NODES : HORIZONTAL_NODES;
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100vh', background: '#f9fafb' }}>
        <GraphDemoInner initialNodes={nodes} edge={edge} />
      </div>
    </ReactFlowProvider>
  );
}

const BASE_EDGE: Edge = { id: 'e1', source: 'source', target: 'target', type: 'crossLayer', markerEnd: MarkerType.ArrowClosed };

export const Default: Story = { render: () => <GraphDemo edge={BASE_EDGE} /> };
export const Animated: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e2', animated: true }} /> };
export const WithLabel: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e3', label: 'implements' }} /> };
export const VerticalFlow: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e4' }} vertical /> };
export const Selected: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e5', selected: true }} /> };
export const ChangesetAdd: Story = {
  render: () => (
    <GraphDemo
      edge={{ ...BASE_EDGE, id: 'e6', data: { sourceLayer: LayerType.Business, changesetOperation: 'add', targetLayer: LayerType.Application, relationshipType: ReferenceType.BusinessService } }}
    />
  ),
};
export const ChangesetUpdate: Story = {
  render: () => (
    <GraphDemo
      edge={{ ...BASE_EDGE, id: 'e7', data: { sourceLayer: LayerType.Business, changesetOperation: 'update', targetLayer: LayerType.Technology, relationshipType: ReferenceType.BusinessService } }}
    />
  ),
};
export const ChangesetDelete: Story = {
  render: () => (
    <GraphDemo
      edge={{ ...BASE_EDGE, id: 'e8', data: { sourceLayer: LayerType.Business, changesetOperation: 'delete', targetLayer: LayerType.Api, relationshipType: ReferenceType.APIOperation } }}
    />
  ),
};
