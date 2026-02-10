import type { StoryDefault, Story } from '@ladle/react';
import { C4InspectorPanel } from '@/apps/embedded/components/C4InspectorPanel';
import type { C4Graph, C4Node, C4Edge } from '@/apps/embedded/types/c4Graph';
import { C4Type, ContainerType, ProtocolType, CommunicationDirection } from '@/apps/embedded/types/c4Graph';

export default {
  title: 'A Primitives / Panels and Sidebars / C4InspectorPanel',
} satisfies StoryDefault;

const mockNodes: C4Node[] = [
  {
    id: 'web-app',
    c4Type: C4Type.Container,
    containerType: ContainerType.WebApp,
    name: 'Web Application',
    description: 'React-based single-page application',
    technology: ['React', 'TypeScript', 'Redux'],
    boundary: 'internal',
    sourceElement: { id: 'web-app', type: 'ApplicationComponent', name: 'Web Application', layerId: 'application', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } },
  },
  {
    id: 'api-gateway',
    c4Type: C4Type.Container,
    containerType: ContainerType.Api,
    name: 'API Gateway',
    description: 'RESTful API gateway',
    technology: ['Node.js', 'Express'],
    boundary: 'internal',
    sourceElement: { id: 'api-gateway', type: 'ApplicationComponent', name: 'API Gateway', layerId: 'application', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } },
  },
  {
    id: 'database',
    c4Type: C4Type.Container,
    containerType: ContainerType.Database,
    name: 'PostgreSQL Database',
    description: 'Primary data store',
    technology: ['PostgreSQL'],
    boundary: 'internal',
    sourceElement: { id: 'database', type: 'ApplicationComponent', name: 'PostgreSQL Database', layerId: 'application', properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 50 }, style: {} } },
  },
];

const mockEdges: C4Edge[] = [
  {
    id: 'e1',
    sourceId: 'web-app',
    targetId: 'api-gateway',
    description: 'Makes API calls',
    protocol: ProtocolType.HTTPS,
    direction: CommunicationDirection.Sync,
    relationship: { id: 'r1', sourceId: 'web-app', targetId: 'api-gateway', type: 'serves' },
  },
  {
    id: 'e2',
    sourceId: 'api-gateway',
    targetId: 'database',
    description: 'Reads/writes data',
    protocol: ProtocolType.JDBC,
    direction: CommunicationDirection.Sync,
    relationship: { id: 'r2', sourceId: 'api-gateway', targetId: 'database', type: 'accesses' },
  },
];

const mockGraph: C4Graph = {
  nodes: new Map(mockNodes.map(n => [n.id, n])),
  edges: new Map(mockEdges.map(e => [e.id, e])),
  hierarchy: {
    systemBoundary: [],
    containers: new Map(),
    externalActors: [],
    parentChildMap: new Map(),
  },
  deploymentMap: new Map(),
  indexes: {
    byType: new Map([
      [C4Type.Container, new Set(['web-app', 'api-gateway', 'database'])],
    ]),
    byTechnology: new Map(),
    byContainerType: new Map([
      [ContainerType.WebApp, new Set(['web-app'])],
      [ContainerType.Api, new Set(['api-gateway'])],
      [ContainerType.Database, new Set(['database'])],
    ]),
    containerComponents: new Map(),
    componentContainer: new Map(),
    nodesWithOutgoingEdges: new Set(['web-app', 'api-gateway']),
    nodesWithIncomingEdges: new Set(['api-gateway', 'database']),
  },
  metadata: {
    elementCounts: {
      [C4Type.System]: 0,
      [C4Type.Container]: 3,
      [C4Type.Component]: 0,
      [C4Type.External]: 0,
      [C4Type.Deployment]: 0,
    },
    containerTypeCounts: {
      [ContainerType.WebApp]: 1,
      [ContainerType.MobileApp]: 0,
      [ContainerType.DesktopApp]: 0,
      [ContainerType.Api]: 1,
      [ContainerType.Database]: 1,
      [ContainerType.MessageQueue]: 0,
      [ContainerType.Cache]: 0,
      [ContainerType.FileStorage]: 0,
      [ContainerType.Service]: 0,
      [ContainerType.Function]: 0,
      [ContainerType.Custom]: 0,
    },
    technologies: ['React', 'TypeScript', 'Redux', 'Node.js', 'Express', 'PostgreSQL'],
    maxComponentDepth: 0,
    warnings: [],
    validationErrors: [],
    hasCycles: false,
  },
};

export const ContainerSelected: Story = () => (
  <div className="w-96 bg-gray-50 p-4">
    <C4InspectorPanel
      selectedNodeId="web-app"
      graph={mockGraph}
      onTraceUpstream={(id) => console.log('Trace upstream:', id)}
      onTraceDownstream={(id) => console.log('Trace downstream:', id)}
      onDrillDown={(id) => console.log('Drill down:', id)}
      onClose={() => console.log('Close inspector')}
    />
  </div>
);

export const ApiSelected: Story = () => (
  <div className="w-96 bg-gray-50 p-4">
    <C4InspectorPanel
      selectedNodeId="api-gateway"
      graph={mockGraph}
      onTraceUpstream={(id) => console.log('Trace upstream:', id)}
      onTraceDownstream={(id) => console.log('Trace downstream:', id)}
      onDrillDown={(id) => console.log('Drill down:', id)}
      onClose={() => console.log('Close inspector')}
    />
  </div>
);

export const DatabaseSelected: Story = () => (
  <div className="w-96 bg-gray-50 p-4">
    <C4InspectorPanel
      selectedNodeId="database"
      graph={mockGraph}
      onTraceUpstream={(id) => console.log('Trace upstream:', id)}
      onTraceDownstream={(id) => console.log('Trace downstream:', id)}
      onClose={() => console.log('Close inspector')}
    />
  </div>
);
