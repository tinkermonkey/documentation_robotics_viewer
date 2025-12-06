/**
 * Visual Similarity Comparison Engine
 *
 * Phase 3 of the Visualization Optimization Loop.
 * Provides screenshot capture, image comparison (SSIM + perceptual hashing),
 * combined quality scoring, and difference heatmap generation.
 *
 * @module comparison
 *
 * @example
 * ```typescript
 * import {
 *   captureDiagramScreenshot,
 *   compareImages,
 *   calculateCombinedScore,
 *   generateDifferenceHeatmap,
 * } from '../services/comparison';
 *
 * // Capture diagram screenshot
 * const screenshot = await captureDiagramScreenshot(page, '.react-flow', {
 *   diagramType: 'c4',
 *   layoutType: 'hierarchical',
 * });
 *
 * // Compare with reference
 * const similarity = await compareImages(
 *   screenshot.imageBuffer,
 *   referenceBuffer
 * );
 *
 * // Calculate combined quality score
 * const qualityScore = await calculateCombinedScore(
 *   nodes,
 *   edges,
 *   'hierarchical',
 *   'c4',
 *   screenshot.imageBuffer,
 *   referenceBuffer
 * );
 *
 * // Generate debug heatmap if quality is low
 * if (!qualityScore.meetsThreshold) {
 *   const heatmap = await generateDifferenceHeatmap(
 *     screenshot.imageBuffer,
 *     referenceBuffer
 *   );
 *   await saveHeatmapResult(heatmap, './debug/comparison');
 * }
 * ```
 */

// Screenshot capture service
export {
  captureDiagramScreenshot,
  getDiagramDimensions,
  getDiagramType,
  getLayoutType,
  loadReferenceAsBuffer,
  waitForDiagramReady,
  captureMultipleScreenshots,
  type DiagramScreenshot,
  type ScreenshotOptions,
} from './screenshotService';

// Image similarity service
export {
  compareWithSSIM,
  compareWithPerceptualHash,
  compareImages,
  quickSimilarityCheck,
  calculatePerceptualHash,
  getSimilarityClass,
  validateImagesForComparison,
  type SSIMResult,
  type PerceptualHashResult,
  type SimilarityResult,
  type ComparisonOptions,
} from './imageSimilarityService';

// Quality score service
export {
  calculateCombinedScore,
  calculateReadabilityOnlyScore,
  calculateSimilarityOnlyScore,
  compareQualityScores,
  isQualityAcceptable,
  getImprovementSuggestions,
  formatQualityScore,
  type CombinedQualityScore,
  type QualityScoreOptions,
  type QualityComparisonResult,
} from './qualityScoreService';

// Heatmap service
export {
  generateDifferenceHeatmap,
  quickDifferenceCheck,
  saveHeatmapResult,
  formatHeatmapStats,
  type HeatmapResult,
  type HeatmapOptions,
} from './heatmapService';
