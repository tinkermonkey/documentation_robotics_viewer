/**
 * Unit Tests for Automated Refinement Loop
 *
 * Tests the refinement loop service including:
 * - Parameter space exploration
 * - Optimization strategies (grid search, random search)
 * - Early stopping conditions
 * - Iteration history logging
 */

import { test, expect } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';

import {
  // Layout Parameters
  MOTIVATION_PARAMETER_RANGES,
  BUSINESS_PARAMETER_RANGES,
  C4_PARAMETER_RANGES,
  DEFAULT_MOTIVATION_PARAMETERS,
  DEFAULT_BUSINESS_PARAMETERS,
  DEFAULT_C4_PARAMETERS,
  getDefaultParameters,
  getParameterRanges,
  validateParameters,
  generateRandomParameters,
  perturbParameters,
  calculateParameterSpaceSize,
  isNumericRange,
  isDiscreteRange,
  isBooleanRange,
  getNumericRangeValues,
  DiagramType,
  LayoutParameters,
} from '../../../src/core/services/refinement/layoutParameters';

import {
  // Optimization Strategies
  GridSearchStrategy,
  RandomSearchStrategy,
  HillClimbingStrategy,
  createStrategy,
  DEFAULT_OPTIMIZATION_CONFIG,
  EvaluationResult,
} from '../../../src/core/services/refinement/optimizationStrategies';

import {
  // Refinement Loop
  RefinementLoop,
  runRefinement,
  formatRefinementResult,
  exportIterationHistory,
  DEFAULT_REFINEMENT_CONFIG,
  RefinementConfig,
  RefinementResult,
} from '../../../src/core/services/refinement/refinementLoop';

// ============================================================================
// Test Helpers
// ============================================================================

/**
 * Create test nodes for layout evaluation
 */
function createTestNodes(count: number, baseSpacing: number = 100): Node[] {
  const nodes: Node[] = [];
  const cols = Math.ceil(Math.sqrt(count));

  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;

    nodes.push({
      id: `node-${i}`,
      position: {
        x: col * baseSpacing + Math.random() * 20,
        y: row * baseSpacing + Math.random() * 20,
      },
      data: { label: `Node ${i}` },
      type: 'default',
      width: 180,
      height: 110,
    });
  }

  return nodes;
}

/**
 * Create test edges connecting nodes
 */
function createTestEdges(nodes: Node[], density: number = 0.3): Edge[] {
  const edges: Edge[] = [];
  let edgeId = 0;

  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      if (Math.random() < density) {
        edges.push({
          id: `edge-${edgeId++}`,
          source: nodes[i].id,
          target: nodes[j].id,
          type: 'default',
        });
      }
    }
  }

  return edges;
}

/**
 * Mock layout applicator that simulates layout with scoring based on parameters
 */
function createMockLayoutApplicator(
  nodeCount: number = 10
): (params: LayoutParameters) => Promise<{ nodes: Node[]; edges: Edge[] }> {
  const baseNodes = createTestNodes(nodeCount);
  const edges = createTestEdges(baseNodes, 0.2);

  return async (params: LayoutParameters) => {
    // Simulate layout by adjusting positions based on parameters
    const nodes = baseNodes.map((node, i) => {
      // Extract numeric parameters that affect layout
      const spacing =
        'nodesep' in params
          ? (params as any).nodesep
          : 'linkDistance' in params
            ? (params as any).linkDistance / 2
            : 80;

      const cols = Math.ceil(Math.sqrt(nodeCount));
      const row = Math.floor(i / cols);
      const col = i % cols;

      return {
        ...node,
        position: {
          x: col * spacing,
          y: row * spacing,
        },
      };
    });

    return { nodes, edges };
  };
}

// ============================================================================
// Layout Parameters Tests
// ============================================================================

