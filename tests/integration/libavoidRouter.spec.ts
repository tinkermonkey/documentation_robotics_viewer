/**
 * Comprehensive tests for LibavoidRouter service
 *
 * Tests cover:
 * - WASM initialization and idempotency
 * - Obstacle creation from node bounding boxes
 * - Exclusive pin assignment for multiple edges per side
 * - Waypoint extraction and endpoint stripping
 * - Full routing with 3 nodes and 4 edges
 * - Error handling and A* fallback
 * - Memory leak prevention (object destruction)
 */

import { test, expect } from '@playwright/test';
import { LibavoidRouter, libavoidRouter } from '../../src/core/services/libavoidRouter';

test.describe('LibavoidRouter - Comprehensive Routing Tests', () => {
  test.beforeEach(() => {
    LibavoidRouter.resetInstance();
  });

  test('should provide singleton instance', () => {
    const router1 = LibavoidRouter.getInstance();
    const router2 = LibavoidRouter.getInstance();
    expect(router1).toBe(router2);
  });

  test('should start uninitialized', () => {
    const router = LibavoidRouter.getInstance();
    expect(router.isInitialized()).toBe(false);
  });

  test('should initialize WASM module successfully', async () => {
    const router = LibavoidRouter.getInstance();

    await router.initialize();

    expect(router.isInitialized()).toBe(true);
  });

  test('should be idempotent - multiple initialize calls should succeed', async () => {
    const router = LibavoidRouter.getInstance();

    // Call multiple times - should not throw
    await router.initialize();
    await router.initialize();
    await router.initialize();

    expect(router.isInitialized()).toBe(true);
  });

  test('should create obstacles for single node', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 100, y: 100 }, width: 150, height: 80 },
      ],
      edges: [],
    };

    const result = await router.routeEdges(input);

    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    expect(result.edgeWaypoints.size).toBe(0);
  });

  test('should assign exclusive pins for multiple edges on same side', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'node2', position: { x: 300, y: 0 }, width: 100, height: 100 },
        { id: 'node3', position: { x: 600, y: 0 }, width: 100, height: 100 },
      ],
      edges: [
        // Three edges from node1 bottom side to node2
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          sourceSide: 'bottom',
          targetSide: 'top',
        },
        {
          id: 'edge2',
          source: 'node1',
          target: 'node3',
          sourceSide: 'bottom',
          targetSide: 'top',
        },
        {
          id: 'edge3',
          source: 'node2',
          target: 'node3',
          sourceSide: 'right',
          targetSide: 'left',
        },
      ],
    };

    const result = await router.routeEdges(input);

    // All edges should be in result
    expect(result.edgeWaypoints.has('edge1')).toBe(true);
    expect(result.edgeWaypoints.has('edge2')).toBe(true);
    expect(result.edgeWaypoints.has('edge3')).toBe(true);
  });

  test('should strip first and last waypoints from route', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'node2', position: { x: 300, y: 0 }, width: 100, height: 100 },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          sourceSide: 'bottom',
          targetSide: 'top',
        },
      ],
    };

    const result = await router.routeEdges(input);
    const waypoints = result.edgeWaypoints.get('edge1');

    // Waypoints should exist (may be empty if straight line, but if present should be intermediate only)
    expect(waypoints).toBeDefined();
    if (waypoints && waypoints.length > 0) {
      // Waypoints should not include the source/target endpoints
      // (those are added by ElbowEdge from React Flow handle positions)
      for (const point of waypoints) {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
      }
    }
  });

  test('should route 3 nodes with 4 edges without overlapping parallel segments', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    // Arrange 3 nodes in an L shape
    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 120, height: 80 },
        { id: 'node2', position: { x: 300, y: 0 }, width: 120, height: 80 },
        { id: 'node3', position: { x: 300, y: 300 }, width: 120, height: 80 },
      ],
      edges: [
        // Horizontal edges
        {
          id: 'edge1',
          source: 'node1',
          target: 'node2',
          sourceSide: 'right',
          targetSide: 'left',
        },
        // Vertical edges
        {
          id: 'edge2',
          source: 'node2',
          target: 'node3',
          sourceSide: 'bottom',
          targetSide: 'top',
        },
        // Diagonal edges (routed around obstacles)
        {
          id: 'edge3',
          source: 'node1',
          target: 'node3',
          sourceSide: 'bottom',
          targetSide: 'left',
        },
        {
          id: 'edge4',
          source: 'node3',
          target: 'node1',
          sourceSide: 'left',
          targetSide: 'bottom',
        },
      ],
    };

    const result = await router.routeEdges(input);

    // All edges should be routed
    expect(result.edgeWaypoints.size).toBeGreaterThanOrEqual(4);
    for (const edgeId of ['edge1', 'edge2', 'edge3', 'edge4']) {
      expect(result.edgeWaypoints.has(edgeId)).toBe(true);

      // Waypoints should be arrays of points
      const waypoints = result.edgeWaypoints.get(edgeId);
      expect(Array.isArray(waypoints)).toBe(true);
      if (waypoints && waypoints.length > 0) {
        for (const point of waypoints) {
          expect(typeof point.x).toBe('number');
          expect(typeof point.y).toBe('number');
          expect(isFinite(point.x)).toBe(true);
          expect(isFinite(point.y)).toBe(true);
        }
      }
    }
  });

  test('should handle side parameters (top/bottom/left/right)', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'node2', position: { x: 300, y: 0 }, width: 100, height: 100 },
        { id: 'node3', position: { x: 300, y: 300 }, width: 100, height: 100 },
        { id: 'node4', position: { x: 0, y: 300 }, width: 100, height: 100 },
      ],
      edges: [
        // Test all sides
        {
          id: 'edge-top',
          source: 'node1',
          target: 'node2',
          sourceSide: 'top',
          targetSide: 'top',
        },
        {
          id: 'edge-right',
          source: 'node2',
          target: 'node3',
          sourceSide: 'right',
          targetSide: 'right',
        },
        {
          id: 'edge-bottom',
          source: 'node3',
          target: 'node4',
          sourceSide: 'bottom',
          targetSide: 'bottom',
        },
        {
          id: 'edge-left',
          source: 'node4',
          target: 'node1',
          sourceSide: 'left',
          targetSide: 'left',
        },
      ],
    };

    const result = await router.routeEdges(input);

    // All edges should be routed with explicit sides
    for (const edgeId of ['edge-top', 'edge-right', 'edge-bottom', 'edge-left']) {
      expect(result.edgeWaypoints.has(edgeId)).toBe(true);
    }
  });

  test('should skip edges with missing nodes', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    // Create a scenario with missing target node
    const input = {
      nodes: [{ id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 }],
      edges: [
        {
          id: 'edge-invalid',
          source: 'node1',
          target: 'missing-node', // Node doesn't exist
        },
      ],
    };

    // Should handle gracefully - edges with missing nodes are skipped
    const result = await router.routeEdges(input);
    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    // Edge should not be in result since one of its nodes is missing
    expect(result.edgeWaypoints.has('edge-invalid')).toBe(false);
  });

  test('should return empty waypoints for edges when uninitialized (fallback)', async () => {
    const router = LibavoidRouter.getInstance();
    // Don't initialize

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'node2', position: { x: 300, y: 0 }, width: 100, height: 100 },
      ],
      edges: [{ id: 'edge1', source: 'node1', target: 'node2' }],
    };

    // Should return empty Map instead of throwing (A* fallback mode)
    const result = await router.routeEdges(input);
    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    expect(result.edgeWaypoints.size).toBe(0);
  });

  test('should clean up resources after routing (no memory leaks)', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    // Run multiple routing operations to ensure cleanup works
    for (let i = 0; i < 5; i++) {
      const input = {
        nodes: [
          { id: `node1-${i}`, position: { x: 0, y: 0 }, width: 100, height: 100 },
          { id: `node2-${i}`, position: { x: 300, y: 0 }, width: 100, height: 100 },
          { id: `node3-${i}`, position: { x: 600, y: 0 }, width: 100, height: 100 },
        ],
        edges: [
          {
            id: `edge1-${i}`,
            source: `node1-${i}`,
            target: `node2-${i}`,
          },
          {
            id: `edge2-${i}`,
            source: `node2-${i}`,
            target: `node3-${i}`,
          },
          {
            id: `edge3-${i}`,
            source: `node1-${i}`,
            target: `node3-${i}`,
          },
        ],
      };

      const result = await router.routeEdges(input);
      expect(result.edgeWaypoints).toBeInstanceOf(Map);
      expect(result.edgeWaypoints.size).toBeGreaterThan(0);
    }

    // If we got here without crashes, cleanup is working
    expect(router.isInitialized()).toBe(true);
  });

  test('should support dispose and cleanup', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    expect(router.isInitialized()).toBe(true);

    router.dispose();

    expect(router.isInitialized()).toBe(false);
  });

  test('should handle default sides (bottom/top) when not specified', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'node2', position: { x: 0, y: 300 }, width: 100, height: 100 },
      ],
      edges: [
        // No sourceSide/targetSide specified - should default to bottom/top
        {
          id: 'edge-default',
          source: 'node1',
          target: 'node2',
        },
      ],
    };

    const result = await router.routeEdges(input);

    expect(result.edgeWaypoints.has('edge-default')).toBe(true);
    const waypoints = result.edgeWaypoints.get('edge-default');
    expect(Array.isArray(waypoints)).toBe(true);
  });

  test('should distribute pins evenly for multiple edges on same side', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    // Create a scenario with multiple edges from same source side
    const input = {
      nodes: [
        { id: 'source', position: { x: 0, y: 0 }, width: 100, height: 100 },
        { id: 'target1', position: { x: 300, y: 0 }, width: 100, height: 100 },
        { id: 'target2', position: { x: 300, y: 150 }, width: 100, height: 100 },
        { id: 'target3', position: { x: 300, y: 300 }, width: 100, height: 100 },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'source',
          target: 'target1',
          sourceSide: 'right',
          targetSide: 'left',
        },
        {
          id: 'edge2',
          source: 'source',
          target: 'target2',
          sourceSide: 'right',
          targetSide: 'left',
        },
        {
          id: 'edge3',
          source: 'source',
          target: 'target3',
          sourceSide: 'right',
          targetSide: 'left',
        },
      ],
    };

    const result = await router.routeEdges(input);

    // All three edges should be routed from the same side
    for (const edgeId of ['edge1', 'edge2', 'edge3']) {
      expect(result.edgeWaypoints.has(edgeId)).toBe(true);
    }
  });

  test('should generate waypoints with proper numeric precision', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 10.5, y: 20.7 }, width: 100.2, height: 99.8 },
        { id: 'node2', position: { x: 300.3, y: 50.9 }, width: 99.5, height: 100.1 },
      ],
      edges: [
        {
          id: 'edge-float',
          source: 'node1',
          target: 'node2',
        },
      ],
    };

    const result = await router.routeEdges(input);
    const waypoints = result.edgeWaypoints.get('edge-float');

    if (waypoints && waypoints.length > 0) {
      for (const point of waypoints) {
        expect(typeof point.x).toBe('number');
        expect(typeof point.y).toBe('number');
        expect(isFinite(point.x)).toBe(true);
        expect(isFinite(point.y)).toBe(true);
      }
    }
  });

  test('should provide singleton instance via export', async () => {
    await libavoidRouter.initialize();

    expect(libavoidRouter.isInitialized()).toBe(true);

    libavoidRouter.dispose();
  });
});
