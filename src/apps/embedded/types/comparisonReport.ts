/**
 * Comparison Report Types
 *
 * Type definitions for comparison report export service.
 * These types are kept separate from refinement types as they may
 * have different lifecycle than other refinement components.
 */

/**
 * Quality score for a layout
 */
export interface QualityScore {
  /** Combined quality score (0-1) */
  combinedScore: number;
  /** Readability score (0-1) */
  readabilityScore: number;
  /** Similarity score (0-1) */
  similarityScore: number;
}

/**
 * Single refinement iteration
 */
export interface RefinementIteration {
  /** Iteration number */
  iterationNumber: number;
  /** Quality score for this iteration */
  qualityScore: QualityScore;
  /** Whether this iteration improved over baseline */
  improved: boolean;
  /** Improvement delta from baseline */
  improvementDelta: number;
}

/**
 * Layout snapshot for comparison
 */
export interface LayoutSnapshot {
  /** Label for the layout */
  label: string;
  /** Screenshot URL */
  screenshotUrl: string;
  /** Quality score */
  qualityScore: QualityScore;
  /** Whether this is the best layout */
  isBest: boolean;
}