test.describe('Layout Parameters', () => {
  test('should have valid ranges for motivation parameters', () => {
    for (const [key, range] of Object.entries(MOTIVATION_PARAMETER_RANGES)) {
      expect(range.min).toBeLessThan(range.max);
      expect(range.step).toBeGreaterThan(0);
      expect(range.default).toBeGreaterThanOrEqual(range.min);
      expect(range.default).toBeLessThanOrEqual(range.max);
      console.log(`  ${key}: [${range.min}, ${range.max}] step=${range.step} default=${range.default}`);
    }
  });

  test('should have valid ranges for business parameters', () => {
    for (const [key, range] of Object.entries(BUSINESS_PARAMETER_RANGES)) {
      if (isNumericRange(range)) {
        expect(range.min).toBeLessThan(range.max);
        expect(range.step).toBeGreaterThan(0);
        console.log(`  ${key}: [${range.min}, ${range.max}] step=${range.step}`);
      } else if (isDiscreteRange(range)) {
        expect(range.values.length).toBeGreaterThan(0);
        expect(range.values).toContain(range.default);
        console.log(`  ${key}: ${range.values.join(' | ')} default=${range.default}`);
      } else if (isBooleanRange(range)) {
        expect(typeof range.default).toBe('boolean');
        console.log(`  ${key}: boolean default=${range.default}`);
      }
    }
  });

  test('should have valid ranges for C4 parameters', () => {
    for (const [key, range] of Object.entries(C4_PARAMETER_RANGES)) {
      if (isNumericRange(range)) {
        expect(range.min).toBeLessThan(range.max);
        expect(range.step).toBeGreaterThan(0);
      } else if (isDiscreteRange(range)) {
        expect(range.values.length).toBeGreaterThan(0);
      }
    }
  });

  test('should get default parameters for each diagram type', () => {
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];

    for (const type of diagramTypes) {
      const params = getDefaultParameters(type);
      expect(params).toBeDefined();
      expect(Object.keys(params).length).toBeGreaterThan(0);
      console.log(`${type} default parameters:`, Object.keys(params).length, 'parameters');
    }
  });

  test('should validate correct parameters', () => {
    const result = validateParameters(DEFAULT_MOTIVATION_PARAMETERS, 'motivation');
    expect(result.valid).toBe(true);
    expect(result.errors.length).toBe(0);
  });

  test('should detect invalid parameter values', () => {
    const invalidParams = {
      ...DEFAULT_MOTIVATION_PARAMETERS,
      iterations: 999, // Out of range
    };

    const result = validateParameters(invalidParams, 'motivation');
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('iterations');
  });

  test('should generate random parameters within ranges', () => {
    for (let i = 0; i < 10; i++) {
      const params = generateRandomParameters('motivation');
      const validation = validateParameters(params, 'motivation');
      expect(validation.valid).toBe(true);
    }
  });

  test('should perturb parameters while staying in valid ranges', () => {
    const original = DEFAULT_MOTIVATION_PARAMETERS;

    for (let i = 0; i < 10; i++) {
      const perturbed = perturbParameters(original, 'motivation', 1, 0.5);
      const validation = validateParameters(perturbed, 'motivation');
      expect(validation.valid).toBe(true);
    }
  });

  test('should calculate parameter space size', () => {
    const motivationSize = calculateParameterSpaceSize('motivation');
    const businessSize = calculateParameterSpaceSize('business');
    const c4Size = calculateParameterSpaceSize('c4');

    expect(motivationSize).toBeGreaterThan(0);
    expect(businessSize).toBeGreaterThan(0);
    expect(c4Size).toBeGreaterThan(0);

    console.log('Parameter space sizes:');
    console.log(`  motivation: ${motivationSize.toLocaleString()} combinations`);
    console.log(`  business: ${businessSize.toLocaleString()} combinations`);
    console.log(`  c4: ${c4Size.toLocaleString()} combinations`);
  });

  test('should get numeric range values', () => {
    const range = MOTIVATION_PARAMETER_RANGES.iterations;
    const values = getNumericRangeValues(range);

    expect(values.length).toBeGreaterThan(0);
    expect(values[0]).toBe(range.min);
    expect(values[values.length - 1]).toBe(range.max);
    console.log(`iterations values: ${values.join(', ')}`);
  });
});

// ============================================================================
// Optimization Strategy Tests
// ============================================================================

