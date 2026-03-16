/**
 * Smoke test for Libavoid WASM module loading
 *
 * Tests that:
 * 1. The WASM file is accessible and loadable
 * 2. The LibavoidRouter can initialize without errors
 * 3. The router provides expected interface
 */

import { test, expect } from '@playwright/test';
import { LibavoidRouter, libavoidRouter } from '../../src/core/services/libavoidRouter';

test.describe('LibavoidRouter - WASM Loading', () => {
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

    // Initialize the WASM module
    await router.initialize();

    expect(router.isInitialized()).toBe(true);
  });

  test('should handle multiple initialize calls idempotently', async () => {
    const router = LibavoidRouter.getInstance();

    // Should not throw on multiple calls
    await router.initialize();
    await router.initialize();
    await router.initialize();

    expect(router.isInitialized()).toBe(true);
  });

  test('should return empty waypoints if routing before initialization (A* fallback)', async () => {
    const router = LibavoidRouter.getInstance();

    const input = {
      nodes: [],
      edges: [],
    };

    // Should not throw - returns empty map for A* fallback instead
    const result = await router.routeEdges(input);
    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    expect(result.edgeWaypoints.size).toBe(0);
  });

  test('should return empty waypoints for empty input', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [],
      edges: [],
    };

    const result = await router.routeEdges(input);

    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    expect(result.edgeWaypoints.size).toBe(0);
  });

  test('should return waypoint map for edges', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    const input = {
      nodes: [
        { id: 'node1', position: { x: 0, y: 0 }, width: 100, height: 50 },
        { id: 'node2', position: { x: 200, y: 0 }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2' },
        { id: 'edge2', source: 'node2', target: 'node1' },
      ],
    };

    const result = await router.routeEdges(input);

    expect(result.edgeWaypoints).toBeInstanceOf(Map);
    expect(result.edgeWaypoints.size).toBe(2);
    expect(result.edgeWaypoints.has('edge1')).toBe(true);
    expect(result.edgeWaypoints.has('edge2')).toBe(true);
  });

  test('should support dispose', async () => {
    const router = LibavoidRouter.getInstance();
    await router.initialize();

    expect(router.isInitialized()).toBe(true);

    router.dispose();

    expect(router.isInitialized()).toBe(false);
  });

  test('singleton instance should be accessible', async () => {
    await libavoidRouter.initialize();

    expect(libavoidRouter.isInitialized()).toBe(true);

    libavoidRouter.dispose();
  });
});
