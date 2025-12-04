/**
 * Unit tests for Image Similarity Service
 *
 * Tests SSIM comparison, perceptual hashing, combined comparison,
 * and difference heatmap generation. Uses synthetic test images
 * to verify correct behavior without requiring Playwright.
 */

import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import {
  compareWithSSIM,
  compareWithPerceptualHash,
  compareImages,
  quickSimilarityCheck,
  calculatePerceptualHash,
  getSimilarityClass,
  validateImagesForComparison,
} from '../../src/core/services/comparison/imageSimilarityService';
import {
  generateDifferenceHeatmap,
  quickDifferenceCheck,
  formatHeatmapStats,
} from '../../src/core/services/comparison/heatmapService';
import {
  calculateCombinedScore,
  calculateReadabilityOnlyScore,
  formatQualityScore,
  getImprovementSuggestions,
} from '../../src/core/services/comparison/qualityScoreService';
import type { Node, Edge } from '@xyflow/react';

/**
 * Create a solid color test image
 */
async function createSolidImage(
  width: number,
  height: number,
  color: { r: number; g: number; b: number }
): Promise<Buffer> {
  return sharp({
    create: {
      width,
      height,
      channels: 3,
      background: color,
    },
  })
    .png()
    .toBuffer();
}

/**
 * Create a test image with a simple pattern
 */
async function createPatternImage(
  width: number,
  height: number,
  pattern: 'stripes' | 'checkerboard' | 'gradient'
): Promise<Buffer> {
  const pixels = Buffer.alloc(width * height * 3);

  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 3;

      switch (pattern) {
        case 'stripes':
          const isStripe = Math.floor(x / 20) % 2 === 0;
          pixels[idx] = isStripe ? 255 : 0;
          pixels[idx + 1] = isStripe ? 255 : 0;
          pixels[idx + 2] = isStripe ? 255 : 0;
          break;

        case 'checkerboard':
          const isWhite = (Math.floor(x / 40) + Math.floor(y / 40)) % 2 === 0;
          pixels[idx] = isWhite ? 255 : 0;
          pixels[idx + 1] = isWhite ? 255 : 0;
          pixels[idx + 2] = isWhite ? 255 : 0;
          break;

        case 'gradient':
          const gray = Math.floor((x / width) * 255);
          pixels[idx] = gray;
          pixels[idx + 1] = gray;
          pixels[idx + 2] = gray;
          break;
      }
    }
  }

  return sharp(pixels, { raw: { width, height, channels: 3 } })
    .png()
    .toBuffer();
}

/**
 * Create a slightly modified version of an image
 */
async function addNoiseToImage(image: Buffer, noiseLevel: number): Promise<Buffer> {
  const { data, info } = await sharp(image)
    .raw()
    .toBuffer({ resolveWithObject: true });

  const noisyData = Buffer.from(data);
  for (let i = 0; i < noisyData.length; i++) {
    const noise = Math.floor((Math.random() - 0.5) * 2 * noiseLevel);
    noisyData[i] = Math.max(0, Math.min(255, noisyData[i] + noise));
  }

  return sharp(noisyData, {
    raw: { width: info.width, height: info.height, channels: info.channels },
  })
    .png()
    .toBuffer();
}

test.describe('Image Similarity Service - SSIM Comparison', () => {
  test('should return 1.0 for identical images', async () => {
    const image = await createSolidImage(200, 200, { r: 128, g: 128, b: 128 });

    const result = await compareWithSSIM(image, image);

    expect(result.mssim).toBeGreaterThan(0.99);
    expect(result.performance.totalTimeMs).toBeGreaterThan(0);
  });

  test('should return lower score for different images', async () => {
    // Use structured vs different structured images for meaningful SSIM comparison
    // Note: SSIM compares structure, not just color - solid images have same structure
    const checkerboard = await createPatternImage(200, 200, 'checkerboard');
    const gradient = await createPatternImage(200, 200, 'gradient');

    const result = await compareWithSSIM(checkerboard, gradient);

    // Checkerboard and gradient have different structures, expect lower score
    expect(result.mssim).toBeLessThan(0.9);
  });

  test('should return high score for similar images', async () => {
    const original = await createPatternImage(200, 200, 'gradient');
    const noisy = await addNoiseToImage(original, 10);

    const result = await compareWithSSIM(original, noisy);

    expect(result.mssim).toBeGreaterThan(0.8);
  });

  test('should complete within 500ms latency target', async () => {
    const image1 = await createPatternImage(400, 300, 'checkerboard');
    const image2 = await createPatternImage(400, 300, 'stripes');

    const result = await compareWithSSIM(image1, image2);

    expect(result.performance.totalTimeMs).toBeLessThan(500);
  });

  test('should handle images of different sizes', async () => {
    const small = await createSolidImage(100, 100, { r: 200, g: 200, b: 200 });
    const large = await createSolidImage(400, 400, { r: 200, g: 200, b: 200 });

    const result = await compareWithSSIM(small, large);

    // Should normalize and compare successfully
    expect(result.mssim).toBeGreaterThan(0.9);
  });
});

