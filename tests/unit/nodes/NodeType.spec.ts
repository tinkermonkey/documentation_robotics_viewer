import { test, expect } from '@playwright/test';
import { NodeType, isValidNodeType } from '../../../src/core/nodes/NodeType';

test.describe('NodeType Enum', () => {
  test('should define all 20 node types', () => {
    const values = Object.values(NodeType);
    expect(values).toHaveLength(20);
  });

  test('should have 10 motivation layer types', () => {
    const motivationTypes = Object.values(NodeType).filter(v => v.startsWith('motivation.'));
    expect(motivationTypes).toHaveLength(10);
  });

  test('should have 4 business layer types', () => {
    const businessTypes = Object.values(NodeType).filter(v => v.startsWith('business.'));
    expect(businessTypes).toHaveLength(4);
  });

  test('should have 3 C4 layer types', () => {
    const c4Types = Object.values(NodeType).filter(v => v.startsWith('c4.'));
    expect(c4Types).toHaveLength(3);
  });

  test('should have 2 data layer types', () => {
    const dataTypes = Object.values(NodeType).filter(v => v.startsWith('data.'));
    expect(dataTypes).toHaveLength(2);
  });

  test('should have 1 structural layer type', () => {
    const structuralTypes = Object.values(NodeType).filter(v => v.startsWith('layer.'));
    expect(structuralTypes).toHaveLength(1);
  });

  test('should define motivation stakeholder', () => {
    expect(NodeType.MOTIVATION_STAKEHOLDER).toBe('motivation.stakeholder');
  });

  test('should define motivation goal', () => {
    expect(NodeType.MOTIVATION_GOAL).toBe('motivation.goal');
  });

  test('should define business function', () => {
    expect(NodeType.BUSINESS_FUNCTION).toBe('business.function');
  });

  test('should define c4 container', () => {
    expect(NodeType.C4_CONTAINER).toBe('c4.container');
  });

  test('should define data model', () => {
    expect(NodeType.DATA_MODEL).toBe('data.model');
  });

  test('should define layer container', () => {
    expect(NodeType.LAYER_CONTAINER).toBe('layer.container');
  });
});

test.describe('isValidNodeType type guard', () => {
  test('should accept valid NodeType enum value', () => {
    expect(isValidNodeType('motivation.goal')).toBe(true);
  });

  test('should accept all valid NodeType values', () => {
    const values = Object.values(NodeType);
    for (const value of values) {
      expect(isValidNodeType(value)).toBe(true);
    }
  });

  test('should reject invalid string', () => {
    expect(isValidNodeType('invalid.type')).toBe(false);
  });

  test('should reject empty string', () => {
    expect(isValidNodeType('')).toBe(false);
  });

  test('should reject null', () => {
    expect(isValidNodeType(null)).toBe(false);
  });

  test('should reject undefined', () => {
    expect(isValidNodeType(undefined)).toBe(false);
  });

  test('should reject number', () => {
    expect(isValidNodeType(123)).toBe(false);
  });

  test('should reject object', () => {
    expect(isValidNodeType({})).toBe(false);
  });

  test('should reject array', () => {
    expect(isValidNodeType([])).toBe(false);
  });
});
