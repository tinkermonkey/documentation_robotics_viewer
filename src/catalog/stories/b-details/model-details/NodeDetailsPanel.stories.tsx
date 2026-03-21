import type { Meta, StoryObj } from '@storybook/react';
import NodeDetailsPanel from '@/apps/embedded/components/NodeDetailsPanel';
import type { Node } from '@xyflow/react';
import type { MetaModel, SourceReference, SpecLayerData } from '@/core/types';
import { LayerType } from '@/core/types/layers';
import { ReferenceType } from '@/core/types/model';
import { useModelStore } from '@/core/stores/modelStore';

const meta = {
  title: 'B Details / Model Details / NodeDetailsPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const mockModel: MetaModel = {
  version: '1.0.0',
  references: [
    {
      id: 'ref-1',
      type: ReferenceType.Goal,
      source: { elementId: 'motivation.goal.increase-revenue', layerId: 'motivation' },
      target: { elementId: 'business.service.order-management', layerId: 'business' },
    },
  ],
  layers: {
    motivation: {
      id: 'motivation',
      type: LayerType.Motivation,
      name: 'Motivation Layer',
      description: 'Stakeholders, drivers, and goals',
      order: 1,
      elements: [
        {
          id: 'goal-1',
          type: 'Goal',
          elementId: 'motivation.goal.increase-revenue',
          name: 'Increase Revenue',
          layerId: 'motivation',
          description: 'Primary business objective to grow annual recurring revenue.',
          properties: { priority: 'high', status: 'active', owner: 'Product Team' },
          visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['driver-1'], outgoing: ['requirement-1', 'requirement-2'] },
        },
        {
          id: 'requirement-1',
          type: 'Requirement',
          name: 'Support 1000 concurrent users',
          layerId: 'motivation',
          description: 'Scalability requirement',
          properties: { priority: 'medium', status: 'pending' },
          visual: { position: { x: 200, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['goal-1'], outgoing: [] },
        },
        {
          id: 'requirement-2',
          type: 'Requirement',
          name: 'Achieve 99.9% uptime',
          layerId: 'motivation',
          description: 'Availability requirement',
          properties: { priority: 'high', status: 'active' },
          visual: { position: { x: 400, y: 0 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: ['goal-1'], outgoing: [] },
        },
        {
          id: 'driver-1',
          type: 'Driver',
          name: 'Market Competition',
          layerId: 'motivation',
          description: 'Competitive pressure from new entrants',
          properties: { category: 'external', owner: 'Strategy Team' },
          visual: { position: { x: 0, y: 100 }, size: { width: 160, height: 80 }, style: {} },
          relationships: { incoming: [], outgoing: ['goal-1'] },
        },
      ],
      relationships: [
        { id: 'rel-1', sourceId: 'driver-1', targetId: 'goal-1', type: 'influence' },
        { id: 'rel-2', sourceId: 'goal-1', targetId: 'requirement-1', type: 'reference' },
        { id: 'rel-3', sourceId: 'goal-1', targetId: 'requirement-2', type: 'reference' },
      ],
    },
    business: {
      id: 'business',
      type: LayerType.Business,
      name: 'Business Layer',
      description: 'Services and processes',
      order: 2,
      elements: [
        {
          id: 'service-1',
          type: 'BusinessService',
          name: 'Order Management Service',
          layerId: 'business',
          description: 'Manages customer orders end-to-end.',
          properties: { status: 'active', owner: 'Commerce Team' },
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
      id: 'node-goal-1',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-1',
        layerId: 'motivation',
        label: 'Increase Revenue',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const RequirementNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'node-requirement-1',
      position: { x: 200, y: 50 },
      data: {
        nodeType: 'motivation.requirement',
        elementId: 'requirement-1',
        layerId: 'motivation',
        label: 'Support 1000 concurrent users',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const DriverNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'node-driver-1',
      position: { x: 0, y: 100 },
      data: {
        nodeType: 'motivation.driver',
        elementId: 'driver-1',
        layerId: 'motivation',
        label: 'Market Competition',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const BusinessServiceNodeSelected: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'node-service-1',
      position: { x: 0, y: 200 },
      data: {
        nodeType: 'business.service',
        elementId: 'service-1',
        layerId: 'business',
        label: 'Order Management Service',
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
              properties: { priority: 'low', status: 'draft' },
              visual: { position: { x: 600, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: [] },
            },
          ],
          relationships: [
            ...mockModel.layers.motivation.relationships,
            { id: 'rel-4', sourceId: 'driver-1', targetId: 'goal-2', type: 'influence' },
            { id: 'rel-5', sourceId: 'goal-2', targetId: 'requirement-2', type: 'reference' },
            { id: 'rel-6', sourceId: 'goal-1', targetId: 'goal-2', type: 'reference' },
          ],
        },
      },
    };

    const selectedNode: Node = {
      id: 'node-goal-1',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-1',
        layerId: 'motivation',
        label: 'Increase Revenue',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithConnections} />;
  },
};

export const NodeWithLongName: Story = {
  render: () => {
    const modelWithLongName: MetaModel = {
      ...mockModel,
      layers: {
        ...mockModel.layers,
        motivation: {
          ...mockModel.layers.motivation,
          elements: [
            {
              id: 'goal-long',
              type: 'Goal',
              name: 'Enable Real-Time Analytics and Dashboarding Across All Customer Touchpoints with Sub-Second Latency',
              layerId: 'motivation',
              description: 'Ambitious analytics goal.',
              properties: { priority: 'high', status: 'active' },
              visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: [] },
            },
          ],
          relationships: [],
        },
      },
    };

    const selectedNode: Node = {
      id: 'node-goal-long',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-long',
        layerId: 'motivation',
        label: 'Enable Real-Time Analytics...',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithLongName} />;
  },
};

export const NodeWithoutLabel: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'node-orphan-123',
      position: { x: 100, y: 100 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'orphan-123',
        layerId: 'motivation',
        label: 'Orphan Node',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={mockModel} />;
  },
};

export const ChangesetAddNode: Story = {
  render: () => {
    const modelWithChangeset: MetaModel = {
      ...mockModel,
      layers: {
        ...mockModel.layers,
        motivation: {
          ...mockModel.layers.motivation,
          elements: [
            {
              id: 'goal-new',
              type: 'Goal',
              name: 'New Strategic Goal',
              layerId: 'motivation',
              description: 'Newly added goal in changeset.',
              properties: { priority: 'high', status: 'draft', owner: 'Strategy Team' },
              visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: [] },
            },
          ],
          relationships: [],
        },
      },
    };

    const selectedNode: Node = {
      id: 'node-goal-new',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-new',
        layerId: 'motivation',
        label: 'New Strategic Goal',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithChangeset} />;
  },
};

