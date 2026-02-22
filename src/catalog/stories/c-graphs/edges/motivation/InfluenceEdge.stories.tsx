import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GoalNode } from '@/core/nodes/motivation/GoalNode';
import { InfluenceEdge } from '@/core/edges/motivation/InfluenceEdge';
import { createGoalNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Edges / Motivation / InfluenceEdge',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeTypes = { goal: GoalNode };
const edgeTypes = { influence: InfluenceEdge };

const NODES: Node[] = [
  { id: 'source', type: 'goal', position: { x: 50, y: 100 }, data: createGoalNodeData({ label: 'Stakeholder', elementId: 'goal-source' }) as Record<string, unknown> },
  { id: 'target', type: 'goal', position: { x: 350, y: 100 }, data: createGoalNodeData({ label: 'Goal', elementId: 'goal-target' }) as Record<string, unknown> },
];

function GraphDemoInner({ edge }: { edge: Edge }) {
  const [nodes] = useNodesState(NODES);
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

function GraphDemo({ edge }: { edge: Edge }) {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100vh', background: '#f9fafb' }}>
        <GraphDemoInner edge={edge} />
      </div>
    </ReactFlowProvider>
  );
}

const BASE_EDGE: Edge = { id: 'e1', source: 'source', target: 'target', type: 'influence', markerEnd: MarkerType.ArrowClosed };

export const Default: Story = { render: () => <GraphDemo edge={BASE_EDGE} /> };
export const Animated: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e2', animated: true }} /> };
export const Selected: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e3', selected: true }} /> };
export const WithLabel: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e4', label: 'influences' }} /> };
export const ChangesetAdd: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e5', data: { changesetOperation: 'add' } }} /> };
export const ChangesetUpdate: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e6', data: { changesetOperation: 'update' } }} /> };
export const ChangesetDelete: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e7', data: { changesetOperation: 'delete' } }} /> };
