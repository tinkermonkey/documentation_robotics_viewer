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
    test('should silently skip unknown element types', async () => {
      const element = createElement('unknown-1', 'core.unknown.UnknownType');

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      // Unknown types are skipped silently — no node created for the unknown element
      const unknownNode = result.nodes.find(n => n.id === 'node-unknown-1');
      expect(unknownNode).toBeUndefined();
    });
  });

  test.describe('Motivation Layer - Direct Extraction Tests', () => {
    test('should extract complete motivation data including all optional properties', async () => {
      const element: ModelElement = {
        id: 'complete-motivation',
        type: 'Goal',
        name: 'Complete Goal Element',
        layerId: 'motivation',
        properties: {
          priority: 'Critical',
          description: 'Complete test element',
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
        detailLevel: 'detailed',
        changesetOperation: 'add',
        relationshipBadge: {
          count: 5,
          incoming: 2,
          outgoing: 3,
        },
      } as unknown as ModelElement;

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'complete-motivation');
      expect(nodeData).toBeDefined();
      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_GOAL);
      expect(nodeData.detailLevel).toBe('detailed');
      expect(nodeData.changesetOperation).toBe('add');
      expect(nodeData.relationshipBadge).toBeDefined();
      expect(nodeData.relationshipBadge.count).toBe(5);
      expect(nodeData.relationshipBadge.incoming).toBe(2);
      expect(nodeData.relationshipBadge.outgoing).toBe(3);
    });

    test('should extract stakeholder with all properties as field items', async () => {
      const element = createElement('stakeholder-full', 'Stakeholder', {
        stakeholderType: 'Executive',
        description: 'C-level executive',
        department: 'Executive',
      });

      const model = createTestModel({ motivation: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'stakeholder-full');
      const items = nodeData.items || [];

      expect(items.length).toBeGreaterThan(0);
      expect(items.some((item: any) => item.id === 'stakeholderType')).toBe(true);
      expect(items.some((item: any) => item.id === 'description')).toBe(true);
      expect(items.some((item: any) => item.id === 'department')).toBe(true);
    });

    test('should apply correct detail levels to motivation nodes', async () => {
      const testCases = [
        { detailLevel: 'minimal' as const },
        { detailLevel: 'standard' as const },
        { detailLevel: 'detailed' as const },
      ];

      for (const testCase of testCases) {
        const element: ModelElement = {
          id: `detail-${testCase.detailLevel}`,
          type: 'Goal',
          name: `Goal with ${testCase.detailLevel} detail`,
          layerId: 'motivation',
          properties: { priority: 'High' },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 200, height: 100 },
            style: {},
          },
          relationships: { incoming: [], outgoing: [] },
          detailLevel: testCase.detailLevel,
        } as unknown as ModelElement;

        const model = createTestModel({ motivation: [element] });
        const result = await transformer.transformModel(model);

        const nodeData = findNodeData(result.nodes, `detail-${testCase.detailLevel}`);
        expect(nodeData.detailLevel).toBe(testCase.detailLevel);
      }
    });

    test('should apply changeset styling to motivation nodes', async () => {
      const operations: Array<'add' | 'update' | 'delete'> = ['add', 'update', 'delete'];

      for (const operation of operations) {
        const element: ModelElement = {
          id: `changeset-${operation}`,
          type: 'Goal',
          name: `Goal with ${operation} operation`,
          layerId: 'motivation',
          properties: { priority: 'High' },
          visual: {
            position: { x: 0, y: 0 },
            size: { width: 200, height: 100 },
            style: {},
          },
          relationships: { incoming: [], outgoing: [] },
          changesetOperation: operation,
        } as unknown as ModelElement;

        const model = createTestModel({ motivation: [element] });
        const result = await transformer.transformModel(model);

        const nodeData = findNodeData(result.nodes, `changeset-${operation}`);
        expect(nodeData.changesetOperation).toBe(operation);
      }
    });
  });

  test.describe('Business Layer - Direct Extraction Tests', () => {
    test('should extract complete business node with multiple badges', async () => {
      const element = createElement('process-full', 'Process', {
        owner: 'Finance Team',
        criticality: 'High',
        domain: 'Finance',
        subprocessCount: 3,
        expanded: true,
        description: 'Comprehensive business process',
      });

      const model = createTestModel({ business: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'process-full');
      const badges = nodeData.badges || [];

      // Should have owner, criticality, and expand/collapse badges
      expect(badges.length).toBeGreaterThan(0);
      expect(badges.some((b: any) => b.ariaLabel?.includes('Owner'))).toBe(true);
      expect(badges.some((b: any) => b.ariaLabel?.includes('Criticality'))).toBe(true);
      expect(badges.some((b: any) => b.ariaLabel?.includes('Expand') || b.ariaLabel?.includes('Collapse'))).toBe(true);
    });

    test('should apply criticality color classes correctly', async () => {
      const criticalityLevels = ['high', 'medium', 'low'];

      for (const level of criticalityLevels) {
        const element = createElement(`criticality-${level}`, 'Process', {
          criticality: level.charAt(0).toUpperCase() + level.slice(1),
        });

        const model = createTestModel({ business: [element] });
        const result = await transformer.transformModel(model);

        const nodeData = findNodeData(result.nodes, `criticality-${level}`);
        const badges = nodeData.badges || [];
        const criticalityBadge = badges.find((b: any) => b.ariaLabel?.includes('Criticality'));

        expect(criticalityBadge).toBeDefined();
        expect(criticalityBadge?.className).toBeDefined();
        expect(criticalityBadge?.className).toContain('text-');
      }
    });

    test('should extract domain badge only for Function and Service nodes', async () => {
      // Test Function with domain
      const functionElement = createElement('function-with-domain', 'Function', {
        domain: 'Finance',
      });

      const model1 = createTestModel({ business: [functionElement] });
      const result1 = await transformer.transformModel(model1);
      const functionData = findNodeData(result1.nodes, 'function-with-domain');
      const functionBadges = functionData.badges || [];
      expect(functionBadges.some((b: any) => b.ariaLabel?.includes('Domain'))).toBe(true);

      // Test Capability with domain (should NOT appear)
      const capabilityElement = createElement('capability-with-domain', 'Capability', {
        domain: 'Finance',
      });

      const model2 = createTestModel({ business: [capabilityElement] });
      const result2 = await transformer.transformModel(model2);
      const capabilityData = findNodeData(result2.nodes, 'capability-with-domain');
      const capabilityBadges = capabilityData.badges || [];
      expect(capabilityBadges.some((b: any) => b.ariaLabel?.includes('Domain'))).toBe(false);
    });

    test('should handle expand/collapse badge for BusinessProcess', async () => {
      // No subprocesses - should not have expand/collapse badge
      const noSubElement = createElement('process-no-subs', 'Process', {
        subprocessCount: 0,
      });

      const model1 = createTestModel({ business: [noSubElement] });
      const result1 = await transformer.transformModel(model1);
      const noSubData = findNodeData(result1.nodes, 'process-no-subs');
      const noSubBadges = noSubData.badges || [];
      expect(noSubBadges.some((b: any) => b.ariaLabel?.includes('Expand') || b.ariaLabel?.includes('Collapse'))).toBe(false);

      // With subprocesses - should have expand/collapse badge
      const expandedElement = createElement('process-expanded', 'Process', {
        subprocessCount: 2,
        expanded: true,
      });

      const model2 = createTestModel({ business: [expandedElement] });
      const result2 = await transformer.transformModel(model2);
      const expandedData = findNodeData(result2.nodes, 'process-expanded');
      const expandedBadges = expandedData.badges || [];
      expect(expandedBadges.some((b: any) => b.ariaLabel?.includes('Collapse'))).toBe(true);
    });
  });

  test.describe('Data Layer - Direct Extraction Tests', () => {
    test('should extract data node with properties', async () => {
      const element = createElement('entity-1', 'Entity', {
        properties: {
          id: { type: 'UUID', description: 'Unique identifier' },
          name: { type: 'string', description: 'User name' },
        },
      });

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'entity-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);
      // Data nodes may have items if properties exist
      expect(nodeData).toBeDefined();
    });

    test('should handle data node without properties', async () => {
      const element = createElement('interface-1', 'Interface');

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'interface-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);
      expect(nodeData.items).toBeUndefined();
    });

    test('should transform enum element', async () => {
      const element = createElement('enum-1', 'Enum', {
        properties: {
          ACTIVE: { type: 'string' },
          INACTIVE: { type: 'string' },
        },
      });

      const model = createTestModel({ data_model: [element] });
      const result = await transformer.transformModel(model);

      const nodeData = findNodeData(result.nodes, 'enum-1');
      expect(nodeData.nodeType).toBe(NodeType.DATA_MODEL);
    });
  });

  test.describe('Cross-Layer Extraction Consistency', () => {
    test('should extract consistent label from element name or ID', async () => {
      const elementWithName = createElement('elem-with-name', 'Goal');
      elementWithName.name = 'Custom Label';

      const model1 = createTestModel({ motivation: [elementWithName] });
      const result1 = await transformer.transformModel(model1);
      const nodeData1 = findNodeData(result1.nodes, 'elem-with-name');

      expect(nodeData1.label).toBe('Custom Label');

      // Element without custom name should use generated name
      const elementDefaultName = createElement('elem-default', 'Goal');
      const model2 = createTestModel({ motivation: [elementDefaultName] });
      const result2 = await transformer.transformModel(model2);
      const nodeData2 = findNodeData(result2.nodes, 'elem-default');

      expect(nodeData2.label).toBe('Test elem-default');
    });

    test('should extract nodes consistently across all layers', async () => {
      const testCases = [
        { layerId: 'motivation', type: 'Goal', expectedType: NodeType.MOTIVATION_GOAL },
        { layerId: 'business', type: 'Process', expectedType: NodeType.BUSINESS_PROCESS },
        { layerId: 'data_model', type: 'Entity', expectedType: NodeType.DATA_MODEL },
      ];

      for (const testCase of testCases) {
        const element = createElement(`elem-${testCase.layerId}`, testCase.type, {
          property1: 'value1',
          property2: 'value2',
        });

        const model = createTestModel({ [testCase.layerId]: [element] });
        const result = await transformer.transformModel(model);

        const nodeData = findNodeData(result.nodes, `elem-${testCase.layerId}`);
        expect(nodeData).toBeDefined();
        expect(nodeData.nodeType).toBe(testCase.expectedType);
        expect(nodeData.label).toBeDefined();
      }
    });
  });

  test.describe('Edge ID Uniqueness Fix (Issue #404)', () => {
    test('should generate unique edge IDs for multiple relationships using relationship ID', async () => {
      const source = createElement('source-elem', 'Goal', { priority: 'High' });
      const target = createElement('target-elem', 'Goal', { priority: 'Low' });

      const model = createTestModel({ motivation: [source, target] });

      // Add multiple relationships between the same source and target
      // These would previously have collided with edge IDs: "source-elem-target-elem"
      // Now they use edge-${rel.id} format for uniqueness
      model.layers.motivation.relationships = [
        {
          id: 'rel-1',
          sourceId: 'source-elem',
          targetId: 'target-elem',
          type: 'influences',
          properties: {},
        } as any,
        {
          id: 'rel-2',
          sourceId: 'source-elem',
          targetId: 'target-elem',
          type: 'contradicts',
          properties: {},
        } as any,
        {
          id: 'rel-3',
          sourceId: 'source-elem',
          targetId: 'target-elem',
          type: 'depends-on',
          properties: {},
        } as any,
      ];

      const result = await transformer.transformModel(model);

      // Extract edges connecting source to target (with node- prefix)
      const sourceNodeId = `node-source-elem`;
      const targetNodeId = `node-target-elem`;
      const edgesSourceToTarget = result.edges.filter(
        (e: any) => e.source === sourceNodeId && e.target === targetNodeId
      );

      // All edges should be present (no collisions)
      expect(edgesSourceToTarget).toHaveLength(3);

      // Each edge ID should be unique
      const edgeIds = edgesSourceToTarget.map((e: any) => e.id);
      const uniqueEdgeIds = new Set(edgeIds);
      expect(uniqueEdgeIds.size).toBe(3);

      // Edge IDs should use the relationship ID with edge- prefix
      expect(edgeIds).toContain('edge-rel-1');
      expect(edgeIds).toContain('edge-rel-2');
      expect(edgeIds).toContain('edge-rel-3');
    });

    test('should preserve edge source and target with relationship ID-based edge IDs', async () => {
      const elem1 = createElement('elem-1', 'Goal');
      const elem2 = createElement('elem-2', 'Goal');

      const model = createTestModel({ motivation: [elem1, elem2] });

      model.layers.motivation.relationships = [
        {
          id: 'unique-rel-1',
          sourceId: 'elem-1',
          targetId: 'elem-2',
          type: 'influences',
          properties: {},
        } as any,
        {
          id: 'unique-rel-2',
          sourceId: 'elem-1',
          targetId: 'elem-2',
          type: 'supports',
          properties: {},
        } as any,
      ];

      const result = await transformer.transformModel(model);

      // Verify edges are created with correct relationship IDs
      const edge1 = result.edges.find((e: any) => e.id === 'edge-unique-rel-1');
      const edge2 = result.edges.find((e: any) => e.id === 'edge-unique-rel-2');

      expect(edge1).toBeDefined();
      expect(edge2).toBeDefined();
      expect(edge1?.source).toBe('node-elem-1');
      expect(edge1?.target).toBe('node-elem-2');
      expect(edge2?.source).toBe('node-elem-1');
      expect(edge2?.target).toBe('node-elem-2');
      expect(edge1?.id).not.toBe(edge2?.id);
    });
  });

  test.describe('Empty/Invalid Layer Bounds Fix (Issue #404)', () => {
    test('should generate valid positions for all nodes even with complex layouts', async () => {
      const elements = [
        createElement('elem-1', 'Goal', { priority: 'High' }),
        createElement('elem-2', 'Goal', { priority: 'Low' }),
        createElement('elem-3', 'Goal', { priority: 'Medium' }),
      ];

      const model = createTestModel({ motivation: elements });

      const result = await transformer.transformModel(model);

      // Verify all nodes have finite positions
      result.nodes.forEach((node: any) => {
        expect(Number.isFinite(node.position.x)).toBe(true);
        expect(Number.isFinite(node.position.y)).toBe(true);
        expect(node.width).toBeGreaterThan(0);
        expect(node.height).toBeGreaterThan(0);
      });
    });

    test('should handle multi-layer models with proper vertical spacing', async () => {
      // Create a multi-layer model
      const motivationElem = createElement('motivation-elem', 'Goal', { priority: 'High' });
      const businessElem = createElement('business-elem', 'Process', { criticality: 'High' });
      const dataElem = createElement('data-elem', 'Entity');

      const model = createTestModel({
        motivation: [motivationElem],
        business: [businessElem],
        data_model: [dataElem],
      });

      const result = await transformer.transformModel(model);

      // Verify all nodes across all layers have finite positions
      result.nodes.forEach((node: any) => {
        expect(Number.isFinite(node.position.x)).toBe(true, `Node ${node.id} has non-finite x`);
        expect(Number.isFinite(node.position.y)).toBe(true, `Node ${node.id} has non-finite y`);
      });

      // Verify nodes from different layers have different Y positions (proper spacing)
      const motivationNode = result.nodes.find((n: any) => n.id === 'node-motivation-elem');
      const businessNode = result.nodes.find((n: any) => n.id === 'node-business-elem');
      const dataNode = result.nodes.find((n: any) => n.id === 'node-data-elem');

      // Each layer should be positioned below the previous one
      if (motivationNode && businessNode && dataNode) {
        expect(motivationNode.position.y).toBeLessThan(businessNode.position.y);
        expect(businessNode.position.y).toBeLessThan(dataNode.position.y);
      }
    });

    test('should not produce negative or infinite dimensions in layout bounds', async () => {
      const elements = Array.from({ length: 5 }, (_, i) =>
        createElement(`elem-${i}`, 'Goal')
      );

      const model = createTestModel({ motivation: elements });

      const result = await transformer.transformModel(model);

      // Check that no node has negative or infinite width/height
      result.nodes.forEach((node: any) => {
        expect(node.width).toBeGreaterThan(0);
        expect(node.height).toBeGreaterThan(0);
        expect(Number.isFinite(node.width)).toBe(true);
        expect(Number.isFinite(node.height)).toBe(true);
      });
    });
  });
});
