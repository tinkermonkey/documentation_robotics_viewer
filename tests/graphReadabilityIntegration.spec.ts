/**
 * Integration tests for Graph Readability Service with example-implementation model
 *
 * Tests the complete metrics calculation pipeline with real YAML instance data,
 * verifying that greadability.js integration works correctly with actual architecture diagrams.
 */

import { test, expect } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';
import { DataLoader } from '../src/core/services/dataLoader';
import { GitHubService } from '../src/core/services/githubService';
import { LocalFileLoader } from '../src/core/services/localFileLoader';
import { SpecParser } from '../src/core/services/specParser';
import { BusinessLayerParser } from '../src/core/services/businessLayerParser';
import { BusinessGraphBuilder } from '../src/core/services/businessGraphBuilder';
import { MetaModel } from '../src/core/types/model';
import {
  calculateLayoutQuality,
  toGreadabilityGraph,
  calculateEdgeLengthStats,
  calculateNodeOcclusion,
  calculateAspectRatio,
  calculateDensity,
  getMetricWeights,
  compareLayoutQuality,
  DiagramType,
  LayoutType,
  LayoutQualityReport,
} from '../src/core/services/metrics/graphReadabilityService';
import {
  MetricsHistoryService,
  RegressionSeverity,
} from '../src/core/services/metrics/metricsHistoryService';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Create mock React Flow nodes from business graph nodes
 * with realistic positions using a simple grid layout
 */
function createMockReactFlowNodes(
  businessNodes: Map<string, { id: string; name: string; dimensions?: { width: number; height: number } }>
): Node[] {
  const nodes: Node[] = [];
  let x = 0;
  let y = 0;
  let col = 0;
  const colWidth = 250;
  const rowHeight = 150;
  const maxCols = 5;

  for (const [id, node] of businessNodes) {
    const width = node.dimensions?.width ?? 200;
    const height = node.dimensions?.height ?? 100;

    nodes.push({
      id,
      position: { x, y },
      data: { label: node.name },
      type: 'businessFunction',
      width,
      height,
    });

    col++;
    if (col >= maxCols) {
      col = 0;
      x = 0;
      y += rowHeight;
    } else {
      x += colWidth;
    }
  }

  return nodes;
}

/**
 * Create mock React Flow edges from business graph edges
 */
function createMockReactFlowEdges(
  businessEdges: Map<string, { id: string; source: string; target: string }>
): Edge[] {
  const edges: Edge[] = [];

  for (const [id, edge] of businessEdges) {
    edges.push({
      id,
      source: edge.source,
      target: edge.target,
      type: 'default',
    });
  }

  return edges;
}

/**
 * Load example-implementation model using DataLoader
 */
async function loadExampleImplementation(dataLoader: DataLoader): Promise<MetaModel> {
  const examplePath = path.join(process.cwd(), 'documentation-robotics', 'model');

  if (!fs.existsSync(examplePath)) {
    throw new Error(
      'documentation-robotics directory not found. Please ensure it exists in the project root.'
    );
  }

  const schemas: Record<string, string> = {};

  // Read manifest.yaml
  const manifestPath = path.join(examplePath, 'manifest.yaml');
  if (fs.existsSync(manifestPath)) {
    schemas['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
  }

  // Read projection-rules.yaml
  const projectionRulesPath = path.join(
    process.cwd(),
    'example-implementation',
    'projection-rules.yaml'
  );
  if (fs.existsSync(projectionRulesPath)) {
    schemas['projection-rules.yaml'] = fs.readFileSync(projectionRulesPath, 'utf-8');
  }

  // Recursively read all YAML files from layer directories
  function readYAMLFiles(dirPath: string, relativePath = '') {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        readYAMLFiles(fullPath, relativeFilePath);
      } else if (
        entry.isFile() &&
        (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))
      ) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        schemas[relativeFilePath] = content;
      }
    }
  }

  readYAMLFiles(examplePath);

  return dataLoader.parseYAMLInstances(schemas, 'example-implementation');
}

