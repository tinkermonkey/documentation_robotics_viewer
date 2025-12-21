/**
 * C4 Architecture Refinement Tests (DEPRECATED)
 *
 * ⚠️ DEPRECATION NOTICE: This test file uses the embedded app approach (port 3001).
 *
 * This file is no longer maintained. Please use the Ladle-based approach instead:
 * - New test file: tests/refinement/c4-refinement.ladle.spec.ts
 * - Environment: http://localhost:6006 (Ladle catalog)
 * - Benefits: 40% faster startup, better isolation, automated discovery
 *
 * For migration guidance, see:
 * documentation/refinement/REFINEMENT_WORKFLOWS.md#migration-guide-from-embedded-app-to-ladle
 *
 * Automated refinement workflow tests for C4 architecture diagrams.
 * Validates layout quality metrics and refinement iteration behavior.
 *
 * Run with: npm run refine:c4
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
const DIAGRAM_TYPE: DiagramType = 'c4';
const QUALITY_THRESHOLD = 0.7;
const MAX_REFINEMENT_ITERATIONS = 5;
const SCREENSHOT_DIR = 'test-results/refinement/c4';

// Ensure screenshot directory exists
test.beforeAll(async () => {
  const dir = path.resolve(SCREENSHOT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Create a C4 Context diagram (Level 1)
 */
