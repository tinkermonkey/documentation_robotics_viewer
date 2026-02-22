import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState } from '@xyflow/react';
import type { Edge, Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { GoalNode } from '@/core/nodes/motivation/GoalNode';
import { ElbowEdge } from '@/core/edges/ElbowEdge';
import { createGoalNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Edges / Base / ElbowEdge',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const nodeTypes = { goal: GoalNode };
const edgeTypes = { elbow: ElbowEdge };

// Node A (source) lower-left, Node B (target) upper-right.
// Edge exits the top of Node A going upward, routes around, and
// arrives at the bottom of Node B from below.
const NODES: Node[] = [
  { id: 'source', type: 'goal', position: { x: 50, y: 200 }, data: createGoalNodeData({ label: 'Node A', elementId: 'goal-source' }) as Record<string, unknown> },
  { id: 'target', type: 'goal', position: { x: 400, y: 80 }, data: createGoalNodeData({ label: 'Node B', elementId: 'goal-target' }) as Record<string, unknown> },
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

// Edge runs from the top handle of Node A to the bottom handle of Node B.
// sourceHandle='top'   → Position.Top   → exits going upward
// targetHandle='bottom' → Position.Bottom → arrives from below
const BASE_EDGE: Edge = {
  id: 'e1',
  source: 'source',
  target: 'target',
  type: 'elbow',
  sourceHandle: 'top',
  targetHandle: 'bottom',
  markerEnd: MarkerType.ArrowClosed,
};

export const Default: Story = { render: () => <GraphDemo edge={BASE_EDGE} /> };
export const Animated: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e2', animated: true }} /> };
export const WithLabel: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e3', label: 'connection' }} /> };
export const Selected: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e4', selected: true }} /> };
export const ChangesetAdd: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e5', data: { changesetOperation: 'add' } }} /> };
export const ChangesetUpdate: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e6', data: { changesetOperation: 'update' } }} /> };
export const ChangesetDelete: Story = { render: () => <GraphDemo edge={{ ...BASE_EDGE, id: 'e7', data: { changesetOperation: 'delete' } }} /> };
