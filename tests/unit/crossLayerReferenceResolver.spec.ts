/**
 * Unit tests for CrossLayerReferenceResolver
 */

import { test, expect } from '@playwright/test';
import { CrossLayerReferenceResolver } from '../../src/core/services/crossLayerReferenceResolver';
import { BusinessGraph, BusinessNode } from '../../src/core/types/businessLayer';
import { MetaModel, ModelElement, Layer, Reference } from '../../src/core/types';

test.describe('CrossLayerReferenceResolver', () => {
  let resolver: CrossLayerReferenceResolver;

  test.beforeEach(() => {
    resolver = new CrossLayerReferenceResolver();
  });

  test.describe('resolveAllLinks()', () => {
    test('should resolve links to all layers', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Business Process', {
          realizes: ['m1'],
          accesses: ['d1'],
        }),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('m1', 'goal', 'Goal 1')],
        DataModel: [createTestModelElement('d1', 'schema', 'Schema 1')],
      });

      const result = resolver.resolveAllLinks(businessGraph, model);

      expect(result.crossLayerLinks.length).toBeGreaterThan(0);
      const motivationLinks = result.crossLayerLinks.filter(
        (l) => l.targetLayer === 'motivation'
      );
      const dataModelLinks = result.crossLayerLinks.filter(
        (l) => l.targetLayer === 'data_model'
      );

      expect(motivationLinks.length).toBeGreaterThan(0);
      expect(dataModelLinks.length).toBeGreaterThan(0);
    });

    test('should handle model with no other layers', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1'),
      ]);

      const model = createTestModel({});

      const result = resolver.resolveAllLinks(businessGraph, model);

      expect(result.crossLayerLinks.length).toBe(0);
      expect(resolver.getWarnings().length).toBe(0);
    });
  });

  test.describe('resolveMotivationLinks()', () => {
    test('should resolve realizes relationships to motivation layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', { realizes: ['goal-1'] }),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Improve Quality')],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].source).toBe('b1');
      expect(links[0].target).toBe('goal-1');
      expect(links[0].sourceLayer).toBe('business');
      expect(links[0].targetLayer).toBe('motivation');
      expect(links[0].type).toBe('realizes');
    });

    test('should resolve supports relationships to motivation layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'function', 'Function 1', { supports: ['goal-1'] }),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Goal')],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].type).toBe('realizes');
    });

    test('should handle array of motivation references', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', {
          realizes: ['goal-1', 'goal-2'],
        }),
      ]);

      const model = createTestModel({
        Motivation: [
          createTestModelElement('goal-1', 'goal', 'Goal 1'),
          createTestModelElement('goal-2', 'goal', 'Goal 2'),
        ],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(2);
    });

    test('should warn about references to non-existent motivation elements', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', { realizes: ['non-existent'] }),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Goal 1')],
      });

      resolver.resolveMotivationLinks(businessGraph, model);

      const warnings = resolver.getWarnings();
      expect(warnings.length).toBeGreaterThan(0);
      expect(warnings[0]).toContain('non-existent');
    });

    test('should return empty array when no motivation layer exists', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1'),
      ]);

      const model = createTestModel({});

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(0);
    });

    test('should resolve links from model references', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1'),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Goal 1')],
      });

      model.references.push({
        id: 'ref-1',
        type: 'goal' as any,
        source: { elementId: 'b1' },
        target: { elementId: 'goal-1' },
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].source).toBe('b1');
      expect(links[0].target).toBe('goal-1');
    });
  });

  test.describe('resolveApplicationLinks()', () => {
    test('should resolve links to application layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'service', 'Business Service'),
      ]);

      const model = createTestModel({
        Application: [createTestModelElement('app-1', 'component', 'App Component')],
      });

      model.references.push({
        id: 'ref-1',
        type: 'realization' as any,
        source: { elementId: 'b1' },
        target: { elementId: 'app-1' },
      });

      const links = resolver.resolveApplicationLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].targetLayer).toBe('application');
    });
  });

  test.describe('resolveDataModelLinks()', () => {
    test('should resolve accesses relationships to data model layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', { accesses: ['schema-1'] }),
      ]);

      const model = createTestModel({
        DataModel: [createTestModelElement('schema-1', 'schema', 'User Schema')],
      });

      const links = resolver.resolveDataModelLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].targetLayer).toBe('data_model');
      expect(links[0].type).toBe('accesses');
    });

    test('should resolve uses relationships to data model layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', { uses: ['schema-1'] }),
      ]);

      const model = createTestModel({
        DataModel: [createTestModelElement('schema-1', 'schema', 'Schema')],
      });

      const links = resolver.resolveDataModelLinks(businessGraph, model);

      expect(links.length).toBe(1);
    });
  });

  test.describe('resolveSecurityLinks()', () => {
    test('should resolve secured_by relationships to security layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Secure Process', { secured_by: ['role-1'] }),
      ]);

      const model = createTestModel({
        Security: [createTestModelElement('role-1', 'role', 'Admin Role')],
      });

      const links = resolver.resolveSecurityLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].targetLayer).toBe('security');
      expect(links[0].type).toBe('secured_by');
    });

    test('should resolve requires_permissions relationships', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', {
          requires_permissions: ['perm-1'],
        }),
      ]);

      const model = createTestModel({
        Security: [createTestModelElement('perm-1', 'permission', 'Read Permission')],
      });

      const links = resolver.resolveSecurityLinks(businessGraph, model);

      expect(links.length).toBe(1);
    });
  });

  test.describe('resolveAPILinks()', () => {
    test('should resolve exposed_by relationships to API layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'service', 'Business Service', {
          exposed_by: ['api-1'],
        }),
      ]);

      const model = createTestModel({
        Api: [createTestModelElement('api-1', 'operation', 'GET /users')],
      });

      const links = resolver.resolveAPILinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].targetLayer).toBe('api');
    });

    test('should only check service nodes for API links', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process', { exposed_by: ['api-1'] }),
        createTestNode('b2', 'service', 'Service', { exposed_by: ['api-1'] }),
      ]);

      const model = createTestModel({
        Api: [createTestModelElement('api-1', 'operation', 'API Op')],
      });

      const links = resolver.resolveAPILinks(businessGraph, model);

      // Only service node should have API link
      expect(links.length).toBe(1);
      expect(links[0].source).toBe('b2');
    });
  });

  test.describe('resolveUXLinks()', () => {
    test('should resolve triggered_by relationships to UX layer', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'User Flow', { triggered_by: ['view-1'] }),
      ]);

      const model = createTestModel({
        Ux: [createTestModelElement('view-1', 'view', 'User Dashboard')],
      });

      const links = resolver.resolveUXLinks(businessGraph, model);

      expect(links.length).toBe(1);
      expect(links[0].targetLayer).toBe('ux');
      expect(links[0].type).toBe('triggered_by');
    });
  });

  test.describe('reference extraction', () => {
    test('should handle single string reference', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', { realizes: 'goal-1' }),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Goal')],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(1);
    });

    test('should handle array of references', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', {
          realizes: ['goal-1', 'goal-2'],
        }),
      ]);

      const model = createTestModel({
        Motivation: [
          createTestModelElement('goal-1', 'goal', 'Goal 1'),
          createTestModelElement('goal-2', 'goal', 'Goal 2'),
        ],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(2);
    });

    test('should handle missing reference properties', () => {
      const businessGraph = createTestBusinessGraph([
        createTestNode('b1', 'process', 'Process 1', {}),
      ]);

      const model = createTestModel({
        Motivation: [createTestModelElement('goal-1', 'goal', 'Goal')],
      });

      const links = resolver.resolveMotivationLinks(businessGraph, model);

      expect(links.length).toBe(0);
    });
  });
});

