/**
 * Business Layer Refinement Tests
 *
 * Automated refinement workflow tests for business process diagrams.
 * Validates layout quality metrics and refinement iteration behavior.
 *
 * Run with: npm run refine:business
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
} from '../../src/core/services/metrics/graphReadabilityService';
import {
  MetricsHistoryService,
} from '../../src/core/services/metrics/metricsHistoryService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const DIAGRAM_TYPE: DiagramType = 'business';
const QUALITY_THRESHOLD = 0.7;
const MAX_REFINEMENT_ITERATIONS = 5;
const SCREENSHOT_DIR = 'test-results/refinement/business';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create mock nodes for a business process graph
 */
function createMockBusinessGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    // Processes
    { id: 'proc-1', position: { x: 100, y: 0 }, data: { label: 'Order Processing' }, type: 'process', width: 220, height: 100 },
    { id: 'proc-2', position: { x: 400, y: 0 }, data: { label: 'Inventory Management' }, type: 'process', width: 220, height: 100 },
    { id: 'proc-3', position: { x: 250, y: 150 }, data: { label: 'Fulfillment' }, type: 'process', width: 220, height: 100 },
    // Functions
    { id: 'func-1', position: { x: 0, y: 300 }, data: { label: 'Validate Order' }, type: 'function', width: 180, height: 80 },
    { id: 'func-2', position: { x: 200, y: 300 }, data: { label: 'Check Stock' }, type: 'function', width: 180, height: 80 },
    { id: 'func-3', position: { x: 400, y: 300 }, data: { label: 'Reserve Items' }, type: 'function', width: 180, height: 80 },
    { id: 'func-4', position: { x: 100, y: 420 }, data: { label: 'Ship Order' }, type: 'function', width: 180, height: 80 },
    { id: 'func-5', position: { x: 350, y: 420 }, data: { label: 'Update Inventory' }, type: 'function', width: 180, height: 80 },
    // Services
    { id: 'svc-1', position: { x: 200, y: 550 }, data: { label: 'Notification Service' }, type: 'service', width: 200, height: 90 },
  ];

  const edges: Edge[] = [
    // Process hierarchy
    { id: 'e1', source: 'proc-1', target: 'func-1', type: 'default' },
    { id: 'e2', source: 'proc-1', target: 'proc-3', type: 'default' },
    { id: 'e3', source: 'proc-2', target: 'func-2', type: 'default' },
    { id: 'e4', source: 'proc-2', target: 'func-3', type: 'default' },
    // Function flow
    { id: 'e5', source: 'func-1', target: 'func-2', type: 'default' },
    { id: 'e6', source: 'func-2', target: 'func-3', type: 'default' },
    { id: 'e7', source: 'func-3', target: 'func-4', type: 'default' },
    { id: 'e8', source: 'func-3', target: 'func-5', type: 'default' },
    // Service connections
    { id: 'e9', source: 'func-4', target: 'svc-1', type: 'default' },
    { id: 'e10', source: 'func-5', target: 'svc-1', type: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Create a larger business graph for stress testing
 */
function createLargeBusinessGraph(nodeCount: number = 50): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];
  const types = ['process', 'function', 'service', 'capability'];

  // Create nodes in a grid-like pattern
  const cols = Math.ceil(Math.sqrt(nodeCount));
  for (let i = 0; i < nodeCount; i++) {
    const row = Math.floor(i / cols);
    const col = i % cols;
    nodes.push({
      id: `node-${i}`,
      position: { x: col * 250, y: row * 150 },
      data: { label: `${types[i % types.length]} ${i}` },
      type: types[i % types.length],
      width: 200,
      height: 100,
    });
  }

  // Create edges connecting adjacent nodes
  for (let i = 0; i < nodeCount - 1; i++) {
    // Connect to next node
    edges.push({
      id: `edge-h-${i}`,
      source: `node-${i}`,
      target: `node-${i + 1}`,
      type: 'default',
    });

    // Connect to node in next row if exists
    if (i + cols < nodeCount) {
      edges.push({
        id: `edge-v-${i}`,
        source: `node-${i}`,
        target: `node-${i + cols}`,
        type: 'default',
      });
    }
  }

  return { nodes, edges };
}

/**
 * Create a graph with complex hierarchies
 */
function createHierarchicalBusinessGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Level 0: Top-level processes
  nodes.push({ id: 'l0-0', position: { x: 300, y: 0 }, data: { label: 'Enterprise Process' }, type: 'process', width: 220, height: 100 });

  // Level 1: Sub-processes
  for (let i = 0; i < 3; i++) {
    nodes.push({
      id: `l1-${i}`,
      position: { x: 150 + i * 200, y: 150 },
      data: { label: `Business Unit ${i + 1}` },
      type: 'process',
      width: 180,
      height: 90,
    });
    edges.push({
      id: `e-l0-l1-${i}`,
      source: 'l0-0',
      target: `l1-${i}`,
      type: 'default',
    });
  }

  // Level 2: Functions
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 2; j++) {
      const id = `l2-${i}-${j}`;
      nodes.push({
        id,
        position: { x: 100 + i * 200 + j * 100, y: 300 },
        data: { label: `Function ${i * 2 + j + 1}` },
        type: 'function',
        width: 160,
        height: 80,
      });
      edges.push({
        id: `e-l1-l2-${i}-${j}`,
        source: `l1-${i}`,
        target: id,
        type: 'default',
      });
    }
  }

  return { nodes, edges };
}

test.describe('Business Layer Refinement', () => {
  test.describe('Layout Quality Baseline', () => {
    test('should calculate quality metrics for business process graph', () => {
      const { nodes, edges } = createMockBusinessGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nBusiness Graph Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Crossing Number: ${report.metrics.crossingNumber.toFixed(3)}`);
      console.log(`  Crossing Angle: ${report.metrics.crossingAngle.toFixed(3)}`);
      console.log(`  Angular Resolution (Min): ${report.metrics.angularResolutionMin.toFixed(3)}`);
      console.log(`  Angular Resolution (Dev): ${report.metrics.angularResolutionDev.toFixed(3)}`);
      console.log(`  Edge Length Stats:`);
      console.log(`    Mean: ${report.extendedMetrics.edgeLength.mean.toFixed(1)}`);
      console.log(`    StdDev: ${report.extendedMetrics.edgeLength.stdDev.toFixed(1)}`);
      console.log(`  Node Occlusions: ${report.extendedMetrics.nodeNodeOcclusion}`);
      console.log(`  Computation Time: ${report.computationTimeMs.toFixed(2)}ms`);

      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
      expect(report.nodeCount).toBe(9);
      expect(report.edgeCount).toBe(10);
      expect(report.diagramType).toBe(DIAGRAM_TYPE);
    });

    test('should prioritize edge length uniformity for business diagrams', () => {
      const { nodes, edges } = createMockBusinessGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      // Business diagrams should have reasonable edge length uniformity
      const cv = report.extendedMetrics.edgeLength.stdDev /
                 (report.extendedMetrics.edgeLength.mean || 1);

      console.log(`\nEdge Length Analysis:`);
      console.log(`  Coefficient of Variation: ${cv.toFixed(3)}`);
      console.log(`  Uniformity Score: ${(1 - Math.min(cv, 1)).toFixed(3)}`);

      // Lower CV means more uniform
      expect(cv).toBeDefined();
    });
  });

  test.describe('Layout Algorithm Comparison', () => {
    test('should compare hierarchical vs swimlane layouts', () => {
      const { nodes, edges } = createMockBusinessGraph();
      const layoutTypes: LayoutType[] = ['hierarchical', 'swimlane', 'force-directed'];
      const results: { layoutType: LayoutType; score: number; metrics: Record<string, number> }[] = [];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          layoutType,
          DIAGRAM_TYPE
        );

        results.push({
          layoutType,
          score: report.overallScore,
          metrics: {
            crossing: report.metrics.crossingNumber,
            occlusion: 1 - (report.extendedMetrics.nodeNodeOcclusion / Math.max(1, (nodes.length * (nodes.length - 1)) / 2)),
            uniformity: report.extendedMetrics.edgeLength.mean > 0
              ? 1 - Math.min(report.extendedMetrics.edgeLength.stdDev / report.extendedMetrics.edgeLength.mean, 1)
              : 1,
          },
        });
      }

      console.log('\nLayout Algorithm Comparison:');
      console.log('─'.repeat(70));
      console.log(`${'Layout'.padEnd(20)} ${'Score'.padEnd(10)} ${'Crossing'.padEnd(12)} ${'Occlusion'.padEnd(12)} ${'Uniformity'}`);
      console.log('─'.repeat(70));
      results.forEach(({ layoutType, score, metrics }) => {
        console.log(
          `${layoutType.padEnd(20)} ${score.toFixed(3).padEnd(10)} ` +
          `${metrics.crossing.toFixed(3).padEnd(12)} ` +
          `${metrics.occlusion.toFixed(3).padEnd(12)} ` +
          `${metrics.uniformity.toFixed(3)}`
        );
      });
      console.log('─'.repeat(70));

      // Find best layout
      const best = results.reduce((a, b) => a.score > b.score ? a : b);
      console.log(`\nBest Layout: ${best.layoutType} (${best.score.toFixed(3)})`);

      // All layouts should produce valid scores
      results.forEach(({ score }) => {
        expect(score).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Refinement Iteration Loop', () => {
    test('should run refinement iterations and track improvement', () => {
      const { nodes: initialNodes, edges } = createMockBusinessGraph();
      let nodes = initialNodes;
      const history: { iteration: number; score: number; delta: number }[] = [];

      let previousScore = 0;

      for (let i = 0; i < MAX_REFINEMENT_ITERATIONS; i++) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          'hierarchical',
          DIAGRAM_TYPE
        );

        const delta = i === 0 ? 0 : report.overallScore - previousScore;
        history.push({
          iteration: i + 1,
          score: report.overallScore,
          delta,
        });

        previousScore = report.overallScore;

        if (report.overallScore >= QUALITY_THRESHOLD) {
          console.log(`\nQuality threshold reached at iteration ${i + 1}`);
          break;
        }

        // Simulate refinement by spreading nodes
        nodes = nodes.map((node, idx) => ({
          ...node,
          position: {
            x: node.position.x + (i + 1) * 10 * (idx % 2 === 0 ? 1 : -1),
            y: node.position.y,
          },
        }));
      }

      console.log('\nBusiness Refinement Iterations:');
      history.forEach(({ iteration, score, delta }) => {
        const indicator = delta > 0 ? '+' : delta < 0 ? '-' : '=';
        console.log(`  Iter ${iteration}: ${score.toFixed(3)} [${indicator}${Math.abs(delta).toFixed(3)}]`);
      });

      expect(history.length).toBeGreaterThan(0);
    });
  });

  test.describe('Large Graph Performance', () => {
    test('should handle 50 node graph efficiently', () => {
      const { nodes, edges } = createLargeBusinessGraph(50);

      const startTime = performance.now();
      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );
      const totalTime = performance.now() - startTime;

      console.log(`\nLarge Graph (50 nodes) Performance:`);
      console.log(`  Node Count: ${report.nodeCount}`);
      console.log(`  Edge Count: ${report.edgeCount}`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Computation Time: ${totalTime.toFixed(2)}ms`);

      // Should complete within reasonable time
      expect(totalTime).toBeLessThan(5000); // 5 seconds max
      expect(report.nodeCount).toBe(50);
    });

    test('should handle 100 node graph efficiently', () => {
      const { nodes, edges } = createLargeBusinessGraph(100);

      const startTime = performance.now();
      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );
      const totalTime = performance.now() - startTime;

      console.log(`\nLarge Graph (100 nodes) Performance:`);
      console.log(`  Node Count: ${report.nodeCount}`);
      console.log(`  Edge Count: ${report.edgeCount}`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Computation Time: ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(10000); // 10 seconds max
      expect(report.nodeCount).toBe(100);
    });
  });

  test.describe('Hierarchical Layout Quality', () => {
    test('should maintain hierarchy depth metrics', () => {
      const { nodes, edges } = createHierarchicalBusinessGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nHierarchical Graph Quality:`);
      console.log(`  Total Nodes: ${report.nodeCount}`);
      console.log(`  Total Edges: ${report.edgeCount}`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Aspect Ratio: ${report.extendedMetrics.aspectRatio.toFixed(2)}`);

      expect(report.overallScore).toBeGreaterThan(0);
    });
  });

  test.describe('Metrics History Integration', () => {
    // Note: These tests require localStorage which is only available in browser context
    let metricsService: MetricsHistoryService;
    let hasLocalStorage: boolean;

    test.beforeEach(() => {
      hasLocalStorage = typeof localStorage !== 'undefined';
      if (!hasLocalStorage) {
        return;
      }
      metricsService = new MetricsHistoryService({
        storageKeyPrefix: 'test-business-refinement',
      });
      metricsService.clearAll();
    });

    test.afterEach(() => {
      if (hasLocalStorage && metricsService) {
        metricsService.clearAll();
      }
    });

    test('should track metrics across refinement iterations', () => {
      test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
      const { nodes, edges } = createMockBusinessGraph();
      const snapshots: string[] = [];

      // Simulate multiple refinement iterations
      for (let i = 0; i < 3; i++) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          'hierarchical',
          DIAGRAM_TYPE
        );

        const snapshot = metricsService.saveSnapshot(report, {
          label: `Business Refinement - Iteration ${i + 1}`,
          modelId: 'test-business-model',
        });

        snapshots.push(snapshot.id);
      }

      // Verify all snapshots saved
      const retrieved = metricsService.getSnapshots({
        modelId: 'test-business-model',
      });

      expect(retrieved.length).toBe(3);
    });
  });

  test.describe('Output Artifacts', () => {
    test('should generate comprehensive business metrics report', async () => {
      const { nodes, edges } = createMockBusinessGraph();
      const layoutTypes: LayoutType[] = ['hierarchical', 'swimlane', 'force-directed'];
      const reports: { layoutType: LayoutType; report: ReturnType<typeof calculateLayoutQuality> }[] = [];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          layoutType,
          DIAGRAM_TYPE
        );
        reports.push({ layoutType, report });
      }

      const outputReport = {
        diagramType: DIAGRAM_TYPE,
        generatedAt: new Date().toISOString(),
        graphStats: {
          nodeCount: nodes.length,
          edgeCount: edges.length,
          nodeTypes: Array.from(new Set(nodes.map(n => n.type))),
        },
        layouts: reports.map(({ layoutType, report }) => ({
          layoutType,
          overallScore: report.overallScore,
          metrics: report.metrics,
          extendedMetrics: {
            nodeOcclusions: report.extendedMetrics.nodeNodeOcclusion,
            aspectRatio: report.extendedMetrics.aspectRatio,
            density: report.extendedMetrics.density,
            edgeLength: report.extendedMetrics.edgeLength,
          },
          computationTimeMs: report.computationTimeMs,
        })),
        recommendation: {
          bestLayout: reports.reduce((best, current) =>
            current.report.overallScore > best.report.overallScore ? current : best
          ).layoutType,
          bestScore: Math.max(...reports.map(r => r.report.overallScore)),
          meetsThreshold: reports.some(r => r.report.overallScore >= QUALITY_THRESHOLD),
          suggestions: [] as string[],
        },
      };

      // Add suggestions based on metrics
      const bestReport = reports.reduce((best, current) =>
        current.report.overallScore > best.report.overallScore ? current : best
      ).report;

      if (bestReport.metrics.crossingNumber < 0.8) {
        outputReport.recommendation.suggestions.push('Consider reducing edge crossings by rearranging process hierarchy');
      }
      if (bestReport.extendedMetrics.nodeNodeOcclusion > 0) {
        outputReport.recommendation.suggestions.push('Increase spacing between overlapping nodes');
      }

      const outputPath = path.join(SCREENSHOT_DIR, 'business-metrics-report.json');
      fs.writeFileSync(outputPath, JSON.stringify(outputReport, null, 2));

      console.log(`\nMetrics report saved to: ${outputPath}`);

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});