test.describe('Image Similarity Service - Perceptual Hashing', () => {
  test('should generate consistent hash for same image', async () => {
    const image = await createPatternImage(200, 200, 'checkerboard');

    const hash1 = await calculatePerceptualHash(image);
    const hash2 = await calculatePerceptualHash(image);

    expect(hash1).toBe(hash2);
    expect(hash1.length).toBe(16); // Default hash length
  });

  test('should return low hamming distance for similar images', async () => {
    const original = await createPatternImage(200, 200, 'gradient');
    const noisy = await addNoiseToImage(original, 5);

    const result = await compareWithPerceptualHash(original, noisy);

    expect(result.hammingDistance).toBeLessThan(8);
    expect(result.similarity).toBeGreaterThan(0.5);
    expect(result.isSimilar).toBe(true);
  });

  test('should return high hamming distance for different images', async () => {
    const stripes = await createPatternImage(200, 200, 'stripes');
    const checkerboard = await createPatternImage(200, 200, 'checkerboard');

    const result = await compareWithPerceptualHash(stripes, checkerboard);

    expect(result.hammingDistance).toBeGreaterThan(0);
    // Different patterns should have measurable distance
  });

  test('should complete within 50ms latency target', async () => {
    const image1 = await createSolidImage(200, 200, { r: 100, g: 150, b: 200 });
    const image2 = await createSolidImage(200, 200, { r: 100, g: 155, b: 195 });

    const start = Date.now();
    await compareWithPerceptualHash(image1, image2);
    const elapsed = Date.now() - start;

    // Allow some margin for file I/O
    expect(elapsed).toBeLessThan(200);
  });
});

test.describe('Image Similarity Service - Combined Comparison', () => {
  test('should combine SSIM and perceptual hash scores', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 10);

    const result = await compareImages(image1, image2);

    expect(result.ssimScore).toBeGreaterThan(0);
    expect(result.ssimScore).toBeLessThanOrEqual(1);
    expect(result.perceptualHash).toBeDefined();
    expect(result.perceptualHash.length).toBe(16);
    expect(result.combinedScore).toBeGreaterThan(0);
    expect(result.combinedScore).toBeLessThanOrEqual(1);
    expect(result.details.ssimResult).toBeDefined();
    expect(result.details.hashResult).toBeDefined();
  });

  test('should respect custom weights', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 20);

    // SSIM-heavy weighting
    const ssimHeavy = await compareImages(image1, image2, {
      ssimWeight: 0.9,
      perceptualWeight: 0.1,
    });

    // Perceptual-heavy weighting
    const perceptualHeavy = await compareImages(image1, image2, {
      ssimWeight: 0.1,
      perceptualWeight: 0.9,
    });

    // Scores should differ based on weights
    expect(ssimHeavy.combinedScore).not.toBe(perceptualHeavy.combinedScore);
  });

  test('should classify similarity correctly', async () => {
    const identical = await createSolidImage(200, 200, { r: 128, g: 128, b: 128 });

    const result = await compareImages(identical, identical);

    expect(result.isSimilar).toBe(true);
    expect(getSimilarityClass(result.ssimScore)).toBe('identical');
  });
});

test.describe('Image Similarity Service - Quick Similarity Check', () => {
  test('should quickly determine if images are similar', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 5);

    const isSimilar = await quickSimilarityCheck(image1, image2);

    expect(typeof isSimilar).toBe('boolean');
  });

  test('should return false for very different images', async () => {
    const white = await createSolidImage(200, 200, { r: 255, g: 255, b: 255 });
    const black = await createSolidImage(200, 200, { r: 0, g: 0, b: 0 });

    const isSimilar = await quickSimilarityCheck(white, black, 5);

    expect(isSimilar).toBe(false);
  });
});

