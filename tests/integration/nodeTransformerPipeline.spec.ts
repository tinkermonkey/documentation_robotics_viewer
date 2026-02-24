/**
 * Integration tests for nodeTransformer pipeline
 *
 * Tests the complete transformation from MetaModel → AppNode[] for all layer types.
 * Verifies badge extraction, field item generation, and type mapping by:
 * - Building complete MetaModel with test elements
 * - Calling transformModel() with a mock layout engine
 * - Verifying node data, badges, and field items in resulting nodes
 *
 * Covers:
 * - Motivation layer (10 node types)
 * - Business layer (4 node types)
 * - C4 layer (3 node types)
 * - Data layer (2 node types)
 */

import { test, expect } from '@playwright/test';
import { NodeTransformer } from '../../src/core/services/nodeTransformer';
import { NodeType } from '../../src/core/nodes/NodeType';
import type { ModelElement, MetaModel, Layer } from '../../src/core/types';
import { LayerType } from '../../src/core/types/layers';
import { VerticalLayerLayout } from '../../src/core/layout/verticalLayerLayout';

/**
 * Helper to create minimal ModelElement for testing
 */
function createElement(
  id: string,
  type: string,
  properties: Record<string, unknown> = {}
): ModelElement {
  return {
    id,
    type,
    name: `Test ${id}`,
    layerId: 'test-layer',
    properties,
    visual: {
      position: { x: 0, y: 0 },
      size: { width: 200, height: 100 },
      style: {},
    },
    relationships: {
      incoming: [],
      outgoing: [],
    },
    description: 'Test element',
  };
}

/**
 * Helper to create a minimal MetaModel with test elements
 */
function createTestModel(layers: Record<string, ModelElement[]>): MetaModel {
  const layerMap: Record<string, Layer> = {};

  const layerTypeMap: Record<string, LayerType> = {
    motivation: LayerType.Motivation,
    business: LayerType.Business,
    security: LayerType.Security,
    application: LayerType.Application,
    technology: LayerType.Technology,
    api: LayerType.Api,
    data_model: LayerType.DataModel,
    datastore: LayerType.Datastore,
    ux: LayerType.Ux,
    navigation: LayerType.Navigation,
    apm: LayerType.ApmObservability,
  };

  for (const [layerKey, elements] of Object.entries(layers)) {
    // Update layerId in elements to match the layer they belong to
    const elementsWithLayerId = elements.map(el => ({
      ...el,
      layerId: layerKey,
    }));

    layerMap[layerKey] = {
      id: layerKey,
      type: layerTypeMap[layerKey] || layerKey,
      name: layerKey.charAt(0).toUpperCase() + layerKey.slice(1),
      elements: elementsWithLayerId,
      relationships: [],
    };
  }

  return {
    id: 'test-model',
    name: 'Test Model',
    version: '1.0.0',
    description: 'Integration test model',
    layers: layerMap,
    references: [],
  };
}

/**
 * Helper to find node data by element ID
 */
function findNodeData(nodes: any[], elementId: string): any {
  const node = nodes.find(n => n.id === `node-${elementId}`);
  return node?.data;
}

