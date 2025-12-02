/**
 * Unit tests for C4ViewTransformer
 *
 * Tests all aspects of C4 graph transformation including:
 * - View level filtering (context/container/component)
 * - User filters (container type, technology stack)
 * - Focus+context highlighting
 * - Layout algorithms (hierarchical, force, manual)
 * - Semantic zoom detail levels
 * - Edge styling (protocol labels, animated async)
 * - Path tracing (upstream, downstream, between)
 * - Performance requirements
 */

import { test, expect } from '@playwright/test';
import {
  C4ViewTransformer,
  C4_CONTAINER_NODE_WIDTH,
  C4_CONTAINER_NODE_HEIGHT,
  C4_COMPONENT_NODE_WIDTH,
  C4_COMPONENT_NODE_HEIGHT,
  C4_EXTERNAL_ACTOR_NODE_WIDTH,
  C4_EXTERNAL_ACTOR_NODE_HEIGHT,
} from '../../src/apps/embedded/services/c4ViewTransformer';
import {
  C4Graph,
  C4Node,
  C4Edge,
  C4Hierarchy,
  C4GraphIndexes,
  C4GraphMetadata,
  C4Type,
  ContainerType,
  ProtocolType,
  CommunicationDirection,
  C4TransformerOptions,
  DEFAULT_C4_TRANSFORMER_OPTIONS,
} from '../../src/apps/embedded/types/c4Graph';
import { ModelElement, Relationship } from '../../src/core/types';

// Test helper functions
function createMockModelElement(id: string, name: string): ModelElement {
  return {
    id,
    type: 'service',
    name,
    description: `Mock element ${name}`,
    layerId: 'application',
    properties: {},
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 100, height: 100 },
      style: {},
    },
  };
}

function createMockRelationship(id: string, sourceId: string, targetId: string): Relationship {
  return {
    id,
    type: 'serving',
    sourceId,
    targetId,
    properties: {},
  };
}

function createC4Node(
  id: string,
  name: string,
  c4Type: C4Type,
  options: {
    containerType?: ContainerType;
    technology?: string[];
    parentContainerId?: string;
    changesetStatus?: 'new' | 'modified' | 'deleted';
  } = {}
): C4Node {
  return {
    id,
    c4Type,
    name,
    description: `${name} description`,
    technology: options.technology || [],
    sourceElement: createMockModelElement(id, name),
    containerType: options.containerType,
    parentContainerId: options.parentContainerId,
    boundary: c4Type === C4Type.External ? 'external' : 'internal',
    changesetStatus: options.changesetStatus,
    metadata: {
      apiEndpointCount: 0,
      componentCount: 0,
    },
  };
}

function createC4Edge(
  id: string,
  sourceId: string,
  targetId: string,
  options: {
    protocol?: ProtocolType;
    direction?: CommunicationDirection;
    changesetStatus?: 'new' | 'modified' | 'deleted';
  } = {}
): C4Edge {
  return {
    id,
    sourceId,
    targetId,
    protocol: options.protocol || ProtocolType.REST,
    direction: options.direction || CommunicationDirection.Sync,
    description: `Edge from ${sourceId} to ${targetId}`,
    relationship: createMockRelationship(id, sourceId, targetId),
    changesetStatus: options.changesetStatus,
  };
}