// Helper functions

function createTestBusinessGraph(nodes: BusinessNode[]): BusinessGraph {
  const nodeMap = new Map<string, BusinessNode>();
  for (const node of nodes) {
    nodeMap.set(node.id, node);
  }

  return {
    nodes: nodeMap,
    edges: new Map(),
    hierarchy: {
      maxDepth: 0,
      rootNodes: [],
      leafNodes: [],
      nodesByLevel: new Map(),
      parentChildMap: new Map(),
      childParentMap: new Map(),
    },
    metrics: {
      nodeCount: nodes.length,
      edgeCount: 0,
      averageConnectivity: 0,
      maxHierarchyDepth: 0,
      circularDependencies: [],
      orphanedNodes: [],
      criticalNodes: [],
    },
    crossLayerLinks: [],
    indices: {
      byType: new Map(),
      byDomain: new Map(),
      byLifecycle: new Map(),
      byCriticality: new Map(),
    },
  };
}

function createTestNode(
  id: string,
  type: 'function' | 'process' | 'service' | 'capability',
  name: string,
  properties: Record<string, unknown> = {}
): BusinessNode {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    properties,
    metadata: {},
    hierarchyLevel: 0,
    childIds: [],
    dimensions: { width: 200, height: 100 },
  };
}

function createTestModel(
  layers: Record<string, ModelElement[]>
): MetaModel {
  const modelLayers: Record<string, Layer> = {};

  for (const [layerName, elements] of Object.entries(layers)) {
    modelLayers[layerName] = {
      id: layerName.toLowerCase(),
      type: layerName,
      name: layerName,
      elements,
      relationships: [],
    };
  }

  return {
    version: '1.0.0',
    layers: modelLayers,
    references: [],
    metadata: {},
  };
}

function createTestModelElement(
  id: string,
  type: string,
  name: string
): ModelElement {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    layerId: type,
    properties: {},
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      style: {},
    },
  };
}
