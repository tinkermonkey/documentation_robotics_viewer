/**
 * Metrics Report Generation Tests
 *
 * Generates comprehensive quality metrics reports for all diagram types.
 * Outputs JSON reports suitable for CI analysis and historical tracking.
 *
 * Run with: npm run metrics:report
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
  LayoutQualityReport,
  getMetricWeights,
} from '../../src/core/services/metrics/graphReadabilityService';
import {
  MetricsHistoryService,
} from '../../src/core/services/metrics/metricsHistoryService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';

// Test configuration
const OUTPUT_DIR = 'test-results/metrics';
const QUALITY_THRESHOLD = 0.7;

// Ensure output directory exists
test.beforeAll(async () => {
  const dir = path.resolve(OUTPUT_DIR);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

/**
 * Standard test graphs for each diagram type
 */
const TEST_GRAPHS = {
  motivation: createMotivationTestGraph(),
  business: createBusinessTestGraph(),
  c4: createC4TestGraph(),
};

function createMotivationTestGraph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'goal-1', position: { x: 200, y: 0 }, data: { label: 'Strategic Goal 1' }, type: 'goal', width: 200, height: 80 },
      { id: 'goal-2', position: { x: 500, y: 0 }, data: { label: 'Strategic Goal 2' }, type: 'goal', width: 200, height: 80 },
      { id: 'req-1', position: { x: 50, y: 150 }, data: { label: 'Requirement 1' }, type: 'requirement', width: 180, height: 70 },
      { id: 'req-2', position: { x: 250, y: 150 }, data: { label: 'Requirement 2' }, type: 'requirement', width: 180, height: 70 },
      { id: 'req-3', position: { x: 450, y: 150 }, data: { label: 'Requirement 3' }, type: 'requirement', width: 180, height: 70 },
      { id: 'req-4', position: { x: 650, y: 150 }, data: { label: 'Requirement 4' }, type: 'requirement', width: 180, height: 70 },
      { id: 'driver-1', position: { x: 150, y: 300 }, data: { label: 'Business Driver 1' }, type: 'driver', width: 160, height: 60 },
      { id: 'driver-2', position: { x: 450, y: 300 }, data: { label: 'Business Driver 2' }, type: 'driver', width: 160, height: 60 },
      { id: 'stakeholder-1', position: { x: 300, y: 420 }, data: { label: 'Key Stakeholder' }, type: 'stakeholder', width: 180, height: 70 },
    ],
    edges: [
      { id: 'e1', source: 'req-1', target: 'goal-1', type: 'default' },
      { id: 'e2', source: 'req-2', target: 'goal-1', type: 'default' },
      { id: 'e3', source: 'req-3', target: 'goal-2', type: 'default' },
      { id: 'e4', source: 'req-4', target: 'goal-2', type: 'default' },
      { id: 'e5', source: 'driver-1', target: 'req-1', type: 'default' },
      { id: 'e6', source: 'driver-1', target: 'req-2', type: 'default' },
      { id: 'e7', source: 'driver-2', target: 'req-3', type: 'default' },
      { id: 'e8', source: 'driver-2', target: 'req-4', type: 'default' },
      { id: 'e9', source: 'stakeholder-1', target: 'driver-1', type: 'default' },
      { id: 'e10', source: 'stakeholder-1', target: 'driver-2', type: 'default' },
    ],
  };
}

