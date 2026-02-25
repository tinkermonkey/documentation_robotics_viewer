import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlow, ReactFlowProvider, MarkerType, useNodesState, useEdgesState, Handle, Position } from '@xyflow/react';
import type { Edge, EdgeTypes, Node, NodeTypes } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { memo } from 'react';
import { BundledCrossLayerEdge } from '@/core/edges/BundledCrossLayerEdge';

const meta = {
  title: 'C Graphs / Edges / Base / BundledCrossLayerEdge',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Story-local node with handles for the edge demonstration
const DemoNode = memo(({ data }: { data: { label: string } }) => (
  <div
    style={{
      width: 180,
      height: 110,
      border: '2px solid #8b5cf6',
      borderRadius: 8,
      background: '#e9d5ff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif',
      fontSize: 14,
      fontWeight: 600,
      color: '#1f2937',
    }}
  >
    <Handle type="source" position={Position.Top}    id="top"    style={{ background: '#8b5cf6' }} />
    <Handle type="target" position={Position.Bottom} id="bottom" style={{ background: '#8b5cf6' }} />
    <Handle type="target" position={Position.Left}   id="left"   style={{ background: '#8b5cf6' }} />
    <Handle type="source" position={Position.Right}  id="right"  style={{ background: '#8b5cf6' }} />
    {data.label}
  </div>
));
DemoNode.displayName = 'DemoNode';

const nodeTypes = { demo: DemoNode } as NodeTypes;
const edgeTypes = { bundledCrossLayer: BundledCrossLayerEdge } as EdgeTypes;

// Node A (source) lower-left, Node B (target) upper-right
const NODES: Node[] = [
  { id: 'source', type: 'demo', position: { x: 50, y: 250 }, data: { label: 'Source Layer' } },
  { id: 'target', type: 'demo', position: { x: 350, y: 50 }, data: { label: 'Target Layer' } },
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

// Base bundled edge configuration
const BASE_BUNDLED_EDGE: Edge = {
  id: 'be1',
  source: 'source',
  target: 'target',
  type: 'bundledCrossLayer',
  sourceHandle: 'top',
  targetHandle: 'bottom',
  markerEnd: MarkerType.ArrowClosed,
  data: {
    bundleCount: 3,
    bundledEdgeIds: ['edge-1', 'edge-2', 'edge-3'],
    targetLayer: 'technology',
  },
};

export const Default: Story = {
  render: () => <GraphDemo edge={BASE_BUNDLED_EDGE} />,
};

export const TwoBundledEdges: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be2', data: { ...BASE_BUNDLED_EDGE.data, bundleCount: 2, bundledEdgeIds: ['edge-1', 'edge-2'] } }} />,
};

export const LargeBundle: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be3', data: { ...BASE_BUNDLED_EDGE.data, bundleCount: 10, bundledEdgeIds: Array.from({ length: 10 }, (_, i) => `edge-${i + 1}`) } }} />,
};

export const WithLabel: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be4', label: 'cross-layer' }} />,
};

export const Selected: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be5', selected: true }} />,
};

export const Animated: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be6', animated: true }} />,
};

export const ChangesetAdd: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be7', data: { ...BASE_BUNDLED_EDGE.data, changesetOperation: 'add' } }} />,
};

export const ChangesetUpdate: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be8', data: { ...BASE_BUNDLED_EDGE.data, changesetOperation: 'update' } }} />,
};

export const ChangesetDelete: Story = {
  render: () => <GraphDemo edge={{ ...BASE_BUNDLED_EDGE, id: 'be9', data: { ...BASE_BUNDLED_EDGE.data, changesetOperation: 'delete' } }} />,
};
