import type { Meta, StoryObj } from '@storybook/react';
import { MotivationInspectorPanel } from '@/apps/embedded/components/MotivationInspectorPanel';
import type { MotivationGraph } from '@/apps/embedded/types/motivationGraph';
import { MotivationElementType, MotivationRelationshipType, RelationshipDirection } from '@/apps/embedded/types/motivationGraph';

const meta = {
  title: 'A Primitives / Panels and Sidebars / MotivationInspectorPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const mockGraph: MotivationGraph = {
  nodes: new Map([
    ['goal-1', {
      id: 'goal-1',
      element: {
        id: 'goal-1',
        type: MotivationElementType.Goal,
        name: 'Improve Customer Satisfaction',
        description: 'Increase customer satisfaction scores by 25% within 12 months through enhanced service quality.',
        layerId: 'motivation-layer',
        properties: {
          priority: 'high',
          status: 'active',
          owner: 'Product Team',
        },
        visual: { position: { x: 0, y: 0 }, size: { width: 180, height: 100 }, style: {} },
      },
      metrics: {
        degreeCentrality: 1,
        inDegree: 0,
        outDegree: 1,
        influenceDepth: 1,
        influenceHeight: 0,
      },
      adjacency: {
        incoming: [],
        outgoing: ['req-1'],
      },
    }],
    ['req-1', {
      id: 'req-1',
      element: {
        id: 'req-1',
        type: MotivationElementType.Requirement,
        name: 'Reduce Response Time',
        description: 'Reduce average customer service response time to under 2 hours',
        layerId: 'motivation-layer',
        properties: {},
        visual: { position: { x: 0, y: 100 }, size: { width: 180, height: 100 }, style: {} },
      },
      metrics: {
        degreeCentrality: 1,
        inDegree: 1,
        outDegree: 0,
        influenceDepth: 0,
        influenceHeight: 1,
      },
      adjacency: {
        incoming: ['goal-1'],
        outgoing: [],
      },
    }],
  ]),
  edges: new Map([
    ['edge-1', {
      id: 'edge-1',
      sourceId: 'goal-1',
      targetId: 'req-1',
      type: MotivationRelationshipType.Realizes,
      relationship: { id: 'rel-1', sourceId: 'goal-1', targetId: 'req-1', type: 'realizes' } as any,
      direction: RelationshipDirection.Outgoing,
    }],
  ]),
  metadata: {
    elementCounts: {} as any,
    relationshipCounts: {} as any,
    maxInfluenceDepth: 2,
    conflicts: [],
    density: 0.5,
    warnings: [],
  },
  adjacencyLists: {
    outgoing: new Map([['goal-1', new Set(['req-1'])]]),
    incoming: new Map([['req-1', new Set(['goal-1'])]]),
  },
};

export const Default: Story = {
  render: () => (
    <div className="w-96 bg-gray-50 p-4">
      <MotivationInspectorPanel
        selectedNodeId="goal-1"
        graph={mockGraph}
        onTraceUpstream={(id) => console.log('Trace upstream:', id)}
        onTraceDownstream={(id) => console.log('Trace downstream:', id)}
        onShowNetwork={(id) => console.log('Show network:', id)}
        onFocusOnElement={(id) => console.log('Focus on element:', id)}
        onClose={() => console.log('Close inspector')}
      />
    </div>
  ),
};

export const RequirementNode: Story = {
  render: () => (
    <div className="w-96 bg-gray-50 p-4">
      <MotivationInspectorPanel
        selectedNodeId="req-1"
        graph={mockGraph}
        onTraceUpstream={(id) => console.log('Trace upstream:', id)}
        onTraceDownstream={(id) => console.log('Trace downstream:', id)}
        onClose={() => console.log('Close inspector')}
      />
    </div>
  ),
};
