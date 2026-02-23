import { test, expect } from '@playwright/test';
import { nodeConfigLoader } from '../../../src/core/nodes/nodeConfigLoader';
import { NodeType } from '../../../src/core/nodes/NodeType';

test.describe('NodeConfigLoader', () => {
  test('should initialize successfully', () => {
    expect(nodeConfigLoader.isInitialized()).toBe(true);
  });

  test('should return version', () => {
    const version = nodeConfigLoader.getVersion();
    expect(version).toBe('1.0');
  });

  test.describe('getStyleConfig', () => {
    test('should return config for valid NodeType', () => {
      const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_GOAL);
      expect(config).toBeDefined();
      expect(config?.typeLabel).toBe('Goal');
      expect(config?.icon).toBe('🎯');
    });

    test('should return undefined for invalid NodeType', () => {
      const config = nodeConfigLoader.getStyleConfig('invalid.type');
      expect(config).toBeUndefined();
    });

    test('should have correct colors for motivation.goal', () => {
      const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_GOAL);
      expect(config?.colors.fill).toBe('#d1fae5');
      expect(config?.colors.stroke).toBe('#059669');
      expect(config?.colors.header).toBe('#059669');
    });

    test('should have correct dimensions for business.function', () => {
      const config = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_FUNCTION);
      expect(config?.dimensions.width).toBeDefined();
      expect(config?.dimensions.height).toBeDefined();
    });

    test('should have layout property set', () => {
      const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_GOAL);
      expect(config?.layout).toBe('centered');
    });

    test('should support all motivation layer types', () => {
      const motivationTypes = [
        NodeType.MOTIVATION_STAKEHOLDER,
        NodeType.MOTIVATION_GOAL,
        NodeType.MOTIVATION_REQUIREMENT,
        NodeType.MOTIVATION_ASSESSMENT,
        NodeType.MOTIVATION_DRIVER,
        NodeType.MOTIVATION_OUTCOME,
        NodeType.MOTIVATION_PRINCIPLE,
        NodeType.MOTIVATION_CONSTRAINT,
        NodeType.MOTIVATION_VALUE_STREAM,
        NodeType.MOTIVATION_ASSUMPTION,
      ];

      for (const nodeType of motivationTypes) {
        const config = nodeConfigLoader.getStyleConfig(nodeType);
        expect(config).toBeDefined();
        expect(config?.layout).toMatch(/^(centered|left)$/);
      }
    });

    test('should support all business layer types', () => {
      const businessTypes = [
        NodeType.BUSINESS_FUNCTION,
        NodeType.BUSINESS_SERVICE,
        NodeType.BUSINESS_CAPABILITY,
        NodeType.BUSINESS_PROCESS,
      ];

      for (const nodeType of businessTypes) {
        const config = nodeConfigLoader.getStyleConfig(nodeType);
        expect(config).toBeDefined();
      }
    });

    test('should support all C4 layer types', () => {
      const c4Types = [NodeType.C4_CONTAINER, NodeType.C4_COMPONENT, NodeType.C4_EXTERNAL_ACTOR];

      for (const nodeType of c4Types) {
        const config = nodeConfigLoader.getStyleConfig(nodeType);
        expect(config).toBeDefined();
      }
    });

    test('should support all data layer types', () => {
      const dataTypes = [NodeType.DATA_JSON_SCHEMA, NodeType.DATA_MODEL];

      for (const nodeType of dataTypes) {
        const config = nodeConfigLoader.getStyleConfig(nodeType);
        expect(config).toBeDefined();
      }
    });
  });

  test.describe('mapElementType', () => {
    test('should map BusinessFunction to business.function', () => {
      const nodeType = nodeConfigLoader.mapElementType('BusinessFunction');
      expect(nodeType).toBe(NodeType.BUSINESS_FUNCTION);
    });

    test('should map business-function to business.function', () => {
      const nodeType = nodeConfigLoader.mapElementType('business-function');
      expect(nodeType).toBe(NodeType.BUSINESS_FUNCTION);
    });

    test('should map Goal to motivation.goal', () => {
      const nodeType = nodeConfigLoader.mapElementType('Goal');
      expect(nodeType).toBe(NodeType.MOTIVATION_GOAL);
    });

    test('should map Stakeholder to motivation.stakeholder', () => {
      const nodeType = nodeConfigLoader.mapElementType('Stakeholder');
      expect(nodeType).toBe(NodeType.MOTIVATION_STAKEHOLDER);
    });

    test('should map Container to c4.container', () => {
      const nodeType = nodeConfigLoader.mapElementType('Container');
      expect(nodeType).toBe(NodeType.C4_CONTAINER);
    });

    test('should return undefined for unmapped type', () => {
      const nodeType = nodeConfigLoader.mapElementType('UnknownType');
      expect(nodeType).toBeUndefined();
    });

    test('should handle multiple mappings for same type', () => {
      const mapping1 = nodeConfigLoader.mapElementType('C4Container');
      const mapping2 = nodeConfigLoader.mapElementType('c4-container');
      expect(mapping1).toBe(mapping2);
      expect(mapping1).toBe(NodeType.C4_CONTAINER);
    });

    test('should map Entity to data.model', () => {
      const nodeType = nodeConfigLoader.mapElementType('Entity');
      expect(nodeType).toBe(NodeType.DATA_MODEL);
    });

    test('should map process-like types to business.process', () => {
      const processTypes = ['APIEndpoint', 'Endpoint', 'Role', 'Permission', 'Policy'];
      for (const type of processTypes) {
        const nodeType = nodeConfigLoader.mapElementType(type);
        expect(nodeType).toBe(NodeType.BUSINESS_PROCESS);
      }
    });
  });

  test.describe('getChangesetColors', () => {
    test('should return add colors', () => {
      const colors = nodeConfigLoader.getChangesetColors('add');
      expect(colors).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.bg).toBeDefined();
    });

    test('should return update colors', () => {
      const colors = nodeConfigLoader.getChangesetColors('update');
      expect(colors).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.bg).toBeDefined();
    });

    test('should return delete colors', () => {
      const colors = nodeConfigLoader.getChangesetColors('delete');
      expect(colors).toBeDefined();
      expect(colors.border).toBeDefined();
      expect(colors.bg).toBeDefined();
    });

    test('add colors should be green', () => {
      const colors = nodeConfigLoader.getChangesetColors('add');
      expect(colors.border).toContain('10b981');
    });

    test('update colors should be yellow', () => {
      const colors = nodeConfigLoader.getChangesetColors('update');
      expect(colors.border).toContain('f59e0b');
    });

    test('delete colors should be red', () => {
      const colors = nodeConfigLoader.getChangesetColors('delete');
      expect(colors.border).toContain('ef4444');
    });
  });

  test.describe('getAllChangesetColors', () => {
    test('should return all changeset colors', () => {
      const allColors = nodeConfigLoader.getAllChangesetColors();
      expect(allColors).toBeDefined();
      expect(allColors.add).toBeDefined();
      expect(allColors.update).toBeDefined();
      expect(allColors.delete).toBeDefined();
    });
  });

  test.describe('getTypeMap', () => {
    test('should return type map', () => {
      const typeMap = nodeConfigLoader.getTypeMap();
      expect(typeMap).toBeDefined();
      expect(typeof typeMap).toBe('object');
    });

    test('should include BusinessFunction mapping', () => {
      const typeMap = nodeConfigLoader.getTypeMap();
      expect(typeMap['BusinessFunction']).toBe('business.function');
    });

    test('should not allow modification of internal type map', () => {
      const typeMap1 = nodeConfigLoader.getTypeMap();
      const typeMap2 = nodeConfigLoader.getTypeMap();
      expect(typeMap1).not.toBe(typeMap2); // Should be different object instances
      expect(typeMap1).toEqual(typeMap2); // But have same values
    });
  });

  test.describe('getNodeStyles', () => {
    test('should return node styles', () => {
      const styles = nodeConfigLoader.getNodeStyles();
      expect(styles).toBeDefined();
      expect(typeof styles).toBe('object');
    });

    test('should include business.function style', () => {
      const styles = nodeConfigLoader.getNodeStyles();
      expect(styles['business.function']).toBeDefined();
    });

    test('should not allow modification of internal styles', () => {
      const styles1 = nodeConfigLoader.getNodeStyles();
      const styles2 = nodeConfigLoader.getNodeStyles();
      expect(styles1).not.toBe(styles2); // Should be different object instances
      expect(styles1).toEqual(styles2); // But have same values
    });
  });

  test.describe('integration scenarios', () => {
    test('should map element type and retrieve style in sequence', () => {
      const nodeType = nodeConfigLoader.mapElementType('Goal');
      expect(nodeType).toBeDefined();

      const style = nodeConfigLoader.getStyleConfig(nodeType!);
      expect(style).toBeDefined();
      expect(style?.typeLabel).toBe('Goal');
    });

    test('should handle multiple consecutive operations', () => {
      const nodeType1 = nodeConfigLoader.mapElementType('BusinessFunction');
      const nodeType2 = nodeConfigLoader.mapElementType('Goal');
      const style1 = nodeConfigLoader.getStyleConfig(nodeType1!);
      const style2 = nodeConfigLoader.getStyleConfig(nodeType2!);

      expect(style1?.typeLabel).toBe('Function');
      expect(style2?.typeLabel).toBe('Goal');
    });
  });
});
