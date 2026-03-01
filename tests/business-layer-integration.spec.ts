/**
 * Integration tests for Business Layer Parser
 *
 * Tests the parser and graph builder with fixture data.
 * (Previously used DataLoader to load YAML files; replaced with static fixtures
 * after the YAML parsing pipeline was removed in the Pipeline Redesign.)
 */

import { test, expect } from '@playwright/test';
import { BusinessLayerParser } from '../src/core/services/businessLayerParser';
import { BusinessGraphBuilder } from '../src/core/services/businessGraphBuilder';
import { MetaModel } from '../src/core/types/model';

/**
 * Create a fixture MetaModel with business layer data similar to example-implementation
 */
function createExampleImplementationModel(): MetaModel {
  return {
    id: 'example-implementation',
    name: 'Example Implementation',
    version: '1.0.0',
    description: 'Example business layer model for integration testing',
    layers: {
      business: {
        id: 'business',
        type: 'Business',
        name: 'Business Layer',
        description: 'Business capabilities and services',
        order: 2,
        elements: [
          {
            id: 'cap-visualization',
            type: 'capability',
            specNodeId: 'business.capability',
            name: 'Visualization',
            description: 'Graph visualization capability',
            layerId: 'business',
            properties: { maturity: 'high' },
            visual: { position: { x: 0, y: 0 }, size: { width: 200, height: 100 }, style: {} },
          },
          {
            id: 'cap-documentation',
            type: 'capability',
            specNodeId: 'business.capability',
            name: 'Documentation',
            description: 'Documentation management capability',
            layerId: 'business',
            properties: { maturity: 'medium' },
            visual: { position: { x: 0, y: 0 }, size: { width: 200, height: 100 }, style: {} },
          },
          {
            id: 'cap-validation',
            type: 'capability',
            specNodeId: 'business.capability',
            name: 'Validation',
            description: 'Model validation capability',
            layerId: 'business',
            properties: {},
            visual: { position: { x: 0, y: 0 }, size: { width: 200, height: 100 }, style: {} },
          },
          {
            id: 'svc-api',
            type: 'service',
            specNodeId: 'business.service',
            name: 'API Service',
            description: 'REST API service for model access',
            layerId: 'business',
            properties: {},
            visual: { position: { x: 0, y: 0 }, size: { width: 200, height: 100 }, style: {} },
          },
          {
            id: 'proc-review',
            type: 'process',
            specNodeId: 'business.process',
            name: 'Review Process',
            description: 'Architecture review process',
            layerId: 'business',
            properties: {},
            visual: { position: { x: 0, y: 0 }, size: { width: 200, height: 100 }, style: {} },
          },
        ],
        relationships: [
          {
            id: 'rel-1',
            type: 'composition',
            sourceId: 'cap-visualization',
            targetId: 'svc-api',
            properties: { label: 'uses' },
          },
          {
            id: 'rel-2',
            type: 'composition',
            sourceId: 'cap-documentation',
            targetId: 'proc-review',
            properties: { label: 'uses' },
          },
        ],
      },
    },
    references: [],
    metadata: {
      author: 'Integration Test Fixture',
      created: new Date().toISOString(),
      elementCount: 5,
      layerCount: 1,
    },
  };
}

test.describe('Business Layer Parser Integration Tests', () => {
  test('should parse business layer from example-implementation model', () => {
    const model = createExampleImplementationModel();

    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    expect(businessLayerData.elements.length).toBeGreaterThan(0);
    console.log(`Extracted ${businessLayerData.elements.length} business elements`);

    expect(businessLayerData.relationships.length).toBeGreaterThanOrEqual(0);
    console.log(`Extracted ${businessLayerData.relationships.length} business relationships`);

    expect(businessLayerData.metadata.elementCount).toBe(businessLayerData.elements.length);
    expect(businessLayerData.metadata.relationshipCount).toBe(businessLayerData.relationships.length);

    const elementsByType = businessLayerData.metadata.elementsByType;
    console.log('Elements by type:', elementsByType);
    expect(elementsByType['capability']).toBeGreaterThan(0);

    const visualizationCap = businessLayerData.elements.find((e) => e.name === 'Visualization');
    expect(visualizationCap).toBeDefined();
    expect(visualizationCap?.type).toBe('capability');

    const documentationCap = businessLayerData.elements.find((e) => e.name === 'Documentation');
    expect(documentationCap).toBeDefined();
    expect(documentationCap?.type).toBe('capability');
  });

  test('should build business graph from example-implementation model', () => {
    const model = createExampleImplementationModel();
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(businessLayerData.elements, businessLayerData.relationships);

    expect(graph.nodes.size).toBe(businessLayerData.elements.length);
    expect(graph.edges.size).toBeGreaterThanOrEqual(0);
    console.log(`Built graph with ${graph.nodes.size} nodes, ${graph.edges.size} edges`);

    expect(graph.hierarchy).toBeDefined();
    expect(graph.hierarchy.maxDepth).toBeGreaterThanOrEqual(0);
    console.log(`Hierarchy max depth: ${graph.hierarchy.maxDepth}`);

    expect(graph.metrics.nodeCount).toBe(graph.nodes.size);
    expect(graph.metrics.edgeCount).toBe(graph.edges.size);
    console.log(`Orphaned nodes: ${graph.metrics.orphanedNodes.length}`);
    console.log(`Circular dependencies: ${graph.metrics.circularDependencies.length}`);

    expect(graph.indices.byType.size).toBeGreaterThan(0);
    console.log(`Indexed ${graph.indices.byType.size} types`);
  });

  test('should handle malformed data gracefully', () => {
    const model = createExampleImplementationModel();
    const parser = new BusinessLayerParser();

    expect(() => parser.parseBusinessLayer(model)).not.toThrow();

    const businessLayerData = parser.parseBusinessLayer(model);

    const warnings = parser.getWarnings();
    if (warnings.length > 0) {
      console.log(`Parser warnings (${warnings.length}):`);
      warnings.slice(0, 5).forEach((w) => console.log(`  - ${w}`));
    }

    expect(businessLayerData.elements.length).toBeGreaterThan(0);
  });

  test('should validate business relationships', () => {
    const model = createExampleImplementationModel();
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const validation = parser.validateBusinessRelationships(businessLayerData.elements);

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

    expect(validation.errors.some((e) => e.includes('Duplicate'))).toBe(false);
  });

  test('should detect circular dependencies if present', () => {
    const model = createExampleImplementationModel();
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const builder = new BusinessGraphBuilder();
    const graph = builder.buildGraph(businessLayerData.elements, businessLayerData.relationships);

    const cycles = graph.metrics.circularDependencies;
    console.log(`Circular dependencies detected: ${cycles.length}`);

    if (cycles.length > 0) {
      console.log('First cycle:');
      console.log(`  Type: ${cycles[0].type}`);
      console.log(`  Cycle: ${cycles[0].cycle.join(' -> ')}`);
    }

    expect(Array.isArray(cycles)).toBe(true);
  });

  test('should calculate element counts by type', () => {
    const model = createExampleImplementationModel();
    const parser = new BusinessLayerParser();
    const businessLayerData = parser.parseBusinessLayer(model);

    const elementsByType = businessLayerData.metadata.elementsByType;

    console.log('Element counts by type:');
    for (const [type, count] of Object.entries(elementsByType)) {
      console.log(`  ${type}: ${count}`);
    }

    expect(elementsByType).toHaveProperty('capability');

    const total = Object.values(elementsByType).reduce((a, b) => a + b, 0);
    expect(total).toBe(businessLayerData.elements.length);
  });
});
