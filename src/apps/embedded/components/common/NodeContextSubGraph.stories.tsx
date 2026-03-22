/**
 * Storybook stories for NodeContextSubGraph component
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeContextSubGraph } from './NodeContextSubGraph';
import type { AppNode, AppEdge } from '@/core/types/reactflow';
import { NodeType } from '@/core/nodes/NodeType';

const meta = {
  title: 'A Primitives / Graph Components / NodeContextSubGraph',
  component: NodeContextSubGraph,
  parameters: {
    layout: 'centered',
  },
  args: {
    onNodeClick: () => console.log('Node clicked'),
  },
} satisfies Meta<typeof NodeContextSubGraph>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Helper to create test node
 */
function createTestNode(id: string, label: string, layerId: string, x: number, y: number): AppNode {
  const layerColors: Record<string, string> = {
    Motivation: '#9333ea',
    Business: '#3b82f6',
    Application: '#10b981',
    Technology: '#ef4444',
    Api: '#f59e0b',
    DataModel: '#8b5cf6',
  };

  return {
    id,
    data: {
      label,
      elementId: id,
      layerId,
      fill: layerColors[layerId] || '#9ca3af',
      stroke: layerColors[layerId] || '#9ca3af',
      detailLevel: 'minimal' as const,
      nodeType: NodeType.BUSINESS_FUNCTION,
    },
    position: { x, y },
    type: 'unified',
    width: 140,
    height: 80,
    draggable: false,
    selectable: true,
  };
}

/**
 * Helper to create test edge
 */
function createTestEdge(id: string, source: string, target: string, label: string): AppEdge {
  return {
    id,
    source,
    target,
    label,
    animated: false,
    style: {
      stroke: '#9ca3af',
      strokeWidth: 1.5,
    },
  };
}

/**
 * Story: Single focal node with no neighbors
 */
export const FocalNodeOnly: Story = {
  args: {
    focalElementId: 'elem-1',
    nodes: [
      createTestNode('elem-1', 'Business Function 1', 'Business', 0, 0),
    ],
    edges: [],
  },
};

/**
 * Story: Focal node with single neighbor
 */
export const SingleNeighbor: Story = {
  args: {
    focalElementId: 'elem-1',
    nodes: [
      createTestNode('elem-1', 'Business Function 1', 'Business', 0, 0),
      createTestNode('elem-2', 'Business Service 1', 'Business', 160, 0),
    ],
    edges: [
      createTestEdge('edge-1', 'elem-1', 'elem-2', 'serves'),
    ],
  },
};

/**
 * Story: Focal node with multiple neighbors
 */
export const MultipleNeighbors: Story = {
  args: {
    focalElementId: 'elem-1',
    nodes: [
      createTestNode('elem-1', 'Business Function 1', 'Business', 0, 0),
      createTestNode('elem-2', 'Business Service 1', 'Business', 150, -100),
      createTestNode('elem-3', 'Business Capability 1', 'Business', 150, 100),
      createTestNode('elem-4', 'Business Process 1', 'Business', -150, 0),
    ],
    edges: [
      createTestEdge('edge-1', 'elem-1', 'elem-2', 'serves'),
      createTestEdge('edge-2', 'elem-3', 'elem-1', 'realizes'),
      createTestEdge('edge-3', 'elem-4', 'elem-1', 'supports'),
    ],
  },
};

/**
 * Story: Cross-layer references
 */
export const CrossLayerReferences: Story = {
  args: {
    focalElementId: 'elem-1',
    nodes: [
      createTestNode('elem-1', 'Business Function', 'Business', 0, 0),
      createTestNode('elem-2', 'Application Service', 'Application', 150, 0),
      createTestNode('elem-3', 'Technology Component', 'Technology', -150, 0),
    ],
    edges: [
      {
        id: 'ref-1',
        source: 'elem-1',
        target: 'elem-2',
        label: 'implements',
        animated: false,
        style: {
          stroke: '#d1d5db',
          strokeWidth: 1,
          strokeDasharray: '5,5',
        },
      },
      {
        id: 'ref-2',
        source: 'elem-2',
        target: 'elem-3',
        label: 'uses',
        animated: false,
        style: {
          stroke: '#d1d5db',
          strokeWidth: 1,
          strokeDasharray: '5,5',
        },
      },
    ],
  },
};

/**
 * Story: Rich neighborhood with multiple relationships
 */
export const RichNeighborhood: Story = {
  args: {
    focalElementId: 'core-func',
    nodes: [
      createTestNode('core-func', 'Core Function', 'Motivation', 0, 0),
      createTestNode('goal-1', 'Strategic Goal', 'Motivation', 140, -120),
      createTestNode('req-1', 'Business Requirement', 'Business', 140, 0),
      createTestNode('cap-1', 'Business Capability', 'Business', 140, 120),
      createTestNode('app-1', 'Application Service', 'Application', -140, -60),
      createTestNode('app-2', 'Application Component', 'Application', -140, 60),
    ],
    edges: [
      createTestEdge('edge-1', 'core-func', 'goal-1', 'supports'),
      createTestEdge('edge-2', 'core-func', 'req-1', 'realizes'),
      createTestEdge('edge-3', 'cap-1', 'core-func', 'decomposes'),
      createTestEdge('edge-4', 'core-func', 'app-1', 'implements'),
      createTestEdge('edge-5', 'core-func', 'app-2', 'implements'),
    ],
  },
};

/**
 * Story: Bidirectional relationships
 */
export const BidirectionalRelationships: Story = {
  args: {
    focalElementId: 'elem-1',
    nodes: [
      createTestNode('elem-1', 'Service A', 'Business', 0, 0),
      createTestNode('elem-2', 'Service B', 'Business', 180, 0),
    ],
    edges: [
      createTestEdge('edge-1', 'elem-1', 'elem-2', 'calls'),
      createTestEdge('edge-2', 'elem-2', 'elem-1', 'replies'),
    ],
  },
};
