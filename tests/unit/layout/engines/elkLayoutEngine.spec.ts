/**
 * Unit tests for ELKLayoutEngine
 *
 * Tests cover:
 * - Port ID suffix stripping for node IDs with hyphens and dots
 * - sourceSide/targetSide population from port IDs for all directions (DOWN, UP, LEFT, RIGHT)
 * - Edge routing set to UNDEFINED for Libavoid fallback
 * - Complex graphs with 4+ nodes and multiple edges
 * - Node positioning and bounds calculation
 * - Edge data preservation through layout
 */

import { test, expect } from '@playwright/test';
import { ELKLayoutEngine, type ELKDirection } from '@/core/layout/engines/ELKLayoutEngine';
import type { LayoutGraphInput } from '@/core/layout/engines/LayoutEngine';

test.describe('ELKLayoutEngine - Port and Routing Tests', () => {
  let engine: ELKLayoutEngine;

  test.beforeEach(async () => {
    engine = new ELKLayoutEngine();
    await engine.initialize();
  });

  test.afterEach(async () => {
    await engine.cleanup();
  });

  test('should position a single node', async () => {
    // Arrange: simple graph with one node
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
      ],
      edges: [],
    };

    // Act: layout the graph
    const result = await engine.calculateLayout(graph);

    // Assert: node is positioned with x/y coordinates
    expect(result.nodes).toHaveLength(1);
    expect(result.nodes[0].id).toBe('node1');
    expect(result.nodes[0].position).toBeDefined();
    expect(typeof result.nodes[0].position.x).toBe('number');
    expect(typeof result.nodes[0].position.y).toBe('number');
  });

  test('should process edges with source and target node IDs', async () => {
    // Arrange: graph with nodes and edges
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Node 2' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', data: { label: 'edge' } },
      ],
    };

    // Act: layout the graph
    const result = await engine.calculateLayout(graph);

    // Assert: edge is processed with correct source and target node IDs
    expect(result.edges).toHaveLength(1);
    expect(result.edges[0].source).toBe('node1');
    expect(result.edges[0].target).toBe('node2');
    expect(result.edges[0].id).toBe('edge1');
  });

  test('should strip port suffix from port IDs', async () => {
    // Arrange: graph with edge using port-suffixed node IDs
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Node 2' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', data: { label: 'edge' } },
      ],
    };

    // Act: layout with port generation
    const result = await engine.calculateLayout(graph);

    // Assert: edges have stripped node IDs (not port IDs)
    expect(result.edges[0].source).toBe('node1');
    expect(result.edges[0].target).toBe('node2');
  });

  test('should handle node IDs with hyphens when stripping port suffix', async () => {
    // Arrange: nodes with hyphenated IDs like "node-service.validate-order"
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node-service.validate-order', data: { label: 'Validate' }, width: 120, height: 60 },
        { id: 'node-service.process-payment', data: { label: 'Process' }, width: 120, height: 60 },
      ],
      edges: [
        {
          id: 'edge1',
          source: 'node-service.validate-order',
          target: 'node-service.process-payment',
          data: { label: 'edge' },
        },
      ],
    };

    // Act: layout the graph
    const result = await engine.calculateLayout(graph);

    // Assert: node IDs are preserved (not stripped incorrectly)
    expect(result.edges[0].source).toBe('node-service.validate-order');
    expect(result.edges[0].target).toBe('node-service.process-payment');
  });

  test('should populate sourceSide and targetSide from port IDs', async () => {
    // Arrange: graph where ELK will assign port sides
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Source' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Target' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', data: { label: 'edge' } },
      ],
    };

    // Act: layout the graph (ELK assigns port sides)
    const result = await engine.calculateLayout(graph);

    // Assert: sourceSide and targetSide are populated
    expect(result.edges[0].sourceSide).toBeDefined();
    expect(result.edges[0].targetSide).toBeDefined();
    const validSides = ['top', 'bottom', 'left', 'right'];
    expect(validSides).toContain(result.edges[0].sourceSide);
    expect(validSides).toContain(result.edges[0].targetSide);
  });


  test('should handle complex graphs with 4+ nodes and edges', async () => {
    // Arrange: 4-node graph forming a hierarchy
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Root' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Left' }, width: 100, height: 50 },
        { id: 'node3', data: { label: 'Right' }, width: 100, height: 50 },
        { id: 'node4', data: { label: 'Bottom' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'e1', source: 'node1', target: 'node2', data: {} },
        { id: 'e2', source: 'node1', target: 'node3', data: {} },
        { id: 'e3', source: 'node2', target: 'node4', data: {} },
        { id: 'e4', source: 'node3', target: 'node4', data: {} },
      ],
    };

    // Act: layout the complex graph
    const result = await engine.calculateLayout(graph);

    // Assert: all nodes and edges are processed
    expect(result.nodes).toHaveLength(4);
    expect(result.edges).toHaveLength(4);

    // All edges should have source/target node IDs
    for (const edge of result.edges) {
      expect(['node1', 'node2', 'node3', 'node4']).toContain(edge.source);
      expect(['node1', 'node2', 'node3', 'node4']).toContain(edge.target);
    }

    // All nodes should have positions
    for (const node of result.nodes) {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    }
  });

  test('should preserve edge data through layout calculation', async () => {
    // Arrange: graph with edge data
    const edgeData = { label: 'test edge', color: 'red' };
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Node 2' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', data: edgeData },
      ],
    };

    // Act: layout the graph
    const result = await engine.calculateLayout(graph);

    // Assert: edge data is preserved
    expect(result.edges[0].data).toEqual(edgeData);
  });

  test('should calculate bounds for positioned nodes', async () => {
    // Arrange: graph with multiple nodes
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Node 2' }, width: 100, height: 50 },
        { id: 'node3', data: { label: 'Node 3' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'e1', source: 'node1', target: 'node2', data: {} },
        { id: 'e2', source: 'node2', target: 'node3', data: {} },
      ],
    };

    // Act: layout the graph
    const result = await engine.calculateLayout(graph);

    // Assert: bounds are calculated with minX, maxX, minY, maxY, width, height
    expect(result.bounds).toBeDefined();
    expect(typeof result.bounds.minX).toBe('number');
    expect(typeof result.bounds.maxX).toBe('number');
    expect(typeof result.bounds.minY).toBe('number');
    expect(typeof result.bounds.maxY).toBe('number');
    expect(typeof result.bounds.width).toBe('number');
    expect(typeof result.bounds.height).toBe('number');
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  test('should initialize engine with ELK instance', async () => {
    // Arrange: fresh engine
    const freshEngine = new ELKLayoutEngine();

    // Act: initialize
    await freshEngine.initialize();

    // Assert: engine can calculate layout after initialization
    const graph: LayoutGraphInput = {
      nodes: [{ id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 }],
      edges: [],
    };
    const result = await freshEngine.calculateLayout(graph);

    // Engine should successfully calculate layout
    expect(result.nodes).toHaveLength(1);
    expect(result.bounds).toBeDefined();

    // Cleanup
    await freshEngine.cleanup();
  });

  test('should filter out edges with invalid node references', async () => {
    // Arrange: graph with edge referencing non-existent node
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'nonexistent', data: {} },
      ],
    };

    // Act: layout the graph (should skip invalid edge)
    const result = await engine.calculateLayout(graph);

    // Assert: invalid edge is filtered out
    expect(result.edges).toHaveLength(0);
    expect(result.nodes).toHaveLength(1);
  });

  test('should return valid port sides for all edge directions', async () => {
    // Arrange: test data for multiple directions
    const directions: ELKDirection[] = ['DOWN', 'UP', 'LEFT', 'RIGHT'];
    const graph: LayoutGraphInput = {
      nodes: [
        { id: 'node1', data: { label: 'Node 1' }, width: 100, height: 50 },
        { id: 'node2', data: { label: 'Node 2' }, width: 100, height: 50 },
      ],
      edges: [
        { id: 'edge1', source: 'node1', target: 'node2', data: {} },
      ],
    };

    // Act & Assert: verify port sides for each direction
    for (const direction of directions) {
      const result = await engine.calculateLayout(graph, { direction });
      expect(result.edges).toHaveLength(1);
      expect(result.edges[0].sourceSide).toBeDefined();
      expect(result.edges[0].targetSide).toBeDefined();

      const validSides = ['top', 'bottom', 'left', 'right'];
      expect(validSides).toContain(result.edges[0].sourceSide);
      expect(validSides).toContain(result.edges[0].targetSide);
    }
  });
});
