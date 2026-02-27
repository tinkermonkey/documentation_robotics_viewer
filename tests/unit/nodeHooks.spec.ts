/**
 * Node Hooks Parity Tests
 *
 * These tests ensure that extracted hooks (useChangesetStyling, useNodeHandles)
 * produce identical output to the inline logic they replaced in UnifiedNode.
 * This prevents silent divergence between hook and component logic.
 */

import { test, expect } from '@playwright/test';
import { computeChangesetStyling } from '../../src/core/nodes/hooks/useChangesetStyling';
import { computeHandleConfigs } from '../../src/core/nodes/hooks/useNodeHandles';
import { nodeConfigLoader } from '../../src/core/nodes/nodeConfigLoader';
import type { ChangesetOperation } from '../../src/core/nodes/components/UnifiedNode';

test.describe('Hook and Component Parity', () => {
  test.describe('useChangesetStyling - Changeset Operation Styling', () => {
    test('should return null when no operation provided', () => {
      const result = computeChangesetStyling(undefined);

      expect(result).toBeNull();
    });

    test('should compute add operation styling correctly', () => {
      const result = computeChangesetStyling('add');

      expect(result).not.toBeNull();
      expect(result?.fill).toBeDefined();
      expect(result?.stroke).toBeDefined();
      expect(result?.opacity).toBeDefined();
    });

    test('should compute update operation styling correctly', () => {
      const result = computeChangesetStyling('update');

      expect(result).not.toBeNull();
      expect(result?.fill).toBeDefined();
      expect(result?.stroke).toBeDefined();
      expect(result?.opacity).toBeDefined();
    });

    test('should compute delete operation styling correctly', () => {
      const result = computeChangesetStyling('delete');

      expect(result).not.toBeNull();
      expect(result?.fill).toBeDefined();
      expect(result?.stroke).toBeDefined();
      expect(result?.opacity).toBeDefined();
      // Delete typically has reduced opacity
      expect(result?.opacity).toBeLessThanOrEqual(1);
    });

    test('should match nodeConfigLoader.getChangesetColors output', () => {
      const operations: ChangesetOperation[] = ['add', 'update', 'delete'];

      operations.forEach((op) => {
        const hookResult = computeChangesetStyling(op);
        const configResult = nodeConfigLoader.getChangesetColors(op);

        expect(hookResult?.fill).toBe(configResult.bg);
        expect(hookResult?.stroke).toBe(configResult.border);
        expect(hookResult?.opacity).toBe(configResult.opacity ?? 1);
      });
    });

    test('should have consistent opacity defaults', () => {
      // Ensure opacity defaults to 1 when not specified
      const result = computeChangesetStyling('add');

      expect(typeof result?.opacity).toBe('number');
      expect(result?.opacity).toBeGreaterThan(0);
      expect(result?.opacity).toBeLessThanOrEqual(1);
    });
  });

  test.describe('useNodeHandles - Handle Configuration', () => {
    test('should return 4 handles for any layout', () => {
      const layouts = ['centered', 'left', 'table'] as const;

      layouts.forEach((layout) => {
        const configs = computeHandleConfigs({
          layout,
          handleColor: '#000000',
          headerHeight: 40,
        });

        expect(configs).toHaveLength(4);
      });
    });

    test('should have correct handle IDs in order', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#000000',
        headerHeight: 40,
      });

      expect(configs[0].id).toBe('top');
      expect(configs[1].id).toBe('bottom');
      expect(configs[2].id).toBe('left');
      expect(configs[3].id).toBe('right');
    });

    test('should set correct handle types', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#000000',
        headerHeight: 40,
      });

      expect(configs[0].type).toBe('target'); // top
      expect(configs[1].type).toBe('source'); // bottom
      expect(configs[2].type).toBe('target'); // left
      expect(configs[3].type).toBe('source'); // right
    });

    test('should set correct handle positions', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#000000',
        headerHeight: 40,
      });

      // Check position properties (from @xyflow/react Position enum - string values)
      expect(configs[0].position).toBe('top'); // Position.Top
      expect(configs[1].position).toBe('bottom'); // Position.Bottom
      expect(configs[2].position).toBe('left'); // Position.Left
      expect(configs[3].position).toBe('right'); // Position.Right
    });

    test('should center left/right handles vertically in centered layout', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#000000',
        headerHeight: 40,
      });

      // In centered layout, left and right handles should be at 50%
      expect(configs[2].style.top).toBe('50%'); // left
      expect(configs[3].style.top).toBe('50%'); // right
    });

    test('should position left/right handles at headerHeight/2 in left layout', () => {
      const headerHeight = 40;
      const configs = computeHandleConfigs({
        layout: 'left',
        handleColor: '#000000',
        headerHeight,
      });

      // In left layout, left and right handles should be at headerHeight/2
      expect(configs[2].style.top).toBe(headerHeight / 2); // left
      expect(configs[3].style.top).toBe(headerHeight / 2); // right
    });

    test('should center left/right handles vertically in table layout', () => {
      const configs = computeHandleConfigs({
        layout: 'table',
        handleColor: '#000000',
        headerHeight: 40,
      });

      // In table layout, left and right handles should be at 50%
      expect(configs[2].style.top).toBe('50%'); // left
      expect(configs[3].style.top).toBe('50%'); // right
    });

    test('should apply handle color to all handles', () => {
      const handleColor = '#ff0000';
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor,
        headerHeight: 40,
      });

      configs.forEach((config) => {
        expect(config.style.background).toBe(handleColor);
      });
    });

    test('should set consistent handle dimensions', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#000000',
        headerHeight: 40,
      });

      configs.forEach((config) => {
        expect(config.style.width).toBe(8);
        expect(config.style.height).toBe(8);
      });
    });

    test('should handle different header heights correctly', () => {
      const headerHeights = [30, 40, 50, 60];

      headerHeights.forEach((headerHeight) => {
        const configs = computeHandleConfigs({
          layout: 'left',
          handleColor: '#000000',
          headerHeight,
        });

        // Left and right handles should position at headerHeight/2
        expect(configs[2].style.top).toBe(headerHeight / 2);
        expect(configs[3].style.top).toBe(headerHeight / 2);
      });
    });

    test('should preserve style properties across handle configurations', () => {
      const configs = computeHandleConfigs({
        layout: 'centered',
        handleColor: '#123456',
        headerHeight: 40,
      });

      // Verify all handles have the required style properties
      configs.forEach((config) => {
        expect(config.style).toHaveProperty('background');
        expect(config.style).toHaveProperty('width');
        expect(config.style).toHaveProperty('height');
      });

      // Verify top/bottom don't have explicit top positioning
      expect(configs[0].style.top).toBeUndefined(); // top handle
      expect(configs[1].style.top).toBeUndefined(); // bottom handle
    });
  });

  test.describe('Cross-Hook Consistency', () => {
    test('should maintain parity between centered and table layouts for handle positioning', () => {
      const headerHeight = 40;
      const handleColor = '#000000';

      const centeredConfigs = computeHandleConfigs({
        layout: 'centered',
        handleColor,
        headerHeight,
      });

      const tableConfigs = computeHandleConfigs({
        layout: 'table',
        handleColor,
        headerHeight,
      });

      // Both layouts should center handles vertically
      expect(centeredConfigs[2].style.top).toBe(tableConfigs[2].style.top); // left
      expect(centeredConfigs[3].style.top).toBe(tableConfigs[3].style.top); // right
    });

    test('should not break with edge case header heights', () => {
      const edgeCases = [0, 1, 100, 1000];

      edgeCases.forEach((headerHeight) => {
        const configs = computeHandleConfigs({
          layout: 'left',
          handleColor: '#000000',
          headerHeight,
        });

        // Should still produce valid configs
        expect(configs).toHaveLength(4);
        expect(configs[2].style.top).toBe(headerHeight / 2);
      });
    });
  });
});
