/**
 * Optimization Strategies for Layout Refinement
 *
 * Implements gradient-free optimization methods for finding optimal layout parameters.
 * Supports grid search for systematic exploration and random search for efficient sampling.
 */

import {
  DiagramType,
  LayoutParameters,
  getParameterRanges,
  getDefaultParameters,
  generateRandomParameters,
  perturbParameters,
  isNumericRange,
  isDiscreteRange,
  isBooleanRange,
  getNumericRangeValues,
  calculateParameterSpaceSize,
} from './layoutParameters';

/**
 * Result of evaluating a parameter configuration
 */
export interface EvaluationResult {
  /** The parameters that were evaluated */
  parameters: LayoutParameters;
  /** Combined quality score (0-1, higher is better) */
  score: number;
  /** Breakdown of score components */
  breakdown?: {
    readabilityScore: number;
    similarityScore?: number;
  };
  /** Time taken to evaluate (ms) */
  evaluationTimeMs: number;
  /** Iteration number when this was evaluated */
  iteration: number;
}

/**
 * Configuration for optimization strategies
 */
export interface OptimizationConfig {
  /** Maximum number of iterations */
  maxIterations: number;
  /** Target score to stop early (0-1) */
  targetScore: number;
  /** Number of iterations with no improvement before stopping */
  plateauThreshold: number;
  /** Minimum improvement to not count as plateau (percentage) */
  minImprovementPercent: number;
  /** Diagram type being optimized */
  diagramType: DiagramType;
}

/**
 * Default optimization configuration
 */
export const DEFAULT_OPTIMIZATION_CONFIG: OptimizationConfig = {
  maxIterations: 50,
  targetScore: 0.9,
  plateauThreshold: 5,
  minImprovementPercent: 1.0,
  diagramType: 'motivation',
};

/**
 * Callback function type for parameter evaluation
 * This function should:
 * 1. Apply the parameters to the layout
 * 2. Calculate the quality score
 * 3. Return the result
 */
export type ParameterEvaluator = (
  params: LayoutParameters,
  iteration: number
) => Promise<EvaluationResult>;

/**
 * State of the optimization process
 */
export interface OptimizationState {
  /** Current iteration number */
  currentIteration: number;
  /** Best result found so far */
  bestResult: EvaluationResult | null;
  /** All results history */
  history: EvaluationResult[];
  /** Whether optimization has completed */
  completed: boolean;
  /** Reason for completion */
  completionReason?: 'max_iterations' | 'target_reached' | 'plateau' | 'cancelled';
  /** Number of consecutive iterations without improvement */
  plateauCount: number;
}

/**
 * Base optimization strategy interface
 */
export interface OptimizationStrategy {
  /** Strategy name */
  readonly name: string;
  /** Strategy description */
  readonly description: string;

  /**
   * Initialize the strategy
   */
  initialize(config: OptimizationConfig): void;

  /**
   * Get the next parameter set to evaluate
   * Returns null if no more parameters to try
   */
  getNextParameters(): LayoutParameters | null;

  /**
   * Update the strategy with evaluation results
   */
  updateWithResult(result: EvaluationResult): void;

  /**
   * Check if strategy has more parameters to explore
   */
  hasMoreToExplore(): boolean;

  /**
   * Reset the strategy state
   */
  reset(): void;
}

// ============================================================================
// Grid Search Strategy
// ============================================================================

/**
 * Grid Search Configuration
 */
export interface GridSearchConfig extends OptimizationConfig {
  /** Maximum number of values to sample per parameter (for large ranges) */
  maxValuesPerParameter?: number;
  /** Parameters to include in grid search (null = all) */
  parametersToOptimize?: string[];
}

/**
 * Grid Search Strategy
 *
 * Systematically explores the parameter space by generating all combinations
 * of parameter values. For large spaces, can limit the number of values per parameter.
 */
export class GridSearchStrategy implements OptimizationStrategy {
  readonly name = 'Grid Search';
  readonly description =
    'Systematically explores all parameter combinations within defined ranges';

