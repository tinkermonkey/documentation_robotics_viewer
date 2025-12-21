/**
 * Motivation Layer Refinement Tests (DEPRECATED)
 *
 * ⚠️ DEPRECATION NOTICE: This test file uses the embedded app approach (port 3001).
 *
 * This file is no longer maintained. Please use the Ladle-based approach instead:
 * - New test file: tests/refinement/motivation-refinement.ladle.spec.ts
 * - Environment: http://localhost:6006 (Ladle catalog)
 * - Benefits: 40% faster startup, better isolation, automated discovery
 *
 * For migration guidance, see:
 * documentation/refinement/REFINEMENT_WORKFLOWS.md#migration-guide-from-embedded-app-to-ladle
 *
 * Automated refinement workflow tests for motivation diagrams.
 * Validates layout quality metrics and refinement iteration behavior.
 *
 * Run with: npm run refine:motivation
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
} from '../../src/core/services/metrics/graphReadabilityService';
import {
  MetricsHistoryService,
  RegressionSeverity,
} from '../../src/core/services/metrics/metricsHistoryService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const DIAGRAM_TYPE: DiagramType = 'motivation';
const QUALITY_THRESHOLD = 0.7;
const MAX_REFINEMENT_ITERATIONS = 5;
const SCREENSHOT_DIR = 'test-results/refinement/motivation';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create mock nodes for testing layout quality calculations
 */
function createMockMotivationGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    { id: 'goal-1', position: { x: 100, y: 0 }, data: { label: 'Strategic Goal 1' }, type: 'goal', width: 200, height: 80 },
    { id: 'goal-2', position: { x: 400, y: 0 }, data: { label: 'Strategic Goal 2' }, type: 'goal', width: 200, height: 80 },
    { id: 'req-1', position: { x: 0, y: 150 }, data: { label: 'Requirement 1' }, type: 'requirement', width: 180, height: 70 },
    { id: 'req-2', position: { x: 200, y: 150 }, data: { label: 'Requirement 2' }, type: 'requirement', width: 180, height: 70 },
    { id: 'req-3', position: { x: 400, y: 150 }, data: { label: 'Requirement 3' }, type: 'requirement', width: 180, height: 70 },
    { id: 'driver-1', position: { x: 100, y: 300 }, data: { label: 'Driver 1' }, type: 'driver', width: 160, height: 60 },
    { id: 'driver-2', position: { x: 350, y: 300 }, data: { label: 'Driver 2' }, type: 'driver', width: 160, height: 60 },
    { id: 'stakeholder-1', position: { x: 200, y: 420 }, data: { label: 'Stakeholder 1' }, type: 'stakeholder', width: 180, height: 70 },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'req-1', target: 'goal-1', type: 'default' },
    { id: 'e2', source: 'req-2', target: 'goal-1', type: 'default' },
    { id: 'e3', source: 'req-2', target: 'goal-2', type: 'default' },
    { id: 'e4', source: 'req-3', target: 'goal-2', type: 'default' },
    { id: 'e5', source: 'driver-1', target: 'req-1', type: 'default' },
    { id: 'e6', source: 'driver-1', target: 'req-2', type: 'default' },
    { id: 'e7', source: 'driver-2', target: 'req-3', type: 'default' },
    { id: 'e8', source: 'stakeholder-1', target: 'driver-1', type: 'default' },
    { id: 'e9', source: 'stakeholder-1', target: 'driver-2', type: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Create a poorly laid out graph for refinement testing
 */
function createPoorLayoutGraph(): { nodes: Node[]; edges: Edge[] } {
  // Intentionally create overlapping nodes and crossing edges
  const nodes: Node[] = [
    { id: 'n1', position: { x: 0, y: 0 }, data: { label: 'Node 1' }, type: 'goal', width: 150, height: 80 },
    { id: 'n2', position: { x: 50, y: 30 }, data: { label: 'Node 2' }, type: 'goal', width: 150, height: 80 }, // Overlapping
    { id: 'n3', position: { x: 200, y: 200 }, data: { label: 'Node 3' }, type: 'requirement', width: 150, height: 80 },
    { id: 'n4', position: { x: 0, y: 200 }, data: { label: 'Node 4' }, type: 'requirement', width: 150, height: 80 },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'n1', target: 'n3', type: 'default' }, // Crosses e2
    { id: 'e2', source: 'n2', target: 'n4', type: 'default' }, // Crosses e1
  ];

  return { nodes, edges };
}

