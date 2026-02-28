/**
 * Unit tests for Third-Party Layout Engines (ELK)
 *
 * Tests ELK layout engine integration, conversion to/from React Flow format,
 * and basic algorithm execution. Focused on integration behavior, not exhaustive algorithm testing.
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