  private config: GridSearchConfig;
  private parameterValues: Map<string, (number | string | boolean)[]>;
  private currentIndices: Map<string, number>;
  private parameterKeys: string[];
  private exhausted: boolean;
  private initialized: boolean;
  private evaluatedCount: number;
  private totalCombinations: number;

  constructor() {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG };
    this.parameterValues = new Map();
    this.currentIndices = new Map();
    this.parameterKeys = [];
    this.exhausted = false;
    this.initialized = false;
    this.evaluatedCount = 0;
    this.totalCombinations = 0;
  }

  initialize(config: GridSearchConfig): void {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.buildParameterGrid();
    this.initialized = true;
    this.exhausted = false;
    this.evaluatedCount = 0;
  }

  private buildParameterGrid(): void {
    const ranges = getParameterRanges(this.config.diagramType);
    const maxValues = this.config.maxValuesPerParameter ?? 5;
    const paramsToOptimize = this.config.parametersToOptimize;

    this.parameterValues.clear();
    this.currentIndices.clear();
    this.parameterKeys = [];

    for (const [key, range] of Object.entries(ranges)) {
      // Skip if not in optimization list (when specified)
      if (paramsToOptimize && !paramsToOptimize.includes(key)) {
        continue;
      }

      let values: (number | string | boolean)[];

      if (isNumericRange(range)) {
        const allValues = getNumericRangeValues(range);
        if (allValues.length <= maxValues) {
          values = allValues;
        } else {
          // Sample evenly from the range
          values = this.sampleEvenly(allValues, maxValues);
        }
      } else if (isDiscreteRange(range)) {
        values = [...range.values];
      } else if (isBooleanRange(range)) {
        values = [true, false];
      } else {
        continue;
      }

      this.parameterValues.set(key, values);
      this.currentIndices.set(key, 0);
      this.parameterKeys.push(key);
    }

    // Calculate total combinations
    this.totalCombinations = 1;
    this.parameterValues.forEach((values) => {
      this.totalCombinations *= values.length;
    });
  }

  private sampleEvenly<T>(array: T[], count: number): T[] {
    if (array.length <= count) return array;

    const result: T[] = [];
    const step = (array.length - 1) / (count - 1);

    for (let i = 0; i < count; i++) {
      const index = Math.round(i * step);
      result.push(array[index]);
    }

    return result;
  }

  getNextParameters(): LayoutParameters | null {
    if (!this.initialized || this.exhausted) {
      return null;
    }

    // Build current parameters from indices
    const defaults = getDefaultParameters(this.config.diagramType);
    const params: Record<string, number | string | boolean> = { ...defaults };

    for (const key of this.parameterKeys) {
      const values = this.parameterValues.get(key)!;
      const index = this.currentIndices.get(key)!;
      params[key] = values[index];
    }

    // Advance to next combination
    this.advanceIndices();

    // Type assertion via unknown is safe because we've populated all keys from the defined ranges
    return params as unknown as LayoutParameters;
  }

  private advanceIndices(): void {
    // Increment indices like an odometer
    for (let i = this.parameterKeys.length - 1; i >= 0; i--) {
      const key = this.parameterKeys[i];
      const values = this.parameterValues.get(key)!;
      const currentIndex = this.currentIndices.get(key)!;

      if (currentIndex + 1 < values.length) {
        this.currentIndices.set(key, currentIndex + 1);
        return;
      } else {
        this.currentIndices.set(key, 0);
        // Continue to carry over to next parameter
      }
    }

    // If we get here, we've exhausted all combinations
    this.exhausted = true;
  }

  updateWithResult(_result: EvaluationResult): void {
    this.evaluatedCount++;
  }

  hasMoreToExplore(): boolean {
    return this.initialized && !this.exhausted;
  }

  reset(): void {
    this.exhausted = false;
    this.evaluatedCount = 0;
    for (const key of this.parameterKeys) {
      this.currentIndices.set(key, 0);
    }
  }

  /**
   * Get the total number of combinations to explore
   */
  getTotalCombinations(): number {
    return this.totalCombinations;
  }

  /**
   * Get the number of combinations evaluated so far
   */
  getEvaluatedCount(): number {
    return this.evaluatedCount;
  }

  /**
   * Get progress as percentage
   */
  getProgress(): number {
    return this.totalCombinations > 0
      ? (this.evaluatedCount / this.totalCombinations) * 100
      : 0;
  }
}

