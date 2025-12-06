/**
 * Layout Parameters for Automated Refinement Loop
 *
 * Defines tunable layout parameters for each diagram type with valid ranges,
 * step sizes, and default values. These parameters are optimized by the
 * refinement loop to achieve better layout quality scores.
 *
 * @remarks
 * Parameter ranges are derived from existing layout implementations:
 * - motivationLayouts.ts: force-directed and hierarchical options
 * - business layout engines: HierarchicalBusinessLayout, ForceDirectedBusinessLayout
 * - c4ViewTransformer.ts: dagre-based hierarchical layout
 */

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

/**
 * Type guard for numeric parameters
 */
export function isNumericRange(range: ParameterRange): range is NumericParameterRange {
  return 'min' in range && 'max' in range && 'step' in range;
}

/**
 * Type guard for discrete parameters
 */
export function isDiscreteRange<T extends string>(
  range: ParameterRange
): range is DiscreteParameterRange<T> {
  return 'values' in range;
}

/**
 * Type guard for boolean parameters
 */
export function isBooleanRange(range: ParameterRange): range is BooleanParameterRange {
  return !isNumericRange(range) && !isDiscreteRange(range) && 'default' in range;
}

// ============================================================================
// Motivation Layout Parameters
// ============================================================================

/**
 * Parameters for motivation diagram layouts
 * Maps to options in motivationLayouts.ts
 */
export interface MotivationLayoutParameters {
  // Force-directed layout parameters
  /** Number of simulation iterations (range: 50-300, step: 25) */
  iterations: number;
  /** Center force strength (range: 0.05-0.3, step: 0.05) */
  centerForce: number;
  /** Target distance between linked nodes (range: 100-300, step: 20) */
  linkDistance: number;
  /** Repulsion strength between all nodes (range: -800 to -200, step: 50) */
  chargeStrength: number;

  // Hierarchical layout parameters
  /** Horizontal spacing between sibling nodes (range: 40-150, step: 10) */
  nodesep: number;
  /** Vertical spacing between hierarchy levels (range: 80-200, step: 20) */
  ranksep: number;
}

/**
 * Parameter ranges for motivation layout
 */
export const MOTIVATION_PARAMETER_RANGES: Record<
  keyof MotivationLayoutParameters,
  NumericParameterRange
> = {
  iterations: { min: 50, max: 300, step: 25, default: 150 },
  centerForce: { min: 0.05, max: 0.3, step: 0.05, default: 0.1 },
  linkDistance: { min: 100, max: 300, step: 20, default: 200 },
  chargeStrength: { min: -800, max: -200, step: 50, default: -500 },
  nodesep: { min: 40, max: 150, step: 10, default: 80 },
  ranksep: { min: 80, max: 200, step: 20, default: 120 },
};

/**
 * Default motivation layout parameters
 */
export const DEFAULT_MOTIVATION_PARAMETERS: MotivationLayoutParameters = {
  iterations: MOTIVATION_PARAMETER_RANGES.iterations.default,
  centerForce: MOTIVATION_PARAMETER_RANGES.centerForce.default,
  linkDistance: MOTIVATION_PARAMETER_RANGES.linkDistance.default,
  chargeStrength: MOTIVATION_PARAMETER_RANGES.chargeStrength.default,
  nodesep: MOTIVATION_PARAMETER_RANGES.nodesep.default,
  ranksep: MOTIVATION_PARAMETER_RANGES.ranksep.default,
};

// ============================================================================
// Business Layout Parameters
// ============================================================================

/**
 * Direction options for hierarchical layout
 */
export type LayoutDirection = 'TB' | 'LR' | 'BT' | 'RL';

/**
 * Parameters for business diagram layouts
 * Maps to options in business layout engines
 */
export interface BusinessLayoutParameters {
  // Dagre hierarchical parameters
  /** Flow direction: top-bottom, left-right, etc. */
  rankdir: LayoutDirection;
  /** Horizontal spacing between nodes in same rank (range: 40-150, step: 10) */
  nodesep: number;
  /** Vertical spacing between ranks (range: 80-200, step: 20) */
  ranksep: number;