function createBusinessTestGraph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'proc-1', position: { x: 200, y: 0 }, data: { label: 'Core Process 1' }, type: 'process', width: 220, height: 100 },
      { id: 'proc-2', position: { x: 500, y: 0 }, data: { label: 'Core Process 2' }, type: 'process', width: 220, height: 100 },
      { id: 'func-1', position: { x: 50, y: 150 }, data: { label: 'Business Function 1' }, type: 'function', width: 180, height: 80 },
      { id: 'func-2', position: { x: 250, y: 150 }, data: { label: 'Business Function 2' }, type: 'function', width: 180, height: 80 },
      { id: 'func-3', position: { x: 450, y: 150 }, data: { label: 'Business Function 3' }, type: 'function', width: 180, height: 80 },
      { id: 'func-4', position: { x: 650, y: 150 }, data: { label: 'Business Function 4' }, type: 'function', width: 180, height: 80 },
      { id: 'svc-1', position: { x: 150, y: 300 }, data: { label: 'Service 1' }, type: 'service', width: 200, height: 90 },
      { id: 'svc-2', position: { x: 450, y: 300 }, data: { label: 'Service 2' }, type: 'service', width: 200, height: 90 },
      { id: 'cap-1', position: { x: 300, y: 430 }, data: { label: 'Business Capability' }, type: 'capability', width: 200, height: 90 },
    ],
    edges: [
      { id: 'e1', source: 'proc-1', target: 'func-1', type: 'default' },
      { id: 'e2', source: 'proc-1', target: 'func-2', type: 'default' },
      { id: 'e3', source: 'proc-2', target: 'func-3', type: 'default' },
      { id: 'e4', source: 'proc-2', target: 'func-4', type: 'default' },
      { id: 'e5', source: 'func-1', target: 'svc-1', type: 'default' },
      { id: 'e6', source: 'func-2', target: 'svc-1', type: 'default' },
      { id: 'e7', source: 'func-3', target: 'svc-2', type: 'default' },
      { id: 'e8', source: 'func-4', target: 'svc-2', type: 'default' },
      { id: 'e9', source: 'svc-1', target: 'cap-1', type: 'default' },
      { id: 'e10', source: 'svc-2', target: 'cap-1', type: 'default' },
    ],
  };
}

function createC4TestGraph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'user', position: { x: 50, y: 150 }, data: { label: 'User', c4Type: 'person' }, type: 'external-actor', width: 120, height: 100 },
      { id: 'web', position: { x: 250, y: 50 }, data: { label: 'Web Application', c4Type: 'container' }, type: 'container', width: 220, height: 140 },
      { id: 'mobile', position: { x: 500, y: 50 }, data: { label: 'Mobile App', c4Type: 'container' }, type: 'container', width: 220, height: 140 },
      { id: 'api', position: { x: 375, y: 250 }, data: { label: 'API Gateway', c4Type: 'container' }, type: 'container', width: 220, height: 140 },
      { id: 'db', position: { x: 250, y: 450 }, data: { label: 'Database', c4Type: 'database' }, type: 'container', width: 200, height: 120 },
      { id: 'cache', position: { x: 500, y: 450 }, data: { label: 'Cache', c4Type: 'container' }, type: 'container', width: 200, height: 120 },
      { id: 'ext-api', position: { x: 700, y: 250 }, data: { label: 'External API', c4Type: 'external-system' }, type: 'container', width: 180, height: 100 },
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'web', type: 'default' },
      { id: 'e2', source: 'user', target: 'mobile', type: 'default' },
      { id: 'e3', source: 'web', target: 'api', type: 'default' },
      { id: 'e4', source: 'mobile', target: 'api', type: 'default' },
      { id: 'e5', source: 'api', target: 'db', type: 'default' },
      { id: 'e6', source: 'api', target: 'cache', type: 'default' },
      { id: 'e7', source: 'api', target: 'ext-api', type: 'default' },
    ],
  };
}

interface MetricsReportOutput {
  generatedAt: string;
  version: string;
  summary: {
    totalDiagramTypes: number;
    totalLayoutTypes: number;
    overallAverageScore: number;
    belowThreshold: number;
    qualityThreshold: number;
  };
  diagrams: {
    [key in DiagramType]: {
      nodeCount: number;
      edgeCount: number;
      weights: ReturnType<typeof getMetricWeights>;
      layouts: {
        [key in LayoutType]?: {
          overallScore: number;
          meetsThreshold: boolean;
          metrics: LayoutQualityReport['metrics'];
          extendedMetrics: {
            nodeOcclusions: number;
            aspectRatio: number;
            density: number;
            edgeLengthStats: LayoutQualityReport['extendedMetrics']['edgeLength'];
          };
          computationTimeMs: number;
        };
      };
      bestLayout: LayoutType;
      bestScore: number;
    };
  };
  recommendations: string[];
}

