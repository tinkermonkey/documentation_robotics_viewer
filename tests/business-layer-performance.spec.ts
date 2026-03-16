/**
 * Performance and Edge Case Tests for Business Layer Parser
 *
 * Tests parsing performance, circular dependency detection, orphaned elements, and other edge cases.
 */

import { test, expect } from '@playwright/test';
import { BusinessLayerParser } from '../src/core/services/businessLayerParser';
import { BusinessGraphBuilder } from '../src/core/services/businessGraphBuilder';
import { MetaModel, ModelElement, Relationship, Layer } from '../src/core/types';

test.describe('Business Layer Parser Performance Tests', () => {
  test('should parse 500 elements in less than 1 second', () => {
    // Generate 500 test elements
    const elements = generateTestElements(500);
    const relationships = generateTestRelationships(elements, 250);

    const model = createTestMetaModel(elements, relationships);

    const startTime = Date.now();

    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const parseTime = Date.now() - startTime;

    console.log(`Parsed 500 elements in ${parseTime}ms`);

    expect(parseTime).toBeLessThan(1000);
    expect(businessLayerData.elements.length).toBe(500);
  });

  test('should build graph from 500 elements efficiently', () => {
    const elements = generateTestElements(500);
    const relationships = generateTestRelationships(elements, 250);

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const startTime = Date.now();

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    const buildTime = Date.now() - startTime;

    console.log(`Built graph from 500 elements in ${buildTime}ms`);

    expect(buildTime).toBeLessThan(1000);
    expect(graph.nodes.size).toBe(500);
  });

  test('should handle large hierarchy depth efficiently', () => {
    // Create deep hierarchy (100 levels)
    const elements: ModelElement[] = [];
    const relationships: Relationship[] = [];

    for (let i = 0; i < 100; i++) {
      elements.push(
        createTestElement(`level-${i}`, 'process', `Process Level ${i}`)
      );

      if (i > 0) {
        relationships.push(
          createTestRelationship(
            `rel-${i}`,
            `level-${i - 1}`,
            `level-${i}`,
            'composes'
          )
        );
      }
    }

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const startTime = Date.now();

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    const buildTime = Date.now() - startTime;

    console.log(`Resolved hierarchy of depth 99 in ${buildTime}ms`);

    expect(buildTime).toBeLessThan(500);
    expect(graph.hierarchy.maxDepth).toBe(99);
  });

  test('should detect circular dependencies efficiently', () => {
    // Create graph with multiple circular dependencies
    const elements: ModelElement[] = [];
    const relationships: Relationship[] = [];

    // Create 10 circular dependency chains
    for (let chain = 0; chain < 10; chain++) {
      for (let i = 0; i < 10; i++) {
        const id = `chain${chain}-node${i}`;
        elements.push(createTestElement(id, 'process', `Process ${id}`));
      }

      // Create circular dependencies within each chain
      for (let i = 0; i < 10; i++) {
        const source = `chain${chain}-node${i}`;
        const target = `chain${chain}-node${(i + 1) % 10}`;

        relationships.push(
          createTestRelationship(`rel-${source}-${target}`, source, target, 'depends_on')
        );
      }
    }

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const startTime = Date.now();

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    const detectTime = Date.now() - startTime;

    console.log(`Detected circular dependencies in ${detectTime}ms`);
    console.log(`Found ${graph.metrics.circularDependencies.length} cycles`);

    expect(detectTime).toBeLessThan(1000);
    expect(graph.metrics.circularDependencies.length).toBeGreaterThan(0);
  });
});

