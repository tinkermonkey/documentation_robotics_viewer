/**
 * Automated Refinement Loop Services
 *
 * This module provides automated layout optimization through iterative refinement.
 * It includes:
 * - Layout parameter definitions with valid ranges
 * - Optimization strategies (grid search, random search, hill climbing)
 * - Main refinement loop with early stopping
 *
 * @example
 * ```typescript
 * import {
 *   RefinementLoop,
 *   runRefinement,
 *   formatRefinementResult,
 * } from './refinement';
 *
 * // Simple usage with convenience function
 * const result = await runRefinement(
 *   async (params) => {
 *     // Apply params to your layout engine
 *     return layoutEngine.calculate(graph, params);
 *   },
 *   {
 *     diagramType: 'motivation',
 *     layoutType: 'force-directed',
 *     maxIterations: 20,
 *     targetScore: 0.85,
 *     strategyType: 'random',
 *   },
 *   (iteration, max, current, best, status) => {
 *     console.log(`Progress: ${iteration}/${max} - ${status}`);
 *   }
 * );
 *
 * console.log(formatRefinementResult(result));
 * ```
 */

// Layout Parameters
export {
  // Types
  type NumericParameterRange,
  type DiscreteParameterRange,
  type BooleanParameterRange,
  type ParameterRange,
  type MotivationLayoutParameters,
  type BusinessLayoutParameters,
  type C4LayoutParameters,
  type LayoutParameters,
  type LayoutDirection,
  // DiagramType is not re-exported here to avoid conflict with metrics/graphReadabilityService
  // Import it directly from './refinement/layoutParameters' if needed

  // Constants
  MOTIVATION_PARAMETER_RANGES,
  BUSINESS_PARAMETER_RANGES,
  C4_PARAMETER_RANGES,
  DEFAULT_MOTIVATION_PARAMETERS,
  DEFAULT_BUSINESS_PARAMETERS,
  DEFAULT_C4_PARAMETERS,

  // Functions
  getDefaultParameters,
  getParameterRanges,
  validateParameters,
  clampToRange,
  roundToStep,
  normalizeValue,
  denormalizeValue,
  getNumericRangeSize,
  getNumericRangeValues,
  calculateParameterSpaceSize,
  generateRandomParameters,
  perturbParameters,

  // Type guards
  isNumericRange,
  isDiscreteRange,
  isBooleanRange,
} from './layoutParameters';

// Optimization Strategies
export {
  // Types
  type EvaluationResult,
  type OptimizationConfig,
  type OptimizationState,
  type OptimizationStrategy,
  type ParameterEvaluator,
  type StrategyType,
  type GridSearchConfig,
  type RandomSearchConfig,
  type HillClimbingConfig,

  // Constants
  DEFAULT_OPTIMIZATION_CONFIG,

  // Classes
  GridSearchStrategy,
  RandomSearchStrategy,
  HillClimbingStrategy,

  // Factory
  createStrategy,
} from './optimizationStrategies';

// Refinement Loop
export {
  // Types
  type RefinementConfig,
  type RefinementIteration,
  type RefinementResult,
  type LayoutApplicator,
  type ProgressCallback,

  // Constants
  DEFAULT_REFINEMENT_CONFIG,

  // Class
  RefinementLoop,

  // Functions
  runRefinement,
  formatRefinementResult,
  exportIterationHistory,
} from './refinementLoop';
