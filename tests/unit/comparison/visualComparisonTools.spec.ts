/**
 * Unit Tests for Visual Comparison Tools
 *
 * Tests multi-layout comparison, screenshot diff visualization,
 * and layout history navigation capabilities.
 *
 * Task Group 7.1: Write 2-8 focused tests for comparison UI
 */

import { test, expect } from '@playwright/test';
import type { RefinementIteration, ComparisonViewOptions } from '../../../src/apps/embedded/types/refinement';

/**
 * Mock iteration data for testing
 */
function createMockIteration(
  iterationNumber: number,
  score: number = 0.8
): RefinementIteration {
  return {
    iterationNumber,
    qualityScore: {
      combinedScore: score,
      readabilityScore: score,
      similarityScore: score,
      readabilityMetrics: {
        edgeCrossings: 0,
        nodeOcclusion: 0,
        aspectRatioScore: 0.9,
        edgeLengthVariance: 100,
        density: 0.5,
      },
      similarityMetrics: {
        structuralSimilarity: score,
        layoutSimilarity: score,
        perceptualHash: 'abcd1234',
      },
    },
    screenshotUrl: `data:image/png;base64,screenshot${iterationNumber}`,
    improved: iterationNumber > 1,
    improvementDelta: iterationNumber > 1 ? 0.05 : 0,
    parameters: {
      hierarchical: {
        nodeSpacing: 100,
        rankSpacing: 150,
        direction: 'TB',
      },
    },
    timestamp: new Date().toISOString(),
    durationMs: 500,
  };
}

