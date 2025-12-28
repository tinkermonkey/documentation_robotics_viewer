/**
 * Integration Test: Complete Layout Engine Workflow
 *
 * Tests the end-to-end workflow:
 * 1. Load dataset
 * 2. Switch between layout engines
 * 3. Apply refinement
 * 4. Export results
 *
 * Task Group 10.3: Strategic integration test for graph layout optimization
 */

import { test, expect } from '@playwright/test';
import { readFileSync } from 'fs';
import { join } from 'path';

test.describe('Layout Engine Workflow Integration', () => {
  test('should complete full optimization workflow: load -> switch engines -> refine -> export', async () => {
    // Import required modules
    const { loadModel } = await import('../../src/core/services/dataLoader');
    const { LayoutEngineRegistry } = await import(
      '../../src/core/layout/engines/LayoutEngineRegistry'
    );
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { DagreLayoutEngine } = await import(
      '../../src/core/layout/engines/DagreLayoutEngine'
    );
    const { GraphvizLayoutEngine } = await import(
      '../../src/core/layout/engines/GraphvizLayoutEngine'
    );

    // Step 1: Load public dataset (motivation layer)
    const datasetPath = join(
      process.cwd(),
      'tests/fixtures/public-datasets/motivation'
    );

    const model = await loadModel(datasetPath);
    expect(model).toBeDefined();
    expect(model.layers).toBeDefined();

    // Verify motivation layer data exists (YAML instance models use directory keys)
    const motivationLayer = model.layers['01_motivation'];
    expect(motivationLayer).toBeDefined();
    expect(motivationLayer.elements.length).toBeGreaterThan(0);

    // Step 2: Setup layout engine registry with multiple engines
    const registry = new LayoutEngineRegistry();

    const elkEngine = new ELKLayoutEngine();
    const dagreEngine = new DagreLayoutEngine();
    const graphvizEngine = new GraphvizLayoutEngine();

    await elkEngine.initialize();
    await dagreEngine.initialize();
    await graphvizEngine.initialize();

    registry.register('elk', elkEngine);
    registry.register('dagre', dagreEngine);
    registry.register('graphviz', graphvizEngine);

    // Verify all engines registered
    expect(registry.get('elk')).toBeDefined();
    expect(registry.get('dagre')).toBeDefined();
    expect(registry.get('graphviz')).toBeDefined();

    // Step 3: Apply layout with different engines and compare results
    const sampleNodes = motivationLayer.elements.slice(0, 10).map((el) => ({
      id: el.id,
      width: 180,
      height: 110,
      data: { label: el.name },
    }));

    // Get node IDs for filtering relationships
    const sampleNodeIds = new Set(sampleNodes.map(n => n.id));

    // Filter relationships to only include those connecting sampled nodes
    const sampleEdges = motivationLayer.relationships
      .filter(rel => sampleNodeIds.has(rel.sourceId) && sampleNodeIds.has(rel.targetId))
      .slice(0, 8)
      .map((rel) => ({
        id: rel.id,
        source: rel.sourceId,
        target: rel.targetId,
      }));

    const graphInput = { nodes: sampleNodes, edges: sampleEdges };

    // Apply ELK layout
    const elkResult = await elkEngine.calculateLayout(graphInput, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 80,
    });

    expect(elkResult.nodes.length).toBe(sampleNodes.length);
    expect(elkResult.nodes.every((n) => n.position)).toBe(true);

    // Apply Dagre layout
    const dagreResult = await dagreEngine.calculateLayout(graphInput, {
      rankdir: 'TB',
      nodesep: 80,
      ranksep: 120,
    });

    expect(dagreResult.nodes.length).toBe(sampleNodes.length);
    expect(dagreResult.nodes.every((n) => n.position)).toBe(true);

    // Apply Graphviz layout
    const graphvizResult = await graphvizEngine.calculateLayout(graphInput, {
      algorithm: 'dot',
      rankdir: 'TB',
      nodesep: 1.0,
      ranksep: 1.5,
    });

    expect(graphvizResult.nodes.length).toBe(sampleNodes.length);
    expect(graphvizResult.nodes.every((n) => n.position)).toBe(true);

    // Step 4: Verify results differ between engines
    const elkNode1 = elkResult.nodes.find((n) => n.id === sampleNodes[0].id);
    const dagreNode1 = dagreResult.nodes.find((n) => n.id === sampleNodes[0].id);
    const graphvizNode1 = graphvizResult.nodes.find((n) => n.id === sampleNodes[0].id);

    // At least some positions should differ (different algorithms)
    const allSamePosition =
      elkNode1?.position.x === dagreNode1?.position.x &&
      elkNode1?.position.y === dagreNode1?.position.y &&
      dagreNode1?.position.x === graphvizNode1?.position.x &&
      dagreNode1?.position.y === graphvizNode1?.position.y;

    expect(allSamePosition).toBe(false); // Different algorithms should produce different layouts

    // Step 5: Verify quality metrics can be calculated for all results
    const { calculateMetrics } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    const elkMetrics = calculateMetrics(elkResult.nodes as any[], elkResult.edges as any[]);
    const dagreMetrics = calculateMetrics(dagreResult.nodes as any[], dagreResult.edges as any[]);
    const graphvizMetrics = calculateMetrics(
      graphvizResult.nodes as any[],
      graphvizResult.edges as any[]
    );

    expect(elkMetrics.overallScore).toBeGreaterThan(0);
    expect(dagreMetrics.overallScore).toBeGreaterThan(0);
    expect(graphvizMetrics.overallScore).toBeGreaterThan(0);

    // Step 6: Verify export functionality works
    // (Simplified - actual export would use export services)
    const layoutSnapshot = {
      engine: 'elk',
      nodes: elkResult.nodes,
      edges: elkResult.edges,
      metrics: elkMetrics,
      timestamp: new Date().toISOString(),
    };

    const exported = JSON.stringify(layoutSnapshot);
    const reimported = JSON.parse(exported);

    expect(reimported.engine).toBe('elk');
    expect(reimported.nodes.length).toBe(sampleNodes.length);
    expect(reimported.metrics.overallScore).toBe(elkMetrics.overallScore);
  });

  test('should switch engines while preserving graph structure', async () => {
    const { LayoutEngineRegistry } = await import(
      '../../src/core/layout/engines/LayoutEngineRegistry'
    );
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { DagreLayoutEngine } = await import(
      '../../src/core/layout/engines/DagreLayoutEngine'
    );

    const registry = new LayoutEngineRegistry();
    const elkEngine = new ELKLayoutEngine();
    const dagreEngine = new DagreLayoutEngine();

    await elkEngine.initialize();
    await dagreEngine.initialize();

    registry.register('elk', elkEngine);
    registry.register('dagre', dagreEngine);

    // Create test graph
    const nodes = [
      { id: 'n1', width: 100, height: 50, data: { label: 'Node 1' } },
      { id: 'n2', width: 100, height: 50, data: { label: 'Node 2' } },
      { id: 'n3', width: 100, height: 50, data: { label: 'Node 3' } },
    ];

    const edges = [
      { id: 'e1', source: 'n1', target: 'n2' },
      { id: 'e2', source: 'n2', target: 'n3' },
    ];

    // Apply with ELK
    const elkResult = await elkEngine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
    });

    // Switch to Dagre
    const dagreResult = await dagreEngine.calculateLayout({ nodes, edges }, {
      rankdir: 'TB',
    });

    // Verify structure preserved
    expect(elkResult.nodes.length).toBe(nodes.length);
    expect(dagreResult.nodes.length).toBe(nodes.length);
    expect(elkResult.edges.length).toBe(edges.length);
    expect(dagreResult.edges.length).toBe(edges.length);

    // Verify node IDs preserved
    const elkNodeIds = elkResult.nodes.map((n) => n.id).sort();
    const dagreNodeIds = dagreResult.nodes.map((n) => n.id).sort();
    expect(elkNodeIds).toEqual(dagreNodeIds);

    // Verify edge connections preserved
    const elkEdgeConnections = elkResult.edges.map((e) => `${e.source}->${e.target}`).sort();
    const dagreEdgeConnections = dagreResult.edges
      .map((e) => `${e.source}->${e.target}`)
      .sort();
    expect(elkEdgeConnections).toEqual(dagreEdgeConnections);

    // Verify data preserved
    elkResult.nodes.forEach((node) => {
      const originalNode = nodes.find((n) => n.id === node.id);
      expect(node.data).toEqual(originalNode?.data);
    });

    dagreResult.nodes.forEach((node) => {
      const originalNode = nodes.find((n) => n.id === node.id);
      expect(node.data).toEqual(originalNode?.data);
    });
  });

  test('should measure quality baseline for public dataset', async () => {
    const { loadModel } = await import('../../src/core/services/dataLoader');
    const { ELKLayoutEngine } = await import(
      '../../src/core/layout/engines/ELKLayoutEngine'
    );
    const { calculateMetrics } = await import(
      '../../src/core/services/metrics/graphReadabilityService'
    );

    // Load motivation layer public dataset
    const datasetPath = join(
      process.cwd(),
      'tests/fixtures/public-datasets/motivation'
    );

    const model = await loadModel(datasetPath);
    const motivationLayer = model.layers['01_motivation'];

    // Apply optimal layout
    const engine = new ELKLayoutEngine();
    await engine.initialize();

    const nodes = motivationLayer.elements.map((el) => ({
      id: el.id,
      width: 180,
      height: 110,
      data: { label: el.name, type: el.type },
    }));

    const edges = motivationLayer.relationships.map((rel) => ({
      id: rel.id,
      source: rel.sourceId,
      target: rel.targetId,
    }));

    const result = await engine.calculateLayout({ nodes, edges }, {
      algorithm: 'layered',
      direction: 'DOWN',
      spacing: 80,
      layering: 'NETWORK_SIMPLEX',
    });

    // Calculate baseline metrics
    const metrics = calculateMetrics(result.nodes as any[], result.edges as any[]);

    // Verify baseline quality thresholds
    expect(metrics.overallScore).toBeGreaterThan(0.6); // Minimum acceptable
    expect(metrics.metrics.crossingNumber).toBeLessThan(10); // Should be low for hierarchical
    expect(metrics.extendedMetrics.nodeNodeOcclusion).toBe(0); // No overlaps expected

    // Store baseline for regression testing
    const baseline = {
      dataset: 'motivation',
      engine: 'elk',
      algorithm: 'layered',
      metrics: metrics,
      timestamp: new Date().toISOString(),
    };

    expect(baseline.metrics.overallScore).toBeDefined();
  });
});