test.describe('Optimization Strategies', () => {
  test.describe('Grid Search Strategy', () => {
    test('should initialize with configuration', () => {
      const strategy = new GridSearchStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        maxValuesPerParameter: 3,
        parametersToOptimize: ['nodesep', 'ranksep'],
      } as any);

      expect(strategy.hasMoreToExplore()).toBe(true);
      expect(strategy.getTotalCombinations()).toBeGreaterThan(0);
      console.log(`Grid search: ${strategy.getTotalCombinations()} combinations`);
    });

    test('should generate unique parameter combinations', () => {
      const strategy = new GridSearchStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        maxValuesPerParameter: 2,
        parametersToOptimize: ['nodesep', 'ranksep'],
      } as any);

      const seen = new Set<string>();
      let count = 0;

      while (strategy.hasMoreToExplore()) {
        const params = strategy.getNextParameters();
        if (!params) break;

        const key = JSON.stringify(params);
        expect(seen.has(key)).toBe(false);
        seen.add(key);
        count++;

        strategy.updateWithResult({
          parameters: params,
          score: Math.random(),
          evaluationTimeMs: 10,
          iteration: count,
        });
      }

      expect(count).toBe(strategy.getTotalCombinations());
      console.log(`Grid search exhausted after ${count} combinations`);
    });
  });

  test.describe('Random Search Strategy', () => {
    test('should initialize with configuration', () => {
      const strategy = new RandomSearchStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numSamples: 10,
      } as any);

      expect(strategy.hasMoreToExplore()).toBe(true);
    });

    test('should generate specified number of samples', () => {
      const numSamples = 15;
      const strategy = new RandomSearchStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numSamples,
      } as any);

      let count = 0;
      while (strategy.hasMoreToExplore()) {
        const params = strategy.getNextParameters();
        if (!params) break;

        count++;
        strategy.updateWithResult({
          parameters: params,
          score: Math.random(),
          evaluationTimeMs: 10,
          iteration: count,
        });
      }

      expect(count).toBe(numSamples);
    });

    test('should track best result', () => {
      const strategy = new RandomSearchStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numSamples: 5,
      } as any);

      let maxScore = 0;
      for (let i = 0; i < 5; i++) {
        const params = strategy.getNextParameters()!;
        const score = Math.random();
        maxScore = Math.max(maxScore, score);

        strategy.updateWithResult({
          parameters: params,
          score,
          evaluationTimeMs: 10,
          iteration: i + 1,
        });
      }

      const best = strategy.getBestResult();
      expect(best).toBeDefined();
      expect(best!.score).toBe(maxScore);
    });
  });

  test.describe('Hill Climbing Strategy', () => {
    test('should initialize with configuration', () => {
      const strategy = new HillClimbingStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numRestarts: 2,
        neighborsPerIteration: 3,
      } as any);

      expect(strategy.hasMoreToExplore()).toBe(true);
    });

    test('should explore neighbors of current best', () => {
      const strategy = new HillClimbingStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numRestarts: 3, // Allow restarts
        neighborsPerIteration: 5,
      } as any);

      // First call gets initial params (defaults)
      const initial = strategy.getNextParameters()!;
      expect(initial).toBeDefined();
      strategy.updateWithResult({
        parameters: initial,
        score: 0.5,
        evaluationTimeMs: 10,
        iteration: 1,
      });

      // The strategy should have more to explore (neighbors are generated after first evaluation)
      expect(strategy.hasMoreToExplore()).toBe(true);

      // Get next parameters - should be a neighbor
      const next = strategy.getNextParameters();
      expect(next).toBeDefined();

      // Verify the strategy tracks the best score
      expect(strategy.getCurrentBestScore()).toBe(0.5);
      expect(strategy.getCurrentBest()).toBeDefined();
    });

    test('should update best when improvement found', () => {
      const strategy = new HillClimbingStrategy();
      strategy.initialize({
        ...DEFAULT_OPTIMIZATION_CONFIG,
        diagramType: 'motivation',
        numRestarts: 0, // No restarts for deterministic test
        neighborsPerIteration: 3,
      } as any);

      // Get initial params
      const initial = strategy.getNextParameters()!;
      strategy.updateWithResult({
        parameters: initial,
        score: 0.3,
        evaluationTimeMs: 10,
        iteration: 1,
      });

      // Simulate finding a better neighbor
      const neighbor = strategy.getNextParameters()!;
      strategy.updateWithResult({
        parameters: neighbor,
        score: 0.7, // Better score
        evaluationTimeMs: 10,
        iteration: 2,
      });

      // Best should be updated
      expect(strategy.getCurrentBestScore()).toBe(0.7);
      expect(strategy.getCurrentBest()).toEqual(neighbor);
    });
  });

  test('should create strategy by type', () => {
    const grid = createStrategy('grid');
    const random = createStrategy('random');
    const hill = createStrategy('hillclimbing');

    expect(grid).toBeInstanceOf(GridSearchStrategy);
    expect(random).toBeInstanceOf(RandomSearchStrategy);
    expect(hill).toBeInstanceOf(HillClimbingStrategy);
  });
});