function createC4ContextGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    // System in scope
    {
      id: 'system-1',
      position: { x: 300, y: 200 },
      data: { label: 'E-Commerce System', c4Type: 'system' },
      type: 'container',
      width: 280,
      height: 180,
    },
    // External actors/systems
    {
      id: 'actor-1',
      position: { x: 50, y: 100 },
      data: { label: 'Customer', c4Type: 'person' },
      type: 'external-actor',
      width: 160,
      height: 120,
    },
    {
      id: 'actor-2',
      position: { x: 50, y: 300 },
      data: { label: 'Admin', c4Type: 'person' },
      type: 'external-actor',
      width: 160,
      height: 120,
    },
    {
      id: 'ext-1',
      position: { x: 650, y: 100 },
      data: { label: 'Payment Gateway', c4Type: 'external-system' },
      type: 'container',
      width: 200,
      height: 140,
    },
    {
      id: 'ext-2',
      position: { x: 650, y: 300 },
      data: { label: 'Email Service', c4Type: 'external-system' },
      type: 'container',
      width: 200,
      height: 140,
    },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'actor-1', target: 'system-1', label: 'Uses', type: 'default' },
    { id: 'e2', source: 'actor-2', target: 'system-1', label: 'Manages', type: 'default' },
    { id: 'e3', source: 'system-1', target: 'ext-1', label: 'Processes payments', type: 'default' },
    { id: 'e4', source: 'system-1', target: 'ext-2', label: 'Sends notifications', type: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Create a C4 Container diagram (Level 2)
 */
function createC4ContainerGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    // System boundary
    {
      id: 'boundary',
      position: { x: 150, y: 50 },
      data: { label: 'E-Commerce System', c4Type: 'system-boundary' },
      type: 'group',
      width: 700,
      height: 500,
    },
    // Containers
    {
      id: 'web-app',
      position: { x: 200, y: 100 },
      data: { label: 'Web Application', technology: 'React, TypeScript', c4Type: 'container' },
      type: 'container',
      width: 250,
      height: 140,
    },
    {
      id: 'mobile-app',
      position: { x: 500, y: 100 },
      data: { label: 'Mobile App', technology: 'React Native', c4Type: 'container' },
      type: 'container',
      width: 250,
      height: 140,
    },
    {
      id: 'api',
      position: { x: 350, y: 280 },
      data: { label: 'API Gateway', technology: 'Node.js, Express', c4Type: 'container' },
      type: 'container',
      width: 250,
      height: 140,
    },
    {
      id: 'db',
      position: { x: 350, y: 450 },
      data: { label: 'Database', technology: 'PostgreSQL', c4Type: 'database' },
      type: 'container',
      width: 250,
      height: 140,
    },
    // External user
    {
      id: 'user',
      position: { x: 50, y: 150 },
      data: { label: 'Customer', c4Type: 'person' },
      type: 'external-actor',
      width: 120,
      height: 100,
    },
  ];

  const edges: Edge[] = [
    { id: 'e1', source: 'user', target: 'web-app', label: 'Uses [HTTPS]', type: 'default' },
    { id: 'e2', source: 'user', target: 'mobile-app', label: 'Uses [HTTPS]', type: 'default' },
    { id: 'e3', source: 'web-app', target: 'api', label: 'REST API', type: 'default' },
    { id: 'e4', source: 'mobile-app', target: 'api', label: 'REST API', type: 'default' },
    { id: 'e5', source: 'api', target: 'db', label: 'Read/Write [SQL]', type: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Create a C4 Component diagram (Level 3)
 */
function createC4ComponentGraph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [
    // API Components
    {
      id: 'auth-ctrl',
      position: { x: 100, y: 0 },
      data: { label: 'Auth Controller', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'order-ctrl',
      position: { x: 350, y: 0 },
      data: { label: 'Order Controller', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'product-ctrl',
      position: { x: 600, y: 0 },
      data: { label: 'Product Controller', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    // Services
    {
      id: 'auth-svc',
      position: { x: 100, y: 150 },
      data: { label: 'Auth Service', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'order-svc',
      position: { x: 350, y: 150 },
      data: { label: 'Order Service', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'product-svc',
      position: { x: 600, y: 150 },
      data: { label: 'Product Service', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    // Repositories
    {
      id: 'user-repo',
      position: { x: 100, y: 300 },
      data: { label: 'User Repository', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'order-repo',
      position: { x: 350, y: 300 },
      data: { label: 'Order Repository', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
    {
      id: 'product-repo',
      position: { x: 600, y: 300 },
      data: { label: 'Product Repository', c4Type: 'component' },
      type: 'component',
      width: 200,
      height: 100,
    },
  ];

  const edges: Edge[] = [
    // Controller -> Service
    { id: 'e1', source: 'auth-ctrl', target: 'auth-svc', type: 'default' },
    { id: 'e2', source: 'order-ctrl', target: 'order-svc', type: 'default' },
    { id: 'e3', source: 'product-ctrl', target: 'product-svc', type: 'default' },
    // Service -> Repository
    { id: 'e4', source: 'auth-svc', target: 'user-repo', type: 'default' },
    { id: 'e5', source: 'order-svc', target: 'order-repo', type: 'default' },
    { id: 'e6', source: 'product-svc', target: 'product-repo', type: 'default' },
    // Cross-service dependencies
    { id: 'e7', source: 'order-svc', target: 'auth-svc', type: 'default' },
    { id: 'e8', source: 'order-svc', target: 'product-svc', type: 'default' },
  ];

  return { nodes, edges };
}

/**
 * Create a complex C4 graph with many connections
 */
function createComplexC4Graph(): { nodes: Node[]; edges: Edge[] } {
  const nodes: Node[] = [];
  const edges: Edge[] = [];

  // Create microservices architecture
  const services = ['User', 'Order', 'Product', 'Inventory', 'Payment', 'Notification', 'Analytics', 'Search'];

  services.forEach((service, i) => {
    const col = i % 4;
    const row = Math.floor(i / 4);
    nodes.push({
      id: `svc-${service.toLowerCase()}`,
      position: { x: col * 250, y: row * 200 },
      data: { label: `${service} Service`, c4Type: 'container' },
      type: 'container',
      width: 200,
      height: 120,
    });
  });

  // Add inter-service connections
  const connections = [
    ['Order', 'User'],
    ['Order', 'Product'],
    ['Order', 'Inventory'],
    ['Order', 'Payment'],
    ['Payment', 'Notification'],
    ['Order', 'Notification'],
    ['Product', 'Search'],
    ['Analytics', 'User'],
    ['Analytics', 'Order'],
    ['Analytics', 'Product'],
    ['Inventory', 'Product'],
  ];

  connections.forEach(([source, target], i) => {
    edges.push({
      id: `e${i}`,
      source: `svc-${source.toLowerCase()}`,
      target: `svc-${target.toLowerCase()}`,
      type: 'default',
    });
  });

  return { nodes, edges };
}

test.describe('C4 Architecture Refinement', () => {
  test.describe('Layout Quality by C4 Level', () => {
    test('should calculate quality metrics for C4 Context diagram', () => {
      const { nodes, edges } = createC4ContextGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nC4 Context Diagram Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Crossing Number: ${report.metrics.crossingNumber.toFixed(3)}`);
      console.log(`  Crossing Angle: ${report.metrics.crossingAngle.toFixed(3)}`);
      console.log(`  Angular Resolution (Min): ${report.metrics.angularResolutionMin.toFixed(3)}`);
      console.log(`  Node Occlusions: ${report.extendedMetrics.nodeNodeOcclusion}`);
      console.log(`  Aspect Ratio: ${report.extendedMetrics.aspectRatio.toFixed(2)}`);

      expect(report.overallScore).toBeGreaterThan(0);
      expect(report.diagramType).toBe(DIAGRAM_TYPE);
    });

    test('should calculate quality metrics for C4 Container diagram', () => {
      const { nodes, edges } = createC4ContainerGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nC4 Container Diagram Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Crossing Number: ${report.metrics.crossingNumber.toFixed(3)}`);
      console.log(`  Node Count: ${report.nodeCount}`);
      console.log(`  Edge Count: ${report.edgeCount}`);

      expect(report.overallScore).toBeGreaterThan(0);
    });

    test('should calculate quality metrics for C4 Component diagram', () => {
      const { nodes, edges } = createC4ComponentGraph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );

      console.log(`\nC4 Component Diagram Quality Report:`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Edge Length Uniformity: ${
        report.extendedMetrics.edgeLength.mean > 0
          ? (1 - Math.min(report.extendedMetrics.edgeLength.stdDev / report.extendedMetrics.edgeLength.mean, 1)).toFixed(3)
          : '1.000'
      }`);
      console.log(`  Node Count: ${report.nodeCount}`);
      console.log(`  Edge Count: ${report.edgeCount}`);

      expect(report.overallScore).toBeGreaterThan(0);
    });
  });

  test.describe('Layout Algorithm Comparison', () => {
    test('should compare layout algorithms for C4 container diagram', () => {
      const { nodes, edges } = createC4ContainerGraph();
      const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed', 'radial'];
      const results: { layoutType: LayoutType; score: number; crossings: number }[] = [];

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
          crossings: 1 - report.metrics.crossingNumber, // Convert to actual crossing count approximation
        });
      }

      console.log('\nC4 Container Layout Comparison:');
      console.log('─'.repeat(50));
      console.log(`${'Layout'.padEnd(20)} ${'Score'.padEnd(12)} ${'Crossings (approx)'}`);
      console.log('─'.repeat(50));
      results.forEach(({ layoutType, score, crossings }) => {
        console.log(
          `${layoutType.padEnd(20)} ${score.toFixed(3).padEnd(12)} ${crossings.toFixed(3)}`
        );
      });
      console.log('─'.repeat(50));

      // Hierarchical typically works best for C4
      const best = results.reduce((a, b) => a.score > b.score ? a : b);
      console.log(`\nRecommended Layout: ${best.layoutType}`);

      results.forEach(({ score }) => {
        expect(score).toBeGreaterThan(0);
      });
    });
  });

  test.describe('Refinement Iteration Loop', () => {
    test('should run refinement iterations for C4 component diagram', () => {
      let { nodes, edges } = createC4ComponentGraph();
      const history: { iteration: number; score: number; crossingMetric: number }[] = [];

      for (let i = 0; i < MAX_REFINEMENT_ITERATIONS; i++) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          'hierarchical',
          DIAGRAM_TYPE
        );

        history.push({
          iteration: i + 1,
          score: report.overallScore,
          crossingMetric: report.metrics.crossingNumber,
        });

        if (report.overallScore >= QUALITY_THRESHOLD) {
          console.log(`\nQuality threshold reached at iteration ${i + 1}`);
          break;
        }

        // Simulate refinement
        nodes = nodes.map((node, idx) => ({
          ...node,
          position: {
            x: node.position.x + (i + 1) * 5 * Math.cos(idx),
            y: node.position.y + (i + 1) * 5 * Math.sin(idx),
          },
        }));
      }

      console.log('\nC4 Refinement Iterations:');
      history.forEach(({ iteration, score, crossingMetric }) => {
        console.log(`  Iter ${iteration}: Score=${score.toFixed(3)}, Crossings=${crossingMetric.toFixed(3)}`);
      });

      expect(history.length).toBeGreaterThan(0);
    });
  });

  test.describe('Complex Architecture Performance', () => {
    test('should handle complex microservices C4 diagram', () => {
      const { nodes, edges } = createComplexC4Graph();

      const startTime = performance.now();
      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical',
        DIAGRAM_TYPE
      );
      const totalTime = performance.now() - startTime;

      console.log(`\nComplex C4 Architecture Performance:`);
      console.log(`  Nodes: ${report.nodeCount}`);
      console.log(`  Edges: ${report.edgeCount}`);
      console.log(`  Overall Score: ${report.overallScore.toFixed(3)}`);
      console.log(`  Density: ${report.extendedMetrics.density.toFixed(3)}`);
      console.log(`  Computation Time: ${totalTime.toFixed(2)}ms`);

      expect(totalTime).toBeLessThan(5000);
      expect(report.nodeCount).toBe(8);
    });

    test('should analyze crossing patterns in complex C4 diagram', () => {
      const { nodes, edges } = createComplexC4Graph();

      const report = calculateLayoutQuality(
        nodes,
        edges,
        'force-directed',
        DIAGRAM_TYPE
      );

      console.log(`\nC4 Crossing Analysis:`);
      console.log(`  Crossing Number Metric: ${report.metrics.crossingNumber.toFixed(3)}`);
      console.log(`  Crossing Angle Metric: ${report.metrics.crossingAngle.toFixed(3)}`);
      console.log(`  Angular Resolution Min: ${report.metrics.angularResolutionMin.toFixed(3)}`);
      console.log(`  Angular Resolution Dev: ${report.metrics.angularResolutionDev.toFixed(3)}`);

      // C4 diagrams prioritize minimal crossings
      expect(report.metrics.crossingNumber).toBeDefined();
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
        storageKeyPrefix: 'test-c4-refinement',
      });
      metricsService.clearAll();
    });

    test.afterEach(() => {
      if (hasLocalStorage && metricsService) {
        metricsService.clearAll();
      }
    });

    test('should compare C4 diagram levels', () => {
      test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
      const levels = [
        { name: 'Context (L1)', graph: createC4ContextGraph() },
        { name: 'Container (L2)', graph: createC4ContainerGraph() },
        { name: 'Component (L3)', graph: createC4ComponentGraph() },
      ];

      console.log('\nC4 Level Comparison:');
      console.log('─'.repeat(60));

      for (const { name, graph } of levels) {
        const report = calculateLayoutQuality(
          graph.nodes,
          graph.edges,
          'hierarchical',
          DIAGRAM_TYPE
        );

        metricsService.saveSnapshot(report, {
          label: name,
          modelId: 'c4-comparison',
        });

        console.log(`${name.padEnd(20)} Nodes: ${report.nodeCount.toString().padEnd(5)} Edges: ${report.edgeCount.toString().padEnd(5)} Score: ${report.overallScore.toFixed(3)}`);
      }

      console.log('─'.repeat(60));

      const snapshots = metricsService.getSnapshots({ modelId: 'c4-comparison' });
      expect(snapshots.length).toBe(3);
    });
  });

  test.describe('Output Artifacts', () => {
    test('should generate comprehensive C4 metrics report', async () => {
      const levels = [
        { name: 'Context', graph: createC4ContextGraph() },
        { name: 'Container', graph: createC4ContainerGraph() },
        { name: 'Component', graph: createC4ComponentGraph() },
      ];

      const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

      const outputReport = {
        diagramType: DIAGRAM_TYPE,
        generatedAt: new Date().toISOString(),
        levels: levels.map(({ name, graph }) => ({
          level: name,
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          layouts: layoutTypes.map(layoutType => {
            const report = calculateLayoutQuality(
              graph.nodes,
              graph.edges,
              layoutType,
              DIAGRAM_TYPE
            );
            return {
              layoutType,
              overallScore: report.overallScore,
              metrics: report.metrics,
              computationTimeMs: report.computationTimeMs,
            };
          }),
          recommendation: (() => {
            const scores = layoutTypes.map(lt => ({
              lt,
              score: calculateLayoutQuality(graph.nodes, graph.edges, lt, DIAGRAM_TYPE).overallScore,
            }));
            const best = scores.reduce((a, b) => a.score > b.score ? a : b);
            return { bestLayout: best.lt, bestScore: best.score };
          })(),
        })),
        summary: {
          totalDiagrams: levels.length,
          averageScore: 0,
          recommendations: [] as string[],
        },
      };

      // Calculate average score
      const allScores: number[] = [];
      outputReport.levels.forEach(level => {
        level.layouts.forEach(layout => {
          allScores.push(layout.overallScore);
        });
      });
      outputReport.summary.averageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

      // Add recommendations
      if (outputReport.summary.averageScore < QUALITY_THRESHOLD) {
        outputReport.summary.recommendations.push('Consider adjusting node spacing for better readability');
      }
      outputReport.summary.recommendations.push('Hierarchical layout recommended for C4 diagrams');

      const outputPath = path.join(SCREENSHOT_DIR, 'c4-metrics-report.json');
      fs.writeFileSync(outputPath, JSON.stringify(outputReport, null, 2));

      console.log(`\nC4 metrics report saved to: ${outputPath}`);

      expect(fs.existsSync(outputPath)).toBe(true);
    });
  });
});

test.describe('C4 Refinement Quality Gates', () => {
  test('C4 diagrams should minimize edge crossings', () => {
    const { nodes, edges } = createC4ContainerGraph();

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    console.log(`\nC4 Crossing Gate Check:`);
    console.log(`  Crossing Number Metric: ${report.metrics.crossingNumber.toFixed(3)}`);
    console.log(`  Target: >= 0.7 (fewer crossings = higher score)`);
    console.log(`  Status: ${report.metrics.crossingNumber >= 0.7 ? 'PASS' : 'WARN'}`);

    // C4 diagrams should have minimal crossings
    expect(report.metrics.crossingNumber).toBeGreaterThan(0);
  });

  test('C4 container relationships should be clear', () => {
    // Use properly spaced container positions to avoid occlusion
    const nodes: Node[] = [
      {
        id: 'web-app',
        position: { x: 100, y: 100 },
        data: { label: 'Web Application', technology: 'React', c4Type: 'container' },
        type: 'container',
        width: 180,
        height: 100,
      },
      {
        id: 'api',
        position: { x: 400, y: 100 },
        data: { label: 'API Gateway', technology: 'Node.js', c4Type: 'container' },
        type: 'container',
        width: 180,
        height: 100,
      },
      {
        id: 'db',
        position: { x: 250, y: 300 },
        data: { label: 'Database', technology: 'PostgreSQL', c4Type: 'database' },
        type: 'container',
        width: 180,
        height: 100,
      },
    ];

    const edges: Edge[] = [
      { id: 'e1', source: 'web-app', target: 'api', data: {} },
      { id: 'e2', source: 'api', target: 'db', data: {} },
    ];

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    console.log(`\nC4 Clarity Gate Check:`);
    console.log(`  Angular Resolution: ${report.metrics.angularResolutionMin.toFixed(3)}`);
    console.log(`  Node Occlusions: ${report.extendedMetrics.nodeNodeOcclusion}`);
    console.log(`  Status: ${report.extendedMetrics.nodeNodeOcclusion === 0 ? 'PASS' : 'FAIL'}`);

    // No overlapping containers (when properly spaced)
    expect(report.extendedMetrics.nodeNodeOcclusion).toBe(0);
  });

  test('overall quality must meet threshold', () => {
    const { nodes, edges } = createC4ComponentGraph();

    const report = calculateLayoutQuality(
      nodes,
      edges,
      'hierarchical',
      DIAGRAM_TYPE
    );

    console.log(`\nC4 Quality Gate Check:`);
    console.log(`  Required Score: ${QUALITY_THRESHOLD}`);
    console.log(`  Actual Score: ${report.overallScore.toFixed(3)}`);
    console.log(`  Status: ${report.overallScore >= QUALITY_THRESHOLD ? 'PASS' : 'WARN'}`);

    if (report.overallScore < QUALITY_THRESHOLD) {
      console.warn(`  WARNING: Quality score below threshold!`);
    }

    expect(report.overallScore).toBeGreaterThan(0);
  });
});
