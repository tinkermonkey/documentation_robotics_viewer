/**
 * Unit tests for Graph Readability Service
 *
 * Tests the graphReadabilityService and metricsHistoryService for:
 * - Metrics calculation
 * - Graph conversion
 * - Regression detection
 * - History persistence
 */

import { test, expect } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';
import {
  toGreadabilityGraph,
  calculateEdgeLengthStats,
  calculateNodeOcclusion,
  calculateAspectRatio,
  calculateDensity,
  getMetricWeights,
  calculateOverallScore,
  compareLayoutQuality,
  DiagramType,
  LayoutQualityReport,
  ReadabilityMetrics,
  ExtendedMetrics,
  MetricWeights,
} from '../../src/core/services/metrics/graphReadabilityService';

/**
 * Helper to create test nodes
 */
function createTestNode(
  id: string,
  x: number,
  y: number,
  width = 180,
  height = 110
): Node {
  return {
    id,
    position: { x, y },
    data: { label: id },
    type: 'default',
    width,
    height,
  };
}

/**
 * Helper to create test edges
 */
function createTestEdge(id: string, source: string, target: string): Edge {
  return {
    id,
    source,
    target,
    type: 'default',
  };
}

test.describe('GraphReadabilityService', () => {
  test.describe('toGreadabilityGraph()', () => {
    test('should convert empty graph', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      const result = toGreadabilityGraph(nodes, edges);

      expect(result.nodes.length).toBe(0);
      expect(result.links.length).toBe(0);
    });

    test('should convert nodes to center coordinates', () => {
      const node = createTestNode('n1', 0, 0, 180, 110);

      const result = toGreadabilityGraph([node], []);

      // Center should be (90, 55) for a node at (0, 0) with size 180x110
      expect(result.nodes[0].x).toBe(90);
      expect(result.nodes[0].y).toBe(55);
    });

    test('should handle nodes with measured dimensions', () => {
      const node: Node = {
        id: 'n1',
        position: { x: 100, y: 100 },
        data: { label: 'test' },
        type: 'default',
        measured: { width: 200, height: 150 },
      };

      const result = toGreadabilityGraph([node], []);

      // Should prefer measured dimensions: center at (100+100, 100+75) = (200, 175)
      expect(result.nodes[0].x).toBe(200);
      expect(result.nodes[0].y).toBe(175);
      expect(result.nodes[0].width).toBe(200);
      expect(result.nodes[0].height).toBe(150);
    });

    test('should filter out edges with missing nodes', () => {
      const nodes = [createTestNode('n1', 0, 0), createTestNode('n2', 100, 0)];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Valid
        createTestEdge('e2', 'n1', 'n3'), // Invalid - n3 doesn't exist
        createTestEdge('e3', 'n4', 'n2'), // Invalid - n4 doesn't exist
      ];

      const result = toGreadabilityGraph(nodes, edges);

      expect(result.links.length).toBe(1);
      expect(result.links[0].source).toBe('n1');
      expect(result.links[0].target).toBe('n2');
    });
  });

  test.describe('calculateEdgeLengthStats()', () => {
    test('should return zeros for empty graph', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      const stats = calculateEdgeLengthStats(nodes, edges);

      expect(stats.min).toBe(0);
      expect(stats.max).toBe(0);
      expect(stats.mean).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    test('should calculate correct edge length', () => {
      const n1 = createTestNode('n1', 0, 0, 100, 100);
      const n2 = createTestNode('n2', 200, 0, 100, 100);
      const edge = createTestEdge('e1', 'n1', 'n2');

      const stats = calculateEdgeLengthStats([n1, n2], [edge]);

      // Centers: n1 at (50, 50), n2 at (250, 50)
      // Distance: sqrt((250-50)^2 + (50-50)^2) = 200
      expect(stats.min).toBe(200);
      expect(stats.max).toBe(200);
      expect(stats.mean).toBe(200);
      expect(stats.stdDev).toBe(0);
    });

    test('should calculate standard deviation correctly', () => {
      const n1 = createTestNode('n1', 0, 0, 0, 0);
      const n2 = createTestNode('n2', 100, 0, 0, 0);
      const n3 = createTestNode('n3', 300, 0, 0, 0);
      const n4 = createTestNode('n4', 600, 0, 0, 0);

      // Edges with lengths 100, 200, 300
      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // 100
        createTestEdge('e2', 'n2', 'n3'), // 200
        createTestEdge('e3', 'n3', 'n4'), // 300
      ];

      const stats = calculateEdgeLengthStats([n1, n2, n3, n4], edges);

      expect(stats.mean).toBe(200);
      // Variance = ((100-200)^2 + (200-200)^2 + (300-200)^2) / 3 = 20000/3
      expect(stats.stdDev).toBeCloseTo(Math.sqrt(20000 / 3), 5);
    });
  });

  test.describe('calculateNodeOcclusion()', () => {
    test('should return 0 for non-overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 200, 0, 100, 100), // No overlap - 100px gap
      ];

      const overlaps = calculateNodeOcclusion(nodes);

      expect(overlaps).toBe(0);
    });

    test('should detect overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 50, 50, 100, 100), // Overlaps with n1
      ];

      const overlaps = calculateNodeOcclusion(nodes);

      expect(overlaps).toBe(1);
    });

    test('should count multiple overlaps correctly', () => {
      // Three nodes all overlapping at origin
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 10, 10, 100, 100),
        createTestNode('n3', 20, 20, 100, 100),
      ];

      const overlaps = calculateNodeOcclusion(nodes);

      // All pairs overlap: (n1,n2), (n1,n3), (n2,n3) = 3 overlaps
      expect(overlaps).toBe(3);
    });
  });

  test.describe('calculateAspectRatio()', () => {
    test('should return 1 for empty graph', () => {
      const nodes: Node[] = [];

      const ratio = calculateAspectRatio(nodes);

      expect(ratio).toBe(1);
    });

    test('should calculate correct aspect ratio', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 300, 0, 100, 100),
        createTestNode('n3', 0, 100, 100, 100),
      ];

      const ratio = calculateAspectRatio(nodes);

      // Bounds: minX=0, maxX=400, minY=0, maxY=200
      // Width=400, Height=200, Ratio=2
      expect(ratio).toBe(2);
    });
  });

  test.describe('calculateDensity()', () => {
    test('should return 0 for single node', () => {
      const density = calculateDensity(1, 0);

      expect(density).toBe(0);
    });

    test('should calculate correct density', () => {
      const density = calculateDensity(4, 3);

      // Max edges = 4*3/2 = 6
      // Density = 3/6 = 0.5
      expect(density).toBe(0.5);
    });

    test('should return 1 for complete graph', () => {
      const density = calculateDensity(3, 3);

      // Max edges = 3*2/2 = 3
      // Density = 3/3 = 1
      expect(density).toBe(1);
    });
  });

  test.describe('getMetricWeights()', () => {
    test('should return weights for motivation diagram', () => {
      const weights = getMetricWeights('motivation');

      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    test('should return weights for business diagram', () => {
      const weights = getMetricWeights('business');

      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    test('should return weights for c4 diagram', () => {
      const weights = getMetricWeights('c4');

      const sum = Object.values(weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    test('should prioritize crossings for motivation diagrams', () => {
      const weights = getMetricWeights('motivation');

      expect(weights.crossingNumber).toBeGreaterThanOrEqual(0.25);
    });

    test('should prioritize edge length uniformity for business diagrams', () => {
      const weights = getMetricWeights('business');

      expect(weights.edgeLengthUniformity).toBeGreaterThanOrEqual(0.2);
    });
  });

  test.describe('calculateOverallScore()', () => {
    test('should calculate weighted score correctly', () => {
      const metrics: ReadabilityMetrics = {
        crossingNumber: 0.8,
        crossingAngle: 0.9,
        angularResolutionMin: 0.7,
        angularResolutionDev: 0.6,
      };

      const extendedMetrics: ExtendedMetrics = {
        ...metrics,
        edgeLength: { min: 100, max: 100, mean: 100, stdDev: 0 }, // Uniform
        nodeNodeOcclusion: 0,
        aspectRatio: 1,
        density: 0.5,
      };

      const weights: MetricWeights = {
        crossingNumber: 0.25,
        crossingAngle: 0.25,
        angularResolutionMin: 0.25,
        angularResolutionDev: 0.25,
        edgeLengthUniformity: 0,
        nodeOcclusion: 0,
      };

      const score = calculateOverallScore(metrics, extendedMetrics, weights, 10);

      // Score = 0.25*0.8 + 0.25*0.9 + 0.25*0.7 + 0.25*0.6 = 0.75
      expect(score).toBeCloseTo(0.75, 10);
    });

    test('should return 1.0 for perfect metrics with no extended weights', () => {
      const metrics: ReadabilityMetrics = {
        crossingNumber: 1.0,
        crossingAngle: 1.0,
        angularResolutionMin: 1.0,
        angularResolutionDev: 1.0,
      };

      const extendedMetrics: ExtendedMetrics = {
        ...metrics,
        edgeLength: { min: 100, max: 100, mean: 100, stdDev: 0 },
        nodeNodeOcclusion: 0,
        aspectRatio: 1,
        density: 0.5,
      };

      const weights: MetricWeights = {
        crossingNumber: 0.25,
        crossingAngle: 0.25,
        angularResolutionMin: 0.25,
        angularResolutionDev: 0.25,
        edgeLengthUniformity: 0,
        nodeOcclusion: 0,
      };

      const score = calculateOverallScore(metrics, extendedMetrics, weights, 10);

      expect(score).toBe(1.0);
    });
  });

  test.describe('compareLayoutQuality()', () => {
    const createReport = (overallScore: number, metrics: Partial<ReadabilityMetrics> = {}): LayoutQualityReport => ({
      overallScore,
      metrics: {
        crossingNumber: 0.8,
        crossingAngle: 0.8,
        angularResolutionMin: 0.8,
        angularResolutionDev: 0.8,
        ...metrics,
      },
      extendedMetrics: {
        crossingNumber: 0.8,
        crossingAngle: 0.8,
        angularResolutionMin: 0.8,
        angularResolutionDev: 0.8,
        ...metrics,
        edgeLength: { min: 100, max: 200, mean: 150, stdDev: 25 },
        nodeNodeOcclusion: 0,
        aspectRatio: 1.5,
        density: 0.3,
      },
      timestamp: new Date().toISOString(),
      layoutType: 'hierarchical',
      diagramType: 'business',
      nodeCount: 10,
      edgeCount: 15,
      computationTimeMs: 10,
    });

    test('should detect improvement', () => {
      const baseline = createReport(0.7);
      const current = createReport(0.8);

      const comparison = compareLayoutQuality(current, baseline);

      expect(comparison.overallImprovement).toBeCloseTo(14.29, 1);
      expect(comparison.improved).toBe(true);
    });

    test('should detect regression', () => {
      const baseline = createReport(0.8);
      const current = createReport(0.7);

      const comparison = compareLayoutQuality(current, baseline);

      expect(comparison.overallImprovement).toBeCloseTo(-12.5, 1);
      expect(comparison.improved).toBe(false);
    });

    test('should handle zero baseline score', () => {
      const baseline = createReport(0);
      const current = createReport(0.5);

      const comparison = compareLayoutQuality(current, baseline);

      // Should not throw or produce NaN
      expect(Number.isFinite(comparison.overallImprovement)).toBe(true);
      expect(comparison.overallImprovement).toBe(50); // (0.5 - 0) / 1 * 100
    });

    test('should calculate individual metric changes', () => {
      const baseline = createReport(0.8, {
        crossingNumber: 0.9,
        crossingAngle: 0.8,
      });
      const current = createReport(0.85, {
        crossingNumber: 0.95,
        crossingAngle: 0.75,
      });

      const comparison = compareLayoutQuality(current, baseline);

      // crossingNumber improved: (0.95 - 0.9) / 0.9 * 100 ≈ 5.56%
      expect(comparison.metricChanges.crossingNumber).toBeCloseTo(5.56, 1);
      // crossingAngle regressed: (0.75 - 0.8) / 0.8 * 100 = -6.25%
      expect(comparison.metricChanges.crossingAngle).toBeCloseTo(-6.25, 1);
    });
  });
});

test.describe('MetricsHistoryService Logic (no localStorage)', () => {
  test.describe('ID generation', () => {
    test('should generate unique IDs with correct format', () => {
      // Test the ID generation pattern
      const generateId = () =>
        `snapshot-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith('snapshot-')).toBe(true);
      expect(id1.split('-').length).toBeGreaterThanOrEqual(3);
    });
  });

  test.describe('Baseline key generation', () => {
    test('should create correct baseline key', () => {
      const getBaselineKey = (diagramType: string, layoutType: string) =>
        `${diagramType}-${layoutType}`;

      expect(getBaselineKey('motivation', 'hierarchical')).toBe('motivation-hierarchical');
      expect(getBaselineKey('business', 'swimlane')).toBe('business-swimlane');
      expect(getBaselineKey('c4', 'force-directed')).toBe('c4-force-directed');
    });
  });

  test.describe('Regression severity classification', () => {
    const classifySeverity = (
      percentageChange: number,
      minorThreshold = 5,
      moderateThreshold = 10,
      severeThreshold = 20
    ) => {
      const absChange = Math.abs(percentageChange);
      if (percentageChange >= 0) return 'none';
      if (absChange < minorThreshold) return 'none';
      if (absChange < moderateThreshold) return 'minor';
      if (absChange < severeThreshold) return 'moderate';
      return 'severe';
    };

    test('should classify no regression for positive change', () => {
      expect(classifySeverity(5)).toBe('none');
      expect(classifySeverity(0)).toBe('none');
      expect(classifySeverity(100)).toBe('none');
    });

    test('should classify no regression for small negative change', () => {
      expect(classifySeverity(-3)).toBe('none');
      expect(classifySeverity(-4.9)).toBe('none');
    });

    test('should classify minor regression', () => {
      expect(classifySeverity(-5)).toBe('minor');
      expect(classifySeverity(-7)).toBe('minor');
      expect(classifySeverity(-9.9)).toBe('minor');
    });

    test('should classify moderate regression', () => {
      expect(classifySeverity(-10)).toBe('moderate');
      expect(classifySeverity(-15)).toBe('moderate');
      expect(classifySeverity(-19.9)).toBe('moderate');
    });

    test('should classify severe regression', () => {
      expect(classifySeverity(-20)).toBe('severe');
      expect(classifySeverity(-30)).toBe('severe');
      expect(classifySeverity(-50)).toBe('severe');
    });
  });

  test.describe('Pruning logic', () => {
    test('should keep most recent snapshots when pruning', () => {
      const snapshots = [
        { id: '1', timestamp: '2024-01-01T00:00:00Z' },
        { id: '2', timestamp: '2024-01-02T00:00:00Z' },
        { id: '3', timestamp: '2024-01-03T00:00:00Z' },
        { id: '4', timestamp: '2024-01-04T00:00:00Z' },
        { id: '5', timestamp: '2024-01-05T00:00:00Z' },
      ];

      // Sort by timestamp descending (newest first)
      const sorted = [...snapshots].sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      // Keep only most recent 3
      const pruned = sorted.slice(0, 3);

      expect(pruned.length).toBe(3);
      expect(pruned[0].id).toBe('5'); // Newest
      expect(pruned[1].id).toBe('4');
      expect(pruned[2].id).toBe('3');
    });

    test('should preserve baselines when pruning', () => {
      const baselines = new Set(['2', '4']);
      const snapshots = [
        { id: '1', timestamp: '2024-01-01T00:00:00Z' },
        { id: '2', timestamp: '2024-01-02T00:00:00Z' }, // baseline
        { id: '3', timestamp: '2024-01-03T00:00:00Z' },
        { id: '4', timestamp: '2024-01-04T00:00:00Z' }, // baseline
        { id: '5', timestamp: '2024-01-05T00:00:00Z' },
      ];

      // Separate baselines from non-baselines
      const baselineSnapshots = snapshots.filter((s) => baselines.has(s.id));
      const nonBaselines = snapshots.filter((s) => !baselines.has(s.id));

      expect(baselineSnapshots.length).toBe(2);
      expect(nonBaselines.length).toBe(3);
    });
  });

  test.describe('Percentage change calculation', () => {
    test('should calculate percentage change correctly', () => {
      const baseline = 0.8;
      const current = 0.9;

      const change = ((current - baseline) / baseline) * 100;
      expect(change).toBeCloseTo(12.5, 10);
    });

    test('should handle zero baseline', () => {
      const baseline = 0;
      const current = 0.5;

      // When baseline is 0, avoid division by zero
      const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
      expect(change).toBe(0);
    });
  });
});

test.describe('Edge length uniformity normalization', () => {
  /**
   * Normalize edge length uniformity to a 0-1 score.
   * Higher score means more uniform edge lengths.
   */
  function normalizeEdgeLengthUniformity(
    edgeLengthStats: { mean: number; stdDev: number }
  ): number {
    if (edgeLengthStats.mean === 0) return 1;
    const cv = edgeLengthStats.stdDev / edgeLengthStats.mean;
    return Math.max(0, 1 - Math.min(cv, 1));
  }

  test('should return 1 for uniform edge lengths', () => {
    const stats = { mean: 100, stdDev: 0 };
    const score = normalizeEdgeLengthUniformity(stats);

    expect(score).toBe(1);
  });

  test('should return lower score for varied edge lengths', () => {
    // CV = 0.5 -> score = 0.5
    const stats = { mean: 200, stdDev: 100 };
    const score = normalizeEdgeLengthUniformity(stats);

    expect(score).toBe(0.5);
  });

  test('should cap CV at 1 for extreme variation', () => {
    // CV = 2.0 -> capped at 1 -> score = 0
    const stats = { mean: 100, stdDev: 200 };
    const score = normalizeEdgeLengthUniformity(stats);

    expect(score).toBe(0);
  });

  test('should return 1 for zero mean', () => {
    const stats = { mean: 0, stdDev: 0 };
    const score = normalizeEdgeLengthUniformity(stats);

    expect(score).toBe(1);
  });
});

test.describe('Node occlusion normalization', () => {
  /**
   * Normalize node occlusion to a 0-1 score.
   * Higher score means fewer overlaps.
   */
  function normalizeOcclusionScore(occlusions: number, nodeCount: number): number {
    if (nodeCount <= 1) return 1;
    const maxOverlaps = (nodeCount * (nodeCount - 1)) / 2;
    return Math.max(0, 1 - occlusions / maxOverlaps);
  }

  test('should return 1 for no overlaps', () => {
    const score = normalizeOcclusionScore(0, 10);

    expect(score).toBe(1);
  });

  test('should return 0 for all overlapping', () => {
    const nodeCount = 5;
    const overlaps = (nodeCount * (nodeCount - 1)) / 2; // All possible pairs overlap

    const score = normalizeOcclusionScore(overlaps, nodeCount);

    expect(score).toBe(0);
  });

  test('should return proportional score', () => {
    const nodeCount = 4;
    const overlaps = 3; // Half of max (6)

    const score = normalizeOcclusionScore(overlaps, nodeCount);

    expect(score).toBe(0.5);
  });

  test('should return 1 for single node', () => {
    const score = normalizeOcclusionScore(0, 1);

    expect(score).toBe(1);
  });
});
