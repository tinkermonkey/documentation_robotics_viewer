/**
 * Layout Parameter Types and Defaults
 *
 * Contains type definitions and default values for all supported layout engines.
 */

// Note: DiagramType would be used internally if we had layout parameter types that
// reference specific diagram types, but the extracted types are generic.
// Export it from ./diagram.ts instead
// import type { DiagramType } from './diagram';

// ============================================================================
// Parameter Range Definitions
// ============================================================================

/**
 * Base parameter range definition with numeric bounds
 */
export interface NumericParameterRange {
  min: number;
  max: number;
  step: number;
  default: number;
}

/**
 * Discrete parameter range for categorical options
 */
export interface DiscreteParameterRange<T extends string> {
  values: readonly T[];
  default: T;
}

/**
 * Boolean parameter (on/off)
 */
export interface BooleanParameterRange {
  default: boolean;
}

/**
 * Union type for all parameter range types
 */
export type ParameterRange =
  | NumericParameterRange
  | DiscreteParameterRange<string>
  | BooleanParameterRange;

// ============================================================================
// ELK Layout Types
// ============================================================================

/**
 * ELK algorithm options
 */
export type ELKAlgorithm = 'layered' | 'force' | 'stress' | 'box';

/**
 * ELK layout direction
 */
export type ELKDirection = 'RIGHT' | 'DOWN' | 'LEFT' | 'UP';

/**
 * ELK layering strategy (for layered algorithm)
 */
export type ELKLayeringStrategy =
  | 'NETWORK_SIMPLEX'
  | 'LONGEST_PATH'
  | 'INTERACTIVE'
  | 'STRETCH_WIDTH'
  | 'MIN_WIDTH';

/**
 * ELK edge routing strategy
 */
export type ELKEdgeRouting = 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES' | 'UNDEFINED';

/**
 * Parameters for ELK-based layouts
 */
export interface ELKLayoutParameters {
  /** Layout algorithm */
  algorithm: ELKAlgorithm;
  /** Layout direction */
  direction: ELKDirection;
  /** Node spacing (range: 20-150, step: 10) */
  spacing: number;
  /** Layering strategy for layered algorithm */
  layering: ELKLayeringStrategy;
  /** Node-edge spacing (range: 10-80, step: 5) */
  edgeNodeSpacing: number;
  /** Edge-edge spacing (range: 5-50, step: 5) */
  edgeSpacing: number;
  /** Aspect ratio target (range: 0.5-3.0, step: 0.1) */
  aspectRatio: number;
  /** Enable orthogonal edge routing */
  orthogonalRouting: boolean;
  /** Edge routing strategy */
  edgeRouting: ELKEdgeRouting;
}

/**
 * Parameter ranges for ELK layout
 */
export const ELK_PARAMETER_RANGES: {
  algorithm: DiscreteParameterRange<ELKAlgorithm>;
  direction: DiscreteParameterRange<ELKDirection>;
  spacing: NumericParameterRange;
  layering: DiscreteParameterRange<ELKLayeringStrategy>;
  edgeNodeSpacing: NumericParameterRange;
  edgeSpacing: NumericParameterRange;
  aspectRatio: NumericParameterRange;
  orthogonalRouting: BooleanParameterRange;
  edgeRouting: DiscreteParameterRange<ELKEdgeRouting>;
} = {
  algorithm: {
    values: ['layered', 'force', 'stress', 'box'] as const,
    default: 'layered',
  },
  direction: {
    values: ['RIGHT', 'DOWN', 'LEFT', 'UP'] as const,
    default: 'DOWN',
  },
  spacing: { min: 20, max: 150, step: 10, default: 50 },
  layering: {
    values: ['NETWORK_SIMPLEX', 'LONGEST_PATH', 'INTERACTIVE', 'STRETCH_WIDTH', 'MIN_WIDTH'] as const,
    default: 'NETWORK_SIMPLEX',
  },
  edgeNodeSpacing: { min: 10, max: 80, step: 5, default: 20 },
  edgeSpacing: { min: 5, max: 50, step: 5, default: 10 },
  aspectRatio: { min: 0.5, max: 3.0, step: 0.1, default: 1.6 },
  orthogonalRouting: { default: false },
  edgeRouting: {
    values: ['ORTHOGONAL', 'POLYLINE', 'SPLINES', 'UNDEFINED'] as const,
    default: 'UNDEFINED',
  },
};

