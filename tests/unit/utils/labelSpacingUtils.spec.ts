/**
 * Unit Tests for Label Spacing Utilities
 *
 * Tests cover:
 * - Label text dimension measurement
 * - Label-aware nudging distance calculation based on actual label widths
 */

import { test, expect } from '@playwright/test';
import {
  measureLabelText,
  calculateLabelAwareNudgingDistance,
  resetCanvasContext,
} from '@/core/utils/labelSpacingUtils';

test.describe('labelSpacingUtils', () => {
  test.afterEach(() => {
    resetCanvasContext();
  });

  test.describe('measureLabelText', () => {
    test('should measure simple text dimensions', () => {
      const dims = measureLabelText('test');

      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    test('should return zero dimensions for empty text', () => {
      const dims = measureLabelText('');

      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);
    });

    test('should measure longer text with greater width', () => {
      const short = measureLabelText('a');
      const long = measureLabelText('abcdefghijklmnopqrstuvwxyz');

      expect(long.width).toBeGreaterThan(short.width);
    });

    test('should use custom font size', () => {
      const small = measureLabelText('test', 10);
      const large = measureLabelText('test', 20);

      expect(large.height).toBeGreaterThan(small.height);
    });

    test('should use custom font weight', () => {
      const dims = measureLabelText('test', 12, 700);

      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });
  });

  test.describe('calculateLabelAwareNudgingDistance', () => {
    test('should return default distance for empty labels', () => {
      const distance = calculateLabelAwareNudgingDistance([]);

      expect(distance).toBe(15); // Default value
    });

    test('should return default distance for empty strings', () => {
      const distance = calculateLabelAwareNudgingDistance(['', '', '']);

      expect(distance).toBe(15);
    });

    test('should increase distance for longer labels', () => {
      const short = calculateLabelAwareNudgingDistance(['a']);
      const long = calculateLabelAwareNudgingDistance(['abcdefghijklmnopqrstuvwxyz']);

      expect(long).toBeGreaterThanOrEqual(short);
    });

    test('should cap distance at reasonable maximum', () => {
      const veryLongLabels = Array(5)
        .fill('This is a very long label text that exceeds normal edge label length');
      const distance = calculateLabelAwareNudgingDistance(veryLongLabels);

      // Should be capped at 50px
      expect(distance).toBeLessThanOrEqual(50);
    });

    test('should respect minimum distance', () => {
      const distance = calculateLabelAwareNudgingDistance(['']);

      expect(distance).toBeGreaterThanOrEqual(15);
    });

    test('should handle multiple labels of varying lengths', () => {
      const labels = ['short', 'medium length', 'this is a longer label text'];
      const distance = calculateLabelAwareNudgingDistance(labels);

      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(50);
    });

    test('should increase with custom padding parameter', () => {
      const labels = ['test label'];
      const dist1 = calculateLabelAwareNudgingDistance(labels, 10);
      const dist2 = calculateLabelAwareNudgingDistance(labels, 40);

      expect(dist2).toBeGreaterThanOrEqual(dist1);
    });

    test('should measure all labels to find the widest, not just sample first 3', () => {
      // Ensure the function measures labels beyond position 3
      const labels = [
        'short',
        'med',
        'ok',
        'very long label that is definitely widest' // Position 3
      ];
      const distance = calculateLabelAwareNudgingDistance(labels);

      // If only first 3 were measured, distance would be lower
      // With all labels measured, it accounts for the longest one
      expect(distance).toBeGreaterThan(15);
    });
  });
});
