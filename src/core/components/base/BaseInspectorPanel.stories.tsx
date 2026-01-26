import type { StoryDefault, Story } from '@ladle/react';
import { BaseInspectorPanel } from './BaseInspectorPanel';
import type { BaseGraph, BaseNode, BaseEdge } from './types';
import { ArrowUp, ArrowDown, Eye } from 'lucide-react';

export default {
  title: 'Core / BaseInspectorPanel',
} satisfies StoryDefault;

/**
 * Sample node type for demo
 */
interface DemoNode extends BaseNode {
  id: string;
  name: string;
  description?: string;
  type: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Sample edge type for demo
 */
interface DemoEdge extends BaseEdge {
  id: string;
  sourceId: string;
  targetId: string;
  type: string;
  weight?: number;
}

/**
 * Sample graph type for demo
 */
interface DemoGraph extends BaseGraph<DemoNode, DemoEdge> {
  nodes: Map<string, DemoNode>;
  edges: Map<string, DemoEdge>;
}

/**
 * Create demo graph fixture
 */
function createDemoGraph(): DemoGraph {
  const nodes = new Map<string, DemoNode>();
  const edges = new Map<string, DemoEdge>();

  // Add sample nodes
  const nodesList: DemoNode[] = [
    {
      id: 'node-1',
      name: 'Strategic Goal',
      description: 'Increase market share by 25%',
      type: 'Goal',
      priority: 'high',
    },
    {
      id: 'node-2',
      name: 'Digital Transformation',
      description: 'Transform business processes digitally',
      type: 'Outcome',
      priority: 'high',
    },
    {
      id: 'node-3',
      name: 'API Integration',
      description: 'Build API-first architecture',
      type: 'Requirement',
      priority: 'medium',
    },
    {
      id: 'node-4',
      name: 'Customer Satisfaction',
      description: 'Improve customer satisfaction metrics',
      type: 'Goal',
      priority: 'high',
    },
    {
      id: 'node-5',
      name: 'Internal Constraint',
      description: 'Limited budget allocation',
      type: 'Constraint',
    },
  ];

  nodesList.forEach((node) => nodes.set(node.id, node));

  // Add sample edges
  const edgesList: DemoEdge[] = [
    {
      id: 'edge-1',
      sourceId: 'node-1',
      targetId: 'node-2',
      type: 'influences',
      weight: 0.8,
    },
    {
      id: 'edge-2',
      sourceId: 'node-2',
      targetId: 'node-3',
      type: 'realizes',
      weight: 0.9,
    },
    {
      id: 'edge-3',
      sourceId: 'node-4',
      targetId: 'node-3',
      type: 'requires',
      weight: 0.7,
    },
    {
      id: 'edge-4',
      sourceId: 'node-5',
      targetId: 'node-1',
      type: 'constrains',
      weight: 0.6,
    },
  ];

  edgesList.forEach((edge) => edges.set(edge.id, edge));

  return {
    nodes,
    edges,
  };
}

/**
 * Default story showing inspector panel with a selected node
 */
export const Default: Story = () => {
  const graph = createDemoGraph();
  const selectedNodeId = 'node-1';

  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRight: '1px solid #e5e7eb' }}>
        <BaseInspectorPanel
          selectedNodeId={selectedNodeId}
          graph={graph}
          onClose={() => console.log('Close clicked')}
          renderElementDetails={(node: DemoNode) => (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-sm font-semibold">{node.name}</span>
              </div>
              {node.description && (
                <div>
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                  <p className="text-sm mt-1">{node.description}</p>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm">{node.type}</span>
              </div>
              {node.priority && (
                <div className="flex justify-between">
                  <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Priority:</span>
                  <span className="text-sm">{node.priority}</span>
                </div>
              )}
            </div>
          )}
          getNodeName={(node: DemoNode) => node.name}
          getEdgeType={(edge: DemoEdge) => edge.type}
          quickActions={[
            {
              id: 'trace-up',
              title: 'Trace Upstream',
              icon: <ArrowUp className="w-4 h-4" />,
              color: 'gray' as const,
              onClick: (node: DemoNode) => console.log('Trace upstream:', node.id),
              description: 'Show all elements that influence this element',
            },
            {
              id: 'trace-down',
              title: 'Trace Downstream',
              icon: <ArrowDown className="w-4 h-4" />,
              color: 'gray' as const,
              onClick: (node: DemoNode) => console.log('Trace downstream:', node.id),
              description: 'Show all elements influenced by this element',
            },
            {
              id: 'focus',
              title: 'Focus on Element',
              icon: <Eye className="w-4 h-4" />,
              color: 'gray' as const,
              onClick: (node: DemoNode) => console.log('Focus on:', node.id),
              condition: (node: DemoNode) => node.type === 'Goal',
              description: 'Dim other elements to focus on this one',
            },
          ]}
        />
      </div>
    </div>
  );
};

