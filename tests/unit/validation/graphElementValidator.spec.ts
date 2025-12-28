/**
 * Unit tests for GraphElementValidator
 *
 * Tests validation of graph elements to ensure all source model elements
 * appear in rendered React Flow nodes and edges arrays.
 *
 * Task: Graph Layout Optimization - Task Group 1.1
 * Test Coverage:
 * - All elements from source data appear in React Flow nodes/edges arrays
 * - Detection of missing entities and relationships
 * - Diagnostic report generation
 * - Focus on critical validation paths (2-8 focused tests)
 */

import { test, expect } from '@playwright/test';
import {
  GraphElementValidator,
  ValidationReport,
  MissingElement,
  ExclusionReason,
} from '../../../src/core/services/validation/graphElementValidator';
import { MetaModel, ModelElement, Relationship } from '../../../src/core/types';
import { AppNode, AppEdge } from '../../../src/core/types/reactflow';

// Test helper functions
function createMockElement(id: string, name: string, layerId: string, type = 'test-element'): ModelElement {
  return {
    id,
    type,
    name,
    description: `Mock element ${name}`,
    layerId,
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
    type: 'test-relationship',
    sourceId,
    targetId,
    properties: {},
  };
}

function createMockNode(id: string, elementId: string): AppNode {
  return {
    id,
    type: 'test',
    position: { x: 0, y: 0 },
    data: {
      label: 'Test Node',
      elementId,
      layerId: 'test',
    },
  } as AppNode;
}

function createMockEdge(id: string, sourceId: string, targetId: string): AppEdge {
  return {
    id,
    source: sourceId,
    target: targetId,
    type: 'test',
  } as AppEdge;
}

function createTestModel(
  elements: ModelElement[],
  relationships: Relationship[]
): MetaModel {
  const layers: Record<string, any> = {};

  // Group elements by layer
  elements.forEach((element) => {
    if (!layers[element.layerId]) {
      layers[element.layerId] = {
        id: element.layerId,
        name: element.layerId,
        type: 'test',
        elements: [],
        relationships: [],
      };
    }
    layers[element.layerId].elements.push(element);
  });

  // Add relationships to appropriate layers
  relationships.forEach((rel) => {
    // Find the layer of the source element
    const sourceElement = elements.find((e) => e.id === rel.sourceId);
    if (sourceElement && layers[sourceElement.layerId]) {
      layers[sourceElement.layerId].relationships.push(rel);
    }
  });

  return {
    layers,
    references: [],
  };
}

