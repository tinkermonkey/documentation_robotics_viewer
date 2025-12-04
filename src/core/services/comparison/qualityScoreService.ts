/**
 * Quality Score Service
 *
 * Combines graph readability metrics with visual similarity scores to provide
 * a unified quality assessment for diagram layouts. This service integrates
 * Phase 1 (readability metrics) and Phase 3 (visual similarity) into a
 * comprehensive optimization target.
 *
 * @remarks
 * The combined score allows for:
 * - Objective layout quality measurement
 * - Comparison against reference diagrams
 * - Automated regression detection
 * - Optimization loop feedback
 */

import { Node, Edge } from '@xyflow/react';
import {
  calculateLayoutQuality,
  LayoutQualityReport,
  DiagramType,
  LayoutType,
} from '../metrics/graphReadabilityService';
import {
  compareImages,
  compareWithSSIM,
  SimilarityResult,
  SSIMResult,
  ComparisonOptions,
} from './imageSimilarityService';

/**
 * Combined quality score combining readability and visual similarity
 */
export interface CombinedQualityScore {
  /**
   * Readability score from greadability.js metrics (0-1)
   */
  readabilityScore: number;

  /**
   * Visual similarity score from SSIM/perceptual hash (0-1)
   */
  similarityScore: number;

  /**
   * Final combined score (0-1)
   */
  combinedScore: number;

  /**
   * Classification of overall quality
   */
  qualityClass: 'excellent' | 'good' | 'acceptable' | 'poor' | 'unacceptable';

  /**
   * Whether the layout meets quality thresholds
   */
  meetsThreshold: boolean;

  /**
   * Detailed breakdown of scores
   */
  breakdown: {
    /**
     * Full layout quality report from greadability.js
     */
    graphMetrics: LayoutQualityReport;

    /**
     * Full visual similarity result (if reference comparison was performed)
     */
    visualSimilarity?: SimilarityResult;

    /**
     * SSIM-only result (if full comparison was not performed)
     */
    ssimResult?: SSIMResult;
  };

  /**
   * Weights used for score calculation
   */
  weights: {
    readability: number;
    similarity: number;
  };

  /**
   * Timestamp of calculation
   */
  timestamp: string;

  /**
   * Computation time in milliseconds
   */
  computationTimeMs: number;
}

/**
 * Options for combined quality score calculation
 */
export interface QualityScoreOptions {
  /**
   * Weight for readability metrics (default: 0.6)
   * Higher values prioritize graph quality over visual similarity
   */
  readabilityWeight?: number;

  /**
   * Weight for similarity metrics (default: 0.4)
   * Higher values prioritize matching reference diagrams
   */
  similarityWeight?: number;

  /**
   * Minimum combined score to pass quality threshold (default: 0.7)
   */
  qualityThreshold?: number;

  /**
   * Options passed to image comparison
   */
  comparisonOptions?: Partial<ComparisonOptions>;
}

/**
 * Result of quality comparison between current and baseline
 */
export interface QualityComparisonResult {
  /**
   * Current quality score
   */
  current: CombinedQualityScore;

  /**
   * Baseline quality score
   */
  baseline: CombinedQualityScore;

  /**
   * Improvement in combined score (positive = better, negative = regression)
   */
  improvement: number;

  /**
   * Percentage change in combined score
   */
  percentageChange: number;

  /**
   * Whether current is better than baseline
   */
  improved: boolean;

  /**
   * Whether this represents a regression
   */
  hasRegression: boolean;

  /**
   * Per-component improvements
   */
  componentChanges: {
    readability: number;
    similarity: number;
  };
}

/**
 * Default quality score options
 */
const DEFAULT_OPTIONS: Required<QualityScoreOptions> = {
  readabilityWeight: 0.6,
  similarityWeight: 0.4,
  qualityThreshold: 0.7,
  comparisonOptions: {},
};

/**
 * Quality class thresholds
 */
const QUALITY_THRESHOLDS = {
  excellent: 0.9,
  good: 0.8,
  acceptable: 0.7,
  poor: 0.5,
};

/**
 * Determine quality class based on combined score
 */
function getQualityClass(
  score: number
): CombinedQualityScore['qualityClass'] {
  if (score >= QUALITY_THRESHOLDS.excellent) return 'excellent';
  if (score >= QUALITY_THRESHOLDS.good) return 'good';
  if (score >= QUALITY_THRESHOLDS.acceptable) return 'acceptable';
  if (score >= QUALITY_THRESHOLDS.poor) return 'poor';
  return 'unacceptable';
}

