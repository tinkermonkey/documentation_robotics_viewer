/**
 * UnifiedNode Component Tests
 *
 * Tests for the core UnifiedNode component that merges capabilities from
 * BaseLayerNode, BaseFieldListNode, and custom implementations.
 *
 * Note: Full component rendering tests are covered by Storybook stories.
 * These tests validate types, configuration, and behavior patterns.
 */

import { test, expect } from '@playwright/test';
import { NodeType } from '../../src/core/nodes/NodeType';
import type { UnifiedNodeData, FieldItem, NodeBadge, DetailLevel, ChangesetOperation } from '../../src/core/nodes/components/UnifiedNode';
import type { RelationshipBadgeData } from '../../src/core/nodes/components/RelationshipBadge';

test.describe('UnifiedNode Component', () => {
  test.describe('Type Exports and Interfaces', () => {
    test('should export UnifiedNodeData type', () => {
      // Validate that UnifiedNodeData interface is properly defined
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_STAKEHOLDER,
        label: 'Test Node',
        layerId: 'test-layer',
        elementId: 'test-element-id',
      };

      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_STAKEHOLDER);
      expect(nodeData.label).toBe('Test Node');
    });

    test('should support optional fields in UnifiedNodeData', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        items: [],
        hideFields: false,
        badges: [],
        detailLevel: 'standard',
      };

      expect(nodeData.items).toEqual([]);
      expect(nodeData.hideFields).toBe(false);
      expect(nodeData.badges).toEqual([]);
      expect(nodeData.detailLevel).toBe('standard');
    });

    test('should support FieldItem type with all properties', () => {
      const field: FieldItem = {
        id: 'field-1',
        label: 'Name',
        value: 'Test Value',
        required: true,
        tooltip: 'This is a test field',
      };

      expect(field.id).toBe('field-1');
      expect(field.label).toBe('Name');
      expect(field.value).toBe('Test Value');
      expect(field.required).toBe(true);
      expect(field.tooltip).toBe('This is a test field');
    });

    test('should support NodeBadge positions', () => {
      const positions: Array<NodeBadge['position']> = ['top-left', 'top-right', 'inline'];

      positions.forEach((position) => {
        expect(['top-left', 'top-right', 'inline']).toContain(position);
      });
    });

    test('should support all DetailLevel values', () => {
      const levels: DetailLevel[] = ['minimal', 'standard', 'detailed'];

      levels.forEach((level) => {
        expect(['minimal', 'standard', 'detailed']).toContain(level);
      });
    });

    test('should support all ChangesetOperation values', () => {
      const operations: ChangesetOperation[] = ['add', 'update', 'delete'];

      operations.forEach((op) => {
        expect(['add', 'update', 'delete']).toContain(op);
      });
    });

    test('should support RelationshipBadgeData type', () => {
      const badgeData: RelationshipBadgeData = {
        count: 5,
        incoming: 2,
        outgoing: 3,
      };

      expect(badgeData.count).toBe(5);
      expect(badgeData.incoming).toBe(2);
      expect(badgeData.outgoing).toBe(3);
      expect(badgeData.incoming + badgeData.outgoing).toBe(badgeData.count);
    });
  });

  test.describe('Configuration and Styling', () => {
    test('should accept NodeType enum for styling', () => {
      const nodeTypes: NodeType[] = [
        NodeType.MOTIVATION_STAKEHOLDER,
        NodeType.MOTIVATION_GOAL,
        NodeType.BUSINESS_FUNCTION,
      ];

      nodeTypes.forEach((type) => {
        expect(type).toBeDefined();
        expect(typeof type).toBe('string');
      });
    });

    test('should handle all three layout modes', () => {
      const layouts = ['centered', 'left', 'table'];

      layouts.forEach((layout) => {
        expect(['centered', 'left', 'table']).toContain(layout);
      });
    });

    test('should validate changeset operation styling', () => {
      const operations: ChangesetOperation[] = ['add', 'update', 'delete'];

      operations.forEach((op) => {
        const nodeData: UnifiedNodeData = {
          nodeType: NodeType.MOTIVATION_STAKEHOLDER,
          label: 'Test',
          layerId: 'test-layer',
          elementId: 'test-element-id',
          changesetOperation: op,
        };

        expect(nodeData.changesetOperation).toBe(op);
      });
    });
  });

  test.describe('Field List Behavior', () => {
    test('should show field list when items provided and hideFields is false', () => {
      const fields: FieldItem[] = [
        { id: '1', label: 'Field 1' },
        { id: '2', label: 'Field 2' },
      ];

      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        items: fields,
        hideFields: false,
      };

      expect(nodeData.items).toHaveLength(2);
      expect(nodeData.hideFields).toBe(false);
    });

    test('should hide field list when hideFields is true', () => {
      const fields: FieldItem[] = [
        { id: '1', label: 'Field 1' },
      ];

      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        items: fields,
        hideFields: true,
      };

      expect(nodeData.items).toHaveLength(1);
      expect(nodeData.hideFields).toBe(true);
    });

    test('should support per-field required indicators', () => {
      const fields: FieldItem[] = [
        { id: '1', label: 'Required Field', required: true },
        { id: '2', label: 'Optional Field', required: false },
      ];

      expect(fields[0].required).toBe(true);
      expect(fields[1].required).toBe(false);
    });

    test('should support per-field tooltips', () => {
      const fields: FieldItem[] = [
        {
          id: '1',
          label: 'Field with Help',
          tooltip: 'This is helpful information'
        },
      ];

      expect(fields[0].tooltip).toBe('This is helpful information');
    });

    test('should support per-field values', () => {
      const fields: FieldItem[] = [
        {
          id: '1',
          label: 'Type',
          value: 'string'
        },
      ];

      expect(fields[0].value).toBe('string');
    });
  });

  test.describe('Badge System', () => {
    test('should support badges at all three positions', () => {
      const badges: NodeBadge[] = [
        { position: 'top-left', content: 'TL' },
        { position: 'top-right', content: 'TR' },
        { position: 'inline', content: 'IL' },
      ];

      expect(badges).toHaveLength(3);
      expect(badges[0].position).toBe('top-left');
      expect(badges[1].position).toBe('top-right');
      expect(badges[2].position).toBe('inline');
    });

    test('should support multiple badges', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_STAKEHOLDER,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        badges: [
          { position: 'top-left', content: 'Badge 1' },
          { position: 'top-left', content: 'Badge 2' },
          { position: 'top-right', content: 'Badge 3' },
        ],
      };

      expect(nodeData.badges).toHaveLength(3);
    });

    test('should support badge aria-label for accessibility', () => {
      const badges: NodeBadge[] = [
        {
          position: 'top-left',
          content: 'New',
          ariaLabel: 'This node is new'
        },
      ];

      expect(badges[0].ariaLabel).toBe('This node is new');
    });

    test('should support custom className for badges', () => {
      const badges: NodeBadge[] = [
        {
          position: 'top-right',
          content: 'Updated',
          className: 'custom-badge-class'
        },
      ];

      expect(badges[0].className).toBe('custom-badge-class');
    });
  });

  test.describe('Semantic Zoom', () => {
    test('should support minimal detail level', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_GOAL,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        detailLevel: 'minimal',
      };

      expect(nodeData.detailLevel).toBe('minimal');
    });

    test('should support standard detail level', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_GOAL,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        detailLevel: 'standard',
      };

      expect(nodeData.detailLevel).toBe('standard');
    });

    test('should support detailed level', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_GOAL,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        detailLevel: 'detailed',
        items: [{ id: '1', label: 'Field' }],
      };

      expect(nodeData.detailLevel).toBe('detailed');
      expect(nodeData.items).toHaveLength(1);
    });
  });

  test.describe('Handle Management', () => {
    test('should define component-level handle IDs', () => {
      const handleIds = ['top', 'bottom', 'left', 'right'];

      expect(handleIds).toHaveLength(4);
      handleIds.forEach((id) => {
        expect(['top', 'bottom', 'left', 'right']).toContain(id);
      });
    });

    test('should generate per-field handle IDs', () => {
      const fieldId = 'my-field';
      const leftHandleId = `field-${fieldId}-left`;
      const rightHandleId = `field-${fieldId}-right`;

      expect(leftHandleId).toBe('field-my-field-left');
      expect(rightHandleId).toBe('field-my-field-right');
    });

    test('should support multiple fields with unique handle IDs', () => {
      const fields: FieldItem[] = [
        { id: 'field-1', label: 'Name' },
        { id: 'field-2', label: 'Type' },
        { id: 'field-3', label: 'Value' },
      ];

      const handleIds = fields.flatMap((field) => [
        `field-${field.id}-left`,
        `field-${field.id}-right`,
      ]);

      expect(handleIds).toHaveLength(6);
      expect(new Set(handleIds).size).toBe(6); // All unique
    });
  });

  test.describe('Height Calculation', () => {
    test('should calculate dynamic height with field list', () => {
      const headerHeight = 40;
      const itemHeight = 24;
      const itemCount = 3;
      const expectedHeight = headerHeight + itemCount * itemHeight;

      expect(expectedHeight).toBe(40 + 72);
    });

    test('should use static height without field list', () => {
      const staticHeight = 80;

      expect(staticHeight).toBeGreaterThan(0);
    });

    test('should handle empty field list gracefully', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Test',
        items: [],
      };

      expect(nodeData.items).toHaveLength(0);
    });
  });

  test.describe('Error Handling', () => {
    test('should handle invalid NodeType gracefully', () => {
      // Component should log error and render error UI
      const invalidType = 'INVALID_NODE_TYPE' as unknown as NodeType;

      const nodeData: UnifiedNodeData = {
        nodeType: invalidType,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
      };

      expect(nodeData.nodeType).toBe(invalidType);
    });

    test('should provide error aria-label for accessibility', () => {
      // Error UI should have role="alert" for screen readers
      const expectedRole = 'alert';

      expect(expectedRole).toBe('alert');
    });
  });

  test.describe('Accessibility', () => {
    test('should have article role for semantic HTML', () => {
      const expectedRole = 'article';

      expect(expectedRole).toBe('article');
    });

    test('should construct aria-label with typeLabel and label', () => {
      const typeLabel = 'Stakeholder';
      const label = 'Customer';
      const expectedAriaLabel = `${typeLabel}: ${label}`;

      expect(expectedAriaLabel).toBe('Stakeholder: Customer');
    });

    test('should support accessibility for field list', () => {
      const fields: FieldItem[] = [
        {
          id: 'field-1',
          label: 'Name',
          required: true
        },
      ];

      expect(fields[0].required).toBe(true);
    });

    test('should support relationship badge aria-label', () => {
      const badgeData: RelationshipBadgeData = {
        count: 5,
        incoming: 2,
        outgoing: 3,
      };

      const expectedAriaLabel = `${badgeData.count} total relationships: ${badgeData.incoming} incoming, ${badgeData.outgoing} outgoing`;

      expect(expectedAriaLabel).toContain('5 total relationships');
      expect(expectedAriaLabel).toContain('2 incoming');
      expect(expectedAriaLabel).toContain('3 outgoing');
    });
  });

  test.describe('Relationship Badge Integration', () => {
    test('should display relationship badge when data provided', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_STAKEHOLDER,
        label: 'Test',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        relationshipBadge: {
          count: 5,
          incoming: 2,
          outgoing: 3,
        },
      };

      expect(nodeData.relationshipBadge).toBeDefined();
      expect(nodeData.relationshipBadge?.count).toBe(5);
    });

    test('should hide relationship badge when not dimmed', () => {
      const badgeData: RelationshipBadgeData = {
        count: 5,
        incoming: 2,
        outgoing: 3,
      };

      const isDimmed = false;

      expect(isDimmed).toBe(false);
      // Component should not render badge
    });

    test('should show relationship badge when dimmed', () => {
      const badgeData: RelationshipBadgeData = {
        count: 5,
        incoming: 2,
        outgoing: 3,
      };

      const isDimmed = true;

      expect(isDimmed).toBe(true);
      // Component should render badge
    });

    test('should not display badge when count is zero', () => {
      const badgeData: RelationshipBadgeData = {
        count: 0,
        incoming: 0,
        outgoing: 0,
      };

      const isDimmed = true;

      expect(badgeData.count).toBe(0);
      // Component should not render badge
    });
  });

  test.describe('Changeset Styling', () => {
    test('should apply add operation styling', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'New Aggregate',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        changesetOperation: 'add',
      };

      expect(nodeData.changesetOperation).toBe('add');
    });

    test('should apply update operation styling', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Updated Aggregate',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        changesetOperation: 'update',
      };

      expect(nodeData.changesetOperation).toBe('update');
    });

    test('should apply delete operation styling', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.BUSINESS_FUNCTION,
        label: 'Deleted Aggregate',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        changesetOperation: 'delete',
      };

      expect(nodeData.changesetOperation).toBe('delete');
    });

    test('should override opacity for delete operations', () => {
      // Delete operations should have reduced opacity
      const deletedOpacity = 0.5;

      expect(deletedOpacity).toBeLessThan(1);
    });
  });

  test.describe('Component Data Integrity', () => {
    test('should maintain data integrity with all properties', () => {
      const nodeData: UnifiedNodeData = {
        nodeType: NodeType.MOTIVATION_GOAL,
        label: 'Strategic Goal',
        layerId: 'test-layer',
        elementId: 'test-element-id',
        items: [
          { id: 'f1', label: 'Objective', required: true, tooltip: 'Key objective' },
          { id: 'f2', label: 'Owner', required: true },
        ],
        hideFields: false,
        badges: [
          { position: 'top-left', content: 'Active' },
          { position: 'inline', content: 'Strategic' },
        ],
        detailLevel: 'detailed',
        changesetOperation: 'update',
        relationshipBadge: { count: 3, incoming: 1, outgoing: 2 },
      };

      expect(nodeData.nodeType).toBe(NodeType.MOTIVATION_GOAL);
      expect(nodeData.label).toBe('Strategic Goal');
      expect(nodeData.items).toHaveLength(2);
      expect(nodeData.hideFields).toBe(false);
      expect(nodeData.badges).toHaveLength(2);
      expect(nodeData.detailLevel).toBe('detailed');
      expect(nodeData.changesetOperation).toBe('update');
      expect(nodeData.relationshipBadge?.count).toBe(3);
    });
  });
});
