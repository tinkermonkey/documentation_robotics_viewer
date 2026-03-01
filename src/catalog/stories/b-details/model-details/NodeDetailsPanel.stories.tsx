import type { Meta, StoryObj } from '@storybook/react';
import NodeDetailsPanel from '@/apps/embedded/components/NodeDetailsPanel';
import type { Node } from '@xyflow/react';
import type { MetaModel } from '@/core/types';

const meta = {
  title: 'B Details / Model Details / NodeDetailsPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockModel: MetaModel = {
  references: [],
  layers: {
    motivation: {
      id: 'motivation',
      type: 'Motivation',
      name: 'Motivation Layer',
      description: 'Stakeholders, drivers, and goals',
      order: 1,
      elements: [
        {
          id: 'goal-1',
          type: 'Goal',
          name: 'Increase Revenue',
          layerId: 'motivation',
          description: 'Primary business objective',
          properties: { fill: '#a78bfa', stroke: '#7c3aed' },
          visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['driver-1'], outgoing: ['requirement-1', 'requirement-2'] },
        },
        {
          id: 'requirement-1',
          type: 'Requirement',
          name: 'Support 1000 concurrent users',
          layerId: 'motivation',
          description: 'Scalability requirement',
          properties: { fill: '#60a5fa', stroke: '#3b82f6' },
          visual: { position: { x: 200, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['goal-1'], outgoing: [] },
        },
        {
          id: 'requirement-2',
          type: 'Requirement',
          name: 'Achieve 99.9% uptime',
          layerId: 'motivation',
          description: 'Availability requirement',
          properties: { fill: '#60a5fa', stroke: '#3b82f6' },
          visual: { position: { x: 400, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['goal-1'], outgoing: [] },
        },
        {
          id: 'driver-1',
          type: 'Driver',
          name: 'Market Competition',
          layerId: 'motivation',
          description: 'Competitive pressure from new entrants',
          properties: { fill: '#f87171', stroke: '#ef4444' },
          visual: { position: { x: 0, y: 100 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: [], outgoing: ['goal-1'] },
        },
      ],
      relationships: [
        { id: 'rel-1', sourceId: 'driver-1', targetId: 'goal-1', type: 'drives' },
        { id: 'rel-2', sourceId: 'goal-1', targetId: 'requirement-1', type: 'requires' },
        { id: 'rel-3', sourceId: 'goal-1', targetId: 'requirement-2', type: 'requires' },
      ],
    },
    business: {
      id: 'business',
      type: 'Business',
      name: 'Business Layer',
      description: 'Services and processes',
      order: 2,
      elements: [
        {
          id: 'service-1',
          type: 'BusinessService',
          name: 'Order Management Service',
          layerId: 'business',
          description: 'Manages customer orders',
          properties: { fill: '#34d399', stroke: '#10b981' },
          visual: { position: { x: 0, y: 200 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: [], outgoing: [] },
        },
      ],
      relationships: [],
    },
  },
};

export const NoNodeSelected: Story = {
  render: () => (
    <NodeDetailsPanel selectedNode={null} model={mockModel} />
  ),
};

export const GoalNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: 0, y: 0 },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const RequirementNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'requirement-1',
      position: { x: 200, y: 50 },
      data: {
        label: 'Support 1000 concurrent users',
        type: 'Requirement',
        stroke: '#3b82f6',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const DriverNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'driver-1',
      position: { x: 0, y: 100 },
      data: {
        label: 'Market Competition',
        type: 'Driver',
        stroke: '#ef4444',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const BusinessServiceNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'service-1',
      position: { x: 0, y: 200 },
      data: {
        label: 'Order Management Service',
        type: 'BusinessService',
        stroke: '#10b981',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const NodeWithManyConnections: Story = {
  render: () => {
    const modelWithConnections: MetaModel = {
      ...mockModel,
      layers: {
        ...mockModel.layers,
        motivation: {
          ...mockModel.layers.motivation,
          elements: [
            ...mockModel.layers.motivation.elements,
            {
              id: 'goal-2',
              type: 'Goal',
              name: 'Reduce Cost',
              layerId: 'motivation',
              description: 'Another goal',
              properties: { fill: '#a78bfa', stroke: '#7c3aed' },
              visual: { position: { x: 600, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: [] },
            },
          ],
          relationships: [
            ...mockModel.layers.motivation.relationships,
            { id: 'rel-4', sourceId: 'driver-1', targetId: 'goal-2', type: 'drives' },
            { id: 'rel-5', sourceId: 'goal-2', targetId: 'requirement-2', type: 'requires' },
            { id: 'rel-6', sourceId: 'goal-1', targetId: 'goal-2', type: 'relates-to' },
          ],
        },
      },
    };

    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: 0, y: 0 },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithConnections} />;
  },
};

export const NodeWithLongName: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: 0, y: 0 },
      data: {
        label: 'Enable Real-Time Analytics and Dashboarding Across All Customer Touchpoints with Sub-Second Latency',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const NodeWithoutLabel: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'orphan-node-123',
      position: { x: 100, y: 100 },
      data: {
        type: 'Unknown',
        stroke: '#999999',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const NodeWithNegativePosition: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: -450, y: -250 },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const EmptyModel: Story = {
  render: () => {
    const emptyModel: MetaModel = {
      layers: {},
      references: [],
    };

    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: 0, y: 0 },
      data: {
        label: 'Goal Without Model Context',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={emptyModel} />;
  },
};

export const DarkModePreview: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'goal-1',
      position: { x: 123, y: 456 },
      data: {
        label: 'Increase Revenue',
        type: 'Goal',
        stroke: '#7c3aed',
      },
    };

    return (
      <div className="dark bg-gray-900 p-4 rounded-lg">
        <div className="bg-white dark:bg-gray-800">
          <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />
        </div>
      </div>
    );
  },
};