  // Swimlane parameters
  /** Spacing between swimlanes (range: 150-400, step: 25) */
  laneSpacing: number;

  // Force-directed parameters
  /** Repulsion strength (range: -500 to -100, step: 50) */
  chargeStrength: number;
  /** Base link distance (range: 80-200, step: 15) */
  linkDistance: number;

  // Collision parameters
  /** Additional padding around nodes for collision (range: 10-40, step: 5) */
  collisionPadding: number;
}

/**
 * Parameter ranges for business layout
 */
export const BUSINESS_PARAMETER_RANGES: {
  rankdir: DiscreteParameterRange<LayoutDirection>;
  nodesep: NumericParameterRange;
  ranksep: NumericParameterRange;
  laneSpacing: NumericParameterRange;
  chargeStrength: NumericParameterRange;
  linkDistance: NumericParameterRange;
  collisionPadding: NumericParameterRange;
} = {
  rankdir: {
    values: ['TB', 'LR', 'BT', 'RL'] as const,
    default: 'TB',
  },
  nodesep: { min: 40, max: 150, step: 10, default: 80 },
  ranksep: { min: 80, max: 200, step: 20, default: 120 },
  laneSpacing: { min: 150, max: 400, step: 25, default: 200 },
  chargeStrength: { min: -500, max: -100, step: 50, default: -300 },
  linkDistance: { min: 80, max: 200, step: 15, default: 150 },
  collisionPadding: { min: 10, max: 40, step: 5, default: 20 },
};

/**
 * Default business layout parameters
 */
export const DEFAULT_BUSINESS_PARAMETERS: BusinessLayoutParameters = {
  rankdir: BUSINESS_PARAMETER_RANGES.rankdir.default,
  nodesep: BUSINESS_PARAMETER_RANGES.nodesep.default,
  ranksep: BUSINESS_PARAMETER_RANGES.ranksep.default,
  laneSpacing: BUSINESS_PARAMETER_RANGES.laneSpacing.default,
  chargeStrength: BUSINESS_PARAMETER_RANGES.chargeStrength.default,
  linkDistance: BUSINESS_PARAMETER_RANGES.linkDistance.default,
  collisionPadding: BUSINESS_PARAMETER_RANGES.collisionPadding.default,
};

// ============================================================================
// C4 Layout Parameters
// ============================================================================

/**
 * Parameters for C4 diagram layouts
 * Maps to options in c4ViewTransformer.ts
 */
export interface C4LayoutParameters {
  // Dagre hierarchical parameters
  /** Flow direction */
  rankdir: LayoutDirection;
  /** Horizontal spacing between containers (range: 60-150, step: 15) */
  nodesep: number;
  /** Vertical spacing between ranks (range: 100-250, step: 25) */
  ranksep: number;

  // System boundary parameters
  /** Padding inside system boundary boxes (range: 20-80, step: 10) */
  boundaryPadding: number;

  // External system positioning
  /** Distance of external systems from main group (range: 100-300, step: 25) */
  externalSystemDistance: number;

  // Edge bundling
  /** Whether to bundle multiple edges between same nodes */
  edgeBundling: boolean;
}

/**
 * Parameter ranges for C4 layout
 */
export const C4_PARAMETER_RANGES: {
  rankdir: DiscreteParameterRange<LayoutDirection>;
  nodesep: NumericParameterRange;
  ranksep: NumericParameterRange;
  boundaryPadding: NumericParameterRange;
  externalSystemDistance: NumericParameterRange;
  edgeBundling: BooleanParameterRange;
} = {
  rankdir: {
    values: ['TB', 'LR', 'BT', 'RL'] as const,
    default: 'TB',
  },
  nodesep: { min: 60, max: 150, step: 15, default: 80 },
  ranksep: { min: 100, max: 250, step: 25, default: 150 },
  boundaryPadding: { min: 20, max: 80, step: 10, default: 40 },
  externalSystemDistance: { min: 100, max: 300, step: 25, default: 150 },
  edgeBundling: { default: true },
};