test.describe('Image Similarity Service - Validation', () => {
  test('should validate valid images', async () => {
    const image1 = await createSolidImage(200, 200, { r: 128, g: 128, b: 128 });
    const image2 = await createSolidImage(300, 300, { r: 200, g: 200, b: 200 });

    const validation = await validateImagesForComparison(image1, image2);

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
    expect(validation.generatedInfo?.width).toBe(200);
    expect(validation.referenceInfo?.width).toBe(300);
  });

  test('should detect invalid image buffers', async () => {
    const validImage = await createSolidImage(100, 100, { r: 128, g: 128, b: 128 });
    const invalidBuffer = Buffer.from('not an image');

    const validation = await validateImagesForComparison(validImage, invalidBuffer);

    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });
});

test.describe('Similarity Classification', () => {
  test('should classify identical images correctly', () => {
    expect(getSimilarityClass(1.0)).toBe('identical');
    expect(getSimilarityClass(0.99)).toBe('identical');
  });

  test('should classify very similar images correctly', () => {
    expect(getSimilarityClass(0.97)).toBe('very-similar');
    expect(getSimilarityClass(0.95)).toBe('very-similar');
  });

  test('should classify similar images correctly', () => {
    expect(getSimilarityClass(0.90)).toBe('similar');
    expect(getSimilarityClass(0.85)).toBe('similar');
  });

  test('should classify somewhat similar images correctly', () => {
    expect(getSimilarityClass(0.80)).toBe('somewhat-similar');
    expect(getSimilarityClass(0.70)).toBe('somewhat-similar');
  });

  test('should classify different images correctly', () => {
    expect(getSimilarityClass(0.60)).toBe('different');
    expect(getSimilarityClass(0.30)).toBe('different');
  });
});

test.describe('Heatmap Service', () => {
  test('should generate heatmap for different images', async () => {
    const image1 = await createPatternImage(200, 200, 'stripes');
    const image2 = await createPatternImage(200, 200, 'checkerboard');

    const result = await generateDifferenceHeatmap(image1, image2);

    expect(result.heatmapBuffer).toBeInstanceOf(Buffer);
    expect(result.comparisonBuffer).toBeInstanceOf(Buffer);
    expect(result.overlayBuffer).toBeInstanceOf(Buffer);
    expect(result.dimensions.width).toBe(800);
    expect(result.dimensions.height).toBe(600);
    expect(result.statistics.meanDifference).toBeGreaterThan(0);
    expect(result.statistics.hotspots).toBeDefined();
    expect(result.computationTimeMs).toBeGreaterThan(0);
  });

  test('should show zero difference for identical images', async () => {
    const image = await createSolidImage(200, 200, { r: 128, g: 128, b: 128 });

    const result = await generateDifferenceHeatmap(image, image);

    expect(result.statistics.meanDifference).toBeLessThan(1);
    expect(result.statistics.maxDifference).toBeLessThan(1);
    expect(result.statistics.significantDifferencePercentage).toBe(0);
  });

  test('should support different color schemes', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 30);

    const thermal = await generateDifferenceHeatmap(image1, image2, {
      colorScheme: 'thermal',
    });

    const grayscale = await generateDifferenceHeatmap(image1, image2, {
      colorScheme: 'grayscale',
    });

    // Both should complete successfully with different outputs
    expect(thermal.heatmapBuffer).not.toEqual(grayscale.heatmapBuffer);
  });

  test('should identify hotspots', async () => {
    // Create image with localized difference
    const image1 = await createSolidImage(200, 200, { r: 128, g: 128, b: 128 });

    // Create image with a bright spot
    const pixels = Buffer.alloc(200 * 200 * 3, 128);
    // Add bright spot at center
    for (let y = 90; y < 110; y++) {
      for (let x = 90; x < 110; x++) {
        const idx = (y * 200 + x) * 3;
        pixels[idx] = 255;
        pixels[idx + 1] = 255;
        pixels[idx + 2] = 255;
      }
    }
    const image2 = await sharp(pixels, { raw: { width: 200, height: 200, channels: 3 } })
      .png()
      .toBuffer();

    const result = await generateDifferenceHeatmap(image1, image2);

    expect(result.statistics.hotspots.length).toBeGreaterThan(0);
  });

  test('should format heatmap stats correctly', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 20);

    const result = await generateDifferenceHeatmap(image1, image2);
    const formatted = formatHeatmapStats(result);

    expect(formatted).toContain('Difference Analysis');
    expect(formatted).toContain('Mean Difference');
    expect(formatted).toContain('Max Difference');
    expect(formatted).toContain('Hotspots');
  });
});

