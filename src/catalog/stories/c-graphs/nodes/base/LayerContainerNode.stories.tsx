import type { Meta, StoryObj } from '@storybook/react';
import { ReactFlowProvider, ReactFlow } from '@xyflow/react';
import type { Node } from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { nodeTypes } from '@/core/nodes';
import { NodeType } from '@/core/nodes/NodeType';
import type { UnifiedNodeData } from '@/core/nodes/components/UnifiedNode';
import { createLayerContainerNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'Graphs / Nodes / Base / LayerContainerNode',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Container is 820px wide × 280px tall.
// Title bar = 40px, so children sit from x=60 (40 + 20 padding) onward.
const CONTAINER_W = 820;
const CONTAINER_H = 280;
const NODE_W = 180;
const NODE_H = 80;
const NODE_Y = (CONTAINER_H - NODE_H) / 2;  // vertically centered
const COL_X = [60, 270, 480, 690];           // four column positions

function childNode(
  id: string,
  nodeType: NodeType,
  label: string,
  layerId: string,
  col: number,
): Node {
  return {
    id,
    type: 'unified',
    position: { x: COL_X[col], y: NODE_Y },
    width: NODE_W,
    height: NODE_H,
    data: { nodeType, label, layerId, elementId: id } as UnifiedNodeData,
  };
}

function containerNode(id: string, layerType: string, label: string): Node {
  return {
    id,
    type: 'layerContainer',
    position: { x: 0, y: 0 },
    width: CONTAINER_W,
    height: CONTAINER_H,
    style: { zIndex: -1 },
    selectable: false,
    draggable: false,
    data: createLayerContainerNodeData({ label, layerType }),
  };
}

function Graph({ nodes }: { nodes: Node[] }) {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: '100vh' }}>
        <ReactFlow
          nodes={nodes}
          edges={[]}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          panOnDrag={false}
          zoomOnScroll={false}
          nodesDraggable={false}
          minZoom={0.2}
        />
      </div>
    </ReactFlowProvider>
  );
}

export const BusinessLayer: Story = {
  render: () => (
    <Graph nodes={[
      containerNode('c', 'business', 'Business'),
      childNode('n1', NodeType.BUSINESS_SERVICE,    'Payment Service',    'business', 0),
      childNode('n2', NodeType.BUSINESS_FUNCTION,   'Order Processing',   'business', 1),
      childNode('n3', NodeType.BUSINESS_CAPABILITY, 'Customer Onboarding','business', 2),
      childNode('n4', NodeType.BUSINESS_PROCESS,    'Fulfilment Process', 'business', 3),
    ]} />
  ),
};

export const MotivationLayer: Story = {
  render: () => (
    <Graph nodes={[
      containerNode('c', 'motivation', 'Motivation'),
      childNode('n1', NodeType.MOTIVATION_GOAL,        'Increase Revenue',   'motivation', 0),
      childNode('n2', NodeType.MOTIVATION_STAKEHOLDER, 'Product Owner',      'motivation', 1),
      childNode('n3', NodeType.MOTIVATION_REQUIREMENT, 'Support Payments',   'motivation', 2),
      childNode('n4', NodeType.MOTIVATION_CONSTRAINT,  'GDPR Compliance',    'motivation', 3),
    ]} />
  ),
};

export const ApplicationLayer: Story = {
  render: () => (
    <Graph nodes={[
      containerNode('c', 'application', 'Application'),
      childNode('n1', NodeType.APPLICATION_COMPONENT, 'Graph Viewer',      'application', 0),
      childNode('n2', NodeType.APPLICATION_SERVICE,   'Node Transformer',  'application', 1),
      childNode('n3', NodeType.APPLICATION_SERVICE,   'Data Loader',       'application', 2),
      childNode('n4', NodeType.APPLICATION_COMPONENT, 'Shared Layout',     'application', 3),
    ]} />
  ),
};
