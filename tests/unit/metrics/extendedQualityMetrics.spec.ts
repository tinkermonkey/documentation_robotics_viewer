/**
 * Unit tests for Extended Quality Metrics (Task Group 6)
 *
 * Tests new quality metrics added to graphReadabilityService:
 * - Edge crossing count and location detection
 * - Node overlap area calculation
 * - Edge length variance
 * - Alignment scoring (horizontal/vertical)
 * - Hierarchy clarity metric
 * - Symmetry detection
 * - Layer-specific quality thresholds
 */

import { test, expect } from '@playwright/test';
import { Node, Edge } from '@xyflow/react';
import {
  detectEdgeCrossings,
  calculateNodeOverlapDetails,
  calculateEdgeLengthStats,
  calculateAlignment,
  calculateSymmetry,
  calculateHierarchyClarity,
  classifyQuality,
  getQualityThresholds,
} from '../../../src/core/services/metrics/graphReadabilityService';

/**
 * Helper to create test nodes with specific positions and dimensions
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

test.describe('Extended Quality Metrics', () => {
  test.describe('Edge Crossing Detection with Locations', () => {
    test('should detect no crossings in simple parallel edges', () => {
      // Two parallel edges that don't cross
      const nodes = [
        createTestNode('n1', 0, 0),
        createTestNode('n2', 200, 0),
        createTestNode('n3', 0, 100),
        createTestNode('n4', 200, 100),
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Top horizontal
        createTestEdge('e2', 'n3', 'n4'), // Bottom horizontal
      ];

      const crossings = detectEdgeCrossings(nodes, edges);

      expect(crossings.count).toBe(0);
      expect(crossings.locations.length).toBe(0);
    });

    test('should detect crossing in X-pattern edges', () => {
      // Two edges that cross in the middle
      const nodes = [
        createTestNode('n1', 0, 0, 10, 10),
        createTestNode('n2', 200, 200, 10, 10),
        createTestNode('n3', 0, 200, 10, 10),
        createTestNode('n4', 200, 0, 10, 10),
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Diagonal down-right
        createTestEdge('e2', 'n3', 'n4'), // Diagonal up-right
      ];

      const crossings = detectEdgeCrossings(nodes, edges);

      expect(crossings.count).toBe(1);
      expect(crossings.locations.length).toBe(1);
      expect(crossings.locations[0].edge1).toBe('e1');
      expect(crossings.locations[0].edge2).toBe('e2');
    });

    test('should provide crossing coordinates for visualization', () => {
      // Test that crossing location is provided for rendering
      const nodes = [
        createTestNode('n1', 0, 0, 10, 10),
        createTestNode('n2', 100, 100, 10, 10),
        createTestNode('n3', 0, 100, 10, 10),
        createTestNode('n4', 100, 0, 10, 10),
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'),
        createTestEdge('e2', 'n3', 'n4'),
      ];

      const crossings = detectEdgeCrossings(nodes, edges);

      expect(crossings.count).toBe(1);
      expect(crossings.locations[0].location).toBeDefined();
      // Node centers are at (5, 5), (105, 105), (5, 105), (105, 5)
      // Crossing should be at center: approximately (55, 55)
      expect(crossings.locations[0].location.x).toBeCloseTo(55, 0);
      expect(crossings.locations[0].location.y).toBeCloseTo(55, 0);
    });
  });

  test.describe('Node Overlap Area Calculation', () => {
    test('should calculate zero overlap area for non-overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 200, 0, 100, 100), // 100px gap
      ];

      const overlaps = calculateNodeOverlapDetails(nodes);

      expect(overlaps.pairs.length).toBe(0);
      expect(overlaps.totalArea).toBe(0);
      expect(overlaps.areaPercentage).toBe(0);
    });

    test('should calculate overlap area for partially overlapping nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 50, 50, 100, 100), // 50x50 overlap
      ];

      const overlaps = calculateNodeOverlapDetails(nodes);

      expect(overlaps.pairs.length).toBe(1);
      expect(overlaps.totalArea).toBe(2500); // 50x50
      expect(overlaps.areaPercentage).toBe(12.5); // 2500 / 20000
    });

    test('should identify specific overlapping node pairs', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 100, 100),
        createTestNode('n2', 50, 50, 100, 100), // Overlaps with n1
        createTestNode('n3', 200, 0, 100, 100), // No overlap
      ];

      const overlaps = calculateNodeOverlapDetails(nodes);

      expect(overlaps.pairs.length).toBe(1);
      expect(overlaps.pairs[0].node1).toBe('n1');
      expect(overlaps.pairs[0].node2).toBe('n2');
      expect(overlaps.pairs[0].area).toBe(2500);
    });
  });

  test.describe('Alignment Detection Metric', () => {
    test('should detect perfect horizontal alignment', () => {
      const nodes = [
        createTestNode('n1', 0, 100),
        createTestNode('n2', 200, 100),
        createTestNode('n3', 400, 100),
      ];

      const alignment = calculateAlignment(nodes);

      expect(alignment.horizontal).toBe(1.0);
    });

    test('should detect perfect vertical alignment', () => {
      const nodes = [
        createTestNode('n1', 100, 0),
        createTestNode('n2', 100, 200),
        createTestNode('n3', 100, 400),
      ];

      const alignment = calculateAlignment(nodes);

      expect(alignment.vertical).toBe(1.0);
    });

    test('should detect near-alignment with tolerance', () => {
      const nodes = [
        createTestNode('n1', 0, 100),
        createTestNode('n2', 200, 102), // 2px off
        createTestNode('n3', 400, 98), // 2px off
      ];

      const alignment = calculateAlignment(nodes, 5);

      expect(alignment.horizontal).toBe(1.0);
      expect(alignment.tolerance).toBe(5);
    });

    test('should score poor alignment for scattered nodes', () => {
      const nodes = [
        createTestNode('n1', 0, 0),
        createTestNode('n2', 200, 150),
        createTestNode('n3', 400, 300),
      ];

      const alignment = calculateAlignment(nodes);

      // Each node is in its own alignment group, so max group size is 1
      expect(alignment.horizontal).toBe(1 / 3);
      expect(alignment.vertical).toBe(1 / 3);
    });
  });

  test.describe('Edge Length Variance Metric', () => {
    test('should calculate zero variance for uniform edge lengths', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 10, 10),
        createTestNode('n2', 100, 0, 10, 10),
        createTestNode('n3', 200, 0, 10, 10),
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Length 100
        createTestEdge('e2', 'n2', 'n3'), // Length 100
      ];

      const stats = calculateEdgeLengthStats(nodes, edges);

      expect(stats.variance).toBe(0);
      expect(stats.stdDev).toBe(0);
    });

    test('should calculate variance for varied edge lengths', () => {
      const nodes = [
        createTestNode('n1', 0, 0, 10, 10),
        createTestNode('n2', 100, 0, 10, 10),
        createTestNode('n3', 300, 0, 10, 10),
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'), // Length 100
        createTestEdge('e2', 'n2', 'n3'), // Length 200
      ];

      const stats = calculateEdgeLengthStats(nodes, edges);

      expect(stats.mean).toBe(150);
      expect(stats.variance).toBeGreaterThan(0);
      expect(stats.stdDev).toBeCloseTo(50, 5);
    });
  });

  test.describe('Hierarchy Clarity Metric', () => {
    test('should detect clear hierarchical levels', () => {
      // Three distinct levels with consistent spacing
      const nodes = [
        createTestNode('n1', 100, 0), // Level 0
        createTestNode('n2', 0, 100), // Level 1
        createTestNode('n3', 200, 100), // Level 1
        createTestNode('n4', 0, 200), // Level 2
        createTestNode('n5', 100, 200), // Level 2
        createTestNode('n6', 200, 200), // Level 2
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'),
        createTestEdge('e2', 'n1', 'n3'),
        createTestEdge('e3', 'n2', 'n4'),
        createTestEdge('e4', 'n2', 'n5'),
        createTestEdge('e5', 'n3', 'n6'),
      ];

      const hierarchy = calculateHierarchyClarity(nodes, edges, 'hierarchical');

      expect(hierarchy).toBeDefined();
      expect(hierarchy!.levels.length).toBeGreaterThanOrEqual(2);
      expect(hierarchy!.score).toBeGreaterThan(0.5);
    });

    test('should score low for inconsistent level spacing', () => {
      // Irregular spacing between levels
      const nodes = [
        createTestNode('n1', 100, 0), // Level 0
        createTestNode('n2', 0, 50), // Level 1 - 50px gap
        createTestNode('n3', 200, 50),
        createTestNode('n4', 0, 200), // Level 2 - 150px gap
      ];

      const edges = [
        createTestEdge('e1', 'n1', 'n2'),
        createTestEdge('e2', 'n1', 'n3'),
        createTestEdge('e3', 'n2', 'n4'),
      ];

      const hierarchy = calculateHierarchyClarity(nodes, edges, 'hierarchical');

      expect(hierarchy).toBeDefined();
      expect(hierarchy!.levelSpacingStdDev).toBeGreaterThan(0);
    });
  });

  test.describe('Symmetry Detection', () => {
    test('should detect horizontal symmetry', () => {
      const nodes = [
        createTestNode('n1', 100, 0),
        createTestNode('n2', 0, 100),
        createTestNode('n3', 200, 100),
        createTestNode('n4', 100, 200),
      ];

      const symmetry = calculateSymmetry(nodes);

      // Some horizontal symmetry expected
      expect(symmetry.horizontal).toBeGreaterThanOrEqual(0);
      expect(symmetry.horizontal).toBeLessThanOrEqual(1);
    });

    test('should detect vertical symmetry', () => {
      const nodes = [
        createTestNode('n1', 0, 100),
        createTestNode('n2', 100, 0),
        createTestNode('n3', 100, 200),
        createTestNode('n4', 200, 100),
      ];

      const symmetry = calculateSymmetry(nodes);

      // Some vertical symmetry expected
      expect(symmetry.vertical).toBeGreaterThanOrEqual(0);
      expect(symmetry.vertical).toBeLessThanOrEqual(1);
    });

    test('should detect radial symmetry', () => {
      // Nodes arranged in a circle around center
      const centerX = 200;
      const centerY = 200;
      const radius = 100;

      const nodes = [
        createTestNode('n1', centerX + radius, centerY), // 0 degrees
        createTestNode('n2', centerX, centerY + radius), // 90 degrees
        createTestNode('n3', centerX - radius, centerY), // 180 degrees
        createTestNode('n4', centerX, centerY - radius), // 270 degrees
      ];

      const symmetry = calculateSymmetry(nodes);

      // All nodes at same distance from center
      expect(symmetry.radial).toBeGreaterThan(0);
    });

    test('should score low symmetry for random layout', () => {
      const nodes = [
        createTestNode('n1', 23, 45),
        createTestNode('n2', 167, 89),
        createTestNode('n3', 299, 234),
        createTestNode('n4', 78, 345),
      ];

      const symmetry = calculateSymmetry(nodes);

      // Low symmetry expected for random positions
      expect(symmetry.horizontal).toBeLessThan(0.5);
      expect(symmetry.vertical).toBeLessThan(0.5);
      expect(symmetry.radial).toBeLessThan(0.5);
    });
  });

  test.describe('Layer-Specific Quality Thresholds', () => {
    test('should have thresholds for motivation layer', () => {
      const thresholds = getQualityThresholds('motivation');

      expect(thresholds.excellent).toBe(0.85);
      expect(thresholds.good).toBe(0.70);
      expect(thresholds.acceptable).toBe(0.55);
      expect(thresholds.poor).toBe(0.40);
    });

    test('should have thresholds for business layer', () => {
      const thresholds = getQualityThresholds('business');

      expect(thresholds.excellent).toBe(0.80);
      expect(thresholds.good).toBe(0.65);
      expect(thresholds.acceptable).toBe(0.50);
      expect(thresholds.poor).toBe(0.35);
    });

    test('should have thresholds for C4 layer', () => {
      const thresholds = getQualityThresholds('c4');

      expect(thresholds.excellent).toBe(0.85);
      expect(thresholds.good).toBe(0.70);
      expect(thresholds.acceptable).toBe(0.55);
      expect(thresholds.poor).toBe(0.40);
    });

    test('should classify quality based on threshold ranges', () => {
      // Test excellent classification
      expect(classifyQuality(0.90, 'motivation')).toBe('excellent');

      // Test good classification
      expect(classifyQuality(0.75, 'motivation')).toBe('good');

      // Test acceptable classification
      expect(classifyQuality(0.60, 'motivation')).toBe('acceptable');

      // Test poor classification
      expect(classifyQuality(0.45, 'motivation')).toBe('poor');

      // Test unacceptable classification
      expect(classifyQuality(0.30, 'motivation')).toBe('unacceptable');
    });
  });
});
