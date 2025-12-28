/**
 * Unit tests for Layout Engine Abstraction Layer
 *
 * Tests the common layout engine interface, engine registration,
 * parameter normalization, and result conversion to React Flow format.
 *
 * Focused on core abstraction behavior rather than exhaustive edge cases.
 */

import { test, expect } from '@playwright/test';

test.describe('Layout Engine Interface', () => {
  test('should register and retrieve layout engines', async () => {
    // Dynamically import to avoid module loading issues
    const { LayoutEngineRegistry } = await import(
      '../../../src/core/layout/engines/LayoutEngineRegistry'
    );

    const registry = new LayoutEngineRegistry();

    // Mock engine for testing
    const mockEngine = {
      name: 'test-engine',
      version: '1.0.0',
      capabilities: {
        hierarchical: true,
        forceDirected: false,
        orthogonal: false,
        circular: false,
      },
      initialize: async () => {},
      calculateLayout: async () => ({
        nodes: [],
        edges: [],
        bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 },
      }),
      getParameters: () => ({}),
      validateParameters: () => ({ valid: true, errors: [] }),
    };

    // Register the mock engine
    registry.register('test', mockEngine);

    // Retrieve and verify
    const retrieved = registry.get('test');
    expect(retrieved).toBeDefined();
    expect(retrieved?.name).toBe('test-engine');
  });

  test('should switch between layout engines at runtime', async () => {
    const { LayoutEngineRegistry } = await import(
      '../../../src/core/layout/engines/LayoutEngineRegistry'
    );

    const registry = new LayoutEngineRegistry();

    const engine1 = {
      name: 'engine-1',
      version: '1.0.0',
      capabilities: { hierarchical: true, forceDirected: false, orthogonal: false, circular: false },
      initialize: async () => {},
      calculateLayout: async () => ({
        nodes: [],
        edges: [],
        bounds: { minX: 0, maxX: 100, minY: 0, maxY: 100, width: 100, height: 100 },
      }),
      getParameters: () => ({}),
      validateParameters: () => ({ valid: true, errors: [] }),
    };

    const engine2 = {
      name: 'engine-2',
      version: '1.0.0',
      capabilities: { hierarchical: false, forceDirected: true, orthogonal: false, circular: false },
      initialize: async () => {},
      calculateLayout: async () => ({
        nodes: [],
        edges: [],
        bounds: { minX: 0, maxX: 200, minY: 0, maxY: 200, width: 200, height: 200 },
      }),
      getParameters: () => ({}),
      validateParameters: () => ({ valid: true, errors: [] }),
    };

    registry.register('engine1', engine1);
    registry.register('engine2', engine2);

    // Switch between engines
    const first = registry.get('engine1');
    expect(first?.name).toBe('engine-1');

    const second = registry.get('engine2');
    expect(second?.name).toBe('engine-2');
  });

  test('should normalize parameters across different engines', async () => {
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );

    const dagreEngine = new DagreLayoutEngine();

    // Test parameter normalization
    const params = dagreEngine.getParameters();
    expect(params).toBeDefined();
    expect(typeof params).toBe('object');

    // Dagre should have standard hierarchical parameters
    const validation = dagreEngine.validateParameters({
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
    });

    expect(validation.valid).toBe(true);
    expect(validation.errors).toHaveLength(0);
  });

  test('should convert layout results to React Flow format', async () => {
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );

    const engine = new DagreLayoutEngine();

    // Create simple graph input
    const graphInput = {
      nodes: [
        { id: 'node-1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'node-2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { rankdir: 'TB' });

    // Verify React Flow format
    expect(result.nodes).toBeDefined();
    expect(result.edges).toBeDefined();
    expect(result.bounds).toBeDefined();

    // Nodes should have positions
    expect(result.nodes.length).toBe(2);
    result.nodes.forEach((node) => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('position');
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
    });

    // Bounds should be calculated
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  test('should detect engine capabilities', async () => {
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );
    const { D3ForceLayoutEngine } = await import(
      '../../../src/core/layout/engines/D3ForceLayoutEngine'
    );

    const dagreEngine = new DagreLayoutEngine();
    const d3Engine = new D3ForceLayoutEngine();

    // Dagre should support hierarchical layouts
    expect(dagreEngine.capabilities.hierarchical).toBe(true);
    expect(dagreEngine.capabilities.forceDirected).toBe(false);

    // D3 Force should support force-directed layouts
    expect(d3Engine.capabilities.forceDirected).toBe(true);
    expect(d3Engine.capabilities.hierarchical).toBe(false);
  });

  test('should validate incompatible parameters', async () => {
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );

    const engine = new DagreLayoutEngine();

    // Test with invalid direction
    const invalidParams = {
      rankdir: 'INVALID' as any,
      nodesep: 80,
      ranksep: 120,
    };

    const validation = engine.validateParameters(invalidParams);
    expect(validation.valid).toBe(false);
    expect(validation.errors.length).toBeGreaterThan(0);
  });

  test('should handle engine factory pattern', async () => {
    const { LayoutEngineRegistry } = await import(
      '../../../src/core/layout/engines/LayoutEngineRegistry'
    );
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );

    const registry = new LayoutEngineRegistry();

    // Register dagre engine
    registry.register('dagre', new DagreLayoutEngine());

    // Create instance via factory
    const engine = registry.create('dagre');
    expect(engine).toBeDefined();
    expect(engine?.name).toBe('Dagre Layout Engine');
  });

  test('should maintain backward compatibility with existing dagre usage', async () => {
    const { DagreLayoutEngine } = await import(
      '../../../src/core/layout/engines/DagreLayoutEngine'
    );

    const engine = new DagreLayoutEngine();

    // Test that dagre wrapper works with existing parameter format
    const graphInput = {
      nodes: [
        { id: 'n1', width: 180, height: 110, data: { label: 'Goal 1' } },
        { id: 'n2', width: 180, height: 110, data: { label: 'Goal 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, {
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
    });

    // Should produce valid layout
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);

    // Nodes should be positioned vertically (TB direction)
    const node1 = result.nodes.find((n) => n.id === 'n1');
    const node2 = result.nodes.find((n) => n.id === 'n2');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();

    // In TB layout, second node should be below first node
    if (node1 && node2) {
      expect(node2.position.y).toBeGreaterThan(node1.position.y);
    }
  });
});