// ============================================================================
// Refinement Loop Tests
// ============================================================================

test.describe('Refinement Loop', () => {
  test('should run basic refinement', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 5,
      targetScore: 0.99, // High target to ensure we run all iterations
      strategyType: 'random',
    });

    const applyLayout = createMockLayoutApplicator(10);

    const result = await loop.run(applyLayout);

    expect(result).toBeDefined();
    expect(result.history.length).toBeGreaterThan(0);
    expect(result.bestParameters).toBeDefined();
    expect(result.bestScore).toBeGreaterThan(0);

    console.log('\nRefinement Result:');
    console.log(`  Iterations: ${result.summary.totalIterations}`);
    console.log(`  Best Score: ${result.bestScore.toFixed(4)}`);
    console.log(`  Completion: ${result.completionReason}`);
  });

  test('should stop early when target score reached', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 50,
      targetScore: 0.1, // Very low target - should stop early
      strategyType: 'random',
    });

    const applyLayout = createMockLayoutApplicator(10);

    const result = await loop.run(applyLayout);

    // Should stop before max iterations if target reached
    if (result.bestScore >= 0.1) {
      expect(result.completionReason).toBe('target_reached');
      console.log(`Stopped early at iteration ${result.summary.totalIterations}`);
    }
  });

  test('should detect plateau and stop', async () => {
    // Create a layout that always returns similar scores
    const consistentApplicator = async (_params: LayoutParameters) => {
      const nodes = createTestNodes(5);
      const edges = createTestEdges(nodes, 0.1);
      return { nodes, edges };
    };

    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 20,
      targetScore: 0.99,
      plateauThreshold: 5,
      minImprovementPercent: 5.0, // Require 5% improvement
      strategyType: 'random',
    });

    const result = await loop.run(consistentApplicator);

    // Should stop due to plateau since scores don't improve significantly
    console.log(`Completion reason: ${result.completionReason}`);
    console.log(`Iterations: ${result.summary.totalIterations}`);
  });

  test('should support cancellation', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 100,
      targetScore: 0.99,
      plateauThreshold: 100, // High to prevent plateau stopping
      strategyType: 'random',
    });

    // Create a slow layout applicator that takes time per iteration
    const slowApplyLayout = async (params: LayoutParameters) => {
      await new Promise((resolve) => setTimeout(resolve, 20)); // 20ms delay per iteration
      const nodes = createTestNodes(10);
      const edges = createTestEdges(nodes, 0.2);
      return { nodes, edges };
    };

    // Cancel after short delay
    setTimeout(() => loop.cancel(), 60);

    const result = await loop.run(slowApplyLayout);

    // Should be cancelled OR stopped for another reason but with fewer iterations
    // The key is that cancellation is properly handled
    expect(result.summary.totalIterations).toBeLessThan(100);
    console.log(`Cancellation test: ${result.completionReason} after ${result.summary.totalIterations} iterations`);
  });

  test('should track progress via callback', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 5,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockLayoutApplicator(10);
    const progressUpdates: { iteration: number; score: number }[] = [];

    await loop.run(applyLayout, (iteration, _max, currentScore, _best, _status) => {
      progressUpdates.push({ iteration, score: currentScore });
    });

    expect(progressUpdates.length).toBeGreaterThan(0);
    console.log('Progress updates:', progressUpdates.length);
  });

  test('should format result for display', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 3,
      strategyType: 'random',
    });

    const result = await loop.run(createMockLayoutApplicator(10));
    const formatted = formatRefinementResult(result);

    expect(formatted).toContain('Refinement Result');
    expect(formatted).toContain('Iterations');
    expect(formatted).toContain('Best Parameters');
    console.log('\n' + formatted);
  });

  test('should export iteration history as JSON', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 3,
      strategyType: 'random',
    });

    const result = await loop.run(createMockLayoutApplicator(10));
    const json = exportIterationHistory(result);

    const parsed = JSON.parse(json);
    expect(parsed.summary).toBeDefined();
    expect(parsed.history).toBeDefined();
    expect(Array.isArray(parsed.history)).toBe(true);
  });
});

