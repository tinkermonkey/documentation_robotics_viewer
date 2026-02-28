import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Edge, EdgeTypes, Node, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo } from 'react';
import { ElbowEdge } from '@/core/edges/ElbowEdge';

const meta = {
  title: 'C Graphs / Edges / Base / ElbowEdge',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story-local node with top as a source handle and bottom as a target handle,
// matching the direction of the edge being demonstrated.
const DemoNode: React.FC<{ data: { label: string } }> = memo(({ data }: { data: { label: string } }) => (
  <div
    style={{
      width: 180,
      height: 110,
      border: '2px solid #d97706',
      borderRadius: 8,
      background: '#fbbf24',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      color: '#1f2937',
    }}
  >
    <Handle type="source" position={Position.Top}    id="top"    style={{ background: '#d97706' }} />
    <Handle type="target" position={Position.Bottom} id="bottom" style={{ background: '#d97706' }} />
    <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#d97706' }} />
    <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#d97706' }} />
    {data.label}
  </div>
));
DemoNode.displayName = 'DemoNode';

const nodeTypes = { demo: DemoNode } as NodeTypes;
const edgeTypes = { elbow: ElbowEdge } as EdgeTypes;

// Node A (source) lower-left, Node B (target) upper-right.
// The A* router exits Node A's top handle going upward, arcs over,
// and arrives at Node B's bottom handle from below.
const NODES: Node[] = [
  { id: 'source', type: 'demo', position: { x: 50, y: 250 }, data: { label: 'Node A' } },
  { id: 'target', type: 'demo', position: { x: 350, y: 50 }, data: { label: 'Node B' } },
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
// sourceHandle='top'    → Position.Top    → exits going upward
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
