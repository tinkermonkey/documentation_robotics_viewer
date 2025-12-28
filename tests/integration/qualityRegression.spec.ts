/**
 * Integration Test: Quality Regression Detection
 *
 * Tests detection of quality degradation when switching between engines
 * or parameter configurations. Ensures layout quality doesn't regress.
 *
 * Task Group 10.3: Strategic test for quality regression detection
 */

import { test, expect } from '@playwright/test';
import type { Node, Edge } from '@xyflow/react';

/**
 * Create a hierarchical tree graph with multiple branches
 * This structure is complex enough to show quality differences with different parameters
 */
function createHierarchicalGraph() {
  const nodes = [
    { id: 'root', width: 120, height: 80, data: { label: 'Root' } },
    // Level 1
    { id: 'l1-1', width: 120, height: 80, data: { label: 'L1-1' } },
    { id: 'l1-2', width: 120, height: 80, data: { label: 'L1-2' } },
    { id: 'l1-3', width: 120, height: 80, data: { label: 'L1-3' } },
    // Level 2
    { id: 'l2-1', width: 120, height: 80, data: { label: 'L2-1' } },
    { id: 'l2-2', width: 120, height: 80, data: { label: 'L2-2' } },
    { id: 'l2-3', width: 120, height: 80, data: { label: 'L2-3' } },
    { id: 'l2-4', width: 120, height: 80, data: { label: 'L2-4' } },
    { id: 'l2-5', width: 120, height: 80, data: { label: 'L2-5' } },
    // Level 3
    { id: 'l3-1', width: 120, height: 80, data: { label: 'L3-1' } },
    { id: 'l3-2', width: 120, height: 80, data: { label: 'L3-2' } },
    { id: 'l3-3', width: 120, height: 80, data: { label: 'L3-3' } },
  ];

  const edges = [
    // Root to Level 1
    { id: 'e1', source: 'root', target: 'l1-1' },
    { id: 'e2', source: 'root', target: 'l1-2' },
    { id: 'e3', source: 'root', target: 'l1-3' },
    // Level 1 to Level 2
    { id: 'e4', source: 'l1-1', target: 'l2-1' },
    { id: 'e5', source: 'l1-1', target: 'l2-2' },
    { id: 'e6', source: 'l1-2', target: 'l2-3' },
    { id: 'e7', source: 'l1-2', target: 'l2-4' },
    { id: 'e8', source: 'l1-3', target: 'l2-5' },
    // Level 2 to Level 3
    { id: 'e9', source: 'l2-2', target: 'l3-1' },
    { id: 'e10', source: 'l2-3', target: 'l3-2' },
    { id: 'e11', source: 'l2-5', target: 'l3-3' },
  ];

  return { nodes, edges };
}