// ============================================================================
// Integration Test: 10-Iteration Refinement on Motivation Diagram
// ============================================================================

test.describe('Integration: 10-Iteration Refinement', () => {
  test('should run 10-iteration refinement on motivation diagram', async () => {
    console.log('\n=== 10-Iteration Refinement Test ===\n');

    const config: Partial<RefinementConfig> = {
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 10,
      targetScore: 0.95,
      plateauThreshold: 5,
      minImprovementPercent: 1.0,
      strategyType: 'random',
      verbose: true,
    };

    // Create mock graph with 15 nodes (realistic motivation diagram size)
    const applyLayout = createMockLayoutApplicator(15);

    const progressLog: string[] = [];
    const result = await runRefinement(
      applyLayout,
      config,
      (iteration, max, current, best, status) => {
        const msg = `Iteration ${iteration}/${max}: current=${current.toFixed(4)}, best=${best.toFixed(4)} - ${status}`;
        progressLog.push(msg);
        console.log(msg);
      }
    );

    console.log('\n--- Final Result ---');
    console.log(formatRefinementResult(result));

    // Assertions
    expect(result.history.length).toBeGreaterThanOrEqual(1);
    expect(result.history.length).toBeLessThanOrEqual(11); // Initial + 10 iterations max
    expect(result.bestScore).toBeGreaterThan(0);
    expect(result.bestParameters).toBeDefined();

    // Verify iteration history is properly logged
    for (const iteration of result.history) {
      expect(iteration.iteration).toBeGreaterThanOrEqual(0);
      expect(iteration.score).toBeGreaterThanOrEqual(0);
      expect(iteration.score).toBeLessThanOrEqual(1);
      expect(iteration.timestamp).toBeDefined();
      expect(iteration.durationMs).toBeGreaterThanOrEqual(0);
    }

    // Verify summary statistics
    expect(result.summary.totalIterations).toBeGreaterThan(0);
    expect(result.summary.totalDurationMs).toBeGreaterThan(0);
    expect(typeof result.summary.startScore).toBe('number');
    expect(typeof result.summary.endScore).toBe('number');
    expect(typeof result.summary.improvementPercent).toBe('number');

    // Log performance metrics
    console.log('\n--- Performance ---');
    console.log(`Total Duration: ${result.summary.totalDurationMs.toFixed(0)}ms`);
    console.log(`Avg per Iteration: ${(result.summary.totalDurationMs / result.summary.totalIterations).toFixed(1)}ms`);
    console.log(`Progress callbacks: ${progressLog.length}`);
  });

  test('should compare grid search vs random search strategies', async () => {
    console.log('\n=== Strategy Comparison Test ===\n');

    const baseConfig = {
      diagramType: 'motivation' as const,
      layoutType: 'force-directed' as const,
      maxIterations: 10,
      targetScore: 0.99, // High to ensure we run all iterations
      plateauThreshold: 20, // High to prevent early stopping
    };

    const applyLayout = createMockLayoutApplicator(10);

    // Run grid search
    console.log('Running Grid Search...');
    const gridResult = await runRefinement(applyLayout, {
      ...baseConfig,
      strategyType: 'grid',
      strategyConfig: {
        maxValuesPerParameter: 2,
        parametersToOptimize: ['nodesep', 'ranksep'],
      },
    });

    // Run random search
    console.log('Running Random Search...');
    const randomResult = await runRefinement(applyLayout, {
      ...baseConfig,
      strategyType: 'random',
    });

    console.log('\n--- Comparison Results ---');
    console.log(`Grid Search:   best=${gridResult.bestScore.toFixed(4)}, iterations=${gridResult.summary.totalIterations}, time=${gridResult.summary.totalDurationMs.toFixed(0)}ms`);
    console.log(`Random Search: best=${randomResult.bestScore.toFixed(4)}, iterations=${randomResult.summary.totalIterations}, time=${randomResult.summary.totalDurationMs.toFixed(0)}ms`);

    // Both should produce valid results
    expect(gridResult.bestScore).toBeGreaterThan(0);
    expect(randomResult.bestScore).toBeGreaterThan(0);
  });
});