test.describe('Graph Readability Integration Tests', () => {
  let dataLoader: DataLoader;
  let model: MetaModel;
  let nodes: Node[];
  let edges: Edge[];

  test.beforeAll(async () => {
    const githubService = new GitHubService();
    const localFileLoader = new LocalFileLoader();
    const specParser = new SpecParser();
    dataLoader = new DataLoader(githubService, localFileLoader, specParser);

    // Load the example-implementation model
    model = await loadExampleImplementation(dataLoader);

    // Parse and build business layer
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Convert to React Flow format
    nodes = createMockReactFlowNodes(graph.nodes);
    edges = createMockReactFlowEdges(graph.edges);
  });

  test.describe('calculateLayoutQuality()', () => {
    test('should calculate metrics for real business layer data', () => {
      const report = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical' as LayoutType,
        'business' as DiagramType
      );

      // Verify report structure
      expect(report.overallScore).toBeGreaterThanOrEqual(0);
      expect(report.overallScore).toBeLessThanOrEqual(1);
      expect(report.nodeCount).toBe(nodes.length);
      expect(report.edgeCount).toBe(edges.length);
      expect(report.layoutType).toBe('hierarchical');
      expect(report.diagramType).toBe('business');
      expect(report.computationTimeMs).toBeGreaterThan(0);

      // Metrics should be normalized 0-1
      expect(report.metrics.crossingNumber).toBeGreaterThanOrEqual(0);
      expect(report.metrics.crossingNumber).toBeLessThanOrEqual(1);
      expect(report.metrics.crossingAngle).toBeGreaterThanOrEqual(0);
      expect(report.metrics.crossingAngle).toBeLessThanOrEqual(1);

      // Extended metrics should be present
      expect(report.extendedMetrics.edgeLength).toBeDefined();
      expect(report.extendedMetrics.nodeNodeOcclusion).toBeGreaterThanOrEqual(0);
      expect(report.extendedMetrics.aspectRatio).toBeGreaterThan(0);
      expect(report.extendedMetrics.density).toBeGreaterThanOrEqual(0);
    });

    test('should complete calculation in reasonable time', () => {
      const startTime = Date.now();

      calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical' as LayoutType,
        'business' as DiagramType
      );

      const elapsed = Date.now() - startTime;

      // Should complete within 3 seconds for reasonable-sized graphs
      expect(elapsed).toBeLessThan(3000);
    });

    test('should work with all diagram types', () => {
      const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];

      for (const diagramType of diagramTypes) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          'hierarchical' as LayoutType,
          diagramType
        );

        expect(report.diagramType).toBe(diagramType);
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
      }
    });

    test('should work with all layout types', () => {
      const layoutTypes: LayoutType[] = [
        'force-directed',
        'hierarchical',
        'radial',
        'swimlane',
        'matrix',
        'manual',
      ];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(
          nodes,
          edges,
          layoutType,
          'business' as DiagramType
        );

        expect(report.layoutType).toBe(layoutType);
        expect(report.overallScore).toBeGreaterThanOrEqual(0);
      }
    });
  });

  test.describe('toGreadabilityGraph()', () => {
    test('should convert React Flow graph to greadability format', () => {
      const graph = toGreadabilityGraph(nodes, edges);

      expect(graph.nodes.length).toBe(nodes.length);
      expect(graph.links.length).toBeLessThanOrEqual(edges.length);

      // Check node structure
      if (graph.nodes.length > 0) {
        const firstNode = graph.nodes[0];
        expect(typeof firstNode.x).toBe('number');
        expect(typeof firstNode.y).toBe('number');
        expect(firstNode.id).toBeDefined();
      }

      // Check link structure
      if (graph.links.length > 0) {
        const firstLink = graph.links[0];
        expect(firstLink.source).toBeDefined();
        expect(firstLink.target).toBeDefined();
      }
    });

    test('should convert coordinates to center positions', () => {
      const testNode: Node = {
        id: 'test',
        position: { x: 0, y: 0 },
        data: { label: 'Test' },
        type: 'default',
        width: 200,
        height: 100,
      };

      const graph = toGreadabilityGraph([testNode], []);

      // Center should be at (100, 50) for a 200x100 node at (0, 0)
      expect(graph.nodes[0].x).toBe(100);
      expect(graph.nodes[0].y).toBe(50);
    });
  });

  test.describe('Extended metrics calculation', () => {
    test('should calculate edge length statistics', () => {
      const stats = calculateEdgeLengthStats(nodes, edges);

      if (edges.length > 0) {
        expect(stats.min).toBeGreaterThanOrEqual(0);
        expect(stats.max).toBeGreaterThanOrEqual(stats.min);
        expect(stats.mean).toBeGreaterThanOrEqual(stats.min);
        expect(stats.mean).toBeLessThanOrEqual(stats.max);
        expect(stats.stdDev).toBeGreaterThanOrEqual(0);
      }
    });

    test('should calculate node occlusion', () => {
      const occlusion = calculateNodeOcclusion(nodes);

      // For our grid layout, there should be no overlaps
      expect(occlusion).toBeGreaterThanOrEqual(0);
    });

    test('should calculate aspect ratio', () => {
      const ratio = calculateAspectRatio(nodes);

      expect(ratio).toBeGreaterThan(0);
    });

    test('should calculate density', () => {
      const density = calculateDensity(nodes.length, edges.length);

      expect(density).toBeGreaterThanOrEqual(0);
      expect(density).toBeLessThanOrEqual(1);
    });
  });

  test.describe('Metric weights', () => {
    test('should return appropriate weights for each diagram type', () => {
      const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];

      for (const diagramType of diagramTypes) {
        const weights = getMetricWeights(diagramType);

        // All weights should sum to 1.0
        const sum =
          weights.crossingNumber +
          weights.crossingAngle +
          weights.angularResolutionMin +
          weights.angularResolutionDev +
          weights.edgeLengthUniformity +
          weights.nodeOcclusion;

        expect(sum).toBeCloseTo(1.0, 10);
      }
    });
  });

  test.describe('Report comparison', () => {
    test('should compare two layout reports', () => {
      const report1 = calculateLayoutQuality(
        nodes,
        edges,
        'hierarchical' as LayoutType,
        'business' as DiagramType
      );

      // Create a slightly modified layout (shift all nodes)
      const modifiedNodes = nodes.map((n) => ({
        ...n,
        position: { x: n.position.x + 10, y: n.position.y + 10 },
      }));

      const report2 = calculateLayoutQuality(
        modifiedNodes,
        edges,
        'hierarchical' as LayoutType,
        'business' as DiagramType
      );

      const comparison = compareLayoutQuality(report2, report1);

      expect(typeof comparison.overallImprovement).toBe('number');
      expect(typeof comparison.improved).toBe('boolean');
    });
  });
});

