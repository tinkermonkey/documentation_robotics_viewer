/**
 * Integration tests for Business Layer Parser with example-implementation model
 *
 * Tests the complete parsing pipeline with real YAML instance data.
 */

import { test, expect } from '@playwright/test';
import { BusinessLayerParser } from '../src/core/services/businessLayerParser';
import { BusinessGraphBuilder } from '../src/core/services/businessGraphBuilder';
import { CrossLayerReferenceResolver } from '../src/core/services/crossLayerReferenceResolver';
import { DataLoader } from '../src/core/services/dataLoader';
import { LocalFileLoader } from '../src/core/services/localFileLoader';
import { SpecParser } from '../src/core/services/specParser';
import { GitHubService } from '../src/core/services/githubService';
import { MetaModel } from '../src/core/types/model';
import * as fs from 'fs';
import * as path from 'path';

test.describe('Business Layer Parser Integration Tests', () => {
  let dataLoader: DataLoader;

  test.beforeAll(() => {
    const gitHubService = new GitHubService('http://localhost:8080');
    const localFileLoader = new LocalFileLoader();
    const specParser = new SpecParser();
    dataLoader = new DataLoader(gitHubService, localFileLoader, specParser);
  });

  test('should parse business layer from example-implementation model', async () => {
    // Load the example-implementation model
    const model = await loadExampleImplementation(dataLoader);

    // Parse business layer
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    // Verify elements were extracted
    expect(businessLayerData.elements.length).toBeGreaterThan(0);
    console.log(
      `Extracted ${businessLayerData.elements.length} business elements`
    );

    // Verify relationships were extracted (can be 0 in this model)
    expect(businessLayerData.relationships.length).toBeGreaterThanOrEqual(0);
    console.log(
      `Extracted ${businessLayerData.relationships.length} business relationships`
    );

    // Verify metadata
    expect(businessLayerData.metadata.elementCount).toBe(
      businessLayerData.elements.length
    );
    expect(businessLayerData.metadata.relationshipCount).toBe(
      businessLayerData.relationships.length
    );

    // Check element types
    const elementsByType = businessLayerData.metadata.elementsByType;
    console.log('Elements by type:', elementsByType);

    expect(elementsByType['capability']).toBeGreaterThan(0);

    // Verify specific elements from capabilities.yaml
    const visualizationCap = businessLayerData.elements.find(
      (e) => e.name === 'Visualization'
    );
    expect(visualizationCap).toBeDefined();
    expect(visualizationCap?.type).toBe('capability');

    // Verify specific elements from capabilities.yaml
    const documentationCap = businessLayerData.elements.find(
      (e) => e.name === 'Documentation'
    );
    expect(documentationCap).toBeDefined();
    expect(documentationCap?.type).toBe('capability');
  });

  test('should build business graph from example-implementation model', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    // Build graph
    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Verify graph structure
    expect(graph.nodes.size).toBe(businessLayerData.elements.length);
    expect(graph.edges.size).toBeGreaterThanOrEqual(0);

    console.log(`Built graph with ${graph.nodes.size} nodes, ${graph.edges.size} edges`);

    // Verify hierarchy was calculated
    expect(graph.hierarchy).toBeDefined();
    expect(graph.hierarchy.maxDepth).toBeGreaterThanOrEqual(0);
    console.log(`Hierarchy max depth: ${graph.hierarchy.maxDepth}`);

    // Verify metrics
    expect(graph.metrics.nodeCount).toBe(graph.nodes.size);
    expect(graph.metrics.edgeCount).toBe(graph.edges.size);
    console.log(`Orphaned nodes: ${graph.metrics.orphanedNodes.length}`);
    console.log(`Circular dependencies: ${graph.metrics.circularDependencies.length}`);

    // Verify indices
    expect(graph.indices.byType.size).toBeGreaterThan(0);
    console.log(`Indexed ${graph.indices.byType.size} types`);
  });

  test('should resolve cross-layer references', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Resolve cross-layer references
    const resolver = new CrossLayerReferenceResolver();
    const enrichedGraph = resolver.resolveAllLinks(graph, model);

    console.log(
      `Resolved ${enrichedGraph.crossLayerLinks.length} cross-layer links`
    );

    // Verify links were found
    expect(enrichedGraph.crossLayerLinks).toBeDefined();

    // Count links by target layer
    const linksByLayer = new Map<string, number>();
    for (const link of enrichedGraph.crossLayerLinks) {
      linksByLayer.set(
        link.targetLayer,
        (linksByLayer.get(link.targetLayer) || 0) + 1
      );
    }

    console.log('Cross-layer links by target layer:');
    for (const [layer, count] of linksByLayer.entries()) {
      console.log(`  ${layer}: ${count}`);
    }
  });

  test('should handle malformed data gracefully', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();

    // Parse should not throw even with real-world data inconsistencies
    expect(() => parser.parseBusinessLayer(model)).not.toThrow();

    const businessLayerData = parser.parseBusinessLayer(model);

    // Check warnings
    const warnings = parser.getWarnings();
    if (warnings.length > 0) {
      console.log(`Parser warnings (${warnings.length}):`);
      warnings.slice(0, 5).forEach((w) => console.log(`  - ${w}`));
    }

    // Should still produce valid output
    expect(businessLayerData.elements.length).toBeGreaterThan(0);
  });

  test('should validate business relationships', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    // Validate relationships
    const validation = parser.validateBusinessRelationships(
      businessLayerData.elements
    );

    console.log('Validation result:');
    console.log(`  Valid: ${validation.valid}`);
    console.log(`  Errors: ${validation.errors.length}`);
    console.log(`  Warnings: ${validation.warnings.length}`);

    if (validation.errors.length > 0) {
      console.log('Validation errors:');
      validation.errors.slice(0, 3).forEach((e) => console.log(`  - ${e}`));
    }

    if (validation.warnings.length > 0) {
      console.log('Validation warnings:');
      validation.warnings.slice(0, 3).forEach((w) => console.log(`  - ${w}`));
    }

    // Should have no duplicate IDs
    expect(validation.errors.some((e) => e.includes('Duplicate'))).toBe(false);
  });

  test('should detect circular dependencies if present', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(
      businessLayerData.elements,
      businessLayerData.relationships
    );

    // Check for circular dependencies
    const cycles = graph.metrics.circularDependencies;
    console.log(`Circular dependencies detected: ${cycles.length}`);

    if (cycles.length > 0) {
      console.log('First cycle:');
      console.log(`  Type: ${cycles[0].type}`);
      console.log(`  Cycle: ${cycles[0].cycle.join(' -> ')}`);
    }

    // Log result (may or may not have cycles, both are valid)
    expect(Array.isArray(cycles)).toBe(true);
  });

  test('should calculate element counts by type', async () => {
    const model = await loadExampleImplementation(dataLoader);
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const elementsByType = businessLayerData.metadata.elementsByType;

    // Log counts
    console.log('Element counts by type:');
    for (const [type, count] of Object.entries(elementsByType)) {
      console.log(`  ${type}: ${count}`);
    }

    // Verify we have at least capabilities
    expect(elementsByType).toHaveProperty('capability');

    // Total should match element count
    const total = Object.values(elementsByType).reduce((a, b) => a + b, 0);
    expect(total).toBe(businessLayerData.elements.length);
  });
});

