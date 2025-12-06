/**
 * Automated Refinement Loop Service
 *
 * Orchestrates iterative layout optimization by:
 * 1. Applying layout parameters
 * 2. Capturing screenshots and calculating quality scores
 * 3. Adjusting parameters using optimization strategies
 * 4. Early stopping when targets are reached or improvement plateaus
 *
 * @remarks
 * This service integrates:
 * - Layout parameters from layoutParameters.ts
 * - Optimization strategies from optimizationStrategies.ts
 * - Quality scoring from qualityScoreService.ts
 * - Readability metrics from graphReadabilityService.ts
 */

import { Node, Edge } from '@xyflow/react';
import {
  DiagramType,
  LayoutParameters,
  getDefaultParameters,
  validateParameters,
} from './layoutParameters';
import {
  OptimizationStrategy,
  OptimizationConfig,
  StrategyType,
  createStrategy,
} from './optimizationStrategies';
import {
  calculateReadabilityOnlyScore,
} from '../comparison/qualityScoreService';
import { LayoutType } from '../metrics/graphReadabilityService';

/**
 * Configuration for the refinement loop
 */
export interface RefinementConfig {
  /** Maximum number of refinement iterations */
  maxIterations: number;
  /** Target combined score to achieve (0-1, default: 0.9) */
  targetScore: number;
  /** Number of iterations without improvement before stopping */
  plateauThreshold: number;
  /** Minimum improvement percentage to not count as plateau */
  minImprovementPercent: number;
  /** Diagram type being optimized */
  diagramType: DiagramType;
  /** Layout algorithm type for scoring */
  layoutType: LayoutType;
  /** Optimization strategy to use */
  strategyType: StrategyType;
  /** Strategy-specific configuration */
  strategyConfig?: Partial<OptimizationConfig>;
  /** Enable verbose logging */
  verbose?: boolean;
  /** Maximum consecutive errors before stopping (default: 3) */
  maxConsecutiveErrors?: number;
  /**
   * Maximum history size to retain (default: unlimited)
   * When set, only the most recent N iterations plus all "best" iterations are kept
   * to limit memory usage during long-running refinements.
   */
  maxHistorySize?: number;
}

/**
 * Default refinement configuration
 */
export const DEFAULT_REFINEMENT_CONFIG: RefinementConfig = {
  maxIterations: 50,
  targetScore: 0.9,
  plateauThreshold: 5,
  minImprovementPercent: 1.0,
  diagramType: 'motivation',
  layoutType: 'force-directed',
  strategyType: 'random',
  verbose: false,
  maxConsecutiveErrors: 3,
};

/**
 * Single iteration record in refinement history
 */
export interface RefinementIteration {
  /** Iteration number (1-indexed) */
  iteration: number;
  /** Parameters used in this iteration */
  parameters: LayoutParameters;
  /** Quality score achieved */
  score: number;
  /** Score breakdown */
  breakdown: {
    readabilityScore: number;
    similarityScore?: number;
  };
  /** Whether this was the best score so far */
  isBest: boolean;
  /** Improvement from previous best (percentage) */
  improvementPercent: number;
  /** Time taken for this iteration (ms) */
  durationMs: number;
  /** ISO timestamp */
  timestamp: string;
}

/**
 * Complete refinement result
 */
export interface RefinementResult {
  /** Whether refinement was successful (met target or improved) */
  success: boolean;
  /** Reason for completion */
  completionReason: 'target_reached' | 'max_iterations' | 'plateau' | 'cancelled' | 'error';
  /** Best parameters found */
  bestParameters: LayoutParameters;
  /** Best score achieved */
  bestScore: number;
  /** Full iteration history */
  history: RefinementIteration[];
  /** Summary statistics */
  summary: {
    totalIterations: number;
    totalDurationMs: number;
    startScore: number;
    endScore: number;
    improvementPercent: number;
    strategySwitches: number;
  };
  /** ISO timestamp of completion */
  timestamp: string;
  /** Any errors encountered */
  errors: string[];
}

/**
 * Callback for layout application
 * Should apply the parameters and return positioned nodes/edges
 */
export type LayoutApplicator = (
  params: LayoutParameters
) => Promise<{ nodes: Node[]; edges: Edge[] }>;