test.describe('GraphElementValidator', () => {
  let validator: GraphElementValidator;

  test.beforeEach(() => {
    validator = new GraphElementValidator();
  });

  test.describe('Complete Graph Validation', () => {
    test('should pass validation when all elements are rendered', () => {
      // Create source model with 3 elements and 2 relationships
      const elements = [
        createMockElement('e1', 'Element 1', 'layer1'),
        createMockElement('e2', 'Element 2', 'layer1'),
        createMockElement('e3', 'Element 3', 'layer1'),
      ];
      const relationships = [
        createMockRelationship('r1', 'e1', 'e2'),
        createMockRelationship('r2', 'e2', 'e3'),
      ];
      const model = createTestModel(elements, relationships);

      // Create React Flow nodes and edges for ALL elements
      const nodes = [
        createMockNode('node-e1', 'e1'),
        createMockNode('node-e2', 'e2'),
        createMockNode('node-e3', 'e3'),
      ];
      const edges = [
        createMockEdge('edge-r1', 'node-e1', 'node-e2'),
        createMockEdge('edge-r2', 'node-e2', 'node-e3'),
      ];

      const report = validator.validate(model, nodes, edges);

      expect(report.isValid).toBe(true);
      expect(report.missingNodes).toHaveLength(0);
      expect(report.missingEdges).toHaveLength(0);
      expect(report.summary).toContain('All elements rendered successfully');
    });

    test('should detect missing nodes in rendered graph', () => {
      // Create source model with 5 elements
      const elements = [
        createMockElement('e1', 'Element 1', 'layer1'),
        createMockElement('e2', 'Element 2', 'layer1'),
        createMockElement('e3', 'Element 3', 'layer1'),
        createMockElement('e4', 'Element 4', 'layer1'),
        createMockElement('e5', 'Element 5', 'layer1'),
      ];
      const model = createTestModel(elements, []);

      // Only render 3 out of 5 nodes (e2 and e4 are missing)
      const nodes = [
        createMockNode('node-e1', 'e1'),
        createMockNode('node-e3', 'e3'),
        createMockNode('node-e5', 'e5'),
      ];

      const report = validator.validate(model, nodes, []);

      expect(report.isValid).toBe(false);
      expect(report.missingNodes).toHaveLength(2);
      expect(report.missingNodes.map((n) => n.elementId)).toContain('e2');
      expect(report.missingNodes.map((n) => n.elementId)).toContain('e4');
      expect(report.summary).toContain('2 missing nodes');
    });

    test('should detect missing edges in rendered graph', () => {
      const elements = [
        createMockElement('e1', 'Element 1', 'layer1'),
        createMockElement('e2', 'Element 2', 'layer1'),
        createMockElement('e3', 'Element 3', 'layer1'),
      ];
      const relationships = [
        createMockRelationship('r1', 'e1', 'e2'),
        createMockRelationship('r2', 'e2', 'e3'),
        createMockRelationship('r3', 'e1', 'e3'),
      ];
      const model = createTestModel(elements, relationships);

      const nodes = [
        createMockNode('node-e1', 'e1'),
        createMockNode('node-e2', 'e2'),
        createMockNode('node-e3', 'e3'),
      ];

      // Only render 1 out of 3 edges
      const edges = [createMockEdge('edge-r1', 'node-e1', 'node-e2')];

      const report = validator.validate(model, nodes, edges);

      expect(report.isValid).toBe(false);
      expect(report.missingEdges).toHaveLength(2);
      expect(report.missingEdges.map((e) => e.relationshipId)).toContain('r2');
      expect(report.missingEdges.map((e) => e.relationshipId)).toContain('r3');
    });

    test('should detect both missing nodes and edges', () => {
      const elements = [
        createMockElement('e1', 'Element 1', 'layer1'),
        createMockElement('e2', 'Element 2', 'layer1'),
        createMockElement('e3', 'Element 3', 'layer1'),
      ];
      const relationships = [
        createMockRelationship('r1', 'e1', 'e2'),
        createMockRelationship('r2', 'e2', 'e3'),
      ];
      const model = createTestModel(elements, relationships);

      // Missing node e2 and both edges
      const nodes = [
        createMockNode('node-e1', 'e1'),
        createMockNode('node-e3', 'e3'),
      ];
      const edges: AppEdge[] = [];

      const report = validator.validate(model, nodes, edges);

      expect(report.isValid).toBe(false);
      expect(report.missingNodes).toHaveLength(1);
      expect(report.missingEdges).toHaveLength(2);
      expect(report.summary).toContain('1 missing nodes');
      expect(report.summary).toContain('2 missing edges');
    });
  });

  test.describe('Diagnostic Report Generation', () => {
    test('should provide detailed element information in missing nodes report', () => {
      const elements = [
        createMockElement('e1', 'Critical Element', 'motivation', 'goal'),
      ];
      const model = createTestModel(elements, []);

      const report = validator.validate(model, [], []);

      expect(report.missingNodes).toHaveLength(1);
      const missing = report.missingNodes[0];
      expect(missing.elementId).toBe('e1');
      expect(missing.elementName).toBe('Critical Element');
      expect(missing.elementType).toBe('goal');
      expect(missing.layerId).toBe('motivation');
    });

    test('should provide detailed relationship information in missing edges report', () => {
      const elements = [
        createMockElement('e1', 'Source', 'layer1'),
        createMockElement('e2', 'Target', 'layer1'),
      ];
      const relationships = [
        createMockRelationship('r1', 'e1', 'e2'),
      ];
      const model = createTestModel(elements, relationships);

      const nodes = [
        createMockNode('node-e1', 'e1'),
        createMockNode('node-e2', 'e2'),
      ];

      const report = validator.validate(model, nodes, []);

      expect(report.missingEdges).toHaveLength(1);
      const missing = report.missingEdges[0];
      expect(missing.relationshipId).toBe('r1');
      expect(missing.sourceId).toBe('e1');
      expect(missing.targetId).toBe('e2');
      expect(missing.relationshipType).toBe('test-relationship');
    });

    test('should identify exclusion reasons for missing elements', () => {
      const elements = [
        createMockElement('e1', 'Element', 'layer1'),
      ];
      const relationships = [
        createMockRelationship('r1', 'e1', 'e2'), // e2 doesn't exist - orphan edge
      ];
      const model = createTestModel(elements, relationships);

      const nodes = [createMockNode('node-e1', 'e1')];
      const edges: AppEdge[] = [];

      const report = validator.validate(model, nodes, edges);

      expect(report.missingEdges).toHaveLength(1);
      const missing = report.missingEdges[0];
      expect(missing.reason).toBe(ExclusionReason.OrphanedRelationship);
    });
  });

  test.describe('Multi-Layer Validation', () => {
    test('should validate elements across multiple layers', () => {
      const elements = [
        createMockElement('m1', 'Goal 1', 'motivation', 'goal'),
        createMockElement('m2', 'Goal 2', 'motivation', 'goal'),
        createMockElement('b1', 'Process 1', 'business', 'process'),
        createMockElement('b2', 'Process 2', 'business', 'process'),
        createMockElement('a1', 'Service 1', 'application', 'service'),
      ];
      const model = createTestModel(elements, []);

      // Missing motivation m2 and business b2
      const nodes = [
        createMockNode('node-m1', 'm1'),
        createMockNode('node-b1', 'b1'),
        createMockNode('node-a1', 'a1'),
      ];

      const report = validator.validate(model, nodes, []);

      expect(report.isValid).toBe(false);
      expect(report.missingNodes).toHaveLength(2);
      expect(report.missingNodes.map((n) => n.layerId)).toContain('motivation');
      expect(report.missingNodes.map((n) => n.layerId)).toContain('business');
    });

    test('should validate cross-layer references', () => {
      const elements = [
        createMockElement('m1', 'Goal 1', 'motivation'),
        createMockElement('b1', 'Process 1', 'business'),
      ];
      const model = createTestModel(elements, []);

      // Add a cross-layer reference
      model.references = [
        {
          type: 'realizes',
          source: { elementId: 'm1' },
          target: { elementId: 'b1' },
        },
      ];

      const nodes = [
        createMockNode('node-m1', 'm1'),
        createMockNode('node-b1', 'b1'),
      ];

      // Cross-layer reference edge is missing
      const edges: AppEdge[] = [];

      const report = validator.validate(model, nodes, edges);

      expect(report.isValid).toBe(false);
      expect(report.missingEdges).toHaveLength(1);
      expect(report.missingEdges[0].reason).toBe(ExclusionReason.CrossLayerReference);
    });
  });

  test.describe('Performance', () => {
    test('should validate large graphs efficiently (500 elements in <500ms)', () => {
      // Create a large model with 500 elements and 450 relationships
      const elements = Array.from({ length: 500 }, (_, i) =>
        createMockElement(`e${i}`, `Element ${i}`, `layer${i % 10}`)
      );
      const relationships = Array.from({ length: 450 }, (_, i) =>
        createMockRelationship(`r${i}`, `e${i}`, `e${(i + 1) % 500}`)
      );
      const model = createTestModel(elements, relationships);

      // Render all nodes and edges
      const nodes = elements.map((e) => createMockNode(`node-${e.id}`, e.id));
      const edges = relationships.map((r) =>
        createMockEdge(`edge-${r.id}`, `node-${r.sourceId}`, `node-${r.targetId}`)
      );

      const startTime = performance.now();
      const report = validator.validate(model, nodes, edges);
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(500);
      expect(report.isValid).toBe(true);
    });
  });
});