test.describe('Metrics Report Generation', () => {
  test('should generate comprehensive metrics report for all diagram types', () => {
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed', 'swimlane', 'matrix', 'radial'];

    const report: MetricsReportOutput = {
      generatedAt: new Date().toISOString(),
      version: '1.0.0',
      summary: {
        totalDiagramTypes: diagramTypes.length,
        totalLayoutTypes: layoutTypes.length,
        overallAverageScore: 0,
        belowThreshold: 0,
        qualityThreshold: QUALITY_THRESHOLD,
      },
      diagrams: {} as MetricsReportOutput['diagrams'],
      recommendations: [],
    };

    const allScores: number[] = [];

    console.log('\n' + '='.repeat(70));
    console.log('           LAYOUT QUALITY METRICS REPORT');
    console.log('='.repeat(70) + '\n');

    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];
      const weights = getMetricWeights(diagramType);

      console.log(`\n${'─'.repeat(70)}`);
      console.log(`  ${diagramType.toUpperCase()} DIAGRAM`);
      console.log(`${'─'.repeat(70)}`);
      console.log(`  Nodes: ${graph.nodes.length}  |  Edges: ${graph.edges.length}`);
      console.log(`  Weights: crossings=${weights.crossingNumber}, uniformity=${weights.edgeLengthUniformity}\n`);

      const diagramResults: MetricsReportOutput['diagrams'][DiagramType] = {
        nodeCount: graph.nodes.length,
        edgeCount: graph.edges.length,
        weights,
        layouts: {},
        bestLayout: 'hierarchical',
        bestScore: 0,
      };

      for (const layoutType of layoutTypes) {
        const quality = calculateLayoutQuality(
          graph.nodes,
          graph.edges,
          layoutType,
          diagramType
        );

        diagramResults.layouts[layoutType] = {
          overallScore: quality.overallScore,
          meetsThreshold: quality.overallScore >= QUALITY_THRESHOLD,
          metrics: quality.metrics,
          extendedMetrics: {
            nodeOcclusions: quality.extendedMetrics.nodeNodeOcclusion,
            aspectRatio: quality.extendedMetrics.aspectRatio,
            density: quality.extendedMetrics.density,
            edgeLengthStats: quality.extendedMetrics.edgeLength,
          },
          computationTimeMs: quality.computationTimeMs,
        };

        if (quality.overallScore > diagramResults.bestScore) {
          diagramResults.bestScore = quality.overallScore;
          diagramResults.bestLayout = layoutType;
        }

        allScores.push(quality.overallScore);

        if (quality.overallScore < QUALITY_THRESHOLD) {
          report.summary.belowThreshold++;
        }

        const status = quality.overallScore >= QUALITY_THRESHOLD ? 'PASS' : 'WARN';
        console.log(
          `  ${layoutType.padEnd(18)} Score: ${quality.overallScore.toFixed(3)}  ` +
          `[${status}]  ${quality.computationTimeMs.toFixed(1)}ms`
        );
      }

      console.log(`\n  Best: ${diagramResults.bestLayout} (${diagramResults.bestScore.toFixed(3)})`);

      report.diagrams[diagramType] = diagramResults;
    }

    // Calculate summary
    report.summary.overallAverageScore = allScores.reduce((a, b) => a + b, 0) / allScores.length;

    // Generate recommendations
    if (report.summary.belowThreshold > 0) {
      report.recommendations.push(
        `${report.summary.belowThreshold} layout combinations are below the quality threshold of ${QUALITY_THRESHOLD}`
      );
    }

    for (const [diagramType, data] of Object.entries(report.diagrams)) {
      if (data.bestLayout !== 'hierarchical') {
        report.recommendations.push(
          `Consider using ${data.bestLayout} layout for ${diagramType} diagrams (best score: ${data.bestScore.toFixed(3)})`
        );
      }
    }

    // Summary output
    console.log('\n' + '='.repeat(70));
    console.log('                         SUMMARY');
    console.log('='.repeat(70));
    console.log(`  Average Score: ${report.summary.overallAverageScore.toFixed(3)}`);
    console.log(`  Below Threshold: ${report.summary.belowThreshold}/${allScores.length}`);
    console.log(`  Quality Threshold: ${QUALITY_THRESHOLD}`);

    if (report.recommendations.length > 0) {
      console.log('\n  Recommendations:');
      report.recommendations.forEach((rec, i) => {
        console.log(`    ${i + 1}. ${rec}`);
      });
    }
    console.log('='.repeat(70) + '\n');

    // Save report
    const outputPath = path.join(OUTPUT_DIR, 'metrics-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(report, null, 2));
    console.log(`Report saved to: ${outputPath}`);

    // Assertions
    expect(report.summary.overallAverageScore).toBeGreaterThan(0);
    expect(Object.keys(report.diagrams).length).toBe(3);
  });

  test('should generate per-diagram detailed reports', () => {
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];

    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];

      // Test all layouts
      const layoutResults: { layout: LayoutType; report: LayoutQualityReport }[] = [];
      const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(graph.nodes, graph.edges, layoutType, diagramType);
        layoutResults.push({ layout: layoutType, report });
      }

      // Generate detailed report
      const detailedReport = {
        diagramType,
        generatedAt: new Date().toISOString(),
        graph: {
          nodeCount: graph.nodes.length,
          edgeCount: graph.edges.length,
          nodeTypes: Array.from(new Set(graph.nodes.map(n => n.type))),
        },
        layouts: layoutResults.map(({ layout, report }) => ({
          layout,
          score: report.overallScore,
          qualityClass: getQualityClass(report.overallScore),
          metrics: {
            crossingNumber: {
              value: report.metrics.crossingNumber,
              description: 'Edge crossing metric (1 = no crossings)',
            },
            crossingAngle: {
              value: report.metrics.crossingAngle,
              description: 'Crossing angle quality (1 = ideal 70° angles)',
            },
            angularResolutionMin: {
              value: report.metrics.angularResolutionMin,
              description: 'Minimum angular resolution (1 = ideal spacing)',
            },
            angularResolutionDev: {
              value: report.metrics.angularResolutionDev,
              description: 'Angular resolution deviation (1 = uniform)',
            },
          },
          extended: {
            nodeOcclusions: report.extendedMetrics.nodeNodeOcclusion,
            aspectRatio: report.extendedMetrics.aspectRatio,
            density: report.extendedMetrics.density,
            edgeLength: {
              mean: report.extendedMetrics.edgeLength.mean,
              stdDev: report.extendedMetrics.edgeLength.stdDev,
              uniformity: report.extendedMetrics.edgeLength.mean > 0
                ? 1 - Math.min(report.extendedMetrics.edgeLength.stdDev / report.extendedMetrics.edgeLength.mean, 1)
                : 1,
            },
          },
          performance: {
            computationTimeMs: report.computationTimeMs,
          },
        })),
        recommendation: layoutResults.reduce((best, curr) =>
          curr.report.overallScore > best.report.overallScore ? curr : best
        ).layout,
      };

      const outputPath = path.join(OUTPUT_DIR, `${diagramType}-detailed-report.json`);
      fs.writeFileSync(outputPath, JSON.stringify(detailedReport, null, 2));

      console.log(`Detailed report saved: ${outputPath}`);

      expect(detailedReport.layouts.length).toBe(2);
    }
  });

  test('should generate CSV-compatible metrics summary', () => {
    const rows: string[] = [
      'diagram_type,layout_type,overall_score,crossing_number,crossing_angle,angular_min,angular_dev,node_occlusions,edge_uniformity,computation_ms',
    ];

    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(graph.nodes, graph.edges, layoutType, diagramType);

        const edgeUniformity = report.extendedMetrics.edgeLength.mean > 0
          ? 1 - Math.min(report.extendedMetrics.edgeLength.stdDev / report.extendedMetrics.edgeLength.mean, 1)
          : 1;

        rows.push([
          diagramType,
          layoutType,
          report.overallScore.toFixed(4),
          report.metrics.crossingNumber.toFixed(4),
          report.metrics.crossingAngle.toFixed(4),
          report.metrics.angularResolutionMin.toFixed(4),
          report.metrics.angularResolutionDev.toFixed(4),
          report.extendedMetrics.nodeNodeOcclusion.toString(),
          edgeUniformity.toFixed(4),
          report.computationTimeMs.toFixed(2),
        ].join(','));
      }
    }

    const csvContent = rows.join('\n');
    const outputPath = path.join(OUTPUT_DIR, 'metrics-summary.csv');
    fs.writeFileSync(outputPath, csvContent);

    console.log(`CSV summary saved: ${outputPath}`);
    console.log('\nCSV Preview:');
    rows.slice(0, 5).forEach(row => console.log(`  ${row}`));

    expect(rows.length).toBe(7); // Header + 6 combinations
  });
});