/**
 * Progress callback for UI updates
 */
export type ProgressCallback = (
  iteration: number,
  maxIterations: number,
  currentScore: number,
  bestScore: number,
  status: string
) => void;

/**
 * Refinement loop state for cancellation
 */
interface RefinementState {
  cancelled: boolean;
}

/**
 * Automated Layout Refinement Loop
 *
 * Iteratively improves layout quality by exploring parameter space
 * using configurable optimization strategies.
 */
export class RefinementLoop {
  private config: RefinementConfig;
  private strategy: OptimizationStrategy;
  private state: RefinementState;
  private history: RefinementIteration[];
  private bestResult: RefinementIteration | null;

  constructor(config: Partial<RefinementConfig> = {}) {
    this.config = { ...DEFAULT_REFINEMENT_CONFIG, ...config };
    this.strategy = createStrategy(this.config.strategyType);
    this.state = { cancelled: false };
    this.history = [];
    this.bestResult = null;
  }

  /**
   * Update configuration
   */
  setConfig(config: Partial<RefinementConfig>): void {
    this.config = { ...this.config, ...config };

    // Recreate strategy if type changed
    if (config.strategyType && config.strategyType !== this.config.strategyType) {
      this.strategy = createStrategy(config.strategyType);
    }
  }

  /**
   * Cancel an ongoing refinement
   */
  cancel(): void {
    this.state.cancelled = true;
  }

  /**
   * Reset the refinement loop state
   */
  reset(): void {
    this.state = { cancelled: false };
    this.history = [];
    this.bestResult = null;
    this.strategy.reset();
  }

  /**
   * Trim history to configured maximum size, preserving "best" iterations
   */
  private trimHistory(): void {
    const maxSize = this.config.maxHistorySize;
    if (!maxSize || this.history.length <= maxSize) {
      return;
    }

    // Separate best iterations from regular iterations
    const bestIterations = this.history.filter((iter) => iter.isBest);
    const regularIterations = this.history.filter((iter) => !iter.isBest);

    // Calculate how many regular iterations to keep
    const regularSlotsAvailable = Math.max(0, maxSize - bestIterations.length);

    // Keep the most recent regular iterations
    const keptRegular = regularIterations.slice(-regularSlotsAvailable);

    // Merge and sort by iteration number
    this.history = [...bestIterations, ...keptRegular].sort(
      (a, b) => a.iteration - b.iteration
    );
  }

