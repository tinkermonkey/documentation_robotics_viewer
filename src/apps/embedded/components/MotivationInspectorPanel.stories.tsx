// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import { MotivationInspectorPanel } from './MotivationInspectorPanel';
import type { MotivationGraph, MotivationGraphNode, MotivationGraphEdge } from '../types/motivationGraph';
import { MotivationElementType, MotivationRelationshipType } from '../types/motivationGraph';

export default {
  title: 'Motivation / MotivationInspectorPanel',
} satisfies StoryDefault;

const mockNodes: MotivationGraphNode[] = [
  {
    id: 'goal-1',
    element: {
      id: 'goal-1',
      type: MotivationElementType.Goal,
      name: 'Improve Customer Satisfaction',
      description: 'Increase customer satisfaction scores by 25% within 12 months through enhanced service quality.',
      properties: {
        priority: 'high',
        status: 'active',
        owner: 'Product Team',
      },
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
  },
  {
    id: 'req-1',
    element: {
      id: 'req-1',
      type: MotivationElementType.Requirement,
      name: 'Reduce Response Time',
      description: 'Reduce average customer service response time to under 2 hours',
      properties: {},
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
  },
];

const mockEdges: MotivationGraphEdge[] = [
  {
    id: 'edge-1',
    sourceId: 'goal-1',
    targetId: 'req-1',
    relationshipType: MotivationRelationshipType.Realizes,
    sourceRelationship: { id: 'rel-1', sourceId: 'goal-1', targetId: 'req-1', type: 'realization-relationship' },
  },
];

const mockGraph: MotivationGraph = {
  nodes: new Map(mockNodes.map(n => [n.id, n])),
  edges: new Map(mockEdges.map(e => [e.id, e])),
};

export const Default: Story = () => (
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
);

export const RequirementNode: Story = () => (
  <div className="w-96 bg-gray-50 p-4">
    <MotivationInspectorPanel
      selectedNodeId="req-1"
      graph={mockGraph}
      onTraceUpstream={(id) => console.log('Trace upstream:', id)}
      onTraceDownstream={(id) => console.log('Trace downstream:', id)}
      onClose={() => console.log('Close inspector')}
    />
  </div>
);