// ============================================================================
// Random Search Strategy
// ============================================================================

/**
 * Random Search Configuration
 */
export interface RandomSearchConfig extends OptimizationConfig {
  /** Number of random samples to generate */
  numSamples?: number;
  /** Seed for reproducibility (optional) */
  seed?: number;
  /** Use local search around best found */
  useLocalSearch?: boolean;
  /** Probability of doing local search vs random sample */
  localSearchProbability?: number;
}

/**
 * Random Search Strategy
 *
 * Samples parameters randomly from the valid ranges. More efficient than
 * grid search for high-dimensional parameter spaces. Can optionally use
 * local search around the best found parameters.
 */
export class RandomSearchStrategy implements OptimizationStrategy {
  readonly name = 'Random Search';
  readonly description =
    'Efficiently samples random parameter combinations from the search space';

  private config: RandomSearchConfig;
  private samplesGenerated: number;
  private maxSamples: number;
  private bestResult: EvaluationResult | null;
  private initialized: boolean;

  constructor() {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG };
    this.samplesGenerated = 0;
    this.maxSamples = 50;
    this.bestResult = null;
    this.initialized = false;
  }

  initialize(config: RandomSearchConfig): void {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.maxSamples = config.numSamples ?? config.maxIterations;
    this.samplesGenerated = 0;
    this.bestResult = null;
    this.initialized = true;
  }

  getNextParameters(): LayoutParameters | null {
    if (!this.initialized || this.samplesGenerated >= this.maxSamples) {
      return null;
    }

    this.samplesGenerated++;

    // Decide whether to do local search or random sample
    const useLocalSearch =
      this.config.useLocalSearch &&
      this.bestResult !== null &&
      Math.random() < (this.config.localSearchProbability ?? 0.3);

    if (useLocalSearch && this.bestResult) {
      // Perturb the best parameters
      return perturbParameters(
        this.bestResult.parameters,
        this.config.diagramType,
        1, // step multiplier
        0.4 // perturb probability per parameter
      );
    } else {
      // Generate completely random parameters
      return generateRandomParameters(this.config.diagramType);
    }
  }

  updateWithResult(result: EvaluationResult): void {
    if (!this.bestResult || result.score > this.bestResult.score) {
      this.bestResult = result;
    }
  }

  hasMoreToExplore(): boolean {
    return this.initialized && this.samplesGenerated < this.maxSamples;
  }

  reset(): void {
    this.samplesGenerated = 0;
    this.bestResult = null;
  }

  /**
   * Get the best result found so far
   */
  getBestResult(): EvaluationResult | null {
    return this.bestResult;
  }

  /**
   * Get number of samples generated
   */
  getSamplesGenerated(): number {
    return this.samplesGenerated;
  }

  /**
   * Get progress as percentage
   */
  getProgress(): number {
    return this.maxSamples > 0 ? (this.samplesGenerated / this.maxSamples) * 100 : 0;
  }
}

// ============================================================================
// Hill Climbing Strategy (Local Search)
// ============================================================================

/**
 * Hill Climbing Configuration
 */
export interface HillClimbingConfig extends OptimizationConfig {
  /** Number of restarts if stuck in local optimum */
  numRestarts?: number;
  /** Number of neighbors to evaluate per iteration */
  neighborsPerIteration?: number;
  /** Step multiplier for perturbation (1 = single step) */
  stepMultiplier?: number;
}

/**
 * Hill Climbing Strategy
 *
 * Local search that iteratively moves to better neighboring solutions.
 * Includes random restarts to escape local optima.
 */
export class HillClimbingStrategy implements OptimizationStrategy {
  readonly name = 'Hill Climbing';
  readonly description =
    'Local search that iteratively improves by exploring neighboring configurations';

