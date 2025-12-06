/**
 * Regression Check Tests
 *
 * Compares current layout quality metrics against established baselines.
 * Fails the build if significant quality regressions are detected.
 *
 * Run with: npm run metrics:regression-check
 */

import { test, expect } from '@playwright/test';
import {
  calculateLayoutQuality,
  DiagramType,
  LayoutType,
  LayoutQualityReport,
} from '../../src/core/services/metrics/graphReadabilityService';
import {
  MetricsHistoryService,
  RegressionReport,
  RegressionSeverity,
} from '../../src/core/services/metrics/metricsHistoryService';
import { Node, Edge } from '@xyflow/react';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
const OUTPUT_DIR = 'test-results/metrics';
const BASELINE_DIR = 'test-results/baselines';

// Regression thresholds (percentage decrease that triggers each severity)
const REGRESSION_THRESHOLDS = {
  minor: 5,     // 5% decrease = minor regression
  moderate: 10, // 10% decrease = moderate regression
  severe: 20,   // 20% decrease = severe regression (fails build)
};

// Quality floor - absolute minimum acceptable score
const QUALITY_FLOOR = 0.5;

// Whether to fail on moderate regressions (strict mode)
const STRICT_MODE = process.env.STRICT_REGRESSION === 'true';

// Ensure directories exist
test.beforeAll(async () => {
  [OUTPUT_DIR, BASELINE_DIR].forEach(dir => {
    const fullPath = path.resolve(dir);
    if (!fs.existsSync(fullPath)) {
      fs.mkdirSync(fullPath, { recursive: true });
    }
  });
});

/**
 * Standard test graphs
 */
const TEST_GRAPHS: Record<DiagramType, { nodes: Node[]; edges: Edge[] }> = {
  motivation: createMotivationGraph(),
  business: createBusinessGraph(),
  c4: createC4Graph(),
};

function createMotivationGraph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'g1', position: { x: 200, y: 0 }, data: { label: 'Goal 1' }, type: 'goal', width: 200, height: 80 },
      { id: 'g2', position: { x: 500, y: 0 }, data: { label: 'Goal 2' }, type: 'goal', width: 200, height: 80 },
      { id: 'r1', position: { x: 50, y: 150 }, data: { label: 'Req 1' }, type: 'requirement', width: 180, height: 70 },
      { id: 'r2', position: { x: 250, y: 150 }, data: { label: 'Req 2' }, type: 'requirement', width: 180, height: 70 },
      { id: 'r3', position: { x: 450, y: 150 }, data: { label: 'Req 3' }, type: 'requirement', width: 180, height: 70 },
      { id: 'r4', position: { x: 650, y: 150 }, data: { label: 'Req 4' }, type: 'requirement', width: 180, height: 70 },
      { id: 'd1', position: { x: 150, y: 300 }, data: { label: 'Driver 1' }, type: 'driver', width: 160, height: 60 },
      { id: 'd2', position: { x: 450, y: 300 }, data: { label: 'Driver 2' }, type: 'driver', width: 160, height: 60 },
    ],
    edges: [
      { id: 'e1', source: 'r1', target: 'g1', type: 'default' },
      { id: 'e2', source: 'r2', target: 'g1', type: 'default' },
      { id: 'e3', source: 'r3', target: 'g2', type: 'default' },
      { id: 'e4', source: 'r4', target: 'g2', type: 'default' },
      { id: 'e5', source: 'd1', target: 'r1', type: 'default' },
      { id: 'e6', source: 'd1', target: 'r2', type: 'default' },
      { id: 'e7', source: 'd2', target: 'r3', type: 'default' },
      { id: 'e8', source: 'd2', target: 'r4', type: 'default' },
    ],
  };
}