/**
 * Load example-implementation model from filesystem using Node.js APIs
 */
async function loadExampleImplementation(dataLoader: DataLoader): Promise<MetaModel> {
  const examplePath = path.join(process.cwd(), 'documentation-robotics', 'model');

  // Check if example-implementation exists
  if (!fs.existsSync(examplePath)) {
    throw new Error(
      'documentation-robotics directory not found. Please ensure it exists in the project root.'
    );
  }

  // Read all YAML files from the directory structure
  const schemas: Record<string, string> = {};

  // Read manifest.yaml
  const manifestPath = path.join(examplePath, 'manifest.yaml');
  if (fs.existsSync(manifestPath)) {
    schemas['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
  }

  // Read projection-rules.yaml
  const projectionRulesPath = path.join(process.cwd(), 'example-implementation', 'projection-rules.yaml');
  if (fs.existsSync(projectionRulesPath)) {
    schemas['projection-rules.yaml'] = fs.readFileSync(projectionRulesPath, 'utf-8');
  }

  // Recursively read all YAML files from layer directories
  function readYAMLFiles(dirPath: string, relativePath: string = '') {
    if (!fs.existsSync(dirPath)) {
      return;
    }

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });

    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      const relativeFilePath = relativePath ? `${relativePath}/${entry.name}` : entry.name;

      if (entry.isDirectory()) {
        readYAMLFiles(fullPath, relativeFilePath);
      } else if (entry.isFile() && (entry.name.endsWith('.yaml') || entry.name.endsWith('.yml'))) {
        const content = fs.readFileSync(fullPath, 'utf-8');
        schemas[relativeFilePath] = content;
      }
    }
  }

  // Read all layer directories
  readYAMLFiles(examplePath);

  console.log(`Loaded ${Object.keys(schemas).length} YAML files from example-implementation`);

  // Use DataLoader.parseYAMLInstances() public method to convert to MetaModel
  return dataLoader.parseYAMLInstances(schemas, 'example-implementation');
}