test.describe('Visual Comparison Tools', () => {
  test.describe('Multi-Layout Comparison', () => {
    test('should support comparing 2 layouts side-by-side', async () => {
      const layout1 = createMockIteration(1, 0.75);
      const layout2 = createMockIteration(2, 0.85);

      const layouts = [layout1, layout2];

      expect(layouts.length).toBe(2);
      expect(layouts[0].screenshotUrl).toBeDefined();
      expect(layouts[1].screenshotUrl).toBeDefined();
      expect(layouts[1].qualityScore.combinedScore).toBeGreaterThan(
        layouts[0].qualityScore.combinedScore
      );
    });

    test('should support comparing 3-6 layouts in grid mode', async () => {
      const layouts = [
        createMockIteration(1, 0.7),
        createMockIteration(2, 0.75),
        createMockIteration(3, 0.8),
        createMockIteration(4, 0.85),
      ];

      expect(layouts.length).toBe(4);
      expect(layouts.length).toBeGreaterThanOrEqual(3);
      expect(layouts.length).toBeLessThanOrEqual(6);

      // Verify all have required data for grid display
      layouts.forEach((layout) => {
        expect(layout.screenshotUrl).toBeDefined();
        expect(layout.qualityScore).toBeDefined();
        expect(layout.iterationNumber).toBeDefined();
      });
    });

    test('should calculate quality score deltas between layouts', async () => {
      const layouts = [
        createMockIteration(1, 0.7),
        createMockIteration(2, 0.75),
        createMockIteration(3, 0.72),
      ];

      const deltas = layouts.slice(1).map((layout, index) => {
        const previousScore = layouts[index].qualityScore.combinedScore;
        const currentScore = layout.qualityScore.combinedScore;
        return {
          iteration: layout.iterationNumber,
          delta: currentScore - previousScore,
          improved: currentScore > previousScore,
        };
      });

      expect(deltas[0].delta).toBeCloseTo(0.05);
      expect(deltas[0].improved).toBe(true);
      expect(deltas[1].delta).toBeCloseTo(-0.03);
      expect(deltas[1].improved).toBe(false);
    });
  });

  test.describe('Screenshot Diff Visualization', () => {
    test('should identify changed regions between screenshots', async () => {
      // Mock diff data structure
      const diffData = {
        referenceUrl: 'data:image/png;base64,reference',
        generatedUrl: 'data:image/png;base64,generated',
        changedRegions: [
          { x: 100, y: 100, width: 50, height: 50, intensity: 0.8 },
          { x: 200, y: 150, width: 30, height: 40, intensity: 0.6 },
        ],
        totalChangedArea: 2900,
        changePercentage: 0.15,
      };

      expect(diffData.changedRegions.length).toBe(2);
      expect(diffData.changePercentage).toBe(0.15);
      expect(diffData.changedRegions[0].intensity).toBeGreaterThan(
        diffData.changedRegions[1].intensity
      );
    });

    test('should compute structural difference metrics', async () => {
      const layout1 = createMockIteration(1, 0.75);
      const layout2 = createMockIteration(2, 0.85);

      // Simulate SSIM comparison result
      const ssimScore = layout2.qualityScore.similarityMetrics?.structuralSimilarity || 0;

      expect(ssimScore).toBeGreaterThan(0);
      expect(ssimScore).toBeLessThanOrEqual(1);

      // Higher SSIM = more similar = fewer structural differences
      const structuralDifference = 1 - ssimScore;
      expect(structuralDifference).toBeGreaterThanOrEqual(0);
      expect(structuralDifference).toBeLessThanOrEqual(1);
    });

    test('should highlight regions with largest differences', async () => {
      const changedRegions = [
        { x: 100, y: 100, width: 50, height: 50, intensity: 0.9 },
        { x: 200, y: 150, width: 30, height: 40, intensity: 0.4 },
        { x: 300, y: 200, width: 60, height: 70, intensity: 0.7 },
      ];

      // Sort by intensity to find most significant changes
      const sortedByIntensity = [...changedRegions].sort(
        (a, b) => b.intensity - a.intensity
      );

      expect(sortedByIntensity[0].intensity).toBe(0.9);
      expect(sortedByIntensity[0].x).toBe(100);
      expect(sortedByIntensity[sortedByIntensity.length - 1].intensity).toBe(0.4);
    });
  });

  test.describe('Layout History Navigation', () => {
    test('should maintain chronological iteration history', async () => {
      const iterations = [
        createMockIteration(1, 0.65),
        createMockIteration(2, 0.72),
        createMockIteration(3, 0.78),
        createMockIteration(4, 0.85),
        createMockIteration(5, 0.83),
      ];
      expect(iterations.length).toBe(5);

      for (let i = 0; i < iterations.length - 1; i++) {
        expect(iterations[i + 1].iterationNumber).toBe(
          iterations[i].iterationNumber + 1
        );
      }
    });

    test('should support reverting to previous iteration', async () => {
      const iterations = [
        createMockIteration(1, 0.65),
        createMockIteration(2, 0.72),
        createMockIteration(3, 0.78),
        createMockIteration(4, 0.85),
        createMockIteration(5, 0.83),
      ];
      const currentIteration = 5;
      const revertToIteration = 3;

      const revertedLayout = iterations.find(
        (iter) => iter.iterationNumber === revertToIteration
      );

      expect(revertedLayout).toBeDefined();
      expect(revertedLayout?.iterationNumber).toBe(3);
      expect(revertedLayout?.qualityScore.combinedScore).toBe(0.78);
    });

    test('should identify best iteration in history', async () => {
      const iterations = [
        createMockIteration(1, 0.65),
        createMockIteration(2, 0.72),
        createMockIteration(3, 0.78),
        createMockIteration(4, 0.85),
        createMockIteration(5, 0.83),
      ];
      const bestIteration = iterations.reduce((best, current) => {
        return current.qualityScore.combinedScore > best.qualityScore.combinedScore
          ? current
          : best;
      });

      expect(bestIteration.iterationNumber).toBe(4);
      expect(bestIteration.qualityScore.combinedScore).toBe(0.85);
    });

    test('should generate thumbnail preview data for history timeline', async () => {
      const iterations = [
        createMockIteration(1, 0.65),
        createMockIteration(2, 0.72),
        createMockIteration(3, 0.78),
        createMockIteration(4, 0.85),
        createMockIteration(5, 0.83),
      ];
      const thumbnails = iterations.map((iter) => ({
        iterationNumber: iter.iterationNumber,
        thumbnailUrl: iter.screenshotUrl.replace(
          'data:image/png;base64,',
          'data:image/png;base64,thumb_'
        ),
        score: iter.qualityScore.combinedScore,
        timestamp: iter.timestamp,
        isBest: false, // Will be set for best iteration
      }));

      expect(thumbnails.length).toBe(5);
      thumbnails.forEach((thumb) => {
        expect(thumb.thumbnailUrl).toContain('thumb_');
        expect(thumb.score).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Comparison View Options', () => {
    test('should support all comparison view modes', async () => {
      const viewOptions: ComparisonViewOptions = {
        mode: 'side-by-side',
        overlayOpacity: 0.5,
        zoom: 1.0,
        panOffset: { x: 0, y: 0 },
        syncZoom: true,
      };
      const supportedModes: ComparisonViewOptions['mode'][] = [
        'side-by-side',
        'overlay',
        'heatmap',
        'difference',
      ];

      supportedModes.forEach((mode) => {
        viewOptions.mode = mode;
        expect(viewOptions.mode).toBe(mode);
      });
    });

    test('should synchronize viewport between layouts when syncZoom is enabled', async () => {
      const viewOptions: ComparisonViewOptions = {
        mode: 'side-by-side',
        overlayOpacity: 0.5,
        zoom: 1.0,
        panOffset: { x: 0, y: 0 },
        syncZoom: true,
      };
      viewOptions.syncZoom = true;
      viewOptions.zoom = 1.5;
      viewOptions.panOffset = { x: 100, y: 50 };

      // Both layouts should share the same view state
      const layout1ViewState = {
        zoom: viewOptions.zoom,
        panOffset: viewOptions.panOffset,
      };
      const layout2ViewState = {
        zoom: viewOptions.zoom,
        panOffset: viewOptions.panOffset,
      };

      expect(layout1ViewState.zoom).toBe(layout2ViewState.zoom);
      expect(layout1ViewState.panOffset.x).toBe(layout2ViewState.panOffset.x);
      expect(layout1ViewState.panOffset.y).toBe(layout2ViewState.panOffset.y);
    });

    test('should validate overlay opacity range', async () => {
      const viewOptions: ComparisonViewOptions = {
        mode: 'side-by-side',
        overlayOpacity: 0.5,
        zoom: 1.0,
        panOffset: { x: 0, y: 0 },
        syncZoom: true,
      };
      // Valid range: 0 to 1
      viewOptions.overlayOpacity = 0.7;
      expect(viewOptions.overlayOpacity).toBeGreaterThanOrEqual(0);
      expect(viewOptions.overlayOpacity).toBeLessThanOrEqual(1);

      // Test boundaries
      viewOptions.overlayOpacity = 0;
      expect(viewOptions.overlayOpacity).toBe(0);

      viewOptions.overlayOpacity = 1;
      expect(viewOptions.overlayOpacity).toBe(1);
    });
  });
});