  private config: HillClimbingConfig;
  private currentParams: LayoutParameters | null;
  private currentScore: number;
  private neighborsEvaluated: number;
  private neighborsPerIteration: number;
  private restartsRemaining: number;
  private iterationsWithoutImprovement: number;
  private initialized: boolean;
  private pendingNeighbors: LayoutParameters[];

  constructor() {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG };
    this.currentParams = null;
    this.currentScore = -Infinity;
    this.neighborsEvaluated = 0;
    this.neighborsPerIteration = 5;
    this.restartsRemaining = 3;
    this.iterationsWithoutImprovement = 0;
    this.initialized = false;
    this.pendingNeighbors = [];
  }

  initialize(config: HillClimbingConfig): void {
    this.config = { ...DEFAULT_OPTIMIZATION_CONFIG, ...config };
    this.neighborsPerIteration = config.neighborsPerIteration ?? 5;
    this.restartsRemaining = config.numRestarts ?? 3;
    this.currentParams = null;
    this.currentScore = -Infinity;
    this.neighborsEvaluated = 0;
    this.iterationsWithoutImprovement = 0;
    this.pendingNeighbors = [];
    this.initialized = true;
  }

  getNextParameters(): LayoutParameters | null {
    if (!this.initialized) {
      return null;
    }

    // First call - start with default or random
    if (this.currentParams === null) {
      this.currentParams = getDefaultParameters(this.config.diagramType);
      return this.currentParams;
    }

    // Generate neighbors if none pending
    if (this.pendingNeighbors.length === 0) {
      this.generateNeighbors();
    }

    // Return next neighbor
    if (this.pendingNeighbors.length > 0) {
      return this.pendingNeighbors.shift()!;
    }

    // No more neighbors and stuck - try restart
    if (this.restartsRemaining > 0) {
      this.restartsRemaining--;
      this.currentParams = generateRandomParameters(this.config.diagramType);
      this.currentScore = -Infinity;
      this.iterationsWithoutImprovement = 0;
      return this.currentParams;
    }

    return null;
  }

  private generateNeighbors(): void {
    if (!this.currentParams) return;

    this.pendingNeighbors = [];
    const stepMultiplier = (this.config as HillClimbingConfig).stepMultiplier ?? 1;

    for (let i = 0; i < this.neighborsPerIteration; i++) {
      const neighbor = perturbParameters(
        this.currentParams,
        this.config.diagramType,
        stepMultiplier,
        0.5 // perturb probability
      );
      this.pendingNeighbors.push(neighbor);
    }
  }

  updateWithResult(result: EvaluationResult): void {
    this.neighborsEvaluated++;

    if (result.score > this.currentScore) {
      this.currentParams = result.parameters;
      this.currentScore = result.score;
      this.iterationsWithoutImprovement = 0;
    } else {
      this.iterationsWithoutImprovement++;
    }
  }

  hasMoreToExplore(): boolean {
    return (
      this.initialized &&
      (this.pendingNeighbors.length > 0 ||
        this.currentParams === null ||
        this.restartsRemaining > 0)
    );
  }

  reset(): void {
    this.currentParams = null;
    this.currentScore = -Infinity;
    this.neighborsEvaluated = 0;
    this.iterationsWithoutImprovement = 0;
    this.pendingNeighbors = [];
    this.restartsRemaining = (this.config as HillClimbingConfig).numRestarts ?? 3;
  }

  /**
   * Get current best parameters
   */
  getCurrentBest(): LayoutParameters | null {
    return this.currentParams;
  }

  /**
   * Get current best score
   */
  getCurrentBestScore(): number {
    return this.currentScore;
  }
}

// ============================================================================
// Factory Function
// ============================================================================

/**
 * Supported optimization strategy types
 */
export type StrategyType = 'grid' | 'random' | 'hillclimbing';

/**
 * Create an optimization strategy instance
 */
export function createStrategy(type: StrategyType): OptimizationStrategy {
  switch (type) {
    case 'grid':
      return new GridSearchStrategy();
    case 'random':
      return new RandomSearchStrategy();
    case 'hillclimbing':
      return new HillClimbingStrategy();
    default:
      throw new Error(`Unknown strategy type: ${type}`);
  }
}