function createTestC4Graph(
  nodes: C4Node[],
  edges: C4Edge[] = []
): C4Graph {
  const nodesMap = new Map<string, C4Node>();
  const edgesMap = new Map<string, C4Edge>();

  nodes.forEach((n) => nodesMap.set(n.id, n));
  edges.forEach((e) => edgesMap.set(e.id, e));

  // Build indexes
  const byType = new Map<C4Type, Set<string>>();
  const byTechnology = new Map<string, Set<string>>();
  const byContainerType = new Map<ContainerType, Set<string>>();
  const containerComponents = new Map<string, Set<string>>();
  const componentContainer = new Map<string, string>();
  const nodesWithOutgoingEdges = new Set<string>();
  const nodesWithIncomingEdges = new Set<string>();

  // Initialize type index
  Object.values(C4Type).forEach((type) => {
    byType.set(type as C4Type, new Set());
  });

  nodes.forEach((node) => {
    byType.get(node.c4Type)!.add(node.id);

    node.technology.forEach((tech) => {
      if (!byTechnology.has(tech)) {
        byTechnology.set(tech, new Set());
      }
      byTechnology.get(tech)!.add(node.id);
    });

    if (node.containerType) {
      if (!byContainerType.has(node.containerType)) {
        byContainerType.set(node.containerType, new Set());
      }
      byContainerType.get(node.containerType)!.add(node.id);
    }

    if (node.c4Type === C4Type.Component && node.parentContainerId) {
      if (!containerComponents.has(node.parentContainerId)) {
        containerComponents.set(node.parentContainerId, new Set());
      }
      containerComponents.get(node.parentContainerId)!.add(node.id);
      componentContainer.set(node.id, node.parentContainerId);
    }
  });

  edges.forEach((edge) => {
    nodesWithOutgoingEdges.add(edge.sourceId);
    nodesWithIncomingEdges.add(edge.targetId);
  });

  const hierarchy: C4Hierarchy = {
    systemBoundary: nodes
      .filter((n) => n.c4Type === C4Type.Container)
      .map((n) => n.id),
    containers: containerComponents,
    externalActors: nodes
      .filter((n) => n.c4Type === C4Type.External)
      .map((n) => n.id),
    parentChildMap: componentContainer,
  };

  const indexes: C4GraphIndexes = {
    byType,
    byTechnology,
    byContainerType,
    containerComponents,
    componentContainer,
    nodesWithOutgoingEdges,
    nodesWithIncomingEdges,
  };

  const metadata: C4GraphMetadata = {
    elementCounts: {
      [C4Type.System]: 0,
      [C4Type.Container]: nodes.filter((n) => n.c4Type === C4Type.Container).length,
      [C4Type.Component]: nodes.filter((n) => n.c4Type === C4Type.Component).length,
      [C4Type.External]: nodes.filter((n) => n.c4Type === C4Type.External).length,
      [C4Type.Deployment]: 0,
    },
    containerTypeCounts: {} as Record<ContainerType, number>,
    technologies: Array.from(byTechnology.keys()),
    maxComponentDepth: 1,
    warnings: [],
    validationErrors: [],
    hasCycles: false,
  };

  return {
    nodes: nodesMap,
    edges: edgesMap,
    hierarchy,
    deploymentMap: new Map(),
    indexes,
    metadata,
  };
}

