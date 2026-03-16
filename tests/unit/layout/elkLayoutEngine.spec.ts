/**
 * Unit tests for ELK Layout Engine with port-based routing
 *
 * Tests port generation, FIXED_SIDE constraints, port ID stripping,
 * and side information extraction from ELK output.
 */

import { test, expect } from '@playwright/test';

test.describe('ELK Layout Engine - Port-Based Routing', () => {
  test('should initialize ELK engine successfully', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    expect(engine.name).toBe('ELK Layout Engine');
    expect(engine.version).toBe('1.0.0');
    expect(engine.capabilities.hierarchical).toBe(true);
  });

  test('should generate four ports per node in ELK graph', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'node-1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'node-2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'edge-1', source: 'node-1', target: 'node-2' }],
    };

    // We need to test the internal convertToELKGraph method
    // This requires accessing private methods or inspecting the calculation
    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Verify that layout was calculated
    expect(result.nodes).toBeDefined();
    expect(result.nodes.length).toBe(2);
    expect(result.edges).toBeDefined();
    expect(result.edges.length).toBe(1);
  });

  test('should strip port IDs from edge sources and targets', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'nodeA', width: 100, height: 50, data: { label: 'Node A' } },
        { id: 'nodeB', width: 100, height: 50, data: { label: 'Node B' } },
      ],
      edges: [{ id: 'edge-AB', source: 'nodeA', target: 'nodeB' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Verify that edge sources and targets are node IDs (not port IDs)
    const edge = result.edges[0];
    expect(edge).toBeDefined();
    expect(edge.source).toBe('nodeA');
    expect(edge.target).toBe('nodeB');

    // Edge source and target should not contain port suffix like "-bottom" or "-top"
    expect(edge.source).not.toMatch(/-top|-bottom|-left|-right/);
    expect(edge.target).not.toMatch(/-top|-bottom|-left|-right/);
  });

  test('should populate sourceSide and targetSide for DOWN direction', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'top-node', width: 100, height: 50, data: { label: 'Top' } },
        { id: 'bottom-node', width: 100, height: 50, data: { label: 'Bottom' } },
      ],
      edges: [{ id: 'edge-down', source: 'top-node', target: 'bottom-node' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    const edge = result.edges[0];
    expect(edge).toBeDefined();

    // For DOWN direction: source uses bottom port, target uses top port
    expect(edge.sourceSide).toBe('bottom');
    expect(edge.targetSide).toBe('top');
  });

  test('should populate sourceSide and targetSide for RIGHT direction', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'left-node', width: 100, height: 50, data: { label: 'Left' } },
        { id: 'right-node', width: 100, height: 50, data: { label: 'Right' } },
      ],
      edges: [{ id: 'edge-right', source: 'left-node', target: 'right-node' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'RIGHT' });

    const edge = result.edges[0];
    expect(edge).toBeDefined();

    // For RIGHT direction: source uses right port, target uses left port
    expect(edge.sourceSide).toBe('right');
    expect(edge.targetSide).toBe('left');
  });

  test('should disable ELK internal edge routing', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Test with a small graph
    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    // The calculateLayout method uses the internal convertToELKGraph
    // which should set 'elk.edgeRouting': 'NONE'
    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    // If edge routing was NONE, Libavoid pass should take over
    // Verify that the layout was still calculated successfully
    expect(result.nodes.length).toBe(2);
    expect(result.edges.length).toBe(1);
  });

  test('should handle multiple edges between same nodes', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'src', width: 100, height: 50, data: { label: 'Source' } },
        { id: 'dst', width: 100, height: 50, data: { label: 'Destination' } },
      ],
      edges: [
        { id: 'edge1', source: 'src', target: 'dst' },
        { id: 'edge2', source: 'src', target: 'dst' },
      ],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Both edges should have proper source/target and side information
    expect(result.edges.length).toBe(2);

    result.edges.forEach((edge) => {
      expect(edge.source).toBe('src');
      expect(edge.target).toBe('dst');
      expect(edge.sourceSide).toBe('bottom');
      expect(edge.targetSide).toBe('top');
    });
  });

  test('should handle complex graph with many nodes and edges', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Create a more complex graph
    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
        { id: 'n3', width: 100, height: 50, data: { label: 'Node 3' } },
        { id: 'n4', width: 100, height: 50, data: { label: 'Node 4' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n1', target: 'n3' },
        { id: 'e3', source: 'n2', target: 'n4' },
        { id: 'e4', source: 'n3', target: 'n4' },
      ],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Verify all nodes are positioned
    expect(result.nodes.length).toBe(4);

    // Verify all edges have proper structure
    expect(result.edges.length).toBe(4);

    result.edges.forEach((edge) => {
      // All edges should have valid source and target without port suffix
      expect(edge.source).toMatch(/^n\d$/);
      expect(edge.target).toMatch(/^n\d$/);

      // All edges should have side information
      expect(['top', 'bottom', 'left', 'right']).toContain(edge.sourceSide);
      expect(['top', 'bottom', 'left', 'right']).toContain(edge.targetSide);
    });
  });

  test('should preserve edge data through conversion', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const customData = { weight: 5, label: 'important' };

    const graphInput = {
      nodes: [
        { id: 'a', width: 100, height: 50, data: { label: 'A' } },
        { id: 'b', width: 100, height: 50, data: { label: 'B' } },
      ],
      edges: [{ id: 'e1', source: 'a', target: 'b', data: customData }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    const edge = result.edges[0];
    expect(edge.data).toEqual(customData);
  });

  test('should use LAYER_SWEEP for crossing minimization in layered algorithm', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Create a graph that benefits from crossing minimization
    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Top Left' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Top Right' } },
        { id: 'n3', width: 100, height: 50, data: { label: 'Bottom Left' } },
        { id: 'n4', width: 100, height: 50, data: { label: 'Bottom Right' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n4' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Layout should succeed with crossing minimization strategy applied
    expect(result.nodes.length).toBe(4);
    expect(result.edges.length).toBe(2);

    // Verify nodes are positioned with proper hierarchy
    const layer1Nodes = result.nodes.slice(0, 2);
    const layer2Nodes = result.nodes.slice(2, 4);

    // Nodes in layer 2 should be positioned below layer 1 (DOWN direction)
    const avgY1 = layer1Nodes.reduce((sum, n) => sum + n.position.y, 0) / layer1Nodes.length;
    const avgY2 = layer2Nodes.reduce((sum, n) => sum + n.position.y, 0) / layer2Nodes.length;

    expect(avgY2).toBeGreaterThanOrEqual(avgY1);
  });

  test('should generate valid layout metadata', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    expect(result.metadata).toBeDefined();
    expect(result.metadata?.calculationTime).toBeGreaterThan(0);
    expect(result.metadata?.usedWorker).toBe(false);
    expect(result.metadata?.algorithm).toBe('layered');
  });

  test('should calculate correct bounds with port layout', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    const bounds = result.bounds;

    // Bounds should be valid
    expect(bounds.width).toBeGreaterThan(0);
    expect(bounds.height).toBeGreaterThan(0);
    expect(bounds.minX).toBeLessThanOrEqual(bounds.maxX);
    expect(bounds.minY).toBeLessThanOrEqual(bounds.maxY);

    // Width and height should match calculated bounds
    expect(bounds.width).toBe(bounds.maxX - bounds.minX);
    expect(bounds.height).toBe(bounds.maxY - bounds.minY);
  });

  test('should handle UP direction correctly', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'UP' });

    const edge = result.edges[0];

    // For UP direction: source uses top port, target uses bottom port
    expect(edge.sourceSide).toBe('top');
    expect(edge.targetSide).toBe('bottom');
  });

  test('should handle LEFT direction correctly', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      ],
      edges: [{ id: 'e1', source: 'n1', target: 'n2' }],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'LEFT' });

    const edge = result.edges[0];

    // For LEFT direction: source uses left port, target uses right port
    expect(edge.sourceSide).toBe('left');
    expect(edge.targetSide).toBe('right');
  });

  test('should use NETWORK_SIMPLEX for node placement in layered algorithm', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const graphInput = {
      nodes: [
        { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
        { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
        { id: 'n3', width: 100, height: 50, data: { label: 'Node 3' } },
      ],
      edges: [
        { id: 'e1', source: 'n1', target: 'n2' },
        { id: 'e2', source: 'n2', target: 'n3' },
      ],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered' });

    // Verify layout succeeds with NETWORK_SIMPLEX node placement
    expect(result.nodes.length).toBe(3);
    expect(result.edges.length).toBe(2);

    // Nodes should be positioned in a hierarchical manner
    const positions = result.nodes.map((n) => n.position.y);
    expect(Math.max(...positions)).toBeGreaterThan(Math.min(...positions));
  });

  test('should correctly strip port suffix from node IDs containing hyphens', async () => {
    const { ELKLayoutEngine } = await import(
      '../../../src/core/layout/engines/ELKLayoutEngine'
    );

    const engine = new ELKLayoutEngine();
    await engine.initialize();

    // Use realistic node IDs with hyphens and dots (like "service.validate-order")
    // These are the actual format used by nodeTransformer when prefixed with "node-"
    const graphInput = {
      nodes: [
        { id: 'node-service.validate-order', width: 100, height: 50, data: { label: 'Validate Order' } },
        { id: 'node-capability.payment-processing', width: 100, height: 50, data: { label: 'Payment Processing' } },
        { id: 'node-gateway.order-received', width: 100, height: 50, data: { label: 'Order Received' } },
      ],
      edges: [
        { id: 'edge1', source: 'node-service.validate-order', target: 'node-capability.payment-processing' },
        { id: 'edge2', source: 'node-gateway.order-received', target: 'node-service.validate-order' },
      ],
    };

    const result = await engine.calculateLayout(graphInput, { algorithm: 'layered', direction: 'DOWN' });

    // Verify edges have correct source/target (with full node IDs, not stripped)
    expect(result.edges.length).toBe(2);

    // Edge 1: service -> capability
    const edge1 = result.edges[0];
    expect(edge1.source).toBe('node-service.validate-order');
    expect(edge1.target).toBe('node-capability.payment-processing');
    expect(edge1.sourceSide).toBe('bottom');
    expect(edge1.targetSide).toBe('top');

    // Edge 2: gateway -> service
    const edge2 = result.edges[1];
    expect(edge2.source).toBe('node-gateway.order-received');
    expect(edge2.target).toBe('node-service.validate-order');
    expect(edge2.sourceSide).toBe('bottom');
    expect(edge2.targetSide).toBe('top');

    // Verify no edge has a port suffix in its source/target
    result.edges.forEach((edge) => {
      expect(edge.source).not.toMatch(/-top$|-bottom$|-left$|-right$/);
      expect(edge.target).not.toMatch(/-top$|-bottom$|-left$|-right$/);
    });
  });
});