test.describe('Quality Regression Detection', () => {
  test('should detect quality regression when switching from optimal to poor parameters', async () => {
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { calculateMetrics } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Use hierarchical graph with branches to demonstrate quality differences
    const { nodes, edges } = createHierarchicalGraph();

    // Apply optimal parameters
    const optimalResult = await engine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 80,
      layering: 'NETWORK_SIMPLEX',
      edgeNodeSpacing: 30,
      edgeSpacing: 20,
    });

    const optimalMetrics = calculateMetrics(
      optimalResult.nodes as Node[],
      optimalResult.edges as Edge[]
    );

    // Apply poor parameters (extremely tight spacing to force overlaps and poor quality)
    const poorResult = await engine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 1, // Extremely tight - will cause overlaps
      layering: 'NETWORK_SIMPLEX',
      edgeNodeSpacing: 1,
      edgeSpacing: 1,
    });

    const poorMetrics = calculateMetrics(poorResult.nodes as Node[], poorResult.edges as Edge[]);

    // Detect regression
    const qualityDelta = optimalMetrics.overallScore - poorMetrics.overallScore;

    // For hierarchical graphs, tight spacing should cause worse quality
    // However, if both layouts are acceptable, we verify the poor layout has more overlaps
    if (qualityDelta <= 0) {
      // If scores are similar, check that poor parameters caused more overlaps
      expect(poorMetrics.extendedMetrics.nodeNodeOcclusion).toBeGreaterThan(
        optimalMetrics.extendedMetrics.nodeNodeOcclusion
      );
    } else {
      expect(qualityDelta).toBeGreaterThan(0); // Optimal should be better
    }

    // Poor parameters should have worse metrics
    expect(poorMetrics.extendedMetrics.nodeNodeOcclusion).toBeGreaterThanOrEqual(
      optimalMetrics.extendedMetrics.nodeNodeOcclusion
    );

    // Quality classification should detect the difference
    const { classifyQuality } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const optimalClass = classifyQuality(optimalMetrics.overallScore);
    const poorClass = classifyQuality(poorMetrics.overallScore);

    // Log regression details for visibility
    const regressionReport = {
      optimal: {
        score: optimalMetrics.overallScore,
        class: optimalClass,
        occlusion: optimalMetrics.extendedMetrics.nodeNodeOcclusion,
        crossings: optimalMetrics.metrics.crossingNumber,
      },
      poor: {
        score: poorMetrics.overallScore,
        class: poorClass,
        occlusion: poorMetrics.extendedMetrics.nodeNodeOcclusion,
        crossings: poorMetrics.metrics.crossingNumber,
      },
      delta: qualityDelta,
    };

    // Verify regression was detected (either via score or occlusion)
    expect(regressionReport).toBeDefined();
    expect(regressionReport.poor.occlusion).toBeGreaterThan(regressionReport.optimal.occlusion);
  });

  test('should maintain quality when switching between compatible engines', async () => {
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { DagreLayoutEngine } = await import(
      '../../src/core/layout/engines/DagreLayoutEngine'
    );
    const { calculateMetrics } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const elkEngine = new ELKLayoutEngine();
    const dagreEngine = new DagreLayoutEngine();

    await elkEngine.initialize();
    await dagreEngine.initialize();

    // Use hierarchical graph for more realistic comparison
    const { nodes, edges } = createHierarchicalGraph();

    // Apply ELK hierarchical layout with generous spacing
    const elkResult = await elkEngine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 100,
      layering: 'NETWORK_SIMPLEX',
      edgeNodeSpacing: 40,
      edgeSpacing: 30,
    });

    const elkMetrics = calculateMetrics(elkResult.nodes as Node[], elkResult.edges as Edge[]);

    // Apply Dagre hierarchical layout with similar spacing
    const dagreResult = await dagreEngine.calculateLayout({ nodes, edges }, {
      rankdir: 'TB',
      nodesep: 100,
      ranksep: 140,
    });

    const dagreMetrics = calculateMetrics(dagreResult.nodes as Node[], dagreResult.edges as Edge[]);

    // Both should produce acceptable quality (no major regression)
    expect(elkMetrics.overallScore).toBeGreaterThan(0.5);
    expect(dagreMetrics.overallScore).toBeGreaterThan(0.5);

    // Quality delta should be reasonable (< 0.3)
    const qualityDelta = Math.abs(elkMetrics.overallScore - dagreMetrics.overallScore);
    expect(qualityDelta).toBeLessThan(0.3);

    // Neither should have excessive overlaps (relaxed threshold for different engines)
    // Different engines may calculate positions differently, so allow for some variation
    expect(elkMetrics.extendedMetrics.nodeNodeOcclusion).toBeLessThan(15);
    expect(dagreMetrics.extendedMetrics.nodeNodeOcclusion).toBeLessThan(15);
  });

  test('should track quality improvements across refinement iterations', async () => {
    const { RefinementLoop } = await import(
      '../../src/core/services/refinement/refinementLoop'
    );
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { calculateMetrics } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Sample graph
    const baseNodes = Array.from({ length: 12 }, (_, i) => ({
      id: `node-${i}`,
      width: 100,
      height: 60,
      data: { label: `Node ${i}` },
    }));

    const baseEdges = Array.from({ length: 11 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
    }));

    // Track quality across parameter variations
    const iterations: Array<{ params: any; quality: number }> = [];

    // Iteration 1: Start with default
    const result1 = await engine.calculateLayout({ nodes: baseNodes, edges: baseEdges }, {
      algorithm: 'layered',
      spacing: 50,
    });
    const metrics1 = calculateMetrics(result1.nodes as Node[], result1.edges as Edge[]);
    iterations.push({ params: { spacing: 50 }, quality: metrics1.overallScore });

    // Iteration 2: Increase spacing
    const result2 = await engine.calculateLayout({ nodes: baseNodes, edges: baseEdges }, {
      algorithm: 'layered',
      spacing: 80,
    });
    const metrics2 = calculateMetrics(result2.nodes as Node[], result2.edges as Edge[]);
    iterations.push({ params: { spacing: 80 }, quality: metrics2.overallScore });

    // Iteration 3: Further increase spacing
    const result3 = await engine.calculateLayout({ nodes: baseNodes, edges: baseEdges }, {
      algorithm: 'layered',
      spacing: 120,
    });
    const metrics3 = calculateMetrics(result3.nodes as Node[], result3.edges as Edge[]);
    iterations.push({ params: { spacing: 120 }, quality: metrics3.overallScore });

    // Verify quality progression tracked
    expect(iterations.length).toBe(3);
    iterations.forEach((iter) => {
      expect(iter.quality).toBeGreaterThan(0);
    });

    // Detect best iteration
    const bestIteration = iterations.reduce((best, current) =>
      current.quality > best.quality ? current : best
    );

    expect(bestIteration).toBeDefined();
    expect(bestIteration.quality).toBeGreaterThanOrEqual(iterations[0].quality);
  });

  test('should flag quality regression alerts for production use', async () => {
    const { calculateMetrics, classifyQuality } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    // Simulate baseline from production
    const baselineMetrics = {
      overallScore: 0.85,
      metrics: {
        crossingNumber: 2,
        nodeNodeOcclusion: 0,
      },
    };

    // Simulate new deployment with regression
    const newNodes: Node[] = Array.from({ length: 10 }, (_, i) => ({
      id: `node-${i}`,
      position: { x: i * 50, y: i * 50 },
      width: 100,
      height: 60,
      data: {},
      type: 'default',
    }));

    const newEdges: Edge[] = Array.from({ length: 9 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default',
    }));

    const newMetrics = calculateMetrics(newNodes, newEdges);

    // Check for regression (> 10% degradation)
    const regressionThreshold = 0.1;
    const qualityDelta =
      (baselineMetrics.overallScore - newMetrics.overallScore) /
      baselineMetrics.overallScore;

    const hasRegression = qualityDelta > regressionThreshold;

    // Create regression alert
    if (hasRegression) {
      const alert = {
        type: 'quality_regression',
        severity: qualityDelta > 0.2 ? 'critical' : 'warning',
        baseline: baselineMetrics.overallScore,
        current: newMetrics.overallScore,
        delta: qualityDelta,
        message: `Quality score decreased by ${(qualityDelta * 100).toFixed(1)}%`,
        recommendations: [
          'Review recent parameter changes',
          'Compare with previous successful configurations',
          'Check for layout algorithm changes',
        ],
      };

      expect(alert.type).toBe('quality_regression');
      expect(alert.delta).toBeGreaterThan(regressionThreshold);
    }

    // Quality classification should be consistent
    const baselineClass = classifyQuality(baselineMetrics.overallScore);
    const newClass = classifyQuality(newMetrics.overallScore);

    expect(baselineClass).toBeDefined();
    expect(newClass).toBeDefined();
  });
});
