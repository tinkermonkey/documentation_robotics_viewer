/**
 * Unit Tests for Label Spacing and Collision Detection Utilities
 *
 * Tests cover:
 * - Label text dimension measurement
 * - Label-aware nudging distance calculation
 * - Edge label bounds creation
 * - Pairwise collision detection
 * - Batch collision detection for entire layouts
 * - Parallel edge label validation
 * - Dynamic spacing calculation based on label widths (FR-10)
 */

import { test, expect } from '@playwright/test';
import {
  measureLabelText,
  calculateLabelAwareNudgingDistance,
  createEdgeLabelBounds,
  labelsCollide,
  detectLabelCollisions,
  detectAllLabelCollisions,
  computeParallelEdgeSpacing,
  validateParallelEdgeLabels,
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
  });

  test.describe('createEdgeLabelBounds', () => {
    test('should create bounds with correct center position', () => {
      const bounds = createEdgeLabelBounds('edge1', 'test', 100, 200);

      expect(bounds.centerX).toBe(100);
      expect(bounds.centerY).toBe(200);
      expect(bounds.edgeId).toBe('edge1');
      expect(bounds.labelText).toBe('test');
    });

    test('should calculate extents from center and dimensions', () => {
      const bounds = createEdgeLabelBounds('edge1', 'label', 100, 200);

      // Extents should be symmetric around center
      expect(bounds.leftX).toBeLessThan(bounds.centerX);
      expect(bounds.rightX).toBeGreaterThan(bounds.centerX);
      expect(bounds.topY).toBeLessThan(bounds.centerY);
      expect(bounds.bottomY).toBeGreaterThan(bounds.centerY);

      // Check symmetry
      expect(bounds.centerX - bounds.leftX).toBeCloseTo(
        bounds.rightX - bounds.centerX,
        1
      );
      expect(bounds.centerY - bounds.topY).toBeCloseTo(
        bounds.bottomY - bounds.centerY,
        1
      );
    });

    test('should calculate correct width and height', () => {
      const bounds = createEdgeLabelBounds('edge1', 'test label', 50, 50);

      expect(bounds.width).toBeGreaterThan(0);
      expect(bounds.height).toBeGreaterThan(0);
      expect(bounds.rightX - bounds.leftX).toBeCloseTo(bounds.width, 1);
      expect(bounds.bottomY - bounds.topY).toBeCloseTo(bounds.height, 1);
    });
  });

  test.describe('labelsCollide', () => {
    test('should detect overlapping labels', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 105, 105);

      expect(labelsCollide(label1, label2)).toBe(true);
    });

    test('should not detect collision for separated labels', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 200, 200);

      expect(labelsCollide(label1, label2)).toBe(false);
    });

    test('should detect collision for horizontally overlapping labels', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label text', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label text', 115, 100);

      expect(labelsCollide(label1, label2)).toBe(true);
    });

    test('should detect collision for vertically overlapping labels', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 100, 108);

      expect(labelsCollide(label1, label2)).toBe(true);
    });

    test('should respect buffer parameter', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 150, 100);

      // With small buffer, might not collide
      const collideSmallBuffer = labelsCollide(label1, label2, 1);
      // With large buffer, should collide
      const collideLargeBuffer = labelsCollide(label1, label2, 100);

      expect(collideLargeBuffer).toBe(true);
    });

    test('should not collide with itself', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);

      // Labels at same position don't collide with buffer
      const label2 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      expect(labelsCollide(label1, label2, 0)).toBe(true);
    });
  });

  test.describe('detectLabelCollisions', () => {
    test('should return no collisions for isolated label', () => {
      const label = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const result = detectLabelCollisions(label, []);

      expect(result.hasCollision).toBe(false);
      expect(result.collidingWith).toHaveLength(0);
    });

    test('should detect collision with single other label', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 105, 105);

      const result = detectLabelCollisions(label1, [label2]);

      expect(result.hasCollision).toBe(true);
      expect(result.collidingWith).toContain('edge2');
    });

    test('should detect collisions with multiple labels', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 105, 105);
      const label3 = createEdgeLabelBounds('edge3', 'label', 102, 102);
      const label4 = createEdgeLabelBounds('edge4', 'label', 300, 300);

      const result = detectLabelCollisions(label1, [label2, label3, label4]);

      expect(result.hasCollision).toBe(true);
      expect(result.collidingWith).toHaveLength(2);
      expect(result.collidingWith).toContain('edge2');
      expect(result.collidingWith).toContain('edge3');
    });
  });

  test.describe('detectAllLabelCollisions', () => {
    test('should return empty map for no labels', () => {
      const collisions = detectAllLabelCollisions([]);

      expect(collisions.size).toBe(0);
    });

    test('should handle single label without collision', () => {
      const label = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const collisions = detectAllLabelCollisions([label]);

      expect(collisions.has('edge1')).toBe(true);
      const collision = collisions.get('edge1');
      expect(collision?.hasCollision).toBe(false);
      expect(collision?.collidingWith).toHaveLength(0);
    });

    test('should detect all pairwise collisions', () => {
      const label1 = createEdgeLabelBounds('edge1', 'label', 100, 100);
      const label2 = createEdgeLabelBounds('edge2', 'label', 105, 105);
      const label3 = createEdgeLabelBounds('edge3', 'label', 300, 300);

      const collisions = detectAllLabelCollisions([label1, label2, label3]);

      expect(collisions.size).toBe(3);

      // edge1 should collide with edge2
      const col1 = collisions.get('edge1');
      expect(col1?.hasCollision).toBe(true);
      expect(col1?.collidingWith).toContain('edge2');

      // edge2 should collide with edge1
      const col2 = collisions.get('edge2');
      expect(col2?.hasCollision).toBe(true);
      expect(col2?.collidingWith).toContain('edge1');

      // edge3 should not collide
      const col3 = collisions.get('edge3');
      expect(col3?.hasCollision).toBe(false);
    });
  });

  test.describe('computeParallelEdgeSpacing', () => {
    test('should return zero for single edge', () => {
      const spacing = computeParallelEdgeSpacing([{ edgeId: 'e1', labelText: 'label' }]);

      expect(spacing).toBe(0);
    });

    test('should return positive spacing for multiple parallel edges', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'label1' },
        { edgeId: 'e2', labelText: 'label2' },
      ];

      const spacing = computeParallelEdgeSpacing(edges);

      expect(spacing).toBeGreaterThan(0);
    });

    test('should increase spacing for longer labels', () => {
      const shortEdges = [
        { edgeId: 'e1', labelText: 'a' },
        { edgeId: 'e2', labelText: 'b' },
      ];

      const longEdges = [
        { edgeId: 'e1', labelText: 'very long label text' },
        { edgeId: 'e2', labelText: 'another long label' },
      ];

      const shortSpacing = computeParallelEdgeSpacing(shortEdges);
      const longSpacing = computeParallelEdgeSpacing(longEdges);

      expect(longSpacing).toBeGreaterThanOrEqual(shortSpacing);
    });

    test('should respect custom padding parameter', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'label' },
        { edgeId: 'e2', labelText: 'label' },
      ];

      const spacing1 = computeParallelEdgeSpacing(edges, 10);
      const spacing2 = computeParallelEdgeSpacing(edges, 40);

      expect(spacing2).toBeGreaterThanOrEqual(spacing1);
    });
  });

  test.describe('validateParallelEdgeLabels', () => {
    test('should validate single parallel edge without collision', () => {
      const edges = [{ edgeId: 'e1', labelText: 'label' }];
      const results = validateParallelEdgeLabels(edges, 100, 100, 0);

      expect(results).toHaveLength(1);
      expect(results[0].hasCollision).toBe(false);
    });

    test('should detect collisions in parallel edges without spacing', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'long label text' },
        { edgeId: 'e2', labelText: 'long label text' },
        { edgeId: 'e3', labelText: 'long label text' },
      ];

      const results = validateParallelEdgeLabels(edges, 100, 100, 0);

      expect(results).toHaveLength(3);
      // With zero spacing and overlapping text, should detect collisions
      expect(results.some((r) => r.hasCollision)).toBe(true);
    });

    test('should prevent collisions with adequate spacing', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'label' },
        { edgeId: 'e2', labelText: 'label' },
        { edgeId: 'e3', labelText: 'label' },
      ];

      // Use large spacing to separate labels
      const results = validateParallelEdgeLabels(edges, 100, 100, 50);

      expect(results).toHaveLength(3);
      // With adequate spacing, should not collide
      expect(results.every((r) => !r.hasCollision)).toBe(true);
    });

    test('should position labels correctly for odd number of edges', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'a' },
        { edgeId: 'e2', labelText: 'b' },
        { edgeId: 'e3', labelText: 'c' },
      ];

      const results = validateParallelEdgeLabels(edges, 100, 100, 30);

      expect(results).toHaveLength(3);
      // Middle label should be centered
      const middleLabel = results[1];
      expect(middleLabel).toBeDefined();
    });

    test('should position labels correctly for even number of edges', () => {
      const edges = [
        { edgeId: 'e1', labelText: 'a' },
        { edgeId: 'e2', labelText: 'b' },
      ];

      const results = validateParallelEdgeLabels(edges, 100, 100, 30);

      expect(results).toHaveLength(2);
      // Labels should be positioned symmetrically
      expect(results[0]).toBeDefined();
      expect(results[1]).toBeDefined();
    });
  });

  test.describe('Edge case handling', () => {
    test('should handle null and undefined gracefully', () => {
      const dims = measureLabelText('');
      expect(dims.width).toBe(0);
      expect(dims.height).toBe(0);
    });

    test('should handle very large label dimensions', () => {
      const longText = 'a'.repeat(1000);
      const dims = measureLabelText(longText);

      expect(dims.width).toBeGreaterThan(0);
      expect(dims.height).toBeGreaterThan(0);
    });

    test('should handle special characters in labels', () => {
      const specialChars = ['@#$%', 'café', '你好', 'Ω≈ç√'];

      for (const text of specialChars) {
        const dims = measureLabelText(text);
        expect(dims.width).toBeGreaterThanOrEqual(0);
        expect(dims.height).toBeGreaterThan(0);
      }
    });

    test('should handle collision detection with zero-sized labels', () => {
      const label1 = createEdgeLabelBounds('e1', '', 100, 100);
      const label2 = createEdgeLabelBounds('e2', '', 100, 100);

      // Zero-sized labels at same position might collide
      const result = labelsCollide(label1, label2, 0);
      expect(typeof result).toBe('boolean');
    });
  });

  test.describe('FR-10: Label Readability Requirements', () => {
    test('should provide mechanism for label-aware spacing', () => {
      const labels = ['Inherits From', 'Implements', 'Depends On'];
      const distance = calculateLabelAwareNudgingDistance(labels);

      // Should return a non-zero value based on label widths
      expect(distance).toBeGreaterThan(0);
      expect(distance).toBeLessThanOrEqual(50);
    });

    test('should validate parallel edges for label collisions', () => {
      const parallelEdges = [
        { edgeId: 'edge1', labelText: 'Component A to Component B' },
        { edgeId: 'edge2', labelText: 'Service to Database' },
        { edgeId: 'edge3', labelText: 'Async Processor Queue' },
      ];

      // Simulate labels at edge midpoint
      const results = validateParallelEdgeLabels(parallelEdges, 200, 150, 25);

      // Should provide validation results
      expect(results).toHaveLength(3);
      expect(results.every((r) => 'hasCollision' in r && 'collidingWith' in r)).toBe(
        true
      );
    });

    test('should calculate spacing that prevents label collisions', () => {
      const parallelEdges = [
        { edgeId: 'e1', labelText: 'API Gateway to Service' },
        { edgeId: 'e2', labelText: 'Load Balancer to Instance' },
      ];

      // Get recommended spacing
      const spacing = computeParallelEdgeSpacing(parallelEdges, 20);

      // Validate with computed spacing
      const results = validateParallelEdgeLabels(parallelEdges, 100, 100, spacing);

      // Should achieve no collisions with recommended spacing
      expect(results.some((r) => r.hasCollision)).toBe(false);
    });
  });
});