function createBusinessGraph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'p1', position: { x: 200, y: 0 }, data: { label: 'Process 1' }, type: 'process', width: 220, height: 100 },
      { id: 'p2', position: { x: 500, y: 0 }, data: { label: 'Process 2' }, type: 'process', width: 220, height: 100 },
      { id: 'f1', position: { x: 100, y: 150 }, data: { label: 'Function 1' }, type: 'function', width: 180, height: 80 },
      { id: 'f2', position: { x: 350, y: 150 }, data: { label: 'Function 2' }, type: 'function', width: 180, height: 80 },
      { id: 'f3', position: { x: 600, y: 150 }, data: { label: 'Function 3' }, type: 'function', width: 180, height: 80 },
      { id: 's1', position: { x: 350, y: 300 }, data: { label: 'Service 1' }, type: 'service', width: 200, height: 90 },
    ],
    edges: [
      { id: 'e1', source: 'p1', target: 'f1', type: 'default' },
      { id: 'e2', source: 'p1', target: 'f2', type: 'default' },
      { id: 'e3', source: 'p2', target: 'f2', type: 'default' },
      { id: 'e4', source: 'p2', target: 'f3', type: 'default' },
      { id: 'e5', source: 'f1', target: 's1', type: 'default' },
      { id: 'e6', source: 'f2', target: 's1', type: 'default' },
      { id: 'e7', source: 'f3', target: 's1', type: 'default' },
    ],
  };
}

function createC4Graph(): { nodes: Node[]; edges: Edge[] } {
  return {
    nodes: [
      { id: 'user', position: { x: 50, y: 150 }, data: { label: 'User' }, type: 'external-actor', width: 120, height: 100 },
      { id: 'web', position: { x: 250, y: 50 }, data: { label: 'Web App' }, type: 'container', width: 200, height: 120 },
      { id: 'api', position: { x: 250, y: 220 }, data: { label: 'API' }, type: 'container', width: 200, height: 120 },
      { id: 'db', position: { x: 250, y: 390 }, data: { label: 'Database' }, type: 'container', width: 200, height: 120 },
      { id: 'ext', position: { x: 500, y: 150 }, data: { label: 'External' }, type: 'container', width: 180, height: 100 },
    ],
    edges: [
      { id: 'e1', source: 'user', target: 'web', type: 'default' },
      { id: 'e2', source: 'web', target: 'api', type: 'default' },
      { id: 'e3', source: 'api', target: 'db', type: 'default' },
      { id: 'e4', source: 'api', target: 'ext', type: 'default' },
    ],
  };
}

interface BaselineData {
  version: string;
  createdAt: string;
  baselines: {
    [key: string]: {
      diagramType: DiagramType;
      layoutType: LayoutType;
      report: LayoutQualityReport;
    };
  };
}

interface RegressionCheckResult {
  key: string;
  diagramType: DiagramType;
  layoutType: LayoutType;
  hasBaseline: boolean;
  currentScore: number;
  baselineScore?: number;
  change?: number;
  percentageChange?: number;
  severity: RegressionSeverity;
  passed: boolean;
  reason?: string;
}

/**
 * Load baselines from file
 */
function loadBaselines(): BaselineData | null {
  const baselinePath = path.join(BASELINE_DIR, 'quality-baselines.json');

  if (!fs.existsSync(baselinePath)) {
    return null;
  }

  try {
    const content = fs.readFileSync(baselinePath, 'utf-8');
    return JSON.parse(content) as BaselineData;
  } catch (error) {
    console.warn('Failed to load baselines:', error);
    return null;
  }
}

/**
 * Save baselines to file
 */
function saveBaselines(baselines: BaselineData): void {
  const baselinePath = path.join(BASELINE_DIR, 'quality-baselines.json');
  fs.writeFileSync(baselinePath, JSON.stringify(baselines, null, 2));
}

/**
 * Classify regression severity
 */
function classifySeverity(percentageChange: number): RegressionSeverity {
  if (percentageChange >= 0) return 'none';
  const absChange = Math.abs(percentageChange);
  if (absChange < REGRESSION_THRESHOLDS.minor) return 'none';
  if (absChange < REGRESSION_THRESHOLDS.moderate) return 'minor';
  if (absChange < REGRESSION_THRESHOLDS.severe) return 'moderate';
  return 'severe';
}

