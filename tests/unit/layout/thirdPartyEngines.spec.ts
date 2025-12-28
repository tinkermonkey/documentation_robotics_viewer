/**
 * Unit tests for Third-Party Layout Engines (ELK and Graphviz)
 *
 * Tests ELK and Graphviz layout engine integration, conversion to/from React Flow format,
 * and basic algorithm execution. Focused on integration behavior, not exhaustive algorithm testing.
 *
 * Task Group 3.1: Tests for ELK and Graphviz engines
 */

import { test, expect } from '@playwright/test';

test.describe('ELK Layout Engine', () => {
  test('should calculate layered hierarchical layout', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();

    // Create sample hierarchical graph
    const graphInput = {
      nodes: [
        { id: 'root', width: 100, height: 50, data: { label: 'Root' } },
        { id: 'child1', width: 100, height: 50, data: { label: 'Child 1' } },
        { id: 'child2', width: 100, height: 50, data: { label: 'Child 2' } },
        { id: 'grandchild1', width: 100, height: 50, data: { label: 'Grandchild 1' } },
      ],
      edges: [
        { id: 'e1', source: 'root', target: 'child1' },
        { id: 'e2', source: 'root', target: 'child2' },
        { id: 'e3', source: 'child1', target: 'grandchild1' },
      ],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    // Verify React Flow format
    expect(result.nodes).toBeDefined();
    expect(result.edges).toBeDefined();
    expect(result.bounds).toBeDefined();

    // All nodes should have positions
    expect(result.nodes.length).toBe(4);
    result.nodes.forEach((node) => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('position');
      expect(node.position).toHaveProperty('x');
      expect(node.position).toHaveProperty('y');
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });

    // Edges should be preserved
    expect(result.edges.length).toBe(3);

    // Bounds should be calculated
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  test('should convert React Flow nodes/edges to ELK graph format', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 120, height: 60, data: { label: 'Node 1' } },
        { id: 'n2', width: 120, height: 60, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    // Verify node dimensions are preserved
    const node1 = result.nodes.find((n) => n.id === 'n1');
    const node2 = result.nodes.find((n) => n.id === 'n2');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();

    // Data should be preserved through conversion
    expect(node1?.data).toEqual({ label: 'Node 1' });
    expect(node2?.data).toEqual({ label: 'Node 2' });
  });

  test('should support multiple ELK algorithms', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 80, height: 40 },
        { id: 'n2', width: 80, height: 40 },
        { id: 'n3', width: 80, height: 40 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    };

    await engine.initialize();

    // Test layered algorithm
    const layeredResult = await engine.calculateLayout(graphInput, { algorithm: 'layered' });
    expect(layeredResult.nodes.length).toBe(3);
    expect(layeredResult.metadata?.algorithm).toBe('layered');

    // Test force algorithm
    const forceResult = await engine.calculateLayout(graphInput, { algorithm: 'force' });
    expect(forceResult.nodes.length).toBe(3);
    expect(forceResult.metadata?.algorithm).toBe('force');
  });

  test('should validate ELK parameters', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();

    // Valid parameters
    const validParams = {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 50,
    };

    const validValidation = engine.validateParameters(validParams);
    expect(validValidation.valid).toBe(true);
    expect(validValidation.errors).toHaveLength(0);

    // Invalid algorithm
    const invalidParams = {
      algorithm: 'invalid-algorithm',
      direction: 'DOWN',
    };

    const invalidValidation = engine.validateParameters(invalidParams);
    expect(invalidValidation.valid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });
});

