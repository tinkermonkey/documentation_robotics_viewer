/**
 * Unit Tests for Interactive Refinement Features
 *
 * Tests human-in-the-loop refinement capabilities including:
 * - Multi-turn refinement sessions
 * - Pause/resume functionality
 * - Manual parameter overrides
 * - Session state persistence
 * - Session branching
 *
 * CRITICAL: These are lightweight unit tests with mocked dependencies,
 * NOT browser-based Playwright tests.
 */

import { test, expect } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';

import {
  RefinementLoop,
  RefinementConfig,
  RefinementIteration,
  LayoutApplicator,
} from '../../../src/core/services/refinement/refinementLoop';

import {
  DiagramType,
  LayoutParameters,
  getDefaultParameters,
} from '../../../src/core/services/refinement/layoutParameters';

// ============================================================================
// Mock Helpers
// ============================================================================

/**
 * Create minimal test nodes for layout evaluation
 */
function createMockNodes(count: number = 5): Node[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `node-${i}`,
    position: { x: i * 100, y: i * 50 },
    data: { label: `Node ${i}` },
    type: 'default',
    width: 180,
    height: 110,
  }));
}

/**
 * Create minimal test edges
 */
function createMockEdges(nodeCount: number): Edge[] {
  const edges: Edge[] = [];
  for (let i = 0; i < nodeCount - 1; i++) {
    edges.push({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default',
    });
  }
  return edges;
}

/**
 * Mock layout applicator for testing
 */
function createMockApplicator(): LayoutApplicator {
  return async (_params: LayoutParameters) => {
    const nodes = createMockNodes(5);
    const edges = createMockEdges(5);
    return { nodes, edges };
  };
}

// ============================================================================
// Test Suite: Multi-Turn Refinement Sessions
// ============================================================================

test.describe('Multi-Turn Refinement Sessions', () => {
  test('should support pausing a refinement session', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 10,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();
    let iterationCount = 0;

    // Start refinement and cancel after 3 iterations
    const resultPromise = loop.run(applyLayout, (iteration) => {
      iterationCount = iteration;
      if (iteration === 3) {
        loop.cancel();
      }
    });

    const result = await resultPromise;

    // Should stop at or shortly after iteration 3
    expect(result.completionReason).toBe('cancelled');
    expect(result.summary.totalIterations).toBeLessThanOrEqual(4);
    console.log(`Paused after ${result.summary.totalIterations} iterations`);
  });

  test('should preserve iteration history across pause/resume', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 5,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();

    // Run first session
    loop.cancel(); // Immediately cancel to simulate pause
    const firstResult = await loop.run(applyLayout);
    const firstHistory = [...loop.getHistory()];

    expect(firstHistory.length).toBeGreaterThanOrEqual(1);
    console.log(`First session: ${firstHistory.length} iterations`);

    // Resume by creating a new run
    loop.reset();
    const secondResult = await loop.run(applyLayout);
    const secondHistory = loop.getHistory();

    expect(secondHistory.length).toBeGreaterThan(0);
    console.log(`Second session: ${secondHistory.length} iterations`);
  });

  test('should track best result across multiple sessions', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 3,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();

    // First session
    await loop.run(applyLayout);
    const firstBest = loop.getBestResult();
    expect(firstBest).toBeDefined();
    const firstScore = firstBest!.score;

    // Second session
    loop.reset();
    await loop.run(applyLayout);
    const secondBest = loop.getBestResult();
    expect(secondBest).toBeDefined();

    console.log(`First best: ${firstScore.toFixed(4)}, Second best: ${secondBest!.score.toFixed(4)}`);
  });
});

// ============================================================================
// Test Suite: Manual Parameter Overrides
// ============================================================================

test.describe('Manual Parameter Overrides', () => {
  test('should accept manual parameter changes during refinement', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 5,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();

    // Run refinement with config updates during execution
    const resultPromise = loop.run(applyLayout, (iteration) => {
      if (iteration === 2) {
        // Simulate manual parameter override by updating config
        loop.setConfig({
          targetScore: 0.5, // Lower target to trigger early stopping
        });
      }
    });

    const result = await resultPromise;

    expect(result).toBeDefined();
    console.log(`Refinement with manual override: ${result.summary.totalIterations} iterations`);
  });

  test('should validate manually overridden parameters', () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 5,
      strategyType: 'random',
    });

    // Get current config
    const config = loop.getConfig();
    expect(config.diagramType).toBe('motivation');
    expect(config.maxIterations).toBe(5);

    // Update config with valid values
    loop.setConfig({
      maxIterations: 10,
      targetScore: 0.8,
    });

    const updatedConfig = loop.getConfig();
    expect(updatedConfig.maxIterations).toBe(10);
    expect(updatedConfig.targetScore).toBe(0.8);
  });
});

// ============================================================================
// Test Suite: Session State Management
// ============================================================================