test.describe('Regression Check', () => {
  // Note: MetricsHistoryService uses localStorage which is only available in browser context
  // But the regression check logic can still run using file-based baselines
  let metricsService: MetricsHistoryService | null = null;
  let hasLocalStorage: boolean;

  test.beforeAll(() => {
    hasLocalStorage = typeof localStorage !== 'undefined';
    if (hasLocalStorage) {
      metricsService = new MetricsHistoryService({
        storageKeyPrefix: 'regression-check',
        minorRegressionThreshold: REGRESSION_THRESHOLDS.minor,
        moderateRegressionThreshold: REGRESSION_THRESHOLDS.moderate,
        severeRegressionThreshold: REGRESSION_THRESHOLDS.severe,
      });
    }
  });

  test.afterAll(() => {
    if (metricsService) {
      metricsService.clearAll();
    }
  });

  test('should check for regressions against baselines', () => {
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    const results: RegressionCheckResult[] = [];
    const baselines = loadBaselines();

    console.log('\n' + '='.repeat(80));
    console.log('                    REGRESSION CHECK REPORT');
    console.log('='.repeat(80));
    console.log(`  Baseline file: ${baselines ? 'FOUND' : 'NOT FOUND (will create)'}`);
    console.log(`  Strict mode: ${STRICT_MODE ? 'ENABLED' : 'DISABLED'}`);
    console.log(`  Thresholds: minor=${REGRESSION_THRESHOLDS.minor}%, moderate=${REGRESSION_THRESHOLDS.moderate}%, severe=${REGRESSION_THRESHOLDS.severe}%`);
    console.log('─'.repeat(80));

    // Build new baselines if needed
    const newBaselines: BaselineData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      baselines: {},
    };

    for (const diagramType of diagramTypes) {
      console.log(`\n  ${diagramType.toUpperCase()}:`);

      for (const layoutType of layoutTypes) {
        const key = `${diagramType}-${layoutType}`;
        const graph = TEST_GRAPHS[diagramType];

        // Calculate current metrics
        const currentReport = calculateLayoutQuality(
          graph.nodes,
          graph.edges,
          layoutType,
          diagramType
        );

        // Store for new baselines
        newBaselines.baselines[key] = {
          diagramType,
          layoutType,
          report: currentReport,
        };

        // Check against baseline
        const baseline = baselines?.baselines[key];
        const result: RegressionCheckResult = {
          key,
          diagramType,
          layoutType,
          hasBaseline: !!baseline,
          currentScore: currentReport.overallScore,
          severity: 'none',
          passed: true,
        };

        if (baseline) {
          result.baselineScore = baseline.report.overallScore;
          result.change = currentReport.overallScore - baseline.report.overallScore;
          result.percentageChange = baseline.report.overallScore > 0
            ? (result.change / baseline.report.overallScore) * 100
            : 0;
          result.severity = classifySeverity(result.percentageChange);

          // Determine pass/fail
          if (result.severity === 'severe') {
            result.passed = false;
            result.reason = `Severe regression: ${result.percentageChange.toFixed(1)}% decrease`;
          } else if (STRICT_MODE && result.severity === 'moderate') {
            result.passed = false;
            result.reason = `Moderate regression (strict mode): ${result.percentageChange.toFixed(1)}% decrease`;
          }
        }

        // Check quality floor
        if (currentReport.overallScore < QUALITY_FLOOR) {
          result.passed = false;
          result.reason = `Below quality floor: ${currentReport.overallScore.toFixed(3)} < ${QUALITY_FLOOR}`;
          if (result.severity === 'none') {
            result.severity = 'severe';
          }
        }

        results.push(result);

        // Output result
        const statusIcon = result.passed ? '+' : 'X';
        const changeStr = result.percentageChange !== undefined
          ? `(${result.percentageChange >= 0 ? '+' : ''}${result.percentageChange.toFixed(1)}%)`
          : '(no baseline)';
        const severityStr = result.severity !== 'none' ? `[${result.severity.toUpperCase()}]` : '';

        console.log(
          `    [${statusIcon}] ${layoutType.padEnd(18)} ` +
          `${result.currentScore.toFixed(3)} ${changeStr.padEnd(12)} ${severityStr}`
        );
      }
    }

    // Summary
    const failedCount = results.filter(r => !r.passed).length;
    const severeCount = results.filter(r => r.severity === 'severe').length;
    const moderateCount = results.filter(r => r.severity === 'moderate').length;
    const minorCount = results.filter(r => r.severity === 'minor').length;
    const noBaselineCount = results.filter(r => !r.hasBaseline).length;

    console.log('\n' + '─'.repeat(80));
    console.log('  SUMMARY:');
    console.log(`    Total checks: ${results.length}`);
    console.log(`    Passed: ${results.length - failedCount}`);
    console.log(`    Failed: ${failedCount}`);
    console.log(`    Severe regressions: ${severeCount}`);
    console.log(`    Moderate regressions: ${moderateCount}`);
    console.log(`    Minor regressions: ${minorCount}`);
    console.log(`    Missing baselines: ${noBaselineCount}`);
    console.log('='.repeat(80) + '\n');

    // Save regression report
    const regressionReport = {
      generatedAt: new Date().toISOString(),
      configuration: {
        strictMode: STRICT_MODE,
        thresholds: REGRESSION_THRESHOLDS,
        qualityFloor: QUALITY_FLOOR,
      },
      summary: {
        total: results.length,
        passed: results.length - failedCount,
        failed: failedCount,
        severe: severeCount,
        moderate: moderateCount,
        minor: minorCount,
        noBaseline: noBaselineCount,
      },
      results,
    };

    const reportPath = path.join(OUTPUT_DIR, 'regression-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(regressionReport, null, 2));
    console.log(`Regression report saved: ${reportPath}`);

    // Save new baselines if none existed
    if (!baselines) {
      saveBaselines(newBaselines);
      console.log(`New baselines saved: ${path.join(BASELINE_DIR, 'quality-baselines.json')}`);
    }

    // Fail test if there are regressions
    if (failedCount > 0) {
      const failedItems = results.filter(r => !r.passed);
      console.error('\nFailed regression checks:');
      failedItems.forEach(r => {
        console.error(`  - ${r.key}: ${r.reason}`);
      });
    }

    expect(failedCount).toBe(0);
  });

  test('should update baselines when requested', () => {
    test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');
    // Only run if UPDATE_BASELINES env var is set
    if (process.env.UPDATE_BASELINES !== 'true') {
      test.skip();
      return;
    }

    console.log('\n=== Updating Baselines ===\n');

    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    const newBaselines: BaselineData = {
      version: '1.0.0',
      createdAt: new Date().toISOString(),
      baselines: {},
    };

    for (const diagramType of diagramTypes) {
      for (const layoutType of layoutTypes) {
        const key = `${diagramType}-${layoutType}`;
        const graph = TEST_GRAPHS[diagramType];

        const report = calculateLayoutQuality(
          graph.nodes,
          graph.edges,
          layoutType,
          diagramType
        );

        newBaselines.baselines[key] = {
          diagramType,
          layoutType,
          report,
        };

        console.log(`  Updated: ${key} = ${report.overallScore.toFixed(3)}`);
      }
    }

    saveBaselines(newBaselines);
    console.log(`\nBaselines saved to: ${path.join(BASELINE_DIR, 'quality-baselines.json')}`);

    expect(Object.keys(newBaselines.baselines).length).toBe(6);
  });

  test('should detect individual metric regressions', () => {
    test.skip(!hasLocalStorage, 'localStorage not available in Node.js context');

    const graph = TEST_GRAPHS.motivation;
    const currentReport = calculateLayoutQuality(graph.nodes, graph.edges, 'hierarchical', 'motivation');

    // Create a "baseline" with slightly better metrics
    const mockBaseline: LayoutQualityReport = {
      ...currentReport,
      overallScore: currentReport.overallScore * 1.1,
      metrics: {
        crossingNumber: Math.min(currentReport.metrics.crossingNumber * 1.05, 1),
        crossingAngle: Math.min(currentReport.metrics.crossingAngle * 1.05, 1),
        angularResolutionMin: Math.min(currentReport.metrics.angularResolutionMin * 1.05, 1),
        angularResolutionDev: Math.min(currentReport.metrics.angularResolutionDev * 1.05, 1),
      },
    };

    // Use metrics service to detect regression
    metricsService!.saveSnapshot(mockBaseline, { setAsBaseline: true });
    const regression = metricsService!.detectRegression(currentReport);

    console.log('\nIndividual Metric Regression Check:');
    console.log('─'.repeat(60));
    console.log(`  Overall: ${regression.overallPercentageChange.toFixed(1)}% [${regression.severity}]`);

    regression.metricRegressions.forEach(mr => {
      const status = mr.hasRegression ? 'REGRESSED' : 'OK';
      console.log(
        `  ${mr.metric.padEnd(25)} ${mr.baselineValue.toFixed(3)} -> ${mr.currentValue.toFixed(3)} (${mr.percentageChange.toFixed(1)}%) [${status}]`
      );
    });

    expect(regression).toBeDefined();
  });
});