  /**
   * Run the automated refinement loop
   *
   * @param applyLayout - Function to apply layout parameters and get nodes/edges
   * @param onProgress - Optional progress callback for UI updates
   * @returns Promise resolving to RefinementResult
   */
  async run(
    applyLayout: LayoutApplicator,
    onProgress?: ProgressCallback
  ): Promise<RefinementResult> {
    const startTime = performance.now();
    this.reset();

    const errors: string[] = [];
    let completionReason: RefinementResult['completionReason'] = 'max_iterations';
    let plateauCount = 0;
    let consecutiveErrors = 0;
    const maxConsecutiveErrors = this.config.maxConsecutiveErrors ?? 3;

    // Initialize strategy with config
    const strategyConfig: OptimizationConfig = {
      maxIterations: this.config.maxIterations,
      targetScore: this.config.targetScore,
      plateauThreshold: this.config.plateauThreshold,
      minImprovementPercent: this.config.minImprovementPercent,
      diagramType: this.config.diagramType,
      ...this.config.strategyConfig,
    };
    this.strategy.initialize(strategyConfig);

    // Get initial parameters (defaults)
    let startScore = 0;
    const initialParams = getDefaultParameters(this.config.diagramType);

    try {
      // Evaluate initial parameters
      const initialResult = await this.evaluateParameters(
        initialParams,
        0,
        applyLayout
      );
      startScore = initialResult.score;

      this.history.push(initialResult);
      this.bestResult = initialResult;

      if (this.config.verbose) {
        console.log(
          `[RefinementLoop] Initial score: ${startScore.toFixed(4)} with default parameters`
        );
      }

      onProgress?.(0, this.config.maxIterations, startScore, startScore, 'Starting refinement');

      // Check if initial score meets target
      if (startScore >= this.config.targetScore) {
        completionReason = 'target_reached';
        if (this.config.verbose) {
          console.log(`[RefinementLoop] Target already met with initial parameters`);
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(`Initial evaluation failed: ${errorMessage}`);

      return this.buildResult(
        'error',
        initialParams,
        0,
        startTime,
        0,
        errors
      );
    }

    // Main refinement loop
    for (let iteration = 1; iteration <= this.config.maxIterations; iteration++) {
      // Check for cancellation
      if (this.state.cancelled) {
        completionReason = 'cancelled';
        break;
      }

      // Check if target already reached
      if (this.bestResult && this.bestResult.score >= this.config.targetScore) {
        completionReason = 'target_reached';
        break;
      }

      // Check plateau condition
      if (plateauCount >= this.config.plateauThreshold) {
        completionReason = 'plateau';
        if (this.config.verbose) {
          console.log(
            `[RefinementLoop] Stopping due to plateau (${plateauCount} iterations without improvement)`
          );
        }
        break;
      }

      // Get next parameters from strategy
      const nextParams = this.strategy.getNextParameters();
      if (!nextParams) {
        if (this.config.verbose) {
          console.log(`[RefinementLoop] Strategy exhausted parameter space`);
        }
        break;
      }

      // Validate parameters
      const validation = validateParameters(nextParams, this.config.diagramType);
      if (!validation.valid) {
        if (this.config.verbose) {
          console.warn(
            `[RefinementLoop] Invalid parameters at iteration ${iteration}:`,
            validation.errors
          );
        }
        errors.push(`Iteration ${iteration}: ${validation.errors.join(', ')}`);
        continue;
      }

      try {
        // Evaluate parameters
        const iterationStart = performance.now();
        const result = await this.evaluateParameters(nextParams, iteration, applyLayout);
        result.durationMs = performance.now() - iterationStart;

        // Determine if this is an improvement
        const previousBestScore = this.bestResult?.score ?? 0;
        const improvementPercent =
          previousBestScore > 0
            ? ((result.score - previousBestScore) / previousBestScore) * 100
            : 0;

        result.improvementPercent = improvementPercent;

        // Check if this is the new best
        if (result.score > previousBestScore) {
          result.isBest = true;
          this.bestResult = result;
          plateauCount = 0;

          if (this.config.verbose) {
            console.log(
              `[RefinementLoop] New best at iteration ${iteration}: ${result.score.toFixed(4)} (+${improvementPercent.toFixed(2)}%)`
            );
          }
        } else {
          // Check for plateau
          if (improvementPercent < this.config.minImprovementPercent) {
            plateauCount++;
          }
        }

        // Update strategy with result
        this.strategy.updateWithResult({
          parameters: nextParams,
          score: result.score,
          breakdown: result.breakdown,
          evaluationTimeMs: result.durationMs,
          iteration,
        });

        // Add to history and trim if needed
        this.history.push(result);
        this.trimHistory();

        // Progress callback
        onProgress?.(
          iteration,
          this.config.maxIterations,
          result.score,
          this.bestResult?.score ?? 0,
          result.isBest ? 'Found improvement' : 'Exploring'
        );

        // Check if target reached
        if (result.score >= this.config.targetScore) {
          completionReason = 'target_reached';
          if (this.config.verbose) {
            console.log(
              `[RefinementLoop] Target score reached at iteration ${iteration}`
            );
          }
          break;
        }
        // Reset consecutive error count on success
        consecutiveErrors = 0;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`Iteration ${iteration}: ${errorMessage}`);
        consecutiveErrors++;

        if (this.config.verbose) {
          console.error(`[RefinementLoop] Error at iteration ${iteration}:`, errorMessage);
        }

        // Check if consecutive error threshold reached
        if (consecutiveErrors >= maxConsecutiveErrors) {
          completionReason = 'error';
          if (this.config.verbose) {
            console.error(
              `[RefinementLoop] Stopping due to ${consecutiveErrors} consecutive errors`
            );
          }
          break;
        }
      }
    }

    const totalDuration = performance.now() - startTime;

    return this.buildResult(
      completionReason,
      this.bestResult?.parameters ?? initialParams,
      startScore,
      startTime,
      totalDuration,
      errors
    );
  }

  /**
   * Evaluate a single parameter configuration
   */
  private async evaluateParameters(
    params: LayoutParameters,
    iteration: number,
    applyLayout: LayoutApplicator
  ): Promise<RefinementIteration> {
    const startTime = performance.now();

    // Apply layout with parameters
    const { nodes, edges } = await applyLayout(params);

    // Calculate quality score
    const score = calculateReadabilityOnlyScore(
      nodes,
      edges,
      this.config.layoutType,
      this.config.diagramType
    );

    const durationMs = performance.now() - startTime;

    return {
      iteration,
      parameters: params,
      score: score.combinedScore,
      breakdown: {
        readabilityScore: score.readabilityScore,
        similarityScore: score.similarityScore,
      },
      isBest: false,
      improvementPercent: 0,
      durationMs,
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Build the final result object
   */
  private buildResult(
    completionReason: RefinementResult['completionReason'],
    bestParameters: LayoutParameters,
    startScore: number,
    _startTime: number,
    totalDuration: number,
    errors: string[]
  ): RefinementResult {
    const endScore = this.bestResult?.score ?? startScore;
    const improvementPercent =
      startScore > 0 ? ((endScore - startScore) / startScore) * 100 : 0;

    return {
      success:
        completionReason === 'target_reached' ||
        (completionReason === 'max_iterations' && endScore > startScore) ||
        (completionReason === 'plateau' && endScore > startScore),
      completionReason,
      bestParameters,
      bestScore: endScore,
      history: this.history,
      summary: {
        totalIterations: this.history.length,
        totalDurationMs: totalDuration,
        startScore,
        endScore,
        improvementPercent,
        strategySwitches: 0, // Reserved for future multi-strategy support
      },
      timestamp: new Date().toISOString(),
      errors,
    };
  }

  /**
   * Get current best result
   */
  getBestResult(): RefinementIteration | null {
    return this.bestResult;
  }

  /**
   * Get iteration history
   */
  getHistory(): RefinementIteration[] {
    return [...this.history];
  }

  /**
   * Get current configuration
   */
  getConfig(): RefinementConfig {
    return { ...this.config };
  }
}

/**
 * Convenience function to run a single refinement
 */
export async function runRefinement(
  applyLayout: LayoutApplicator,
  config: Partial<RefinementConfig> = {},
  onProgress?: ProgressCallback
): Promise<RefinementResult> {
  const loop = new RefinementLoop(config);
  return loop.run(applyLayout, onProgress);
}

/**
 * Format refinement result for logging/display
 */
export function formatRefinementResult(result: RefinementResult): string {
  const lines = [
    '=== Refinement Result ===',
    `Status: ${result.success ? '✓ Success' : '✗ Failed'} (${result.completionReason})`,
    '',
    'Summary:',
    `  Iterations: ${result.summary.totalIterations}`,
    `  Duration: ${(result.summary.totalDurationMs / 1000).toFixed(2)}s`,
    `  Start Score: ${result.summary.startScore.toFixed(4)}`,
    `  End Score: ${result.summary.endScore.toFixed(4)}`,
    `  Improvement: ${result.summary.improvementPercent.toFixed(2)}%`,
    '',
    'Best Parameters:',
    ...Object.entries(result.bestParameters).map(
      ([key, value]) => `  ${key}: ${value}`
    ),
  ];

  if (result.errors.length > 0) {
    lines.push('', 'Errors:');
    result.errors.forEach((err) => lines.push(`  - ${err}`));
  }

  return lines.join('\n');
}

/**
 * Export iteration history as JSON
 */
export function exportIterationHistory(
  result: RefinementResult
): string {
  return JSON.stringify(
    {
      summary: result.summary,
      completionReason: result.completionReason,
      bestParameters: result.bestParameters,
      bestScore: result.bestScore,
      history: result.history.map((iter) => ({
        iteration: iter.iteration,
        score: iter.score,
        isBest: iter.isBest,
        improvementPercent: iter.improvementPercent,
        durationMs: iter.durationMs,
        timestamp: iter.timestamp,
        parameters: iter.parameters,
      })),
      timestamp: result.timestamp,
    },
    null,
    2
  );
}