test.describe('Metrics History Report', () => {
  // Note: These tests require localStorage which is only available in browser context
  let metricsService: MetricsHistoryService;
  let hasLocalStorage: boolean;

  test.beforeAll(() => {
    hasLocalStorage = typeof localStorage !== 'undefined';
    if (!hasLocalStorage) {
      return;
    }
    metricsService = new MetricsHistoryService({
      storageKeyPrefix: 'test-metrics-report',
    });
    metricsService.clearAll();
  });

  test.afterAll(() => {
    if (hasLocalStorage && metricsService) {
      metricsService.clearAll();
    }
  });

  test('should generate metrics history snapshot', () => {
    test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];

    // Save snapshots for each diagram type
    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];
      const report = calculateLayoutQuality(graph.nodes, graph.edges, 'hierarchical', diagramType);

      metricsService.saveSnapshot(report, {
        label: `CI Report - ${diagramType}`,
        modelId: 'ci-metrics-report',
        setAsBaseline: true,
      });
    }

    // Generate history report
    const stats = metricsService.getStorageStats();

    const historyReport = {
      generatedAt: new Date().toISOString(),
      stats,
      snapshots: metricsService.getSnapshots({ modelId: 'ci-metrics-report' }).map(s => ({
        id: s.id,
        label: s.label,
        diagramType: s.report.diagramType,
        layoutType: s.report.layoutType,
        score: s.report.overallScore,
        isBaseline: s.isBaseline,
        timestamp: s.report.timestamp,
      })),
    };

    const outputPath = path.join(OUTPUT_DIR, 'metrics-history-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(historyReport, null, 2));

    console.log(`History report saved: ${outputPath}`);
    console.log(`  Total snapshots: ${stats.totalSnapshots}`);
    console.log(`  Baselines: ${stats.baselineCount}`);

    expect(stats.totalSnapshots).toBe(3);
  });
});