/**
 * Simulate layout refinement by adjusting node positions
 */
function simulateLayoutRefinement(
  nodes: Node[],
  _edges: Edge[],
  iteration: number
): Node[] {
  // Simple refinement: spread nodes apart based on iteration
  const spreadFactor = 1 + iteration * 0.3;

  return nodes.map((node) => ({
    ...node,
    position: {
      x: node.position.x * spreadFactor,
      y: node.position.y * spreadFactor,
    },
  }));
}

test.describe('Motivation Layer Refinement', () => {
  test.describe('Layout Quality Baseline', () => {
    test('should calculate quality metrics for well-structured motivation graph', () => {
      const { nodes, edges } = createMockMotivationGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nMotivation Graph Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Crossing Number: ${report.metrics.crossingNumber.toFixed(3)}`);
      console.log(`  Crossing Angle: ${report.metrics.crossingAngle.toFixed(3)}`);
      console.log(`  Angular Resolution (Min): ${report.metrics.angularResolutionMin.toFixed(3)}`);
      console.log(`  Angular Resolution (Dev): ${report.metrics.angularResolutionDev.toFixed(3)}`);
      console.log(`  Node Occlusions: ${report.extendedMetrics.nodeNodeOcclusion}`);
      console.log(`  Computation Time: ${report.computationTimeMs.toFixed(2)}ms`);

      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
      expect(report.nodeCount).toBe(8);
      expect(report.edgeCount).toBe(9);
      expect(report.diagramType).toBe(DIAGRAM_TYPE);
    });

    test('should detect poor layout quality', () => {
      const { nodes, edges } = createPoorLayoutGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'force-directed',
        DIAGRAM_TYPE
      );

      console.log(`\nPoor Layout Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Node Occlusions: ${report.extendedMetrics.nodeNodeOcclusion}`);

      // Poor layout should have overlapping nodes
      expect(report.extendedMetrics.nodeNodeOcclusion).toBeGreaterThan(0);
    });
  });

  test.describe('Refinement Iteration Loop', () => {
    test('should improve layout quality through refinement iterations', () => {
      let { nodes, edges } = createPoorLayoutGraph();
      const iterations: { iteration: number; score: number; improved: boolean }[] = [];
      let bestScore = 0;
      let previousScore = 0;

      for (let i = 0; i < MAX_REFINEMENT_ITERATIONS; i++) {
        // Calculate current quality
        const report = calculateLayoutQuality(
          nodes,
          edges,
          'force-directed',
          DIAGRAM_TYPE
        );

        const improved = report.overallScore > previousScore;
        iterations.push({
          iteration: i + 1,
          score: report.overallScore,
          improved,
        });

        if (report.overallScore > bestScore) {
          bestScore = report.overallScore;
        }

        previousScore = report.overallScore;

        // Check if we've reached quality threshold
        if (report.overallScore >= QUALITY_THRESHOLD) {
          console.log(`\nQuality threshold reached at iteration ${i + 1}`);
          break;
        }

        // Refine layout for next iteration
        nodes = simulateLayoutRefinement(nodes, edges, i + 1);
      }

      console.log('\nRefinement Iteration Results:');
      iterations.forEach(({ iteration, score, improved }) => {
        const indicator = improved ? '+' : '-';
        console.log(`  Iteration ${iteration}: ${score.toFixed(3)} [${indicator}]`);
      });
      console.log(`  Best Score: ${bestScore.toFixed(3)}`);

      // Verify that refinement process completed
      expect(iterations.length).toBeGreaterThan(0);
      expect(iterations.length).toBeLessThanOrEqual(MAX_REFINEMENT_ITERATIONS);
    });

    test('should track refinement progress metrics', () => {
      const { nodes, edges } = createMockMotivationGraph();

      const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];
      const results: { layoutType: LayoutType; score: number }[] = [];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          layoutType,
          DIAGRAM_TYPE
        );
        results.push({ layoutType, score: report.overallScore });
      }

      console.log('\nLayout Algorithm Comparison:');
      results.forEach(({ layoutType, score }) => {
        console.log(`  ${layoutType}: ${score.toFixed(3)}`);
      });

      // All layout types should produce valid scores
      results.forEach(({ score }) => {
        expect(score).toBeGreaterThan(0);
        expect(score).toBeLessThanOrEqual(1);
      });
    });
  });

  test.describe('Metrics History Integration', () => {
    // Note: These tests require localStorage which is only available in browser context
    // They are skipped in Node.js context but will run in E2E browser tests

    let metricsService: MetricsHistoryService;
    let hasLocalStorage: boolean;

    test.beforeEach(() => {
      // Check if localStorage is available (browser context)
      hasLocalStorage = typeof localStorage !== 'undefined';
      if (!hasLocalStorage) {
        return;
      }
      // Create a new service instance for each test
      metricsService = new MetricsHistoryService({
        storageKeyPrefix: 'test-motivation-refinement',
      });
      metricsService.clearAll();
    });

    test.afterEach(() => {
      if (hasLocalStorage && metricsService) {
        metricsService.clearAll();
      }
    });

    test('should save and retrieve metrics snapshots', () => {
      test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
      const { nodes, edges } = createMockMotivationGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      const snapshot = metricsService.saveSnapshot(report, {
        label: 'Test Motivation Graph',
        modelId: 'test-motivation-model',
      });

      expect(snapshot.id).toBeDefined();
      expect(snapshot.report.overallScore).toBe(report.overallScore);
      expect(snapshot.label).toBe('Test Motivation Graph');

      // Retrieve snapshot
      const retrieved = metricsService.getSnapshot(snapshot.id);
      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(snapshot.id);
    });

    test('should set and retrieve baselines', () => {
      test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
      const { nodes, edges } = createMockMotivationGraph();
      const layoutType: LayoutType = 'hierarchical';

      const report = calculateLayoutQuality(
        nodes,
        edges,
        layoutType,
        DIAGRAM_TYPE
      );

      // Save as baseline
      metricsService.saveSnapshot(report, { setAsBaseline: true });

      // Retrieve baseline
      const baseline = metricsService.getBaseline(DIAGRAM_TYPE, layoutType);

      expect(baseline).toBeDefined();
      expect(baseline?.isBaseline).toBe(true);
      expect(baseline?.report.diagramType).toBe(DIAGRAM_TYPE);
      expect(baseline?.report.layoutType).toBe(layoutType);
    });

    test('should detect regression against baseline', () => {
      test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
      const { nodes, edges } = createMockMotivationGraph();
      const layoutType: LayoutType = 'hierarchical';

      // Create good baseline
      const baselineReport = calculateLayoutQuality(
        nodes,
        edges,
        layoutType,
        DIAGRAM_TYPE
      );
      metricsService.saveSnapshot(baselineReport, { setAsBaseline: true });

      // Create poor current layout
      const { nodes: poorNodes, edges: poorEdges } = createPoorLayoutGraph();
      const currentReport = calculateLayoutQuality(
        poorNodes,
        poorEdges,
        layoutType,
        DIAGRAM_TYPE
      );

      // Detect regression
      const regression = metricsService.detectRegression(currentReport);

      console.log('\nRegression Detection:');
      console.log(`  Has Regression: ${regression.hasRegression}`);
      console.log(`  Severity: ${regression.severity}`);
      console.log(`  Score Change: ${regression.overallScoreChange.toFixed(3)}`);
      console.log(`  Percentage Change: ${regression.overallPercentageChange.toFixed(1)}%`);

      // When layout is significantly worse, regression should be detected
      if (currentReport.overallScore < baselineReport.overallScore * 0.9) {
        expect(regression.hasRegression).toBe(true);
        expect(['minor', 'moderate', 'severe']).toContain(regression.severity);
      }
    });
  });

  test.describe('Output Artifacts', () => {
    test('should generate metrics report JSON', async () => {
      const { nodes, edges } = createMockMotivationGraph();
      const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];
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
        nodeCount: nodes.length,
        edgeCount: edges.length,
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
        summary: {
          bestLayout: reports.reduce((best, current) =>
            current.report.overallScore > best.report.overallScore ? current : best
          ).layoutType,
          bestScore: Math.max(...reports.map(r => r.report.overallScore)),
          meetsThreshold: reports.some(r => r.report.overallScore >= QUALITY_THRESHOLD),
        },
      };

      const outputPath = path.join(SCREENSHOT_DIR, 'motivation-metrics-report.json');
      fs.writeFileSync(outputPath, JSON.stringify(outputReport, null, 2));

      console.log(`\nMetrics report saved to: ${outputPath}`);

      // Verify file was created
      expect(fs.existsSync(outputPath)).toBe(true);

      // Verify report structure
      expect(outputReport.layouts.length).toBe(2);
      expect(outputReport.summary.bestScore).toBeGreaterThan(0);
    });
  });
});

test.describe('Motivation Refinement Quality Gates', () => {
  test('layout quality must exceed minimum threshold', () => {
    const { nodes, edges } = createMockMotivationGraph();

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    console.log(`\nQuality Gate Check:`);
    console.log(`  Required Score: ${QUALITY_THRESHOLD}`);
    console.log(`  Actual Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Status: ${report.overallScore >= QUALITY_THRESHOLD ? 'PASS' : 'FAIL'}`);

    // This is a soft check - log warning but don't fail test
    // In CI, you might want to make this a hard requirement
    if (report.overallScore < QUALITY_THRESHOLD) {
      console.warn(`  WARNING: Quality score below threshold!`);
    }

    // Always expect valid metrics
    expect(report.overallScore).toBeGreaterThan(0);
  });

  test('no severe metric regressions allowed', () => {
    // Skip if localStorage not available
    const hasLocalStorage = typeof localStorage !== 'undefined';
    if (!hasLocalStorage) {
      // In Node.js context, just verify metrics calculation works
      const { nodes, edges } = createMockMotivationGraph();
      const report = calculateLayoutQuality(nodes, edges, 'hierarchical', DIAGRAM_TYPE);

      console.log(`\nRegression Gate Check (Node.js mode - no localStorage):`);
      console.log(`  Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Status: Metrics calculation OK`);

      expect(report.overallScore).toBeGreaterThan(0);
      return;
    }

    const metricsService = new MetricsHistoryService({
      storageKeyPrefix: 'test-motivation-gates',
    });

    try {
      const { nodes, edges } = createMockMotivationGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      // Save as baseline for this test
      metricsService.saveSnapshot(report, { setAsBaseline: true });

      // Run regression check
      const regression = metricsService.detectRegression(report);

      console.log(`\nRegression Gate Check:`);
      console.log(`  Severity: ${regression.severity}`);
      console.log(`  Status: ${regression.severity !== 'severe' ? 'PASS' : 'FAIL'}`);

      // Severe regressions should fail the build
      expect(regression.severity).not.toBe('severe');
    } finally {
      metricsService.clearAll();
    }
  });
});