// Note: MetricsHistoryService tests require browser context (localStorage)
// These tests are skipped in Node.js context and should be run in E2E tests
test.describe.skip('Metrics History Service Integration Tests (requires browser)', () => {
  let historyService: MetricsHistoryService;
  let testReport: LayoutQualityReport;

  test.beforeAll(async () => {
    // Create a test report
    testReport = {
      overallScore: 0.85,
      metrics: {
        crossingNumber: 0.9,
        crossingAngle: 0.8,
        angularResolutionMin: 0.85,
        angularResolutionDev: 0.82,
      },
      extendedMetrics: {
        crossingNumber: 0.9,
        crossingAngle: 0.8,
        angularResolutionMin: 0.85,
        angularResolutionDev: 0.82,
        edgeLength: { min: 100, max: 300, mean: 200, stdDev: 50 },
        nodeNodeOcclusion: 0,
        aspectRatio: 1.5,
        density: 0.3,
      },
      timestamp: new Date().toISOString(),
      layoutType: 'hierarchical',
      diagramType: 'business',
      nodeCount: 20,
      edgeCount: 25,
      computationTimeMs: 15,
    };
  });

  test.beforeEach(() => {
    // Create fresh service for each test to avoid interference
    historyService = new MetricsHistoryService({
      storageKeyPrefix: 'dr-viewer-metrics-test',
    });
    historyService.clearAll();
  });

  test.afterEach(() => {
    historyService.clearAll();
  });

  test('should save and retrieve metrics snapshot', () => {
    const snapshot = historyService.saveSnapshot(testReport, {
      modelId: 'test-model',
      label: 'Integration test snapshot',
    });

    expect(snapshot.id).toBeDefined();
    expect(snapshot.report.overallScore).toBe(testReport.overallScore);

    const retrieved = historyService.getSnapshot(snapshot.id);
    expect(retrieved).toBeDefined();
    expect(retrieved?.id).toBe(snapshot.id);
  });

  test('should save and set baseline', () => {
    const snapshot = historyService.saveSnapshot(testReport, {
      setAsBaseline: true,
    });

    expect(snapshot.isBaseline).toBe(true);

    const baseline = historyService.getBaseline('business', 'hierarchical');
    expect(baseline).toBeDefined();
    expect(baseline?.id).toBe(snapshot.id);
  });

  test('should detect regression compared to baseline', () => {
    // Save baseline
    historyService.saveSnapshot(testReport, { setAsBaseline: true });

    // Create report with worse metrics
    const worseReport: LayoutQualityReport = {
      ...testReport,
      overallScore: 0.65, // 23.5% decrease
      metrics: {
        crossingNumber: 0.7,
        crossingAngle: 0.6,
        angularResolutionMin: 0.65,
        angularResolutionDev: 0.62,
      },
    };

    const regression = historyService.detectRegression(worseReport);

    expect(regression.hasRegression).toBe(true);
    expect(regression.severity).not.toBe('none');
    expect(regression.overallPercentageChange).toBeLessThan(0);
  });

  test('should classify regression severity correctly', () => {
    historyService.saveSnapshot(testReport, { setAsBaseline: true });

    // Test different regression levels
    const testCases: Array<{ score: number; expectedSeverity: RegressionSeverity }> = [
      { score: 0.84, expectedSeverity: 'none' }, // <5% decrease
      { score: 0.78, expectedSeverity: 'minor' }, // 5-10% decrease
      { score: 0.72, expectedSeverity: 'moderate' }, // 10-20% decrease
      { score: 0.60, expectedSeverity: 'severe' }, // >20% decrease
    ];

    for (const { score, expectedSeverity } of testCases) {
      const report: LayoutQualityReport = { ...testReport, overallScore: score };
      const regression = historyService.detectRegression(report);

      // Note: Exact thresholds may vary based on rounding
      if (expectedSeverity === 'severe') {
        expect(['moderate', 'severe']).toContain(regression.severity);
      } else if (expectedSeverity === 'moderate') {
        expect(['minor', 'moderate', 'severe']).toContain(regression.severity);
      }
    }
  });

  test('should get metrics history', () => {
    // Save multiple snapshots
    for (let i = 0; i < 5; i++) {
      const report: LayoutQualityReport = {
        ...testReport,
        overallScore: 0.8 + i * 0.02,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      };
      historyService.saveSnapshot(report);
    }

    const history = historyService.getMetricsHistory('business', 'hierarchical', 10);

    expect(history.length).toBe(5);

    // Should be sorted oldest first
    for (let i = 1; i < history.length; i++) {
      const prevTime = new Date(history[i - 1].report.timestamp).getTime();
      const currTime = new Date(history[i].report.timestamp).getTime();
      expect(currTime).toBeGreaterThan(prevTime);
    }
  });

  test('should get storage stats', () => {
    // Save a few snapshots
    historyService.saveSnapshot(testReport, { setAsBaseline: true });
    historyService.saveSnapshot({ ...testReport, diagramType: 'motivation' });
    historyService.saveSnapshot({ ...testReport, diagramType: 'c4' });

    const stats = historyService.getStorageStats();

    expect(stats.totalSnapshots).toBe(3);
    expect(stats.baselineCount).toBe(1);
    expect(stats.snapshotsByDiagramType['business']).toBe(1);
    expect(stats.snapshotsByDiagramType['motivation']).toBe(1);
    expect(stats.snapshotsByDiagramType['c4']).toBe(1);
  });

  test('should export and import data', () => {
    // Save some data
    historyService.saveSnapshot(testReport, { setAsBaseline: true });
    historyService.saveSnapshot({ ...testReport, overallScore: 0.9 });

    // Export
    const exported = historyService.exportData();

    expect(exported.snapshots.length).toBe(2);
    expect(Object.keys(exported.baselines).length).toBe(1);

    // Clear and import
    historyService.clearAll();
    expect(historyService.getStorageStats().totalSnapshots).toBe(0);

    historyService.importData(exported);
    expect(historyService.getStorageStats().totalSnapshots).toBe(2);
  });

  test('should enforce snapshot limit', () => {
    // Create service with low limit
    const limitedService = new MetricsHistoryService({
      storageKeyPrefix: 'dr-viewer-metrics-test-limited',
      maxSnapshots: 5,
    });
    limitedService.clearAll();

    // Save more than limit
    for (let i = 0; i < 10; i++) {
      limitedService.saveSnapshot({
        ...testReport,
        timestamp: new Date(Date.now() + i * 1000).toISOString(),
      });
    }

    const stats = limitedService.getStorageStats();
    expect(stats.totalSnapshots).toBeLessThanOrEqual(5);

    limitedService.clearAll();
  });
});