export const EmptyModel: Story = {
  render: () => {
    const emptyModel: MetaModel = {
      version: '1.0.0',
      layers: {},
      references: [],
    };

    const selectedNode: Node = {
      id: 'node-goal-1',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-1',
        layerId: 'motivation',
        label: 'Goal Without Model Context',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={emptyModel} />;
  },
};

export const DarkModePreview: Story = {
  render: () => {
    const selectedNode: Node = {
      id: 'node-goal-1',
      position: { x: 123, y: 456 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-1',
        layerId: 'motivation',
        label: 'Increase Revenue',
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

export const WithAttributesAndSourceReferences: Story = {
  render: () => {
    // Setup spec schemas in store for the story
    const mockSpecSchemas: Record<string, SpecLayerData> = {
      motivation: {
        layer: { id: 'motivation', number: 1, name: 'Motivation', description: 'Motivation layer' },
        nodeSchemas: {
          goal: {
            properties: {
              attributes: {
                properties: {
                  targetGrowth: { type: 'string', description: 'Target growth percentage' },
                  timeframe: { type: 'string', description: 'Target timeframe for achievement' },
                  metricsKey: { type: 'string', description: 'Key metric to track' },
                },
                required: ['targetGrowth'],
              },
            },
          },
        },
        relationshipSchemas: [],
      },
    };

    useModelStore.setState({ specSchemas: mockSpecSchemas });

    const sourceRef: SourceReference = {
      provenance: 'extracted',
      locations: [
        {
          file: 'src/models/requirements.yaml',
          symbol: 'goals.revenue',
        },
      ],
      repository: {
        url: 'https://github.com/example/architecture',
        commit: 'abc123def456',
      },
    };

    const modelWithV083Data: MetaModel = {
      version: '0.8.3',
      references: [
        {
          id: 'ref-1',
          type: ReferenceType.Goal,
          source: { elementId: 'motivation.goal.increase-revenue', layerId: 'motivation' },
          target: { elementId: 'business.service.order-management', layerId: 'business' },
        },
      ],
      layers: {
        motivation: {
          id: 'motivation',
          type: LayerType.Motivation,
          name: 'Motivation Layer',
          description: 'Stakeholders, drivers, and goals',
          order: 1,
          elements: [
            {
              id: 'goal-1',
              type: 'Goal',
              elementId: 'motivation.goal.increase-revenue',
              name: 'Increase Revenue',
              specNodeId: 'motivation.goal',
              layerId: 'motivation',
              description: 'Primary business objective to grow annual recurring revenue.',
              properties: { priority: 'high', status: 'active', owner: 'Product Team' },
              attributes: {
                targetGrowth: '25%',
                timeframe: 'Q4 2025',
                metricsKey: 'ARR',
              },
              sourceReferences: sourceRef ? [sourceRef] : undefined,
              visual: { position: { x: 0, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: ['driver-1'], outgoing: ['requirement-1', 'requirement-2'] },
            },
            {
              id: 'requirement-1',
              type: 'Requirement',
              name: 'Support 1000 concurrent users',
              layerId: 'motivation',
              description: 'Scalability requirement',
              properties: { priority: 'medium', status: 'pending' },
              visual: { position: { x: 200, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: ['goal-1'], outgoing: [] },
            },
            {
              id: 'requirement-2',
              type: 'Requirement',
              name: 'Achieve 99.9% uptime',
              layerId: 'motivation',
              description: 'Availability requirement',
              properties: { priority: 'high', status: 'active' },
              visual: { position: { x: 400, y: 0 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: ['goal-1'], outgoing: [] },
            },
            {
              id: 'driver-1',
              type: 'Driver',
              name: 'Market Competition',
              layerId: 'motivation',
              description: 'Competitive pressure from new entrants',
              properties: { category: 'external', owner: 'Strategy Team' },
              visual: { position: { x: 0, y: 100 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: ['goal-1'] },
            },
          ],
          relationships: [
            { id: 'rel-1', sourceId: 'driver-1', targetId: 'goal-1', type: 'influence' },
            { id: 'rel-2', sourceId: 'goal-1', targetId: 'requirement-1', type: 'reference' },
            { id: 'rel-3', sourceId: 'goal-1', targetId: 'requirement-2', type: 'reference' },
          ],
        },
        business: {
          id: 'business',
          type: LayerType.Business,
          name: 'Business Layer',
          description: 'Services and processes',
          order: 2,
          elements: [
            {
              id: 'service-1',
              type: 'BusinessService',
              name: 'Order Management Service',
              layerId: 'business',
              description: 'Manages customer orders end-to-end.',
              properties: { status: 'active', owner: 'Commerce Team' },
              visual: { position: { x: 0, y: 200 }, size: { width: 160, height: 80 }, style: {} },
              relationships: { incoming: [], outgoing: [] },
            },
          ],
          relationships: [],
        },
      },
    };

    const selectedNode: Node = {
      id: 'node-goal-1',
      position: { x: 0, y: 0 },
      data: {
        nodeType: 'motivation.goal',
        elementId: 'goal-1',
        layerId: 'motivation',
        label: 'Increase Revenue',
      },
    };

    return <NodeDetailsPanel selectedNode={selectedNode} model={modelWithV083Data} />;
  },
};
