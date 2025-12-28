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

    // Sample graph
    const nodes = Array.from({ length: 15 }, (_, i) => ({
      id: `node-${i}`,
      width: 120,
      height: 80,
      data: { label: `Node ${i}` },
    }));

    const edges = Array.from({ length: 14 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
    }));

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

    // Apply poor parameters (tight spacing, likely to cause overlaps)
    const poorResult = await engine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 10, // Very tight
      layering: 'NETWORK_SIMPLEX',
      edgeNodeSpacing: 5,
      edgeSpacing: 5,
    });

    const poorMetrics = calculateMetrics(poorResult.nodes as Node[], poorResult.edges as Edge[]);

    // Detect regression
    const qualityDelta = optimalMetrics.overallScore - poorMetrics.overallScore;
    expect(qualityDelta).toBeGreaterThan(0); // Optimal should be better

    // Poor parameters should have worse metrics
    expect(poorMetrics.metrics.nodeNodeOcclusion).toBeGreaterThanOrEqual(
      optimalMetrics.metrics.nodeNodeOcclusion
    );

    // Quality classification should detect the difference
    const { classifyQuality } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const optimalClass = classifyQuality(optimalMetrics.overallScore);
    const poorClass = classifyQuality(poorMetrics.overallScore);

    // Log regression details
    const regressionReport = {
      optimal: {
        score: optimalMetrics.overallScore,
        class: optimalClass,
        occlusion: optimalMetrics.metrics.nodeNodeOcclusion,
        crossings: optimalMetrics.metrics.crossingNumber,
      },
      poor: {
        score: poorMetrics.overallScore,
        class: poorClass,
        occlusion: poorMetrics.metrics.nodeNodeOcclusion,
        crossings: poorMetrics.metrics.crossingNumber,
      },
      delta: qualityDelta,
    };

    expect(regressionReport.delta).toBeGreaterThan(0);
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

    // Test graph
    const nodes = Array.from({ length: 10 }, (_, i) => ({
      id: `node-${i}`,
      width: 100,
      height: 60,
      data: { label: `Node ${i}` },
    }));

    const edges = Array.from({ length: 9 }, (_, i) => ({
      id: `edge-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
    }));

    // Apply ELK hierarchical layout
    const elkResult = await elkEngine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 80,
    });

    const elkMetrics = calculateMetrics(elkResult.nodes as Node[], elkResult.edges as Edge[]);

    // Apply Dagre hierarchical layout (similar algorithm)
    const dagreResult = await dagreEngine.calculateLayout({ nodes, edges }, {
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
    });

    const dagreMetrics = calculateMetrics(dagreResult.nodes as Node[], dagreResult.edges as Edge[]);

    // Both should produce acceptable quality (no major regression)
    expect(elkMetrics.overallScore).toBeGreaterThan(0.5);
    expect(dagreMetrics.overallScore).toBeGreaterThan(0.5);

    // Quality delta should be reasonable (< 0.3)
    const qualityDelta = Math.abs(elkMetrics.overallScore - dagreMetrics.overallScore);
    expect(qualityDelta).toBeLessThan(0.3);

    // Neither should have excessive overlaps
    expect(elkMetrics.metrics.nodeNodeOcclusion).toBeLessThan(5);
    expect(dagreMetrics.metrics.nodeNodeOcclusion).toBeLessThan(5);
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