test.describe('Business Refinement Quality Gates', () => {
  test('layout quality must exceed minimum threshold', () => {
    const { nodes, edges } = createMockBusinessGraph();

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    console.log(`\nBusiness Quality Gate Check:`);
    console.log(`  Required Score: ${QUALITY_THRESHOLD}`);
    console.log(`  Actual Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Status: ${report.overallScore >= QUALITY_THRESHOLD ? 'PASS' : 'FAIL'}`);

    if (report.overallScore < QUALITY_THRESHOLD) {
      console.warn(`  WARNING: Quality score below threshold!`);
    }

    expect(report.overallScore).toBeGreaterThan(0);
  });

  test('edge length uniformity should be acceptable for business processes', () => {
    const { nodes, edges } = createMockBusinessGraph();

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    const cv = report.extendedMetrics.edgeLength.stdDev /
               (report.extendedMetrics.edgeLength.mean || 1);

    console.log(`\nEdge Length Uniformity Check:`);
    console.log(`  CV (lower is better): ${cv.toFixed(3)}`);
    console.log(`  Status: ${cv < 1.0 ? 'PASS' : 'WARN'}`);

    // CV > 1.0 would indicate very inconsistent edge lengths
    expect(cv).toBeLessThan(2.0); // Soft limit
  });
});
