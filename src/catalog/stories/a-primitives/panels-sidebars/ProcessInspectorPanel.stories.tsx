import type { Meta, StoryObj } from '@storybook/react';
import { ProcessInspectorPanel } from '@/apps/embedded/components/businessLayer/ProcessInspectorPanel';
import type { BusinessNode, BusinessGraph } from '@/core/types/businessLayer';

const meta = {
  title: 'A Primitives / Panels and Sidebars / ProcessInspectorPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj;

const mockProcess: BusinessNode = {
  id: 'process-1',
  type: 'process',
  name: 'Order Processing',
  description: 'Main process for handling customer orders',
  metadata: {
    owner: 'Sales Team',
    domain: 'Sales',
    criticality: 'high',
    lifecycle: 'active',
    subprocessCount: 5,
  },
  hierarchyLevel: 0,
  childIds: ['process-2', 'function-1'],
  properties: {},
};

const mockBusinessGraph: BusinessGraph = {
  nodes: new Map([
    ['process-1', mockProcess],
    ['process-2', { id: 'process-2', type: 'process', name: 'Payment Processing', metadata: {}, hierarchyLevel: 1, childIds: [], properties: {} }],
    ['function-1', { id: 'function-1', type: 'function', name: 'Validate Order', metadata: {}, hierarchyLevel: 1, childIds: [], properties: {} }],
    ['service-1', { id: 'service-1', type: 'service', name: 'Order Service', metadata: {}, hierarchyLevel: 0, childIds: [], properties: {} }],
  ]),
  edges: new Map([
    ['edge-1', { id: 'edge-1', source: 'process-1', sourceId: 'process-1', target: 'process-2', targetId: 'process-2', type: 'flows_to' }],
    ['edge-2', { id: 'edge-2', source: 'process-2', sourceId: 'process-2', target: 'process-1', targetId: 'process-1', type: 'depends_on' }],
    ['edge-3', { id: 'edge-3', source: 'process-1', sourceId: 'process-1', target: 'function-1', targetId: 'function-1', type: 'composes' }],
  ]),
  crossLayerLinks: [
    {
      source: 'process-1',
      sourceLayer: 'business',
      target: 'api-endpoint-1',
      targetLayer: 'api',
      type: 'implements',
    },
    {
      source: 'process-1',
      sourceLayer: 'business',
      target: 'service-component-1',
      targetLayer: 'application',
      type: 'realized-by',
    },
  ],
  indices: {
    byType: new Map([['process', new Set(['process-1', 'process-2'])]]),
    byDomain: new Map(),
    byLifecycle: new Map(),
    byCriticality: new Map(),
  },
  hierarchy: {
    maxDepth: 2,
    rootNodes: ['process-1', 'service-1'],
    leafNodes: ['process-2', 'function-1'],
    nodesByLevel: new Map([
      [0, new Set(['process-1', 'service-1'])],
      [1, new Set(['process-2', 'function-1'])],
    ]),
    parentChildMap: new Map([['process-1', ['process-2', 'function-1']]]),
    childParentMap: new Map([
      ['process-2', 'process-1'],
      ['function-1', 'process-1'],
    ]),
  },
  metrics: {
    nodeCount: 4,
    edgeCount: 3,
    averageConnectivity: 1.5,
    maxHierarchyDepth: 2,
    circularDependencies: [],
    orphanedNodes: [],
    criticalNodes: ['process-1'],
  },
};

export const Default: Story = {
  render: () => (
    <ProcessInspectorPanel
    selectedNode={null}
    businessGraph={mockBusinessGraph}
    onTraceUpstream={() => console.log('Trace upstream')}
    onTraceDownstream={() => console.log('Trace downstream')}
    onIsolate={() => console.log('Isolate')}
  />
  ),
};

export const ProcessSelected: Story = {
  render: () => (
    <ProcessInspectorPanel
    selectedNode={mockProcess}
    businessGraph={mockBusinessGraph}
    onTraceUpstream={() => console.log('Trace upstream')}
    onTraceDownstream={() => console.log('Trace downstream')}
    onIsolate={() => console.log('Isolate')}
    onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)}
  />
  ),
};

export const ProcessWithCrossLayerLinks: Story = {
  render: () => (
    <ProcessInspectorPanel
    selectedNode={mockProcess}
    businessGraph={mockBusinessGraph}
    onTraceUpstream={() => console.log('Trace upstream')}
    onTraceDownstream={() => console.log('Trace downstream')}
    onIsolate={() => console.log('Isolate')}
    onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)}
  />
  ),
};

export const ComplexProcess: Story = {
  render: () => (
    const complexProcess: BusinessNode = {
    id: 'process-complex',
    type: 'process',
    name: 'Enterprise Integration Bus',
    description: 'Centralized message broker and integration platform for all business services',
    metadata: {
      owner: 'Integration Team',
      domain: 'Infrastructure',
      criticality: 'high',
      lifecycle: 'active',
      subprocessCount: 12,
    },
    hierarchyLevel: 0,
    childIds: ['process-1', 'process-2'],
    properties: {},
  };

  const complexGraph: BusinessGraph = {
    nodes: new Map([
      ...mockBusinessGraph.nodes,
      ['process-complex', complexProcess],
    ]),
    edges: new Map([
      ...mockBusinessGraph.edges,
      ['edge-complex-1', { id: 'edge-complex-1', source: 'process-complex', sourceId: 'process-complex', target: 'process-1', targetId: 'process-1', type: 'flows_to' }],
      ['edge-complex-2', { id: 'edge-complex-2', source: 'process-complex', sourceId: 'process-complex', target: 'process-2', targetId: 'process-2', type: 'flows_to' }],
      ['edge-complex-3', { id: 'edge-complex-3', source: 'service-1', sourceId: 'service-1', target: 'process-complex', targetId: 'process-complex', type: 'depends_on' }],
    ]),
    crossLayerLinks: mockBusinessGraph.crossLayerLinks,
    indices: mockBusinessGraph.indices,
    hierarchy: mockBusinessGraph.hierarchy,
    metrics: mockBusinessGraph.metrics,
  };

  return (
    <ProcessInspectorPanel
      selectedNode={complexProcess}
      businessGraph={complexGraph}
      onTraceUpstream={() => console.log('Trace upstream')}
      onTraceDownstream={() => console.log('Trace downstream')}
      onIsolate={() => console.log('Isolate')}
      onNavigateToCrossLayer={(layer, id) => console.log('Navigate to', layer, id)}
    />
  );
  ),
};

export const SimpleFunction: Story = {
  render: () => (
    const simpleFunction: BusinessNode = {
    id: 'function-1',
    type: 'function',
    name: 'Calculate Tax',
    description: 'Computes applicable tax for order items',
    metadata: {
      owner: 'Finance',
      domain: 'Finance',
      criticality: 'medium',
      lifecycle: 'active',
    },
    hierarchyLevel: 1,
    childIds: [],
    properties: {},
  };

  return (
    <ProcessInspectorPanel
      selectedNode={simpleFunction}
      businessGraph={mockBusinessGraph}
      onTraceUpstream={() => console.log('Trace upstream')}
      onTraceDownstream={() => console.log('Trace downstream')}
      onIsolate={() => console.log('Isolate')}
    />
  );
  ),
};