/**
 * Default C4 layout parameters
 */
export const DEFAULT_C4_PARAMETERS: C4LayoutParameters = {
  rankdir: C4_PARAMETER_RANGES.rankdir.default,
  nodesep: C4_PARAMETER_RANGES.nodesep.default,
  ranksep: C4_PARAMETER_RANGES.ranksep.default,
  boundaryPadding: C4_PARAMETER_RANGES.boundaryPadding.default,
  externalSystemDistance: C4_PARAMETER_RANGES.externalSystemDistance.default,
  edgeBundling: C4_PARAMETER_RANGES.edgeBundling.default,
};

// ============================================================================
// Unified Parameter Types
// ============================================================================

/**
 * Supported diagram types for refinement
 */
export type DiagramType = 'motivation' | 'business' | 'c4';

/**
 * Union type for all layout parameters
 */
export type LayoutParameters =
  | MotivationLayoutParameters
  | BusinessLayoutParameters
  | C4LayoutParameters;

/**
 * Get default parameters for a diagram type
 */
export function getDefaultParameters(diagramType: DiagramType): LayoutParameters {
  switch (diagramType) {
    case 'motivation':
      return { ...DEFAULT_MOTIVATION_PARAMETERS };
    case 'business':
      return { ...DEFAULT_BUSINESS_PARAMETERS };
    case 'c4':
      return { ...DEFAULT_C4_PARAMETERS };
  }
}

/**
 * Get parameter ranges for a diagram type
 */
export function getParameterRanges(
  diagramType: DiagramType
): Record<string, ParameterRange> {
  switch (diagramType) {
    case 'motivation':
      return MOTIVATION_PARAMETER_RANGES;
    case 'business':
      return BUSINESS_PARAMETER_RANGES;
    case 'c4':
      return C4_PARAMETER_RANGES;
  }
}

/**
 * Validate that parameters are within their defined ranges
 */
export function validateParameters(
  params: LayoutParameters,
  diagramType: DiagramType
): { valid: boolean; errors: string[] } {
  const ranges = getParameterRanges(diagramType);
  const errors: string[] = [];

  for (const [key, value] of Object.entries(params)) {
    const range = ranges[key];
    if (!range) {
      errors.push(`Unknown parameter: ${key}`);
      continue;
    }

    if (isNumericRange(range)) {
      if (typeof value !== 'number') {
        errors.push(`Parameter ${key} must be a number`);
      } else if (value < range.min || value > range.max) {
        errors.push(
          `Parameter ${key} (${value}) is out of range [${range.min}, ${range.max}]`
        );
      }
    } else if (isDiscreteRange(range)) {
      if (!range.values.includes(value as string)) {
        errors.push(
          `Parameter ${key} (${value}) must be one of: ${range.values.join(', ')}`
        );
      }
    } else if (isBooleanRange(range)) {
      if (typeof value !== 'boolean') {
        errors.push(`Parameter ${key} must be a boolean`);
      }
    }
  }

  return { valid: errors.length === 0, errors };
}

/**
 * Clamp a numeric value to its valid range
 */
export function clampToRange(value: number, range: NumericParameterRange): number {
  return Math.max(range.min, Math.min(range.max, value));
}

/**
 * Round a numeric value to the nearest step
 */
export function roundToStep(value: number, range: NumericParameterRange): number {
  const steps = Math.round((value - range.min) / range.step);
  return range.min + steps * range.step;
}

/**
 * Normalize a numeric value to [0, 1] within its range
 */
export function normalizeValue(value: number, range: NumericParameterRange): number {
  return (value - range.min) / (range.max - range.min);
}

/**
 * Denormalize a [0, 1] value to the parameter range
 */
export function denormalizeValue(
  normalizedValue: number,
  range: NumericParameterRange
): number {
  const value = range.min + normalizedValue * (range.max - range.min);
  return roundToStep(clampToRange(value, range), range);
}