/**
 * Calculate combined quality score for a diagram layout.
 *
 * Combines graph readability metrics with visual similarity to reference
 * diagrams for comprehensive quality assessment.
 *
 * @param nodes - React Flow nodes with positions
 * @param edges - React Flow edges
 * @param layoutType - Layout algorithm used
 * @param diagramType - Type of diagram
 * @param generatedImage - Optional screenshot of generated diagram
 * @param referenceImage - Optional reference diagram image
 * @param options - Quality score options
 * @returns Promise resolving to CombinedQualityScore
 *
 * @example
 * ```typescript
 * // With visual comparison
 * const score = await calculateCombinedScore(
 *   nodes,
 *   edges,
 *   'hierarchical',
 *   'c4',
 *   generatedScreenshot.imageBuffer,
 *   referenceBuffer
 * );
 *
 * console.log(`Quality: ${score.qualityClass} (${score.combinedScore.toFixed(2)})`);
 *
 * // Without visual comparison (readability only)
 * const readabilityScore = await calculateCombinedScore(
 *   nodes,
 *   edges,
 *   'hierarchical',
 *   'c4'
 * );
 * ```
 */
export async function calculateCombinedScore(
  nodes: Node[],
  edges: Edge[],
  layoutType: LayoutType,
  diagramType: DiagramType,
  generatedImage?: Buffer,
  referenceImage?: Buffer,
  options: QualityScoreOptions = {}
): Promise<CombinedQualityScore> {
  const startTime = performance.now();
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Normalize weights to sum to 1
  const totalWeight = opts.readabilityWeight + opts.similarityWeight;
  const normalizedWeights = {
    readability: opts.readabilityWeight / totalWeight,
    similarity: opts.similarityWeight / totalWeight,
  };

  // Calculate readability metrics
  const graphMetrics = calculateLayoutQuality(
    nodes,
    edges,
    layoutType,
    diagramType
  );

  let similarityScore = 1; // Default to 1 if no reference comparison
  let visualSimilarity: SimilarityResult | undefined;
  let ssimResult: SSIMResult | undefined;

  // Calculate visual similarity if images provided
  if (generatedImage && referenceImage) {
    visualSimilarity = await compareImages(
      generatedImage,
      referenceImage,
      opts.comparisonOptions
    );
    similarityScore = visualSimilarity.combinedScore;
  }

  // Calculate combined score
  const combinedScore =
    normalizedWeights.readability * graphMetrics.overallScore +
    normalizedWeights.similarity * similarityScore;

  const computationTimeMs = performance.now() - startTime;

  return {
    readabilityScore: graphMetrics.overallScore,
    similarityScore,
    combinedScore,
    qualityClass: getQualityClass(combinedScore),
    meetsThreshold: combinedScore >= opts.qualityThreshold,
    breakdown: {
      graphMetrics,
      visualSimilarity,
      ssimResult,
    },
    weights: {
      readability: normalizedWeights.readability,
      similarity: normalizedWeights.similarity,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs,
  };
}

/**
 * Calculate quality score using only readability metrics (no visual comparison).
 *
 * Use this when reference images are not available.
 *
 * @param nodes - React Flow nodes
 * @param edges - React Flow edges
 * @param layoutType - Layout algorithm used
 * @param diagramType - Type of diagram
 * @returns CombinedQualityScore with similarity score set to 1
 */
export function calculateReadabilityOnlyScore(
  nodes: Node[],
  edges: Edge[],
  layoutType: LayoutType,
  diagramType: DiagramType
): CombinedQualityScore {
  const startTime = performance.now();

  const graphMetrics = calculateLayoutQuality(
    nodes,
    edges,
    layoutType,
    diagramType
  );

  const computationTimeMs = performance.now() - startTime;

  // When no visual comparison, readability is the full score
  const combinedScore = graphMetrics.overallScore;

  return {
    readabilityScore: graphMetrics.overallScore,
    similarityScore: 1, // No reference comparison
    combinedScore,
    qualityClass: getQualityClass(combinedScore),
    meetsThreshold: combinedScore >= DEFAULT_OPTIONS.qualityThreshold,
    breakdown: {
      graphMetrics,
    },
    weights: {
      readability: 1,
      similarity: 0,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs,
  };
}

/**
 * Calculate quality score using only visual similarity (no readability metrics).
 *
 * Use this when you only care about matching a reference diagram exactly.
 *
 * @param generatedImage - Screenshot of generated diagram
 * @param referenceImage - Reference diagram image
 * @param options - Comparison options
 * @returns Promise resolving to CombinedQualityScore with readability score set to 1
 */
export async function calculateSimilarityOnlyScore(
  generatedImage: Buffer,
  referenceImage: Buffer,
  options: Partial<ComparisonOptions> = {}
): Promise<CombinedQualityScore> {
  const startTime = performance.now();

  const visualSimilarity = await compareImages(
    generatedImage,
    referenceImage,
    options
  );

  const computationTimeMs = performance.now() - startTime;

  // When no readability comparison, similarity is the full score
  const combinedScore = visualSimilarity.combinedScore;

  // Create a minimal graph metrics report
  const graphMetrics: LayoutQualityReport = {
    overallScore: 1, // Not measured
    metrics: {
      crossingNumber: 1,
      crossingAngle: 1,
      angularResolutionMin: 1,
      angularResolutionDev: 1,
    },
    extendedMetrics: {
      crossingNumber: 1,
      crossingAngle: 1,
      angularResolutionMin: 1,
      angularResolutionDev: 1,
      edgeLength: { min: 0, max: 0, mean: 0, stdDev: 0 },
      nodeNodeOcclusion: 0,
      aspectRatio: 1,
      density: 0,
    },
    timestamp: new Date().toISOString(),
    layoutType: 'manual',
    diagramType: 'motivation',
    nodeCount: 0,
    edgeCount: 0,
    computationTimeMs: 0,
  };

  return {
    readabilityScore: 1, // Not measured
    similarityScore: visualSimilarity.combinedScore,
    combinedScore,
    qualityClass: getQualityClass(combinedScore),
    meetsThreshold: combinedScore >= DEFAULT_OPTIONS.qualityThreshold,
    breakdown: {
      graphMetrics,
      visualSimilarity,
    },
    weights: {
      readability: 0,
      similarity: 1,
    },
    timestamp: new Date().toISOString(),
    computationTimeMs,
  };
}

/**
 * Compare two quality scores to determine improvement or regression.
 *
 * @param current - Current quality score
 * @param baseline - Baseline quality score to compare against
 * @returns QualityComparisonResult with improvement metrics
 */
export function compareQualityScores(
  current: CombinedQualityScore,
  baseline: CombinedQualityScore
): QualityComparisonResult {
  const improvement = current.combinedScore - baseline.combinedScore;
  const percentageChange =
    baseline.combinedScore > 0
      ? (improvement / baseline.combinedScore) * 100
      : 0;

  return {
    current,
    baseline,
    improvement,
    percentageChange,
    improved: improvement > 0,
    hasRegression: improvement < -0.05, // 5% threshold for regression
    componentChanges: {
      readability: current.readabilityScore - baseline.readabilityScore,
      similarity: current.similarityScore - baseline.similarityScore,
    },
  };
}

/**
 * Check if a quality score represents acceptable quality.
 *
 * @param score - Quality score to check
 * @param threshold - Minimum acceptable score (default: 0.7)
 * @returns boolean indicating if quality is acceptable
 */
export function isQualityAcceptable(
  score: CombinedQualityScore,
  threshold: number = 0.7
): boolean {
  return score.combinedScore >= threshold;
}

/**
 * Get suggestions for improving layout quality based on scores.
 *
 * @param score - Current quality score
 * @returns Array of improvement suggestions
 */
export function getImprovementSuggestions(
  score: CombinedQualityScore
): string[] {
  const suggestions: string[] = [];

  const metrics = score.breakdown.graphMetrics.metrics;

  // Check readability metrics
  if (metrics.crossingNumber < 0.7) {
    suggestions.push('Reduce edge crossings by adjusting node positions');
  }

  if (metrics.angularResolutionMin < 0.7) {
    suggestions.push('Increase spacing between adjacent edges at nodes');
  }

  const extended = score.breakdown.graphMetrics.extendedMetrics;

  if (extended.nodeNodeOcclusion > 2) {
    suggestions.push('Resolve overlapping nodes by increasing spacing');
  }

  const edgeLengthCV =
    extended.edgeLength.mean > 0
      ? extended.edgeLength.stdDev / extended.edgeLength.mean
      : 0;
  if (edgeLengthCV > 0.5) {
    suggestions.push('Normalize edge lengths for more uniform appearance');
  }

  // Check visual similarity
  if (score.breakdown.visualSimilarity) {
    const similarity = score.breakdown.visualSimilarity;

    if (similarity.ssimScore < 0.8) {
      suggestions.push('Layout structure differs significantly from reference');
    }

    if (similarity.perceptualSimilarity < 0.7) {
      suggestions.push('Visual appearance differs from reference diagram');
    }
  }

  if (suggestions.length === 0 && score.combinedScore < 0.9) {
    suggestions.push('Consider fine-tuning layout parameters for optimal results');
  }

  return suggestions;
}

/**
 * Format quality score for display/logging.
 *
 * @param score - Quality score to format
 * @returns Formatted string representation
 */
export function formatQualityScore(score: CombinedQualityScore): string {
  const lines = [
    `Quality Score: ${score.combinedScore.toFixed(3)} (${score.qualityClass})`,
    `├── Readability: ${score.readabilityScore.toFixed(3)} (weight: ${(score.weights.readability * 100).toFixed(0)}%)`,
    `└── Similarity:  ${score.similarityScore.toFixed(3)} (weight: ${(score.weights.similarity * 100).toFixed(0)}%)`,
    ``,
    `Threshold: ${score.meetsThreshold ? '✓ PASS' : '✗ FAIL'}`,
    `Computed in: ${score.computationTimeMs.toFixed(1)}ms`,
  ];

  return lines.join('\n');
}