test.describe('C4ViewTransformer', () => {
  let transformer: C4ViewTransformer;

  test.beforeEach(() => {
    transformer = new C4ViewTransformer();
  });

  test.describe('Constructor and Options', () => {
    test('should use default options when none provided', () => {
      const t = new C4ViewTransformer();
      const emptyGraph = createTestC4Graph([]);
      const result = t.transform(emptyGraph);

      // Should not throw and return valid structure
      expect(result.nodes).toBeDefined();
      expect(result.edges).toBeDefined();
      expect(result.breadcrumb).toBeDefined();
    });

    test('should merge provided options with defaults', () => {
      const t = new C4ViewTransformer({
        viewLevel: 'container',
        layoutAlgorithm: 'force',
      });

      // Transform should use provided options
      const container = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([container]);
      const result = t.transform(graph);

      expect(result).toBeDefined();
    });

    test('should allow updating options via setOptions()', () => {
      const container = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([container]);

      transformer.setOptions({ viewLevel: 'container' });
      const result = transformer.transform(graph);

      expect(result).toBeDefined();
    });
  });

  test.describe('View Level Filtering', () => {
    test('should show only containers and external actors in context view', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const container2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const component1 = createC4Node('comp1', 'Component 1', C4Type.Component, {
        parentContainerId: 'c1',
      });
      const external1 = createC4Node('ext1', 'External Actor', C4Type.External);

      const graph = createTestC4Graph([container1, container2, component1, external1]);

      transformer.setOptions({ viewLevel: 'context' });
      const result = transformer.transform(graph);

      // Should include containers and externals, not components
      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('c1');
      expect(nodeIds).toContain('c2');
      expect(nodeIds).toContain('ext1');
      expect(nodeIds).not.toContain('comp1');
    });

    test('should show components within selected container in container view', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const component1 = createC4Node('comp1', 'Component 1', C4Type.Component, {
        parentContainerId: 'c1',
      });
      const component2 = createC4Node('comp2', 'Component 2', C4Type.Component, {
        parentContainerId: 'c1',
      });
      const component3 = createC4Node('comp3', 'Component 3', C4Type.Component, {
        parentContainerId: 'c2', // Different container
      });

      const graph = createTestC4Graph([container1, component1, component2, component3]);

      transformer.setOptions({
        viewLevel: 'container',
        selectedContainerId: 'c1',
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('c1');
      expect(nodeIds).toContain('comp1');
      expect(nodeIds).toContain('comp2');
      expect(nodeIds).not.toContain('comp3');
    });

    test('should fall back to context view when no container selected', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const component1 = createC4Node('comp1', 'Component 1', C4Type.Component, {
        parentContainerId: 'c1',
      });

      const graph = createTestC4Graph([container1, component1]);

      transformer.setOptions({
        viewLevel: 'container',
        // No selectedContainerId
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('c1');
      expect(nodeIds).not.toContain('comp1');
    });

    test('should include connected external actors in container view', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const external1 = createC4Node('ext1', 'External Actor', C4Type.External);
      const component1 = createC4Node('comp1', 'Component 1', C4Type.Component, {
        parentContainerId: 'c1',
      });

      const edge1 = createC4Edge('e1', 'ext1', 'c1');
      const graph = createTestC4Graph([container1, external1, component1], [edge1]);

      transformer.setOptions({
        viewLevel: 'container',
        selectedContainerId: 'c1',
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('ext1');
    });
  });

  test.describe('User Filters', () => {
    test('should filter by container type', () => {
      const apiContainer = createC4Node('api1', 'API Gateway', C4Type.Container, {
        containerType: ContainerType.Api,
      });
      const dbContainer = createC4Node('db1', 'Database', C4Type.Container, {
        containerType: ContainerType.Database,
      });
      const webApp = createC4Node('web1', 'Web App', C4Type.Container, {
        containerType: ContainerType.WebApp,
      });

      const graph = createTestC4Graph([apiContainer, dbContainer, webApp]);

      transformer.setOptions({
        viewLevel: 'context',
        filterOptions: {
          containerTypes: new Set([ContainerType.Api, ContainerType.WebApp]),
        },
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('api1');
      expect(nodeIds).toContain('web1');
      expect(nodeIds).not.toContain('db1');
    });

    test('should filter by technology stack', () => {
      const reactApp = createC4Node('react1', 'React App', C4Type.Container, {
        technology: ['React', 'TypeScript'],
      });
      const nodeApp = createC4Node('node1', 'Node API', C4Type.Container, {
        technology: ['Node.js', 'Express'],
      });
      const pythonApp = createC4Node('python1', 'Python Service', C4Type.Container, {
        technology: ['Python', 'FastAPI'],
      });

      const graph = createTestC4Graph([reactApp, nodeApp, pythonApp]);

      transformer.setOptions({
        viewLevel: 'context',
        filterOptions: {
          technologyStack: new Set(['React', 'Node.js']),
        },
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('react1');
      expect(nodeIds).toContain('node1');
      expect(nodeIds).not.toContain('python1');
    });

    test('should always include external actors regardless of filters', () => {
      const container = createC4Node('c1', 'Container', C4Type.Container, {
        containerType: ContainerType.Api,
        technology: ['Node.js'],
      });
      const external = createC4Node('ext1', 'External', C4Type.External);

      const graph = createTestC4Graph([container, external]);

      transformer.setOptions({
        viewLevel: 'context',
        filterOptions: {
          containerTypes: new Set([ContainerType.Database]), // Won't match container
        },
      });
      const result = transformer.transform(graph);

      const nodeIds = result.nodes.map((n) => n.id);
      expect(nodeIds).toContain('ext1');
      expect(nodeIds).not.toContain('c1');
    });
  });

  test.describe('Focus+Context Highlighting', () => {
    test('should dim non-focused nodes when focus enabled', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const container2 = createC4Node('c2', 'Container 2', C4Type.Container);

      const graph = createTestC4Graph([container1, container2]);

      transformer.setOptions({
        viewLevel: 'context',
        focusContext: {
          enabled: true,
          focusedNodeId: 'c1',
          dimmedOpacity: 0.3,
        },
      });
      const result = transformer.transform(graph);

      const c1Node = result.nodes.find((n) => n.id === 'c1');
      const c2Node = result.nodes.find((n) => n.id === 'c2');

      expect(c1Node?.data.opacity).toBe(1.0);
      expect(c2Node?.data.opacity).toBe(0.3);
    });

    test('should use default opacity when not specified', () => {
      const container1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const container2 = createC4Node('c2', 'Container 2', C4Type.Container);

      const graph = createTestC4Graph([container1, container2]);

      transformer.setOptions({
        viewLevel: 'context',
        focusContext: {
          enabled: true,
          focusedNodeId: 'c1',
          // No dimmedOpacity specified
        },
      });
      const result = transformer.transform(graph);

      const c2Node = result.nodes.find((n) => n.id === 'c2');
      expect(c2Node?.data.opacity).toBe(0.3); // Default
    });
  });

  test.describe('Path Highlighting', () => {
    test('should highlight nodes in path and dim others', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const c3 = createC4Node('c3', 'Container 3', C4Type.Container);

      const graph = createTestC4Graph([c1, c2, c3]);

      transformer.setOptions({
        viewLevel: 'context',
        pathHighlighting: {
          mode: 'upstream',
          highlightedNodeIds: new Set(['c1', 'c2']),
          highlightedEdgeIds: new Set(),
        },
      });
      const result = transformer.transform(graph);

      const c1Node = result.nodes.find((n) => n.id === 'c1');
      const c2Node = result.nodes.find((n) => n.id === 'c2');
      const c3Node = result.nodes.find((n) => n.id === 'c3');

      expect(c1Node?.data.opacity).toBe(1.0);
      expect(c2Node?.data.opacity).toBe(1.0);
      expect(c3Node?.data.opacity).toBe(0.3);
      expect(c1Node?.data.isHighlighted).toBe(true);
    });

    test('should highlight edges in path', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');
      const e2 = createC4Edge('e2', 'c2', 'c1');

      const graph = createTestC4Graph([c1, c2], [e1, e2]);

      transformer.setOptions({
        viewLevel: 'context',
        pathHighlighting: {
          mode: 'downstream',
          highlightedNodeIds: new Set(['c1', 'c2']),
          highlightedEdgeIds: new Set(['e1']),
        },
      });
      const result = transformer.transform(graph);

      const edge1 = result.edges.find((e) => e.id === 'e1');
      const edge2 = result.edges.find((e) => e.id === 'e2');

      expect(edge1?.style?.strokeWidth).toBe(3);
      expect(edge1?.style?.opacity).toBe(1.0);
      expect(edge2?.style?.opacity).toBe(0.2);
    });
  });

  test.describe('Layout Algorithms', () => {
    test('should use hierarchical layout by default', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');

      const graph = createTestC4Graph([c1, c2], [e1]);

      transformer.setOptions({ layoutAlgorithm: 'hierarchical' });
      const result = transformer.transform(graph);

      // Nodes should have valid positions
      expect(result.nodes[0].position.x).toBeDefined();
      expect(result.nodes[0].position.y).toBeDefined();
      expect(result.bounds.width).toBeGreaterThan(0);
      expect(result.bounds.height).toBeGreaterThan(0);
    });

    test('should use force-directed layout when specified', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);

      const graph = createTestC4Graph([c1, c2]);

      transformer.setOptions({ layoutAlgorithm: 'force' });
      const result = transformer.transform(graph);

      expect(result.nodes[0].position.x).toBeDefined();
      expect(result.nodes[0].position.y).toBeDefined();
    });

    test('should restore manual positions when available', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);

      const graph = createTestC4Graph([c1, c2]);

      const existingPositions = new Map([
        ['c1', { x: 100, y: 200 }],
        ['c2', { x: 300, y: 400 }],
      ]);

      transformer.setOptions({
        layoutAlgorithm: 'manual',
        existingPositions,
      });
      const result = transformer.transform(graph);

      // Find node positions (accounting for center-to-top-left conversion)
      const c1Node = result.nodes.find((n) => n.id === 'c1');
      const c2Node = result.nodes.find((n) => n.id === 'c2');

      // Position should be offset by half width/height from center
      expect(c1Node?.position.x).toBe(100 - C4_CONTAINER_NODE_WIDTH / 2);
      expect(c1Node?.position.y).toBe(200 - C4_CONTAINER_NODE_HEIGHT / 2);
      expect(c2Node?.position.x).toBe(300 - C4_CONTAINER_NODE_WIDTH / 2);
      expect(c2Node?.position.y).toBe(400 - C4_CONTAINER_NODE_HEIGHT / 2);
    });

    test('should fall back to hierarchical when manual has no positions', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);

      const graph = createTestC4Graph([c1]);

      transformer.setOptions({
        layoutAlgorithm: 'manual',
        existingPositions: new Map(), // Empty
      });
      const result = transformer.transform(graph);

      // Should still produce valid layout
      expect(result.nodes[0].position.x).toBeDefined();
    });

    test('should produce no overlapping nodes', () => {
      // Create multiple containers
      const containers = Array.from({ length: 10 }, (_, i) =>
        createC4Node(`c${i}`, `Container ${i}`, C4Type.Container)
      );

      const graph = createTestC4Graph(containers);

      transformer.setOptions({ layoutAlgorithm: 'hierarchical' });
      const result = transformer.transform(graph);

      // Check for overlaps using bounding box intersection
      for (let i = 0; i < result.nodes.length; i++) {
        for (let j = i + 1; j < result.nodes.length; j++) {
          const n1 = result.nodes[i];
          const n2 = result.nodes[j];

          const box1 = {
            left: n1.position.x,
            right: n1.position.x + C4_CONTAINER_NODE_WIDTH,
            top: n1.position.y,
            bottom: n1.position.y + C4_CONTAINER_NODE_HEIGHT,
          };
          const box2 = {
            left: n2.position.x,
            right: n2.position.x + C4_CONTAINER_NODE_WIDTH,
            top: n2.position.y,
            bottom: n2.position.y + C4_CONTAINER_NODE_HEIGHT,
          };

          const overlaps =
            box1.left < box2.right &&
            box1.right > box2.left &&
            box1.top < box2.bottom &&
            box1.bottom > box2.top;

          expect(overlaps).toBe(false);
        }
      }
    });
  });

  test.describe('Semantic Zoom', () => {
    test('should return full detail at high zoom', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.setOptions({
        semanticZoom: {
          enabled: true,
          currentScale: 1.5,
        },
      });
      const result = transformer.transform(graph);

      expect(result.nodes[0].data.detailLevel).toBe('full');
    });

    test('should return medium detail at medium zoom', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.setOptions({
        semanticZoom: {
          enabled: true,
          currentScale: 0.6,
        },
      });
      const result = transformer.transform(graph);

      expect(result.nodes[0].data.detailLevel).toBe('medium');
    });

    test('should return minimal detail at low zoom', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.setOptions({
        semanticZoom: {
          enabled: true,
          currentScale: 0.3,
        },
      });
      const result = transformer.transform(graph);

      expect(result.nodes[0].data.detailLevel).toBe('minimal');
    });

    test('should always return full detail when semantic zoom disabled', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.setOptions({
        semanticZoom: {
          enabled: false,
          currentScale: 0.3,
        },
      });
      const result = transformer.transform(graph);

      expect(result.nodes[0].data.detailLevel).toBe('full');
    });
  });

  test.describe('ReactFlow Node Conversion', () => {
    test('should set correct node type for containers', () => {
      const container = createC4Node('c1', 'Container', C4Type.Container);
      const graph = createTestC4Graph([container]);

      const result = transformer.transform(graph);

      expect(result.nodes[0].type).toBe('c4Container');
    });

    test('should set correct node type for components', () => {
      const container = createC4Node('c1', 'Container', C4Type.Container);
      const component = createC4Node('comp1', 'Component', C4Type.Component, {
        parentContainerId: 'c1',
      });
      const graph = createTestC4Graph([container, component]);

      transformer.setOptions({
        viewLevel: 'container',
        selectedContainerId: 'c1',
      });
      const result = transformer.transform(graph);

      const compNode = result.nodes.find((n) => n.id === 'comp1');
      expect(compNode?.type).toBe('c4Component');
    });

    test('should set correct node type for external actors', () => {
      const external = createC4Node('ext1', 'External', C4Type.External);
      const graph = createTestC4Graph([external]);

      const result = transformer.transform(graph);

      expect(result.nodes[0].type).toBe('c4ExternalActor');
    });

    test('should include all required node data', () => {
      const container = createC4Node('c1', 'Container 1', C4Type.Container, {
        containerType: ContainerType.Api,
        technology: ['Node.js'],
      });
      const graph = createTestC4Graph([container]);

      const result = transformer.transform(graph);

      const nodeData = result.nodes[0].data;
      expect(nodeData.label).toBe('Container 1');
      expect(nodeData.elementId).toBe('c1');
      expect(nodeData.c4Type).toBe(C4Type.Container);
      expect(nodeData.containerType).toBe(ContainerType.Api);
      expect(nodeData.technology).toContain('Node.js');
      expect(nodeData.fill).toBeDefined();
      expect(nodeData.stroke).toBeDefined();
    });

    test('should apply changeset styling for new nodes', () => {
      const container = createC4Node('c1', 'New Container', C4Type.Container, {
        changesetStatus: 'new',
      });
      const graph = createTestC4Graph([container]);

      const result = transformer.transform(graph);

      expect(result.nodes[0].data.fill).toBe('#d1fae5'); // Green
      expect(result.nodes[0].data.stroke).toBe('#10b981');
    });

    test('should apply changeset styling for modified nodes', () => {
      const container = createC4Node('c1', 'Modified Container', C4Type.Container, {
        changesetStatus: 'modified',
      });
      const graph = createTestC4Graph([container]);

      const result = transformer.transform(graph);

      expect(result.nodes[0].data.fill).toBe('#fef3c7'); // Yellow
      expect(result.nodes[0].data.stroke).toBe('#f59e0b');
    });

    test('should apply changeset styling for deleted nodes', () => {
      const container = createC4Node('c1', 'Deleted Container', C4Type.Container, {
        changesetStatus: 'deleted',
      });
      const graph = createTestC4Graph([container]);

      const result = transformer.transform(graph);

      expect(result.nodes[0].data.fill).toBe('#fee2e2'); // Red
      expect(result.nodes[0].data.stroke).toBe('#ef4444');
    });
  });

  test.describe('Edge Conversion', () => {
    test('should include protocol label on edges', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const edge = createC4Edge('e1', 'c1', 'c2', {
        protocol: ProtocolType.gRPC,
      });

      const graph = createTestC4Graph([c1, c2], [edge]);

      transformer.setOptions({
        semanticZoom: { enabled: true, currentScale: 1.0 },
      });
      const result = transformer.transform(graph);

      expect(result.edges[0].label).toBe('gRPC');
    });

    test('should animate async connections', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const edge = createC4Edge('e1', 'c1', 'c2', {
        direction: CommunicationDirection.Async,
      });

      const graph = createTestC4Graph([c1, c2], [edge]);

      const result = transformer.transform(graph);

      expect(result.edges[0].animated).toBe(true);
    });

    test('should not animate sync connections', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const edge = createC4Edge('e1', 'c1', 'c2', {
        direction: CommunicationDirection.Sync,
      });

      const graph = createTestC4Graph([c1, c2], [edge]);

      const result = transformer.transform(graph);

      expect(result.edges[0].animated).toBe(false);
    });

    test('should hide edge labels at low zoom', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const edge = createC4Edge('e1', 'c1', 'c2', {
        protocol: ProtocolType.REST,
      });

      const graph = createTestC4Graph([c1, c2], [edge]);

      transformer.setOptions({
        semanticZoom: { enabled: true, currentScale: 0.4 },
      });
      const result = transformer.transform(graph);

      expect(result.edges[0].label).toBeUndefined();
    });

    test('should include method in label when present', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const edge: C4Edge = {
        ...createC4Edge('e1', 'c1', 'c2', {
          protocol: ProtocolType.REST,
        }),
        method: 'POST',
        path: '/api/users',
      };

      const graph = createTestC4Graph([c1, c2], [edge]);

      transformer.setOptions({
        semanticZoom: { enabled: true, currentScale: 1.0 },
      });
      const result = transformer.transform(graph);

      expect(result.edges[0].label).toContain('POST');
    });
  });

  test.describe('Breadcrumb Navigation', () => {
    test('should include root context in breadcrumb', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.setOptions({ viewLevel: 'context' });
      const result = transformer.transform(graph);

      expect(result.breadcrumb.length).toBe(1);
      expect(result.breadcrumb[0].level).toBe('context');
      expect(result.breadcrumb[0].label).toBe('System Context');
    });

    test('should include container in breadcrumb for container view', () => {
      const container = createC4Node('c1', 'API Gateway', C4Type.Container);
      const graph = createTestC4Graph([container]);

      transformer.setOptions({
        viewLevel: 'container',
        selectedContainerId: 'c1',
      });
      const result = transformer.transform(graph);

      expect(result.breadcrumb.length).toBe(2);
      expect(result.breadcrumb[0].level).toBe('context');
      expect(result.breadcrumb[1].level).toBe('container');
      expect(result.breadcrumb[1].label).toBe('API Gateway');
      expect(result.breadcrumb[1].nodeId).toBe('c1');
    });
  });

  test.describe('Path Tracing', () => {
    test('should trace upstream dependencies', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const c3 = createC4Node('c3', 'Container 3', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');
      const e2 = createC4Edge('e2', 'c2', 'c3');

      const graph = createTestC4Graph([c1, c2, c3], [e1, e2]);

      const upstream = transformer.traceUpstream('c3', graph);

      expect(upstream.has('c3')).toBe(true);
      expect(upstream.has('c2')).toBe(true);
      expect(upstream.has('c1')).toBe(true);
    });

    test('should trace downstream dependencies', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const c3 = createC4Node('c3', 'Container 3', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');
      const e2 = createC4Edge('e2', 'c2', 'c3');

      const graph = createTestC4Graph([c1, c2, c3], [e1, e2]);

      const downstream = transformer.traceDownstream('c1', graph);

      expect(downstream.has('c1')).toBe(true);
      expect(downstream.has('c2')).toBe(true);
      expect(downstream.has('c3')).toBe(true);
    });

    test('should trace path between two nodes', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const c3 = createC4Node('c3', 'Container 3', C4Type.Container);
      const c4 = createC4Node('c4', 'Container 4', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');
      const e2 = createC4Edge('e2', 'c2', 'c3');
      const e3 = createC4Edge('e3', 'c3', 'c4');

      const graph = createTestC4Graph([c1, c2, c3, c4], [e1, e2, e3]);

      const path = transformer.traceBetween('c1', 'c4', graph);

      expect(path.has('c1')).toBe(true);
      expect(path.has('c2')).toBe(true);
      expect(path.has('c3')).toBe(true);
      expect(path.has('c4')).toBe(true);
    });

    test('should return empty set when no path exists', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      // No edges

      const graph = createTestC4Graph([c1, c2]);

      const path = transformer.traceBetween('c1', 'c2', graph);

      expect(path.size).toBe(0);
    });

    test('should get highlighted edges for highlighted nodes', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const c2 = createC4Node('c2', 'Container 2', C4Type.Container);
      const c3 = createC4Node('c3', 'Container 3', C4Type.Container);
      const e1 = createC4Edge('e1', 'c1', 'c2');
      const e2 = createC4Edge('e2', 'c2', 'c3');
      const e3 = createC4Edge('e3', 'c1', 'c3'); // Different edge

      const graph = createTestC4Graph([c1, c2, c3], [e1, e2, e3]);

      const highlightedNodes = new Set(['c1', 'c2']);
      const highlightedEdges = transformer.getHighlightedEdges(highlightedNodes, graph);

      expect(highlightedEdges.has('e1')).toBe(true); // c1 -> c2
      expect(highlightedEdges.has('e2')).toBe(false); // c2 -> c3 (c3 not highlighted)
      expect(highlightedEdges.has('e3')).toBe(false); // c1 -> c3 (c3 not highlighted)
    });
  });

  test.describe('Layout Cache', () => {
    test('should cache layout results', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      // First transform
      const result1 = transformer.transform(graph);
      // Second transform with same graph
      const result2 = transformer.transform(graph);

      // Both should have same positions (from cache)
      expect(result1.nodes[0].position.x).toBe(result2.nodes[0].position.x);
      expect(result1.nodes[0].position.y).toBe(result2.nodes[0].position.y);
    });

    test('should clear cache when requested', () => {
      const c1 = createC4Node('c1', 'Container 1', C4Type.Container);
      const graph = createTestC4Graph([c1]);

      transformer.transform(graph);
      transformer.clearLayoutCache();

      // Should not throw, cache cleared
      const result = transformer.transform(graph);
      expect(result.nodes).toBeDefined();
    });
  });

  test.describe('Node Dimensions', () => {
    test('should export correct container dimensions', () => {
      expect(C4_CONTAINER_NODE_WIDTH).toBe(280);
      expect(C4_CONTAINER_NODE_HEIGHT).toBe(180);
    });

    test('should export correct component dimensions', () => {
      expect(C4_COMPONENT_NODE_WIDTH).toBe(240);
      expect(C4_COMPONENT_NODE_HEIGHT).toBe(140);
    });

    test('should export correct external actor dimensions', () => {
      expect(C4_EXTERNAL_ACTOR_NODE_WIDTH).toBe(160);
      expect(C4_EXTERNAL_ACTOR_NODE_HEIGHT).toBe(120);
    });
  });

  test.describe('Performance', () => {
    test('should filter 100 nodes in under 500ms', () => {
      const nodes = Array.from({ length: 100 }, (_, i) =>
        createC4Node(`c${i}`, `Container ${i}`, C4Type.Container, {
          containerType: i % 2 === 0 ? ContainerType.Api : ContainerType.Database,
          technology: i % 3 === 0 ? ['React'] : ['Node.js'],
        })
      );

      const graph = createTestC4Graph(nodes);

      transformer.setOptions({
        viewLevel: 'context',
        filterOptions: {
          containerTypes: new Set([ContainerType.Api]),
          technologyStack: new Set(['React']),
        },
      });

      const startTime = performance.now();
      const result = transformer.transform(graph);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(result.nodes.length).toBeGreaterThan(0);
    });

    test('should compute layout for 50 nodes in under 800ms', () => {
      const nodes = Array.from({ length: 50 }, (_, i) =>
        createC4Node(`c${i}`, `Container ${i}`, C4Type.Container)
      );

      // Create some edges
      const edges = Array.from({ length: 40 }, (_, i) =>
        createC4Edge(`e${i}`, `c${i}`, `c${(i + 1) % 50}`)
      );

      const graph = createTestC4Graph(nodes, edges);

      transformer.setOptions({ layoutAlgorithm: 'hierarchical' });

      const startTime = performance.now();
      const result = transformer.transform(graph);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(800);
      expect(result.nodes.length).toBe(50);
    });
  });
});