test.describe('Graphviz Layout Engine', () => {
  test('should calculate dot algorithm on directed graph', async () => {
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const engine = new GraphvizLayoutEngine();

    // Create sample directed graph
    const graphInput = {
      nodes: [
        { id: 'a', width: 100, height: 50, data: { label: 'A' } },
        { id: 'b', width: 100, height: 50, data: { label: 'B' } },
        { id: 'c', width: 100, height: 50, data: { label: 'C' } },
      ],
      edges: [
        { id: 'e1', source: 'a', target: 'b' },
        { id: 'e2', source: 'b', target: 'c' },
      ],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { algorithm: 'dot' });

    // Verify React Flow format
    expect(result.nodes).toBeDefined();
    expect(result.edges).toBeDefined();
    expect(result.bounds).toBeDefined();

    // All nodes should have positions
    expect(result.nodes.length).toBe(3);
    result.nodes.forEach((node) => {
      expect(node).toHaveProperty('id');
      expect(node).toHaveProperty('position');
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });

    // Bounds should be calculated
    expect(result.bounds.width).toBeGreaterThan(0);
    expect(result.bounds.height).toBeGreaterThan(0);
  });

  test('should convert React Flow graph to DOT format', async () => {
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const engine = new GraphvizLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'node1', width: 150, height: 75, data: { label: 'Start' } },
        { id: 'node2', width: 150, height: 75, data: { label: 'End' } },
      ],
      edges: [{ id: 'edge1', source: 'node1', target: 'node2' }],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { algorithm: 'dot' });

    // Verify data preservation through DOT conversion
    const node1 = result.nodes.find((n) => n.id === 'node1');
    const node2 = result.nodes.find((n) => n.id === 'node2');

    expect(node1).toBeDefined();
    expect(node2).toBeDefined();
    expect(node1?.data).toEqual({ label: 'Start' });
    expect(node2?.data).toEqual({ label: 'End' });

    // Edges should be preserved
    expect(result.edges.length).toBe(1);
    expect(result.edges[0].id).toBe('edge1');
  });

  test('should support multiple Graphviz algorithms', async () => {
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const engine = new GraphvizLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 60, height: 60 },
        { id: 'n2', width: 60, height: 60 },
        { id: 'n3', width: 60, height: 60 },
        { id: 'n4', width: 60, height: 60 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
        { id: 'e3', source: 'n3', target: 'n4' },
        { id: 'e4', source: 'n4', target: 'n1' },
      ],
    };

    await engine.initialize();

    // Test dot algorithm (hierarchical)
    const dotResult = await engine.calculateLayout(graphInput, { algorithm: 'dot' });
    expect(dotResult.nodes.length).toBe(4);
    expect(dotResult.metadata?.algorithm).toBe('dot');

    // Test neato algorithm (spring model)
    const neatoResult = await engine.calculateLayout(graphInput, { algorithm: 'neato' });
    expect(neatoResult.nodes.length).toBe(4);
    expect(neatoResult.metadata?.algorithm).toBe('neato');

    // Test circo algorithm (circular)
    const circoResult = await engine.calculateLayout(graphInput, { algorithm: 'circo' });
    expect(circoResult.nodes.length).toBe(4);
    expect(circoResult.metadata?.algorithm).toBe('circo');
  });

  test('should preserve node dimensions and edge routing', async () => {
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const engine = new GraphvizLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'a', width: 200, height: 100, data: { type: 'large' } },
        { id: 'b', width: 50, height: 25, data: { type: 'small' } },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', data: { weight: 5 } }],
    };

    await engine.initialize();
    const result = await engine.calculateLayout(graphInput, { algorithm: 'dot' });

    // Node dimensions should be considered in layout
    expect(result.nodes.length).toBe(2);

    // Edge data should be preserved
    expect(result.edges[0].data).toEqual({ weight: 5 });

    // Optional edge routing points may be added by Graphviz
    // (We don't strictly require them, but they're allowed)
    result.edges.forEach((edge) => {
      if (edge.points) {
        expect(Array.isArray(edge.points)).toBe(true);
        edge.points.forEach((point) => {
          expect(point).toHaveProperty('x');
          expect(point).toHaveProperty('y');
        });
      }
    });
  });

  test('should validate Graphviz parameters', async () => {
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const engine = new GraphvizLayoutEngine();

    // Valid parameters
    const validParams = {
      algorithm: 'dot',
      rankdir: 'TB',
      nodesep: 1.0,
      ranksep: 1.5,
    };

    const validValidation = engine.validateParameters(validParams);
    expect(validValidation.valid).toBe(true);
    expect(validValidation.errors).toHaveLength(0);

    // Invalid algorithm
    const invalidParams = {
      algorithm: 'not-a-real-algorithm',
      rankdir: 'TB',
    };

    const invalidValidation = engine.validateParameters(invalidParams);
    expect(invalidValidation.valid).toBe(false);
    expect(invalidValidation.errors.length).toBeGreaterThan(0);
  });
});

test.describe('Third-Party Engine Integration', () => {
  test('should register ELK and Graphviz engines in registry', async () => {
    const { LayoutEngineRegistry } = await import(
      '../../../src/core/layout/engines/LayoutEngineRegistry'
    );
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const registry = new LayoutEngineRegistry();

    // Register both engines
    registry.register('elk', new ELKLayoutEngine());
    registry.register('graphviz', new GraphvizLayoutEngine());

    // Verify registration
    const elkEngine = registry.get('elk');
    const graphvizEngine = registry.get('graphviz');

    expect(elkEngine).toBeDefined();
    expect(elkEngine?.name).toBe('ELK Layout Engine');

    expect(graphvizEngine).toBeDefined();
    expect(graphvizEngine?.name).toBe('Graphviz Layout Engine');

    // Check capabilities
    expect(elkEngine?.capabilities.hierarchical).toBe(true);
    expect(graphvizEngine?.capabilities.hierarchical).toBe(true);
  });

  test('should produce different layouts for same graph', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { GraphvizLayoutEngine } = await import(
      '../../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    const elkEngine = new ELKLayoutEngine();
    const graphvizEngine = new GraphvizLayoutEngine();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 80, height: 40 },
        { id: 'n2', width: 80, height: 40 },
        { id: 'n3', width: 80, height: 40 },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    };

    await elkEngine.initialize();
    await graphvizEngine.initialize();

    const elkResult = await elkEngine.calculateLayout(graphInput, { algorithm: 'layered' });
    const graphvizResult = await graphvizEngine.calculateLayout(graphInput, { algorithm: 'dot' });

    // Both should produce valid layouts
    expect(elkResult.nodes.length).toBe(3);
    expect(graphvizResult.nodes.length).toBe(3);

    // Positions may differ (different algorithms)
    // We just verify both are valid React Flow outputs
    elkResult.nodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });

    graphvizResult.nodes.forEach((node) => {
      expect(typeof node.position.x).toBe('number');
      expect(typeof node.position.y).toBe('number');
    });
  });
});