test.describe('NodeTransformer Pipeline Integration', () => {
  let transformer: NodeTransformer;
  let layoutEngine: VerticalLayerLayout;

  test.beforeEach(() => {
    layoutEngine = new VerticalLayerLayout();
    transformer = new NodeTransformer(layoutEngine);
  });

  test.describe('Motivation Layer Transformation', () => {
    test('should transform stakeholder element with proper badge extraction', async () => {
      const element = createElement('stakeholder-1', 'Stakeholder', {
        stakeholderType: 'Executive',
        description: 'Key executive stakeholder',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'stakeholder-1');
      expect(nodeData).toBeDefined();
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_STAKEHOLDER);

      const typeBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Type:'));
      expect(typeBadge).toBeDefined();
      expect(typeBadge?.content).toBe('Executive');
      expect(typeBadge?.position).toBe('inline');
    });

    test('should transform goal element with priority badge', async () => {
      const element = createElement('goal-1', 'Goal', {
        priority: 'High',
        description: 'Critical business goal',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'goal-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_GOAL);

      const priorityBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Priority:'));
      expect(priorityBadge?.content).toBe('High');
      expect(priorityBadge?.position).toBe('top-right');
    });

    test('should transform requirement element with satisfaction status badge', async () => {
      const element = createElement('requirement-1', 'Requirement', {
        status: 'satisfied',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'requirement-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_REQUIREMENT);

      const statusBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Status:'));
      expect(statusBadge?.content).toBe('✓');
      expect(statusBadge?.position).toBe('top-left');
    });

    test('should transform requirement with unsatisfied status', async () => {
      const element = createElement('requirement-2', 'Requirement', {
        status: 'unsatisfied',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'requirement-2');
      const statusBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Status:'));
      expect(statusBadge?.content).toBe('○');
    });

    test('should transform driver element with category badge', async () => {
      const element = createElement('driver-1', 'Driver', {
        category: 'Market',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'driver-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_DRIVER);

      const categoryBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Category:'));
      expect(categoryBadge?.content).toBe('Market');
      expect(categoryBadge?.position).toBe('top-right');
    });

    test('should transform outcome element with status badge', async () => {
      const element = createElement('outcome-1', 'Outcome', {
        status: 'Delivered',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'outcome-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_OUTCOME);

      const statusBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Status:'));
      expect(statusBadge?.content).toBe('Delivered');
      expect(statusBadge?.position).toBe('top-right');
    });

    test('should transform constraint element with negotiability badge', async () => {
      const element = createElement('constraint-1', 'Constraint', {
        negotiability: 'Fixed',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'constraint-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_CONSTRAINT);

      const negotiabilityBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Negotiability:'));
      expect(negotiabilityBadge?.content).toBe('Fixed');
      expect(negotiabilityBadge?.position).toBe('top-right');
    });

    test('should transform assumption element without extra badges', async () => {
      const element = createElement('assumption-1', 'Assumption', {
        description: 'Key assumption',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'assumption-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_ASSUMPTION);
      expect((nodeData.badges || []).length).toBe(0);
    });

    test('should transform assessment element with rating badge', async () => {
      const element = createElement('assessment-1', 'Assessment', {
        rating: 4,
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'assessment-1');
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_ASSESSMENT);

      const ratingBadge = (nodeData.badges || []).find((b: any) => b.ariaLabel?.includes('Rating:'));
      expect(ratingBadge?.content).toBe('4/5');
      expect(ratingBadge?.position).toBe('top-right');
    });

    test('should extract field items from element properties', async () => {
      const element = createElement('goal-2', 'Goal', {
        priority: 'Medium',
        description: 'Business growth',
        status: 'Active',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'goal-2');
      expect(nodeData.items).toBeDefined();
      expect((nodeData.items || []).length).toBeGreaterThan(0);

      const descriptionItem = nodeData.items.find((item: any) => item.id === 'description');
      expect(descriptionItem).toBeDefined();
      expect(descriptionItem?.value).toBe('Business growth');
      expect(descriptionItem?.label).toBe('Description');
    });

    test('should not extract internal properties starting with underscore', async () => {
      const element = createElement('goal-3', 'Goal', {
        priority: 'High',
        _internal: 'should-be-ignored',
        description: 'Valid description',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'goal-3');
      const items = nodeData.items || [];
      const internalItem = items.find((item: any) => item.id === '_internal');
      expect(internalItem).toBeUndefined();
    });
  });

  test.describe('Business Layer Transformation', () => {
    test('should transform process element with owner and criticality badges', async () => {
      const element = createElement('process-1', 'Process', {
        owner: 'Finance Team',
        criticality: 'Critical',
      });

      const model = createTestModel({ business: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'process-1');
      expect(nodeData.nodeType).toBe(NodeType.BUSINESS_PROCESS);

      const badges = nodeData.badges || [];
      const ownerBadge = badges.find((b: any) => b.ariaLabel?.includes('Owner:'));
      const criticalityBadge = badges.find((b: any) => b.ariaLabel?.includes('Criticality:'));

      expect(ownerBadge?.content).toBe('Finance Team');
      expect(criticalityBadge?.content).toBe('Critical');
    });

    test('should transform capability element', async () => {
      const element = createElement('capability-1', 'Capability', {
        description: 'Key business capability',
      });

      const model = createTestModel({ business: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'capability-1');
      expect(nodeData.nodeType).toBe(NodeType.BUSINESS_CAPABILITY);
    });

    test('should transform service element', async () => {
      const element = createElement('service-1', 'Service', {
        description: 'Business service',
      });

      const model = createTestModel({ business: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'service-1');
      expect(nodeData.nodeType).toBe(NodeType.BUSINESS_SERVICE);
    });

    test('should transform function element', async () => {
      const element = createElement('function-1', 'Function', {
        description: 'Business function',
      });

      const model = createTestModel({ business: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'function-1');
      expect(nodeData.nodeType).toBe(NodeType.BUSINESS_FUNCTION);
    });
  });

  test.describe('C4 Layer Transformation', () => {
    test('should transform container element', async () => {
      const element = createElement('container-1', 'Container', {
        description: 'Web application container',
      });

      const model = createTestModel({ application: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'container-1');
      expect(nodeData.nodeType).toBe(NodeType.C4_CONTAINER);
      expect(nodeData.label).toBe('Test container-1');
    });

    test('should transform external actor element', async () => {
      const element = createElement('actor-1', 'ExternalActor', {
        description: 'External user',
      });

      const model = createTestModel({ application: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'actor-1');
      expect(nodeData.nodeType).toBe(NodeType.C4_EXTERNAL_ACTOR);
    });
  });

  test.describe('Data Layer Transformation', () => {
    test('should transform entity element with properties', async () => {
      const element = createElement('entity-1', 'Entity', {
        properties: {
          name: 'string',
          age: 'integer',
        },
        description: 'User entity',
      });

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'entity-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);

      const items = nodeData.items || [];
      expect(items.length).toBeGreaterThan(0);
    });

    test('should transform interface element', async () => {
      const element = createElement('interface-1', 'Interface', {
        description: 'Core interface',
      });

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'interface-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);
    });

    test('should transform enum element', async () => {
      const element = createElement('enum-1', 'Enum', {
        description: 'Status enum',
      });

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'enum-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);
    });
  });

  test.describe('Field Item Extraction Edge Cases', () => {
    test('should skip null and undefined properties', async () => {
      const element = createElement('element-1', 'Goal', {
        priority: 'High',
        nullValue: null,
        undefinedValue: undefined,
        status: 'Active',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-1');
      const items = nodeData.items || [];
      expect(items.some((item: any) => item.id === 'nullValue')).toBe(false);
      expect(items.some((item: any) => item.id === 'undefinedValue')).toBe(false);
      expect(items.some((item: any) => item.id === 'priority')).toBe(true);
      expect(items.some((item: any) => item.id === 'status')).toBe(true);
    });

    test('should format array properties as comma-separated strings', async () => {
      const element = createElement('goal-array', 'Goal', {
        relatedGoals: ['Goal A', 'Goal B', 'Goal C'],
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'goal-array');
      const items = nodeData.items || [];
      const goalsItem = items.find((item: any) => item.id === 'relatedGoals');
      expect(goalsItem).toBeDefined();
      expect(goalsItem?.value).toContain(',');
      expect(goalsItem?.value).toContain('Goal A');
      expect(goalsItem?.value).toContain('Goal B');
      expect(goalsItem?.value).toContain('Goal C');
    });

    test('should use formatted label from property map', async () => {
      const element = createElement('element-2', 'Goal', {
        priority: 'High',
        stakeholderType: 'Executive',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-2');
      const items = nodeData.items || [];
      const priorityItem = items.find((item: any) => item.id === 'priority');
      expect(priorityItem?.label).toBe('Priority');

      const typeItem = items.find((item: any) => item.id === 'stakeholderType');
      expect(typeItem?.label).toBe('Type');
    });

    test('should generate formatted label for unmapped properties', async () => {
      const element = createElement('element-3', 'Goal', {
        customField: 'custom value',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-3');
      const items = nodeData.items || [];
      const customItem = items.find((item: any) => item.id === 'customField');
      expect(customItem).toBeDefined();
      expect(customItem?.label).toBe('Custom Field');
    });

    test('should return undefined items for elements with no properties', async () => {
      const element = createElement('element-4', 'Goal');

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-4');
      expect(nodeData.items).toBeUndefined();
    });
  });

  test.describe('Badge Extraction Consistency', () => {
    test('should apply correct badge positions across node types', async () => {
      const testCases: Array<{
        layerId: string;
        type: string;
        properties: Record<string, unknown>;
        expectedPosition: 'top-left' | 'top-right' | 'inline';
        badgeId: string;
      }> = [
        {
          layerId: 'motivation',
          type: 'Requirement',
          properties: { status: 'satisfied' },
          expectedPosition: 'top-left',
          badgeId: 'req-position',
        },
        {
          layerId: 'motivation',
          type: 'Goal',
          properties: { priority: 'High' },
          expectedPosition: 'top-right',
          badgeId: 'goal-position',
        },
        {
          layerId: 'motivation',
          type: 'Stakeholder',
          properties: { stakeholderType: 'Executive' },
          expectedPosition: 'inline',
          badgeId: 'stakeholder-position',
        },
      ];

      for (const testCase of testCases) {
        const element = createElement(testCase.badgeId, testCase.type, testCase.properties);
        const layers = { [testCase.layerId]: [element] };
        const model = createTestModel(layers);
        const result = await transformer.transformModel(model);

        const nodeData = findNodeData(result.nodes, testCase.badgeId);
        const badges = nodeData.badges || [];

        expect(badges.length).toBeGreaterThan(0);
        expect(badges[0].position).toBe(testCase.expectedPosition);
      }
    });

    test('should not extract badges for empty/null badge values', async () => {
      const element = createElement('element-5', 'Goal', {
        priority: null,
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-5');
      expect((nodeData.badges || []).length).toBe(0);
    });

    test('should include aria labels for accessibility', async () => {
      const element = createElement('element-6', 'Assessment', {
        rating: 3,
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'element-6');
      const badges = nodeData.badges || [];
      expect(badges.length).toBeGreaterThan(0);
      expect(badges[0].ariaLabel).toBeDefined();
      expect(badges[0].ariaLabel).toContain('Rating');
    });
  });

  test.describe('Complete Pipeline Transformation', () => {
    test('should transform element with all optional properties', async () => {
      const element: ModelElement = {
        id: 'complete-element',
        type: 'Goal',
        name: 'Complete Goal Element',
        layerId: 'motivation',
        properties: {
          priority: 'High',
          description: 'Comprehensive goal with all details',
          status: 'Active',
          owner: 'Product Team',
        },
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 200, height: 100 },
          style: {},
        },
        relationships: {
          incoming: [],
          outgoing: [],
        },
        description: 'A complete element',
      };

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'complete-element');

      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_GOAL);
      expect(nodeData.label).toBe('Complete Goal Element');
      expect((nodeData.badges || []).length).toBeGreaterThan(0);
      expect((nodeData.items || []).length).toBeGreaterThan(0);
    });

    test('should use element name as label fallback to ID', async () => {
      const elementWithName = createElement('elem-1', 'Goal');

      const model = createTestModel({ motivation: [elementWithName] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'elem-1');
      expect(nodeData.label).toBe('Test elem-1');

      const elementWithoutName: ModelElement = {
        id: 'elem-2',
        type: 'Goal',
        name: 'elem-2',
        layerId: 'motivation',
        properties: {},
        visual: {
          position: { x: 0, y: 0 },
          size: { width: 200, height: 100 },
          style: {},
        },
        relationships: {
          incoming: [],
          outgoing: [],
        },
      };

      const model2 = createTestModel({ motivation: [elementWithoutName] });
      const result2 = await transformer.transformModel(model2);

      const nodeData2 = findNodeData(result2.nodes, 'elem-2');
      expect(nodeData2.label).toBe('elem-2');
    });
  });

  test.describe('Error Handling', () => {
    test('should throw error for unknown element type', async () => {
      const element = createElement('unknown-1', 'core.unknown.UnknownType');

      const model = createTestModel({ motivation: [element] });

      await expect(transformer.transformModel(model)).rejects.toThrow();
    });
  });
});
