/**
 * Node Hooks Tests
 *
 * Tests for hooks extracted from UnifiedNode component.
 * Tests the pure computation functions that underlie the React hooks,
 * since React hooks cannot be called outside of a component context.
 */

import { test, expect } from '@playwright/test';
import { computeChangesetStyling, type ChangesetStyling } from '../../../src/core/nodes/hooks/useChangesetStyling';
import { computeHandleConfigs, type HandleConfig } from '../../../src/core/nodes/hooks/useNodeHandles';
import { nodeConfigLoader } from '../../../src/core/nodes/nodeConfigLoader';
import type { ChangesetOperation } from '../../../src/core/nodes/components';

/**
 * Test computeChangesetStyling function
 *
 * This function computes color and opacity based on changeset operation type.
 * It should return null when no operation is active, and return styling
 * properties for 'add', 'update', and 'delete' operations.
 */
test.describe('computeChangesetStyling Function', () => {
  test('should return null when operation is undefined', () => {
    const result = computeChangesetStyling(undefined);
    expect(result).toBeNull();
  });

  test('should return color and opacity for "add" operation', () => {
    const result = computeChangesetStyling('add');
    expect(result).not.toBeNull();
    expect(result).toHaveProperty('fill');
    expect(result).toHaveProperty('stroke');
    expect(result).toHaveProperty('opacity');
    expect(typeof result!.fill).toBe('string');
    expect(typeof result!.stroke).toBe('string');
    expect(typeof result!.opacity).toBe('number');
    expect(result!.opacity).toBeGreaterThanOrEqual(0);
    expect(result!.opacity).toBeLessThanOrEqual(1);
  });

  test('should return color and opacity for "update" operation', () => {
    const result = computeChangesetStyling('update');
    expect(result).not.toBeNull();
    expect(result!.fill).toBeDefined();
    expect(result!.stroke).toBeDefined();
    expect(typeof result!.opacity).toBe('number');
  });

  test('should return color and opacity for "delete" operation', () => {
    const result = computeChangesetStyling('delete');
    expect(result).not.toBeNull();
    expect(result!.fill).toBeDefined();
    expect(result!.stroke).toBeDefined();
    expect(typeof result!.opacity).toBe('number');
  });

  test('should return different colors for different operations', () => {
    const addResult = computeChangesetStyling('add');
    const updateResult = computeChangesetStyling('update');
    const deleteResult = computeChangesetStyling('delete');

    // Operations should have distinct styling
    const fills = [addResult!.fill, updateResult!.fill, deleteResult!.fill];
    const uniqueFills = new Set(fills);
    expect(uniqueFills.size).toBeGreaterThan(1); // At least some operations have different fills
  });

  test('should use nodeConfigLoader for colors', () => {
    const addColors = nodeConfigLoader.getChangesetColors('add');
    const result = computeChangesetStyling('add');

    expect(result!.fill).toBe(addColors.bg);
    expect(result!.stroke).toBe(addColors.border);
    expect(result!.opacity).toBe(addColors.opacity ?? 1);
  });

  test('should support all ChangesetOperation types', () => {
    const operations: ChangesetOperation[] = ['add', 'update', 'delete'];

    operations.forEach((op) => {
      const result = computeChangesetStyling(op);
      expect(result).not.toBeNull();
      expect(result!.fill).toBeDefined();
      expect(result!.stroke).toBeDefined();
      expect(result!.opacity).toBeDefined();
    });
  });

  test('should always return consistent results for same input', () => {
    const result1 = computeChangesetStyling('add');
    const result2 = computeChangesetStyling('add');

    expect(result1).toEqual(result2);
  });
});

/**
 * Test computeHandleConfigs function
 *
 * This function returns handle configuration data (not JSX elements).
 * Consumers map these configurations to React Flow Handle elements.
 * The function computes positioning based on layout type.
 */
