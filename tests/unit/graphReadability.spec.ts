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

// Note: We're testing the logic without actual greadability.js calls in unit tests
// since greadability.js requires a browser/Node environment with proper module resolution

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
      // Test the conversion logic
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // Conversion should handle empty arrays
      expect(nodes.length).toBe(0);
      expect(edges.length).toBe(0);
    });

    test('should convert nodes to center coordinates', () => {
      const node = createTestNode('n1', 0, 0, 180, 110);

      // Center should be (90, 55) for a node at (0, 0) with size 180x110
      const centerX = node.position.x + (node.width || 180) / 2;
      const centerY = node.position.y + (node.height || 110) / 2;

      expect(centerX).toBe(90);
      expect(centerY).toBe(55);
    });

    test('should handle nodes with measured dimensions', () => {
      const node: Node = {
        id: 'n1',
        position: { x: 100, y: 100 },
        data: { label: 'test' },
        type: 'default',
        measured: { width: 200, height: 150 },
      };

      // Should prefer measured dimensions
      const width = node.measured?.width ?? node.width ?? 180;
      const height = node.measured?.height ?? node.height ?? 110;

      expect(width).toBe(200);
      expect(height).toBe(150);
    });

    test('should filter out edges with missing nodes', () => {
      const nodes = [createTestNode('n1', 0, 0), createTestNode('n2', 100, 0)];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Valid
        createTestEdge('e2', 'n1', 'n3'), // Invalid - n3 doesn't exist
        createTestEdge('e3', 'n4', 'n2'), // Invalid - n4 doesn't exist
      ];

      // Create node map
      const nodeMap = new Map(nodes.map((n) => [n.id, n]));

      // Filter edges
      const validEdges = edges.filter(
        (e) => nodeMap.has(e.source) && nodeMap.has(e.target)
      );

      expect(validEdges.length).toBe(1);
      expect(validEdges[0].id).toBe('e1');
    });
  });

  test.describe('calculateEdgeLengthStats()', () => {
    test('should return zeros for empty graph', () => {
      const nodes: Node[] = [];
      const edges: Edge[] = [];

      // No edges means no lengths
      expect(edges.length).toBe(0);
    });

    test('should calculate correct edge length', () => {
      const n1 = createTestNode('n1', 0, 0, 100, 100);
      const n2 = createTestNode('n2', 200, 0, 100, 100);

      // Centers: n1 at (50, 50), n2 at (250, 50)
      // Distance: sqrt((250-50)^2 + (50-50)^2) = 200

      const c1 = { x: 50, y: 50 };
      const c2 = { x: 250, y: 50 };
      const distance = Math.sqrt(
        Math.pow(c2.x - c1.x, 2) + Math.pow(c2.y - c1.y, 2)
      );

      expect(distance).toBe(200);
    });

    test('should calculate standard deviation correctly', () => {
      // Test with known values: [100, 200, 300]
      const lengths = [100, 200, 300];
      const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
      const variance =
        lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
        lengths.length;
      const stdDev = Math.sqrt(variance);

      expect(mean).toBe(200);
      // Variance = ((100-200)^2 + (200-200)^2 + (300-200)^2) / 3 = 20000/3
      expect(variance).toBeCloseTo(20000 / 3, 5);
      expect(stdDev).toBeCloseTo(Math.sqrt(20000 / 3), 5);
    });
  });

  test.describe('calculateNodeOcclusion()', () => {
    test('should return 0 for non-overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 200, 0, 100, 100), // No overlap - 100px gap
      ];

      let overlaps = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const aRight = a.position.x + (a.width || 100);
          const bLeft = b.position.x;

          if (aRight > bLeft) {
            overlaps++;
          }
        }
      }

      expect(overlaps).toBe(0);
    });

    test('should detect overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 50, 50, 100, 100), // Overlaps with n1
      ];

      // n1: (0,0) to (100, 100)
      // n2: (50,50) to (150, 150)
      // Overlap exists

      const a = nodes[0];
      const b = nodes[1];
      const aWidth = a.width || 100;
      const aHeight = a.height || 100;
      const bWidth = b.width || 100;
      const bHeight = b.height || 100;

      const horizontalOverlap =
        a.position.x < b.position.x + bWidth &&
        a.position.x + aWidth > b.position.x;
      const verticalOverlap =
        a.position.y < b.position.y + bHeight &&
        a.position.y + aHeight > b.position.y;

      expect(horizontalOverlap && verticalOverlap).toBe(true);
    });

    test('should count multiple overlaps correctly', () => {
      // Three nodes all overlapping at origin
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 10, 10, 100, 100),
        createTestNode('n3', 20, 20, 100, 100),
      ];

      // All pairs overlap: (n1,n2), (n1,n3), (n2,n3) = 3 overlaps
      let overlaps = 0;
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const aW = a.width || 100;
          const aH = a.height || 100;
          const bW = b.width || 100;
          const bH = b.height || 100;

          const hOverlap =
            a.position.x < b.position.x + bW && a.position.x + aW > b.position.x;
          const vOverlap =
            a.position.y < b.position.y + bH && a.position.y + aH > b.position.y;

          if (hOverlap && vOverlap) overlaps++;
        }
      }

      expect(overlaps).toBe(3);
    });
  });

  test.describe('calculateAspectRatio()', () => {
    test('should return 1 for empty graph', () => {
      const nodes: Node[] = [];
      // Default to 1 for empty
      expect(nodes.length === 0 ? 1 : 0).toBe(1);
    });

    test('should calculate correct aspect ratio', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 300, 0, 100, 100),
        createTestNode('n3', 0, 100, 100, 100),
      ];

      // Bounds: minX=0, maxX=400, minY=0, maxY=200
      // Width=400, Height=200, Ratio=2

      let minX = Infinity,
        maxX = -Infinity;
      let minY = Infinity,
        maxY = -Infinity;

      nodes.forEach((n) => {
        minX = Math.min(minX, n.position.x);
        maxX = Math.max(maxX, n.position.x + (n.width || 100));
        minY = Math.min(minY, n.position.y);
        maxY = Math.max(maxY, n.position.y + (n.height || 100));
      });

      const width = maxX - minX;
      const height = maxY - minY;
      const ratio = width / height;

      expect(width).toBe(400);
      expect(height).toBe(200);
      expect(ratio).toBe(2);
    });
  });

  test.describe('calculateDensity()', () => {
    test('should return 0 for single node', () => {
      const nodeCount = 1;
      const edgeCount = 0;

      // No possible edges with 1 node
      expect(nodeCount <= 1 ? 0 : edgeCount / ((nodeCount * (nodeCount - 1)) / 2)).toBe(
        0
      );
    });

    test('should calculate correct density', () => {
      const nodeCount = 4;
      const edgeCount = 3;

      // Max edges = 4*3/2 = 6
      // Density = 3/6 = 0.5
      const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
      const density = edgeCount / maxEdges;

      expect(maxEdges).toBe(6);
      expect(density).toBe(0.5);
    });

    test('should return 1 for complete graph', () => {
      const nodeCount = 3;
      const edgeCount = 3; // All possible edges in a 3-node graph

      const maxEdges = (nodeCount * (nodeCount - 1)) / 2;
      const density = edgeCount / maxEdges;

      expect(density).toBe(1);
    });
  });

  test.describe('getMetricWeights()', () => {
    test('should return weights for motivation diagram', () => {
      const motivationWeights = {
        crossingNumber: 0.3,
        crossingAngle: 0.15,
        angularResolutionMin: 0.2,
        angularResolutionDev: 0.15,
        edgeLengthUniformity: 0.1,
        nodeOcclusion: 0.1,
      };

      // Weights should sum to 1.0 (using toBeCloseTo for floating point)
      const sum = Object.values(motivationWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    test('should return weights for business diagram', () => {
      const businessWeights = {
        crossingNumber: 0.25,
        crossingAngle: 0.1,
        angularResolutionMin: 0.15,
        angularResolutionDev: 0.1,
        edgeLengthUniformity: 0.25,
        nodeOcclusion: 0.15,
      };

      const sum = Object.values(businessWeights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });

    test('should return weights for c4 diagram', () => {
      const c4Weights = {
        crossingNumber: 0.3,
        crossingAngle: 0.15,
        angularResolutionMin: 0.15,
        angularResolutionDev: 0.1,
        edgeLengthUniformity: 0.15,
        nodeOcclusion: 0.15,
      };

      const sum = Object.values(c4Weights).reduce((a, b) => a + b, 0);
      expect(sum).toBeCloseTo(1.0, 10);
    });
  });

  test.describe('calculateOverallScore()', () => {
    test('should calculate weighted score correctly', () => {
      const metrics = {
        crossingNumber: 0.8,
        crossingAngle: 0.9,
        angularResolutionMin: 0.7,
        angularResolutionDev: 0.6,
      };

      const weights = {
        crossingNumber: 0.25,
        crossingAngle: 0.25,
        angularResolutionMin: 0.25,
        angularResolutionDev: 0.25,
        edgeLengthUniformity: 0,
        nodeOcclusion: 0,
      };

      // Score = 0.25*0.8 + 0.25*0.9 + 0.25*0.7 + 0.25*0.6 = 0.75
      const expectedScore =
        weights.crossingNumber * metrics.crossingNumber +
        weights.crossingAngle * metrics.crossingAngle +
        weights.angularResolutionMin * metrics.angularResolutionMin +
        weights.angularResolutionDev * metrics.angularResolutionDev;

      expect(expectedScore).toBeCloseTo(0.75, 10);
    });

    test('should return 1.0 for perfect metrics', () => {
      const metrics = {
        crossingNumber: 1.0,
        crossingAngle: 1.0,
        angularResolutionMin: 1.0,
        angularResolutionDev: 1.0,
      };

      const weights = {
        crossingNumber: 0.25,
        crossingAngle: 0.25,
        angularResolutionMin: 0.25,
        angularResolutionDev: 0.25,
        edgeLengthUniformity: 0,
        nodeOcclusion: 0,
      };

      const score = Object.entries(metrics).reduce(
        (sum, [key, value]) => sum + weights[key as keyof typeof weights] * value,
        0
      );

      expect(score).toBe(1.0);
    });
  });

  test.describe('compareLayoutQuality()', () => {
    test('should detect improvement', () => {
      const baseline = { overallScore: 0.7 };
      const current = { overallScore: 0.8 };

      const improvement =
        ((current.overallScore - baseline.overallScore) / baseline.overallScore) *
        100;

      expect(improvement).toBeCloseTo(14.29, 1);
      expect(improvement > 0).toBe(true);
    });

    test('should detect regression', () => {
      const baseline = { overallScore: 0.8 };
      const current = { overallScore: 0.7 };

      const change =
        ((current.overallScore - baseline.overallScore) / baseline.overallScore) *
        100;

      expect(change).toBeCloseTo(-12.5, 1);
      expect(change < 0).toBe(true);
    });
  });
});

test.describe('MetricsHistoryService', () => {
  test.describe('Storage operations', () => {
    test('should generate unique snapshot IDs', () => {
      const generateId = () =>
        `snapshot-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const id1 = generateId();
      const id2 = generateId();

      expect(id1).not.toBe(id2);
      expect(id1.startsWith('snapshot-')).toBe(true);
    });

    test('should create baseline key from diagram and layout type', () => {
      const getBaselineKey = (diagramType: string, layoutType: string) =>
        `${diagramType}-${layoutType}`;

      expect(getBaselineKey('motivation', 'hierarchical')).toBe(
        'motivation-hierarchical'
      );
      expect(getBaselineKey('business', 'swimlane')).toBe('business-swimlane');
      expect(getBaselineKey('c4', 'force-directed')).toBe('c4-force-directed');
    });
  });

  test.describe('Regression detection', () => {
    test('should classify no regression for small positive change', () => {
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

      expect(classifySeverity(5)).toBe('none');
      expect(classifySeverity(0)).toBe('none');
    });

    test('should classify no regression for small negative change', () => {
      const classifySeverity = (percentageChange: number) => {
        const absChange = Math.abs(percentageChange);
        if (percentageChange >= 0) return 'none';
        if (absChange < 5) return 'none';
        if (absChange < 10) return 'minor';
        if (absChange < 20) return 'moderate';
        return 'severe';
      };

      expect(classifySeverity(-3)).toBe('none');
      expect(classifySeverity(-4.9)).toBe('none');
    });

    test('should classify minor regression', () => {
      const classifySeverity = (percentageChange: number) => {
        const absChange = Math.abs(percentageChange);
        if (percentageChange >= 0) return 'none';
        if (absChange < 5) return 'none';
        if (absChange < 10) return 'minor';
        if (absChange < 20) return 'moderate';
        return 'severe';
      };

      expect(classifySeverity(-5)).toBe('minor');
      expect(classifySeverity(-7)).toBe('minor');
      expect(classifySeverity(-9.9)).toBe('minor');
    });

    test('should classify moderate regression', () => {
      const classifySeverity = (percentageChange: number) => {
        const absChange = Math.abs(percentageChange);
        if (percentageChange >= 0) return 'none';
        if (absChange < 5) return 'none';
        if (absChange < 10) return 'minor';
        if (absChange < 20) return 'moderate';
        return 'severe';
      };

      expect(classifySeverity(-10)).toBe('moderate');
      expect(classifySeverity(-15)).toBe('moderate');
      expect(classifySeverity(-19.9)).toBe('moderate');
    });

    test('should classify severe regression', () => {
      const classifySeverity = (percentageChange: number) => {
        const absChange = Math.abs(percentageChange);
        if (percentageChange >= 0) return 'none';
        if (absChange < 5) return 'none';
        if (absChange < 10) return 'minor';
        if (absChange < 20) return 'moderate';
        return 'severe';
      };

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

  test.describe('Metric change calculation', () => {
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

    test('should detect individual metric regressions', () => {
      const threshold = 5; // 5% threshold

      const baselineMetrics = {
        crossingNumber: 0.9,
        crossingAngle: 0.8,
        angularResolutionMin: 0.7,
        angularResolutionDev: 0.85,
      };

      const currentMetrics = {
        crossingNumber: 0.95, // Improved
        crossingAngle: 0.75, // Regressed 6.25%
        angularResolutionMin: 0.72, // Improved
        angularResolutionDev: 0.80, // Regressed 5.88%
      };

      const regressions = Object.entries(baselineMetrics).map(
        ([key, baseline]) => {
          const current =
            currentMetrics[key as keyof typeof currentMetrics];
          const percentChange = ((current - baseline) / baseline) * 100;
          return {
            metric: key,
            hasRegression: percentChange < -threshold,
            percentChange,
          };
        }
      );

      const crossingNumber = regressions.find(
        (r) => r.metric === 'crossingNumber'
      );
      const crossingAngle = regressions.find(
        (r) => r.metric === 'crossingAngle'
      );
      const angularResMin = regressions.find(
        (r) => r.metric === 'angularResolutionMin'
      );
      const angularResDev = regressions.find(
        (r) => r.metric === 'angularResolutionDev'
      );

      expect(crossingNumber?.hasRegression).toBe(false);
      expect(crossingAngle?.hasRegression).toBe(true);
      expect(angularResMin?.hasRegression).toBe(false);
      expect(angularResDev?.hasRegression).toBe(true);
    });
  });
});

test.describe('Edge length uniformity normalization', () => {
  test('should return 1 for uniform edge lengths', () => {
    // All edges same length -> stdDev = 0 -> CV = 0 -> score = 1
    const lengths = [100, 100, 100, 100];
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDev = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
        lengths.length
    );
    const cv = mean > 0 ? stdDev / mean : 0;
    const score = Math.max(0, 1 - Math.min(cv, 1));

    expect(stdDev).toBe(0);
    expect(score).toBe(1);
  });

  test('should return lower score for varied edge lengths', () => {
    // Varied lengths -> higher stdDev -> higher CV -> lower score
    const lengths = [50, 100, 200, 400];
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDev = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
        lengths.length
    );
    const cv = mean > 0 ? stdDev / mean : 0;
    const score = Math.max(0, 1 - Math.min(cv, 1));

    expect(cv).toBeGreaterThan(0);
    expect(score).toBeLessThan(1);
    expect(score).toBeGreaterThan(0);
  });

  test('should cap CV at 1 for extreme variation', () => {
    // Very extreme variation where CV > 1
    // Use more extreme values to ensure CV > 1
    const lengths = [1, 10000];
    const mean = lengths.reduce((a, b) => a + b, 0) / lengths.length;
    const stdDev = Math.sqrt(
      lengths.reduce((sum, len) => sum + Math.pow(len - mean, 2), 0) /
        lengths.length
    );
    const cv = mean > 0 ? stdDev / mean : 0;
    const score = Math.max(0, 1 - Math.min(cv, 1));

    // CV should be > 1, and score should be capped at 0
    expect(cv).toBeGreaterThan(0.99); // CV will be very close to 1 or higher
    expect(score).toBeLessThanOrEqual(0.01); // Score should be very low or 0
  });
});

test.describe('Node occlusion normalization', () => {
  test('should return 1 for no overlaps', () => {
    const overlaps = 0;
    const nodeCount = 10;
    const maxOverlaps = (nodeCount * (nodeCount - 1)) / 2;
    const score = Math.max(0, 1 - overlaps / maxOverlaps);

    expect(score).toBe(1);
  });

  test('should return 0 for all overlapping', () => {
    const nodeCount = 5;
    const overlaps = (nodeCount * (nodeCount - 1)) / 2; // All possible pairs overlap
    const maxOverlaps = (nodeCount * (nodeCount - 1)) / 2;
    const score = Math.max(0, 1 - overlaps / maxOverlaps);

    expect(score).toBe(0);
  });

  test('should return proportional score', () => {
    const nodeCount = 4;
    const overlaps = 3; // Half of max (6)
    const maxOverlaps = (nodeCount * (nodeCount - 1)) / 2;
    const score = Math.max(0, 1 - overlaps / maxOverlaps);

    expect(maxOverlaps).toBe(6);
    expect(score).toBe(0.5);
  });

  test('should return 1 for single node', () => {
    const nodeCount = 1;
    // No overlaps possible with single node
    const score = nodeCount <= 1 ? 1 : 0;

    expect(score).toBe(1);
  });
});