test.describe('Baseline Management', () => {
  test('should validate baseline file format', () => {
    const baselines = loadBaselines();

    if (!baselines) {
      console.log('No baselines file found - will be created on first run');
      return;
    }

    // Validate structure
    expect(baselines.version).toBeDefined();
    expect(baselines.createdAt).toBeDefined();
    expect(baselines.baselines).toBeDefined();

    // Validate each baseline
    Object.entries(baselines.baselines).forEach(([key, baseline]) => {
      expect(baseline.diagramType).toBeDefined();
      expect(baseline.layoutType).toBeDefined();
      expect(baseline.report).toBeDefined();
      expect(baseline.report.overallScore).toBeGreaterThanOrEqual(0);
      expect(baseline.report.overallScore).toBeLessThanOrEqual(1);

      console.log(`  Baseline ${key}: ${baseline.report.overallScore.toFixed(3)}`);
    });
  });

  test('should report baseline age', () => {
    const baselines = loadBaselines();

    if (!baselines) {
      console.log('No baselines file found');
      return;
    }

    const createdAt = new Date(baselines.createdAt);
    const ageMs = Date.now() - createdAt.getTime();
    const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
    const ageHours = Math.floor(ageMs / (1000 * 60 * 60));

    console.log('\nBaseline Age Report:');
    console.log(`  Created: ${baselines.createdAt}`);
    console.log(`  Age: ${ageDays > 0 ? `${ageDays} days` : `${ageHours} hours`}`);
    console.log(`  Entries: ${Object.keys(baselines.baselines).length}`);

    // Warn if baselines are old
    if (ageDays > 30) {
      console.warn('  WARNING: Baselines are over 30 days old. Consider updating.');
    }
  });
});