/**
 * Calculate the number of discrete values in a numeric range
 */
export function getNumericRangeSize(range: NumericParameterRange): number {
  return Math.floor((range.max - range.min) / range.step) + 1;
}

/**
 * Get all possible values for a numeric range
 */
export function getNumericRangeValues(range: NumericParameterRange): number[] {
  const values: number[] = [];
  for (let v = range.min; v <= range.max; v += range.step) {
    values.push(Math.round(v * 1000) / 1000); // Round to avoid floating point issues
  }
  return values;
}

/**
 * Calculate total parameter space size for a diagram type
 */
export function calculateParameterSpaceSize(diagramType: DiagramType): number {
  const ranges = getParameterRanges(diagramType);
  let size = 1;

  for (const range of Object.values(ranges)) {
    if (isNumericRange(range)) {
      size *= getNumericRangeSize(range);
    } else if (isDiscreteRange(range)) {
      size *= range.values.length;
    } else if (isBooleanRange(range)) {
      size *= 2;
    }
  }

  return size;
}

/**
 * Generate a random parameter set within valid ranges
 */
export function generateRandomParameters<T extends DiagramType>(
  diagramType: T
): T extends 'motivation'
  ? MotivationLayoutParameters
  : T extends 'business'
    ? BusinessLayoutParameters
    : C4LayoutParameters {
  const ranges = getParameterRanges(diagramType);
  const params: Record<string, number | string | boolean> = {};

  for (const [key, range] of Object.entries(ranges)) {
    if (isNumericRange(range)) {
      // Random value within range, snapped to step
      const normalizedRandom = Math.random();
      params[key] = denormalizeValue(normalizedRandom, range);
    } else if (isDiscreteRange(range)) {
      // Random choice from values
      const randomIndex = Math.floor(Math.random() * range.values.length);
      params[key] = range.values[randomIndex];
    } else if (isBooleanRange(range)) {
      // Random boolean
      params[key] = Math.random() < 0.5;
    }
  }

  // Type assertion via unknown is safe here because we've populated all keys from the ranges
  // which correspond to the diagram type's parameter interface
  return params as unknown as ReturnType<typeof generateRandomParameters<T>>;
}

/**
 * Perturb parameters by a small amount for local search
 *
 * @param params - Current parameters
 * @param diagramType - Diagram type for range lookup
 * @param stepMultiplier - How many steps to move (default: 1)
 * @param perturbProbability - Probability of perturbing each parameter (default: 0.3)
 */
export function perturbParameters<T extends LayoutParameters>(
  params: T,
  diagramType: DiagramType,
  stepMultiplier: number = 1,
  perturbProbability: number = 0.3
): T {
  const ranges = getParameterRanges(diagramType);
  const newParams: Record<string, number | string | boolean> = { ...params };

  for (const [key, range] of Object.entries(ranges)) {
    if (Math.random() > perturbProbability) {
      continue; // Don't perturb this parameter
    }

    const currentValue = newParams[key];

    if (isNumericRange(range) && typeof currentValue === 'number') {
      // Move by stepMultiplier steps in random direction
      const direction = Math.random() < 0.5 ? -1 : 1;
      const delta = direction * stepMultiplier * range.step;
      const newValue = clampToRange(currentValue + delta, range);
      newParams[key] = roundToStep(newValue, range);
    } else if (isDiscreteRange(range) && typeof currentValue === 'string') {
      // Random switch to different value
      const currentIndex = range.values.indexOf(currentValue);
      const otherValues = range.values.filter((_, i) => i !== currentIndex);
      if (otherValues.length > 0) {
        const randomIndex = Math.floor(Math.random() * otherValues.length);
        newParams[key] = otherValues[randomIndex];
      }
    } else if (isBooleanRange(range) && typeof currentValue === 'boolean') {
      // Flip boolean
      newParams[key] = !currentValue;
    }
  }

  // Type assertion via unknown is safe because we started with a copy of params
  // and only modified values within their valid ranges
  return newParams as unknown as T;
}