/**
 * Default ELK layout parameters
 */
export const DEFAULT_ELK_PARAMETERS: ELKLayoutParameters = {
  algorithm: ELK_PARAMETER_RANGES.algorithm.default,
  direction: ELK_PARAMETER_RANGES.direction.default,
  spacing: ELK_PARAMETER_RANGES.spacing.default,
  layering: ELK_PARAMETER_RANGES.layering.default,
  edgeNodeSpacing: ELK_PARAMETER_RANGES.edgeNodeSpacing.default,
  edgeSpacing: ELK_PARAMETER_RANGES.edgeSpacing.default,
  aspectRatio: ELK_PARAMETER_RANGES.aspectRatio.default,
  orthogonalRouting: ELK_PARAMETER_RANGES.orthogonalRouting.default,
  edgeRouting: ELK_PARAMETER_RANGES.edgeRouting.default,
};

// ============================================================================
// Graphviz Layout Types
// ============================================================================

/**
 * Graphviz algorithm options
 */
export type GraphvizAlgorithm = 'dot' | 'neato' | 'fdp' | 'circo' | 'twopi';

/**
 * Graphviz rank direction
 */
export type GraphvizRankDir = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Graphviz spline types
 */
export type GraphvizSplines = 'none' | 'line' | 'polyline' | 'curved' | 'ortho' | 'spline';

/**
 * Parameters for Graphviz-based layouts
 */
export interface GraphvizLayoutParameters {
  /** Layout algorithm */
  algorithm: GraphvizAlgorithm;
  /** Rank direction (for dot algorithm) */
  rankdir: GraphvizRankDir;
  /** Node separation in inches (range: 0.1-3.0, step: 0.1) */
  nodesep: number;
  /** Rank separation in inches (range: 0.2-5.0, step: 0.2) */
  ranksep: number;
  /** Spline edge routing type */
  splines: GraphvizSplines;
  /** Graph margin in inches (range: 0.0-1.0, step: 0.1) */
  margin: number;
}

/**
 * Parameter ranges for Graphviz layout
 */
export const GRAPHVIZ_PARAMETER_RANGES: {
  algorithm: DiscreteParameterRange<GraphvizAlgorithm>;
  rankdir: DiscreteParameterRange<GraphvizRankDir>;
  nodesep: NumericParameterRange;
  ranksep: NumericParameterRange;
  splines: DiscreteParameterRange<GraphvizSplines>;
  margin: NumericParameterRange;
} = {
  algorithm: {
    values: ['dot', 'neato', 'fdp', 'circo', 'twopi'] as const,
    default: 'dot',
  },
  rankdir: {
    values: ['TB', 'LR', 'BT', 'RL'] as const,
    default: 'TB',
  },
  nodesep: { min: 0.1, max: 3.0, step: 0.1, default: 0.5 },
  ranksep: { min: 0.2, max: 5.0, step: 0.2, default: 1.0 },
  splines: {
    values: ['none', 'line', 'polyline', 'curved', 'ortho', 'spline'] as const,
    default: 'spline',
  },
  margin: { min: 0.0, max: 1.0, step: 0.1, default: 0.2 },
};

/**
 * Default Graphviz layout parameters
 */
export const DEFAULT_GRAPHVIZ_PARAMETERS: GraphvizLayoutParameters = {
  algorithm: GRAPHVIZ_PARAMETER_RANGES.algorithm.default,
  rankdir: GRAPHVIZ_PARAMETER_RANGES.rankdir.default,
  nodesep: GRAPHVIZ_PARAMETER_RANGES.nodesep.default,
  ranksep: GRAPHVIZ_PARAMETER_RANGES.ranksep.default,
  splines: GRAPHVIZ_PARAMETER_RANGES.splines.default,
  margin: GRAPHVIZ_PARAMETER_RANGES.margin.default,
};

// ============================================================================
// Other Layout Parameter Types (kept for reference)
// ============================================================================

/**
 * Direction options for hierarchical layout
 */
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Union type for all layout parameters
 */
export type LayoutParameters = ELKLayoutParameters | GraphvizLayoutParameters;