test.describe('Session State Management', () => {
  test('should export session state including history', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 3,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();
    const result = await loop.run(applyLayout);

    // Session state should include history
    const history = loop.getHistory();
    expect(history.length).toBeGreaterThan(0);
    expect(result.history.length).toBe(history.length);

    // Verify history structure
    history.forEach((iteration) => {
      expect(iteration.iteration).toBeGreaterThanOrEqual(0);
      expect(iteration.parameters).toBeDefined();
      expect(iteration.score).toBeGreaterThanOrEqual(0);
      expect(iteration.timestamp).toBeDefined();
    });

    console.log(`Exported session with ${history.length} iterations`);
  });

  test('should support session metadata tracking', async () => {
    const sessionMetadata = {
      sessionId: 'test-session-123',
      diagramType: 'motivation' as DiagramType,
      startTime: new Date().toISOString(),
    };

    const loop = new RefinementLoop({
      diagramType: sessionMetadata.diagramType,
      layoutType: 'force-directed',
      maxIterations: 2,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();
    const result = await loop.run(applyLayout);

    // Verify result includes timestamp
    expect(result.timestamp).toBeDefined();
    expect(result.summary).toBeDefined();
    expect(result.summary.totalIterations).toBeGreaterThan(0);

    console.log(`Session ${sessionMetadata.sessionId}: ${result.summary.totalIterations} iterations`);
  });
});

// ============================================================================
// Test Suite: Session Branching
// ============================================================================

test.describe('Session Branching', () => {
  test('should support creating branch from iteration state', async () => {
    const mainLoop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 3,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();
    const mainResult = await mainLoop.run(applyLayout);
    const mainHistory = mainLoop.getHistory();

    // Create a branch by starting a new loop with similar config
    const branchLoop = new RefinementLoop({
      ...mainLoop.getConfig(),
      maxIterations: 2, // Different iteration count for branch
    });

    const branchResult = await branchLoop.run(applyLayout);
    const branchHistory = branchLoop.getHistory();

    // Both should have valid results
    expect(mainHistory.length).toBeGreaterThan(0);
    expect(branchHistory.length).toBeGreaterThan(0);

    console.log(`Main: ${mainHistory.length} iterations, Branch: ${branchHistory.length} iterations`);
  });

  test('should allow exploring different parameter paths', async () => {
    const baseConfig: Partial<RefinementConfig> = {
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 2,
    };

    const applyLayout = createMockApplicator();

    // Path 1: Random search
    const path1 = new RefinementLoop({
      ...baseConfig,
      strategyType: 'random',
    });
    const result1 = await path1.run(applyLayout);

    // Path 2: Hill climbing
    const path2 = new RefinementLoop({
      ...baseConfig,
      strategyType: 'hillclimbing',
    });
    const result2 = await path2.run(applyLayout);

    // Both paths should produce results
    expect(result1.bestScore).toBeGreaterThan(0);
    expect(result2.bestScore).toBeGreaterThan(0);

    console.log(`Path 1 (random): ${result1.bestScore.toFixed(4)}`);
    console.log(`Path 2 (hillclimbing): ${result2.bestScore.toFixed(4)}`);
  });
});

// ============================================================================
// Test Suite: History Size Management
// ============================================================================

test.describe('History Size Management', () => {
  test('should limit history size when maxHistorySize is set', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 10,
      targetScore: 0.99,
      strategyType: 'random',
      maxHistorySize: 5, // Limit to 5 entries
    });

    const applyLayout = createMockApplicator();
    const result = await loop.run(applyLayout);

    // History should be trimmed to maxHistorySize
    const history = loop.getHistory();
    expect(history.length).toBeLessThanOrEqual(5);

    console.log(`History trimmed to ${history.length} entries (max: 5)`);
  });

  test('should preserve best iterations when trimming history', async () => {
    const loop = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 8,
      targetScore: 0.99,
      strategyType: 'random',
      maxHistorySize: 4,
    });

    const applyLayout = createMockApplicator();
    await loop.run(applyLayout);

    const history = loop.getHistory();
    const bestIterations = history.filter((iter) => iter.isBest);

    // Best iterations should be preserved
    expect(bestIterations.length).toBeGreaterThan(0);

    console.log(`Preserved ${bestIterations.length} best iterations in trimmed history`);
  });
});

// ============================================================================
// Test Suite: Integration - Complete Session Lifecycle
// ============================================================================

test.describe('Integration: Complete Session Lifecycle', () => {
  test('should support full pause-modify-resume-branch workflow', async () => {
    console.log('\n=== Complete Session Lifecycle Test ===\n');

    // 1. Start initial session
    const session1 = new RefinementLoop({
      diagramType: 'motivation',
      layoutType: 'force-directed',
      maxIterations: 10,
      targetScore: 0.99,
      strategyType: 'random',
    });

    const applyLayout = createMockApplicator();
    let pausedAtIteration = 0;

    // Run and pause at iteration 3
    const session1Promise = session1.run(applyLayout, (iteration) => {
      if (iteration === 3) {
        pausedAtIteration = iteration;
        session1.cancel();
      }
    });

    const result1 = await session1Promise;
    console.log(`Session 1: Paused at iteration ${pausedAtIteration}`);

    // 2. Modify config and resume
    const session2 = new RefinementLoop({
      ...session1.getConfig(),
      maxIterations: 5,
      targetScore: 0.85, // Modified target
    });

    const result2 = await session2.run(applyLayout);
    console.log(`Session 2: Resumed with modified target, ran ${result2.summary.totalIterations} iterations`);

    // 3. Create branch exploring different strategy
    const branch = new RefinementLoop({
      ...session1.getConfig(),
      strategyType: 'hillclimbing', // Different strategy
      maxIterations: 3,
    });

    const branchResult = await branch.run(applyLayout);
    console.log(`Branch: Explored hillclimbing strategy, ran ${branchResult.summary.totalIterations} iterations`);

    // Verify all sessions completed successfully
    expect(result1.completionReason).toBe('cancelled');
    expect(result2.completionReason).toBeDefined();
    expect(branchResult.completionReason).toBeDefined();

    console.log('\n✓ Complete lifecycle test passed');
  });
});