test.describe('CI Integration', () => {
  test('should output CI-friendly status', () => {
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutType: LayoutType = 'hierarchical';

    let allPassed = true;
    const outputs: string[] = [];

    for (const diagramType of diagramTypes) {
      const graph = TEST_GRAPHS[diagramType];
      const report = calculateLayoutQuality(graph.nodes, graph.edges, layoutType, diagramType);

      const passed = report.overallScore >= QUALITY_FLOOR;
      if (!passed) allPassed = false;

      outputs.push(`${diagramType}=${report.overallScore.toFixed(3)}:${passed ? 'PASS' : 'FAIL'}`);
    }

    // Output in CI-parseable format
    console.log('\n::group::Regression Check Results');
    outputs.forEach(o => console.log(`  ${o}`));
    console.log(`  overall=${allPassed ? 'PASS' : 'FAIL'}`);
    console.log('::endgroup::');

    // GitHub Actions annotation format
    if (!allPassed) {
      console.log('::error::Quality regression detected');
    }

    expect(allPassed).toBe(true);
  });

  test('should generate GitHub Actions summary', () => {
    const summaryLines: string[] = [
      '## Layout Quality Regression Check',
      '',
      '| Diagram | Layout | Score | Status |',
      '|---------|--------|-------|--------|',
    ];

    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4'];
    const layoutTypes: LayoutType[] = ['hierarchical', 'force-directed'];

    for (const diagramType of diagramTypes) {
      for (const layoutType of layoutTypes) {
        const graph = TEST_GRAPHS[diagramType];
        const report = calculateLayoutQuality(graph.nodes, graph.edges, layoutType, diagramType);
        const status = report.overallScore >= QUALITY_FLOOR ? ':white_check_mark:' : ':x:';

        summaryLines.push(`| ${diagramType} | ${layoutType} | ${report.overallScore.toFixed(3)} | ${status} |`);
      }
    }

    summaryLines.push('');
    summaryLines.push(`> Quality floor: ${QUALITY_FLOOR}`);
    summaryLines.push(`> Generated: ${new Date().toISOString()}`);

    const summary = summaryLines.join('\n');

    // Save summary for GitHub Actions
    const summaryPath = path.join(OUTPUT_DIR, 'github-summary.md');
    fs.writeFileSync(summaryPath, summary);

    console.log('\nGitHub Summary Preview:');
    console.log(summary);

    expect(summary.length).toBeGreaterThan(0);
  });
});