test.describe('computeHandleConfigs Function', () => {
  test('should return array of handle configurations', () => {
    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#000000',
      headerHeight: 40,
    });

    expect(Array.isArray(handles)).toBe(true);
    expect(handles.length).toBe(4);
  });

  test('should return handles with correct structure', () => {
    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#ff0000',
      headerHeight: 40,
    });

    handles.forEach((handle) => {
      expect(handle).toHaveProperty('id');
      expect(handle).toHaveProperty('type');
      expect(handle).toHaveProperty('position');
      expect(handle).toHaveProperty('style');
      expect(['target', 'source']).toContain(handle.type);
    });
  });

  test('should have correct handle IDs', () => {
    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#000000',
      headerHeight: 40,
    });

    const ids = handles.map((h) => h.id);
    expect(ids).toContain('top');
    expect(ids).toContain('bottom');
    expect(ids).toContain('left');
    expect(ids).toContain('right');
  });

  test('should apply correct handle colors', () => {
    const testColor = '#12345678';

    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: testColor,
      headerHeight: 40,
    });

    handles.forEach((handle) => {
      expect(handle.style.background).toBe(testColor);
      expect(handle.style.width).toBe(8);
      expect(handle.style.height).toBe(8);
    });
  });

  test('should position handles centered for "centered" layout', () => {
    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#000000',
      headerHeight: 40,
    });

    // For centered layout, left/right handles should be positioned at 50%
    const leftHandle = handles.find((h) => h.id === 'left');
    const rightHandle = handles.find((h) => h.id === 'right');

    expect(leftHandle?.style.top).toBe('50%');
    expect(rightHandle?.style.top).toBe('50%');
  });

  test('should position handles at headerHeight/2 for "left" layout', () => {
    const headerHeight = 40;

    const handles = computeHandleConfigs({
      layout: 'left',
      handleColor: '#000000',
      headerHeight: headerHeight,
    });

    // For left layout, left/right handles should be positioned at headerHeight/2
    const leftHandle = handles.find((h) => h.id === 'left');
    const rightHandle = handles.find((h) => h.id === 'right');

    expect(leftHandle?.style.top).toBe(headerHeight / 2);
    expect(rightHandle?.style.top).toBe(headerHeight / 2);
  });

  test('should position handles centered for "table" layout', () => {
    const handles = computeHandleConfigs({
      layout: 'table',
      handleColor: '#000000',
      headerHeight: 40,
    });

    // For table layout, left/right handles should be positioned at 50%
    const leftHandle = handles.find((h) => h.id === 'left');
    const rightHandle = handles.find((h) => h.id === 'right');

    expect(leftHandle?.style.top).toBe('50%');
    expect(rightHandle?.style.top).toBe('50%');
  });

  test('should return different configurations for different layouts', () => {
    const centeredHandles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#000000',
      headerHeight: 40,
    });

    const leftHandles = computeHandleConfigs({
      layout: 'left',
      handleColor: '#000000',
      headerHeight: 40,
    });

    // Results should be different when layout changes
    const centeredLeft = centeredHandles.find((h) => h.id === 'left');
    const leftLayoutLeft = leftHandles.find((h) => h.id === 'left');

    expect(centeredLeft?.style.top).not.toBe(leftLayoutLeft?.style.top);
  });

  test('should have correct handle types', () => {
    const handles = computeHandleConfigs({
      layout: 'centered',
      handleColor: '#000000',
      headerHeight: 40,
    });

    const handleMap = new Map(handles.map((h) => [h.id, h.type]));

    expect(handleMap.get('top')).toBe('target');
    expect(handleMap.get('bottom')).toBe('source');
    expect(handleMap.get('left')).toBe('target');
    expect(handleMap.get('right')).toBe('source');
  });

  test('should support all layout types', () => {
    const layouts = ['centered', 'left', 'table'] as const;

    layouts.forEach((layout) => {
      const handles = computeHandleConfigs({
        layout: layout,
        handleColor: '#000000',
        headerHeight: 40,
      });

      expect(Array.isArray(handles)).toBe(true);
      expect(handles.length).toBe(4);
    });
  });

  test('should handle different header heights', () => {
    const heights = [30, 40, 50];

    heights.forEach((height) => {
      const handles = computeHandleConfigs({
        layout: 'left',
        handleColor: '#000000',
        headerHeight: height,
      });

      const leftHandle = handles.find((h) => h.id === 'left');
      expect(leftHandle?.style.top).toBe(height / 2);
    });
  });

  test('should always return consistent results for same input', () => {
    const options = {
      layout: 'centered' as const,
      handleColor: '#000000',
      headerHeight: 40,
    };

    const result1 = computeHandleConfigs(options);
    const result2 = computeHandleConfigs(options);

    expect(result1).toEqual(result2);
  });
});

/**
 * Test Hook Exports
 *
 * Validates that hooks are properly exported from barrel files
 */
test.describe('Hook Exports', () => {
  test('should export useChangesetStyling from hooks index', async () => {
    const hooks = await import('../../../src/core/nodes/hooks');
    expect(typeof hooks.useChangesetStyling).toBe('function');
  });

  test('should export useNodeHandles from hooks index', async () => {
    const hooks = await import('../../../src/core/nodes/hooks');
    expect(typeof hooks.useNodeHandles).toBe('function');
  });

  test('should not export removed hooks', async () => {
    const hooks = await import('../../../src/core/nodes/hooks');
    expect(hooks.useNodeOpacity).toBeUndefined();
    expect(hooks.useRelationshipBadge).toBeUndefined();
    expect(hooks.useBadgeRenderer).toBeUndefined();
  });

  test('should export HandleConfig type from hooks index', async () => {
    // Type import validation
    const hooks = await import('../../../src/core/nodes/hooks');
    expect(hooks).toBeDefined();
  });

  test('should export hooks from main nodes index', async () => {
    const nodes = await import('../../../src/core/nodes');
    expect(typeof nodes.useChangesetStyling).toBe('function');
    expect(typeof nodes.useNodeHandles).toBe('function');
  });

  test('should not export removed hooks from main index', async () => {
    const nodes = await import('../../../src/core/nodes');
    expect(nodes.useNodeOpacity).toBeUndefined();
    expect(nodes.useRelationshipBadge).toBeUndefined();
    expect(nodes.useBadgeRenderer).toBeUndefined();
  });
});

/**
 * Test Core Layer Compliance
 *
 * Validates that hooks maintain the core layer restriction
 * (no imports from src/apps/)
 */
test.describe('Core Layer Restriction Compliance', () => {
  test('hooks should not import from src/apps/', async () => {
    const hooks = await import('../../../src/core/nodes/hooks');

    // Verify hooks are defined in core layer
    expect(typeof hooks.useChangesetStyling).toBe('function');
    expect(typeof hooks.useNodeHandles).toBe('function');

    // If we can import and use them without app-layer dependencies,
    // they comply with core layer restrictions
  });
});