test.describe('Quality Analysis', () => {
  test('should identify quality issues across diagrams', () => {
    const issues: { diagram: DiagramType; layout: LayoutType; issue: string; severity: string }[] = [];

    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];

      for (const layoutType of layoutTypes) {
        const report = calculateLayoutQuality(graph.nodes, graph.edges, layoutType, diagramType);

        // Check for issues
        if (report.metrics.crossingNumber < 0.7) {
          issues.push({
            diagram: diagramType,
            layout: layoutType,
            issue: `High edge crossings (${report.metrics.crossingNumber.toFixed(3)})`,
            severity: report.metrics.crossingNumber < 0.5 ? 'high' : 'medium',
          });
        }

        if (report.extendedMetrics.nodeNodeOcclusion > 0) {
          issues.push({
            diagram: diagramType,
            layout: layoutType,
            issue: `Node overlaps detected (${report.extendedMetrics.nodeNodeOcclusion})`,
            severity: 'high',
          });
        }

        const edgeCV = report.extendedMetrics.edgeLength.mean > 0
          ? report.extendedMetrics.edgeLength.stdDev / report.extendedMetrics.edgeLength.mean
          : 0;

        if (edgeCV > 0.5) {
          issues.push({
            diagram: diagramType,
            layout: layoutType,
            issue: `Inconsistent edge lengths (CV=${edgeCV.toFixed(3)})`,
            severity: edgeCV > 1.0 ? 'high' : 'medium',
          });
        }

        if (report.overallScore < QUALITY_THRESHOLD) {
          issues.push({
            diagram: diagramType,
            layout: layoutType,
            issue: `Below quality threshold (${report.overallScore.toFixed(3)} < ${QUALITY_THRESHOLD})`,
            severity: report.overallScore < 0.5 ? 'high' : 'medium',
          });
        }
      }
    }

    // Output issues
    console.log('\nQuality Issues Analysis:');
    console.log('─'.repeat(80));

    if (issues.length === 0) {
      console.log('  No significant quality issues detected');
    } else {
      issues.forEach(({ diagram, layout, issue, severity }) => {
        const severityIcon = severity === 'high' ? '!' : '-';
        console.log(`  [${severityIcon}] ${diagram}/${layout}: ${issue}`);
      });
    }

    console.log('─'.repeat(80));

    // Save issues report
    const issuesReport = {
      generatedAt: new Date().toISOString(),
      totalIssues: issues.length,
      highSeverity: issues.filter(i => i.severity === 'high').length,
      mediumSeverity: issues.filter(i => i.severity === 'medium').length,
      issues,
    };

    const outputPath = path.join(OUTPUT_DIR, 'quality-issues-report.json');
    fs.writeFileSync(outputPath, JSON.stringify(issuesReport, null, 2));

    console.log(`\nIssues report saved: ${outputPath}`);

    // Don't fail on issues, just report
    expect(issuesReport.totalIssues).toBeDefined();
  });
});

function getQualityClass(score: number): string {
  if (score >= 0.9) return 'excellent';
  if (score >= 0.8) return 'good';
  if (score >= 0.7) return 'acceptable';
  if (score >= 0.5) return 'poor';
  return 'unacceptable';
}
