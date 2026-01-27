import type { StoryDefault, Story } from '@ladle/react';
import { BusinessLayerControls } from './BusinessLayerControls';
import type { BusinessGraph } from '@/core/types/businessLayer';

export default {
  title: 'Panels & Inspectors / Business / BusinessLayerControls',
} satisfies StoryDefault;

const mockBusinessGraph: BusinessGraph = {
  nodes: new Map([
    ['service-1', { id: 'service-1', type: 'service', name: 'Order Service', metadata: {}, hierarchyLevel: 0, childIds: [], properties: {} }],
    ['service-2', { id: 'service-2', type: 'service', name: 'Payment Service', metadata: {}, hierarchyLevel: 0, childIds: [], properties: {} }],
    ['process-1', { id: 'process-1', type: 'process', name: 'Order Processing', metadata: {}, hierarchyLevel: 0, childIds: ['function-1'], properties: {} }],
    ['function-1', { id: 'function-1', type: 'function', name: 'Validate Order', metadata: {}, hierarchyLevel: 1, childIds: [], properties: {} }],
    ['capability-1', { id: 'capability-1', type: 'capability', name: 'Order Management', metadata: {}, hierarchyLevel: 0, childIds: [], properties: {} }],
  ]),
  edges: new Map([
    ['edge-1', { id: 'edge-1', source: 'service-1', sourceId: 'service-1', target: 'service-2', targetId: 'service-2', type: 'depends_on' }],
    ['edge-2', { id: 'edge-2', source: 'process-1', sourceId: 'process-1', target: 'function-1', targetId: 'function-1', type: 'composes' }],
  ]),
  crossLayerLinks: [],
  indices: {
    byType: new Map([
      ['service', new Set(['service-1', 'service-2'])],
      ['process', new Set(['process-1'])],
      ['function', new Set(['function-1'])],
      ['capability', new Set(['capability-1'])],
    ]),
    byDomain: new Map([['Sales', new Set(['service-1', 'process-1'])]]),
    byLifecycle: new Map([['Active', new Set(['service-1', 'service-2'])]]),
    byCriticality: new Map([['High', new Set(['service-1'])]]),
  },
  hierarchy: {
    maxDepth: 1,
    rootNodes: ['service-1', 'service-2', 'process-1', 'capability-1'],
    leafNodes: ['service-1', 'service-2', 'function-1', 'capability-1'],
    nodesByLevel: new Map([
      [0, new Set(['service-1', 'service-2', 'process-1', 'capability-1'])],
      [1, new Set(['function-1'])],
    ]),
    parentChildMap: new Map([['process-1', ['function-1']]]),
    childParentMap: new Map([['function-1', 'process-1']]),
  },
  metrics: {
    nodeCount: 5,
    edgeCount: 2,
    averageConnectivity: 0.8,
    maxHierarchyDepth: 1,
    circularDependencies: [],
    orphanedNodes: [],
    criticalNodes: ['service-1'],
  },
};

export const Default: Story = () => (
  <BusinessLayerControls
    businessGraph={mockBusinessGraph}
    onExport={(type) => console.log('Export:', type)}
    isExporting={false}
    visibleCount={5}
    totalCount={5}
  />
);

export const WithFilters: Story = () => (
  <BusinessLayerControls
    businessGraph={mockBusinessGraph}
    onExport={(type) => console.log('Export:', type)}
    isExporting={false}
    visibleCount={3}
    totalCount={5}
  />
);

export const Exporting: Story = () => (
  <BusinessLayerControls
    businessGraph={mockBusinessGraph}
    onExport={(type) => console.log('Export:', type)}
    isExporting={true}
    visibleCount={5}
    totalCount={5}
  />
);

export const NoGraph: Story = () => (
  <BusinessLayerControls
    businessGraph={null}
    onExport={(type) => console.log('Export:', type)}
    isExporting={false}
    visibleCount={0}
    totalCount={0}
  />
);