/**
 * Story showing inspector panel with no element selected
 */
export const NoSelection: Story = () => {
  const graph = createDemoGraph();

  return (
    <div style={{ width: '100%', height: 400, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRight: '1px solid #e5e7eb' }}>
        <BaseInspectorPanel
          selectedNodeId={null}
          graph={graph}
          onClose={() => console.log('Close clicked')}
          renderElementDetails={(node: DemoNode) => <div>{node.name}</div>}
          getNodeName={(node: DemoNode) => node.name}
          getEdgeType={(edge: DemoEdge) => edge.type}
        />
      </div>
    </div>
  );
};

/**
 * Story showing inspector panel with custom relationship badges
 */
export const CustomRelationshipBadges: Story = () => {
  const graph = createDemoGraph();
  const selectedNodeId = 'node-3';

  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRight: '1px solid #e5e7eb' }}>
        <BaseInspectorPanel
          selectedNodeId={selectedNodeId}
          graph={graph}
          onClose={() => console.log('Close clicked')}
          renderElementDetails={(node: DemoNode) => (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <p className="text-sm font-semibold mt-1">{node.name}</p>
              </div>
            </div>
          )}
          getNodeName={(node: DemoNode) => node.name}
          getEdgeType={(edge: DemoEdge) => edge.type}
          renderRelationshipBadge={(edge: DemoEdge) => (
            <div className="mb-1">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {edge.type} ({(edge.weight as number | undefined)?.toFixed(1) || 'N/A'})
              </span>
            </div>
          )}
        />
      </div>
    </div>
  );
};

/**
 * Story showing inspector panel with multiple relationships
 */
export const MultipleRelationships: Story = () => {
  const graph = createDemoGraph();
  const selectedNodeId = 'node-1';

  return (
    <div style={{ width: '100%', height: 700, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRight: '1px solid #e5e7eb' }}>
        <BaseInspectorPanel
          selectedNodeId={selectedNodeId}
          graph={graph}
          onClose={() => console.log('Close clicked')}
          renderElementDetails={(node: DemoNode) => (
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <span className="text-sm font-semibold">{node.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Type:</span>
                <span className="text-sm">{node.type}</span>
              </div>
            </div>
          )}
          getNodeName={(node: DemoNode) => node.name}
          getEdgeType={(edge: DemoEdge) => edge.type}
          title="Element Inspector"
        />
      </div>
    </div>
  );
};

/**
 * Story showing inspector panel with conditional quick actions
 */
export const ConditionalQuickActions: Story = () => {
  const graph = createDemoGraph();
  const selectedNodeId = 'node-2';

  return (
    <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb', display: 'flex' }}>
      <div style={{ width: '100%', maxWidth: 400, borderRight: '1px solid #e5e7eb' }}>
        <BaseInspectorPanel
          selectedNodeId={selectedNodeId}
          graph={graph}
          onClose={() => console.log('Close clicked')}
          renderElementDetails={(node: DemoNode) => (
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Name:</span>
                <p className="text-sm font-semibold mt-1">{node.name}</p>
              </div>
              <div>
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Description:</span>
                <p className="text-sm mt-1">{node.description}</p>
              </div>
            </div>
          )}
          getNodeName={(node: DemoNode) => node.name}
          getEdgeType={(edge: DemoEdge) => edge.type}
          quickActions={[
            {
              id: 'trace-up',
              title: 'Trace Upstream',
              icon: <ArrowUp className="w-4 h-4" />,
              color: 'gray' as const,
              onClick: (node: DemoNode) => console.log('Trace upstream:', node.id),
              condition: (node: DemoNode) => node.type === 'Goal' || node.type === 'Outcome',
            },
            {
              id: 'trace-down',
              title: 'Trace Downstream',
              icon: <ArrowDown className="w-4 h-4" />,
              color: 'gray' as const,
              onClick: (node: DemoNode) => console.log('Trace downstream:', node.id),
            },
            {
              id: 'focus',
              title: 'Focus on Element',
              icon: <Eye className="w-4 h-4" />,
              color: 'blue' as const,
              onClick: (node: DemoNode) => console.log('Focus on:', node.id),
              condition: (node: DemoNode) => node.priority === 'high',
            },
          ]}
          title="Outcome Inspector"
        />
      </div>
    </div>
  );
};