test.describe('Business Layer Parser Edge Case Tests', () => {
  test('should handle missing data gracefully', () => {
    const model = createTestMetaModel([], []);

    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    expect(businessLayerData.elements.length).toBe(0);
    expect(businessLayerData.relationships.length).toBe(0);
  });

  test('should skip elements with missing required fields', () => {
    const elements: ModelElement[] = [
      createTestElement('valid', 'function', 'Valid Function'),
      {
        id: '',
        type: 'function',
        name: 'Missing ID',
        description: '',
        layerId: 'Business',
        properties: {},
        visual: createTestVisual(),
      } as ModelElement,
      {
        id: 'no-name',
        type: 'function',
        name: '',
        description: '',
        layerId: 'Business',
        properties: {},
        visual: createTestVisual(),
      } as ModelElement,
    ];

    const model = createTestMetaModel(elements, []);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    expect(businessLayerData.elements.length).toBe(1);
    expect(parser.getWarnings().length).toBeGreaterThan(0);
  });

  test('should handle circular dependencies in hierarchy', () => {
    const elements: ModelElement[] = [
      createTestElement('a', 'process', 'Process A'),
      createTestElement('b', 'process', 'Process B'),
      createTestElement('c', 'process', 'Process C'),
    ];

    const relationships: Relationship[] = [
      createTestRelationship('r1', 'a', 'b', 'composes'),
      createTestRelationship('r2', 'b', 'c', 'composes'),
      createTestRelationship('r3', 'c', 'a', 'composes'), // Circular!
    ];

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Should not crash - circular hierarchies are handled gracefully
    // The graph builder doesn't warn about circular hierarchies in 'composes' relationships,
    // only detects circular dependencies in 'depends_on' relationships
    expect(graph).toBeDefined();
    expect(graph.nodes.size).toBe(3);
  });

  test('should handle orphaned elements (no relationships)', () => {
    const elements: ModelElement[] = [
      createTestElement('connected1', 'function', 'Connected 1'),
      createTestElement('connected2', 'function', 'Connected 2'),
      createTestElement('orphan1', 'function', 'Orphan 1'),
      createTestElement('orphan2', 'process', 'Orphan 2'),
    ];

    const relationships: Relationship[] = [
      createTestRelationship('r1', 'connected1', 'connected2', 'depends_on'),
    ];

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    expect(graph.metrics.orphanedNodes.length).toBe(2);
    expect(graph.metrics.orphanedNodes).toContain('orphan1');
    expect(graph.metrics.orphanedNodes).toContain('orphan2');
  });

  test('should handle relationships to non-existent elements', () => {
    const elements: ModelElement[] = [
      createTestElement('e1', 'function', 'Function 1'),
    ];

    const relationships: Relationship[] = [
      createTestRelationship('r1', 'e1', 'non-existent', 'realizes'),
      createTestRelationship('r2', 'non-existent', 'e1', 'depends_on'),
    ];

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Edges referencing non-existent nodes should be skipped
    expect(graph.edges.size).toBe(0);
    expect(builder.getWarnings().length).toBeGreaterThan(0);
  });

  test('should handle duplicate element IDs', () => {
    const elements = [
      {
        id: 'duplicate',
        type: 'function',
        name: 'Function 1',
        properties: {},
        relationships: [],
      },
      {
        id: 'duplicate',
        type: 'process',
        name: 'Process 1',
        properties: {},
        relationships: [],
      },
    ];

    const parser = new BusinessLayerParser();
    const validation = parser.validateBusinessRelationships(elements);

    expect(validation.valid).toBe(false);
    expect(validation.errors.some((e) => e.includes('Duplicate'))).toBe(true);
  });

  test('should handle very wide graphs (high connectivity)', () => {
    // Create hub-and-spoke topology: 1 hub connected to 100 nodes
    const elements: ModelElement[] = [
      createTestElement('hub', 'process', 'Hub Process'),
    ];

    const relationships: Relationship[] = [];

    for (let i = 0; i < 100; i++) {
      elements.push(createTestElement(`spoke-${i}`, 'function', `Spoke ${i}`));
      relationships.push(
        createTestRelationship(`rel-${i}`, 'hub', `spoke-${i}`, 'depends_on')
      );
    }

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const startTime = Date.now();

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    const buildTime = Date.now() - startTime;

    console.log(`Built wide graph (1->100 connections) in ${buildTime}ms`);

    expect(buildTime).toBeLessThan(500);
    expect(graph.edges.size).toBe(100);
  });

  test('should handle elements with many metadata properties', () => {
    const largeProperties: Record<string, unknown> = {};

    for (let i = 0; i < 100; i++) {
      largeProperties[`prop${i}`] = `value${i}`;
    }

    const elements: ModelElement[] = [
      {
        ...createTestElement('e1', 'function', 'Function 1'),
        properties: largeProperties,
      },
    ];

    const model = createTestMetaModel(elements, []);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(businessLayerData.elements, []);

    const node = graph.nodes.get('e1');
    expect(Object.keys(node?.properties || {}).length).toBe(100);
  });

  test('should handle malformed relationship types', () => {
    const elements: ModelElement[] = [
      createTestElement('e1', 'function', 'Function 1'),
      createTestElement('e2', 'function', 'Function 2'),
    ];

    const relationships: Relationship[] = [
      {
        id: 'r1',
        sourceId: 'e1',
        targetId: 'e2',
        type: null as any, // Malformed type
      },
      {
        id: 'r2',
        sourceId: 'e1',
        targetId: 'e2',
        type: 123 as any, // Invalid type
      },
    ];

    const model = createTestMetaModel(elements, relationships);
    const parser = new BusinessLayerParser();

    // Should not crash
    expect(() => parser.parseBusinessLayer(model)).not.toThrow();

    const businessLayerData = parser.parseBusinessLayer(model);
    expect(businessLayerData.relationships.length).toBe(2);
  });
});

// Helper functions

function generateTestElements(count: number): ModelElement[] {
  const elements: ModelElement[] = [];
  const types = ['function', 'process', 'service', 'capability'];

  for (let i = 0; i < count; i++) {
    const type = types[i % types.length];
    elements.push(createTestElement(`e${i}`, type, `Element ${i}`));
  }

  return elements;
}

function generateTestRelationships(
  elements: ModelElement[],
  count: number
): Relationship[] {
  const relationships: Relationship[] = [];
  const relationshipTypes = ['realizes', 'depends_on', 'flows_to', 'serves'];

  for (let i = 0; i < count; i++) {
    const source = elements[i % elements.length];
    const target = elements[(i + 1) % elements.length];
    const type = relationshipTypes[i % relationshipTypes.length];

    relationships.push(
      createTestRelationship(`rel-${i}`, source.id, target.id, type)
    );
  }

  return relationships;
}

function createTestMetaModel(
  elements: ModelElement[],
  relationships: Relationship[]
): MetaModel {
  const layer: Layer = {
    id: 'business',
    type: 'Business',
    name: 'Business',
    elements,
    relationships,
  };

  return {
    version: '1.0.0',
    layers: {
      Business: layer,
    },
    references: [],
    metadata: {},
  };
}

function createTestElement(
  id: string,
  type: string,
  name: string,
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type,
    name,
    description: `Description for ${name}`,
    layerId: 'Business',
    properties,
    visual: createTestVisual(),
  };
}

function createTestRelationship(
  id: string,
  sourceId: string,
  targetId: string,
  type: string
): Relationship {
  return {
    id,
    type,
    sourceId,
    targetId,
    properties: {},
  };
}

function createTestVisual() {
  return {
    position: { x: 0, y: 0 },
    size: { width: 200, height: 100 },
    style: {},
  };
}