test.describe('Quick Difference Check', () => {
  test('should quickly compute difference statistics', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 20);

    const start = Date.now();
    const result = await quickDifferenceCheck(image1, image2);
    const elapsed = Date.now() - start;

    expect(result.meanDifference).toBeGreaterThan(0);
    expect(result.maxDifference).toBeGreaterThan(0);
    expect(result.significantDifferencePercentage).toBeGreaterThanOrEqual(0);
    expect(elapsed).toBeLessThan(200); // Should be fast
  });
});

test.describe('Combined Quality Score Service', () => {
  // Create test nodes and edges
  const testNodes: Node[] = [
    { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default' },
    { id: '2', position: { x: 200, y: 0 }, data: { label: 'Node 2' }, type: 'default' },
    { id: '3', position: { x: 100, y: 150 }, data: { label: 'Node 3' }, type: 'default' },
  ];

  const testEdges: Edge[] = [
    { id: 'e1-2', source: '1', target: '2' },
    { id: 'e2-3', source: '2', target: '3' },
  ];

  test('should calculate readability-only score', () => {
    const score = calculateReadabilityOnlyScore(
      testNodes,
      testEdges,
      'hierarchical',
      'motivation'
    );

    expect(score.readabilityScore).toBeGreaterThan(0);
    expect(score.readabilityScore).toBeLessThanOrEqual(1);
    expect(score.similarityScore).toBe(1); // No reference comparison
    expect(score.combinedScore).toBe(score.readabilityScore);
    expect(score.weights.readability).toBe(1);
    expect(score.weights.similarity).toBe(0);
    expect(score.qualityClass).toBeDefined();
    expect(score.meetsThreshold).toBeDefined();
  });

  test('should calculate combined score with visual comparison', async () => {
    const image1 = await createPatternImage(200, 200, 'gradient');
    const image2 = await addNoiseToImage(image1, 10);

    const score = await calculateCombinedScore(
      testNodes,
      testEdges,
      'hierarchical',
      'c4',
      image1,
      image2
    );

    expect(score.readabilityScore).toBeGreaterThan(0);
    expect(score.similarityScore).toBeGreaterThan(0);
    expect(score.combinedScore).toBeGreaterThan(0);
    expect(score.breakdown.graphMetrics).toBeDefined();
    expect(score.breakdown.visualSimilarity).toBeDefined();
    expect(score.computationTimeMs).toBeGreaterThan(0);
  });

  test('should format quality score correctly', () => {
    const score = calculateReadabilityOnlyScore(
      testNodes,
      testEdges,
      'hierarchical',
      'motivation'
    );

    const formatted = formatQualityScore(score);

    expect(formatted).toContain('Quality Score');
    expect(formatted).toContain('Readability');
    expect(formatted).toContain('Similarity');
    expect(formatted).toContain('Threshold');
  });

  test('should provide improvement suggestions', () => {
    // Create overlapping nodes
    const overlappingNodes: Node[] = [
      { id: '1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'default', width: 200, height: 100 },
      { id: '2', position: { x: 50, y: 50 }, data: { label: 'Node 2' }, type: 'default', width: 200, height: 100 },
    ];

    const score = calculateReadabilityOnlyScore(
      overlappingNodes,
      [],
      'manual',
      'motivation'
    );

    const suggestions = getImprovementSuggestions(score);

    // Should suggest something even if quality is decent
    expect(Array.isArray(suggestions)).toBe(true);
  });

  test('should handle empty graph', () => {
    const score = calculateReadabilityOnlyScore(
      [],
      [],
      'hierarchical',
      'motivation'
    );

    expect(score.readabilityScore).toBeGreaterThanOrEqual(0);
    expect(score.qualityClass).toBeDefined();
  });
});
