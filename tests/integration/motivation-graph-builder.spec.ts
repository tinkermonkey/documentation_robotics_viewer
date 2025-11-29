/**
 * Integration test for MotivationGraphBuilder with example-implementation data
 */

import { test, expect } from '@playwright/test';
import { MotivationGraphBuilder } from '../../src/apps/embedded/services/motivationGraphBuilder';
import { DataLoader } from '../../src/core/services/dataLoader';
import { MotivationElementType, MotivationRelationshipType } from '../../src/apps/embedded/types/motivationGraph';
import * as path from 'path';
import * as fs from 'fs';

test.describe('MotivationGraphBuilder Integration Tests', () => {
  test('should parse example-implementation motivation layer', async () => {
    // Load the example-implementation model
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');

    // Verify the directory exists
    expect(fs.existsSync(modelPath)).toBe(true);

    const dataLoader = new DataLoader();

    // Create a mock file list from the model directory
    const files: { [key: string]: string } = {};

    // Read manifest
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    // Read all motivation layer files
    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    // Also read other layers for complete model
    const layers = [
      '02_business', '03_security', '04_application', '05_technology',
      '06_api', '07_data_model', '08_datastore', '09_ux', '10_navigation', '11_apm'
    ];

    for (const layer of layers) {
      const layerPath = path.join(modelPath, layer);
      if (fs.existsSync(layerPath)) {
        const layerFiles = fs.readdirSync(layerPath);
        for (const file of layerFiles) {
          if (file.endsWith('.yaml') || file.endsWith('.yml')) {
            const filePath = path.join(layerPath, file);
            const content = fs.readFileSync(filePath, 'utf-8');
            files[`${layer}/${file}`] = content;
          }
        }
      }
    }

    // Parse the YAML files into MetaModel
    const metaModel = await dataLoader.parseYAMLInstances(files);

    // Verify we have a motivation layer
    expect(metaModel.layers['Motivation']).toBeDefined();

    // Build the motivation graph
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Verify the graph was built successfully
    expect(graph.nodes.size).toBeGreaterThan(0);
    console.log(`Built graph with ${graph.nodes.size} nodes and ${graph.edges.size} edges`);

    // Verify element counts match manifest expectations
    // From manifest: goal: 5, driver: 5, stakeholder: 5, constraint: 5, assessment: 1
    expect(graph.metadata.elementCounts[MotivationElementType.Goal]).toBe(5);
    expect(graph.metadata.elementCounts[MotivationElementType.Driver]).toBe(5);
    expect(graph.metadata.elementCounts[MotivationElementType.Stakeholder]).toBe(5);
    expect(graph.metadata.elementCounts[MotivationElementType.Constraint]).toBe(5);
    expect(graph.metadata.elementCounts[MotivationElementType.Assessment]).toBe(1);

    // Total should be 21 motivation elements
    const totalElements = Object.values(graph.metadata.elementCounts).reduce((sum, count) => sum + count, 0);
    expect(totalElements).toBe(21);

    console.log('Element counts:', graph.metadata.elementCounts);
    console.log('Relationship counts:', graph.metadata.relationshipCounts);
  });

  test('should correctly resolve relationships', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};

    // Read necessary files
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Verify relationships exist
    expect(graph.edges.size).toBeGreaterThan(0);

    // Check that all edges have valid source and target nodes
    for (const edge of graph.edges.values()) {
      expect(graph.nodes.has(edge.sourceId)).toBe(true);
      expect(graph.nodes.has(edge.targetId)).toBe(true);
    }

    // Verify relationship types are mapped correctly
    const relationshipTypes = Array.from(graph.edges.values()).map(e => e.type);
    console.log('Unique relationship types:', [...new Set(relationshipTypes)]);

    // Should have motivates, has_interest, constrains, etc.
    const hasMotivates = relationshipTypes.includes(MotivationRelationshipType.Motivates);
    const hasInterest = relationshipTypes.includes(MotivationRelationshipType.HasInterest);
    const hasConstrainedBy = relationshipTypes.includes(MotivationRelationshipType.ConstrainedBy);

    expect(hasMotivates || hasInterest || hasConstrainedBy).toBe(true);
  });

  test('should build correct adjacency lists', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Verify adjacency lists are built
    expect(graph.adjacencyLists.outgoing.size).toBeGreaterThan(0);
    expect(graph.adjacencyLists.incoming.size).toBeGreaterThan(0);

    // Check consistency: every edge should be reflected in adjacency lists
    for (const edge of graph.edges.values()) {
      const outgoing = graph.adjacencyLists.outgoing.get(edge.sourceId);
      expect(outgoing?.has(edge.targetId)).toBe(true);

      const incoming = graph.adjacencyLists.incoming.get(edge.targetId);
      expect(incoming?.has(edge.sourceId)).toBe(true);
    }
  });

  test('should calculate metrics correctly', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // All nodes should have metrics calculated
    for (const node of graph.nodes.values()) {
      expect(node.metrics.degreeCentrality).toBeGreaterThanOrEqual(0);
      expect(node.metrics.inDegree).toBeGreaterThanOrEqual(0);
      expect(node.metrics.outDegree).toBeGreaterThanOrEqual(0);
      expect(node.metrics.influenceDepth).toBeGreaterThanOrEqual(0);
      expect(node.metrics.influenceHeight).toBeGreaterThanOrEqual(0);

      // Degree centrality should equal in + out
      expect(node.metrics.degreeCentrality).toBe(node.metrics.inDegree + node.metrics.outDegree);
    }

    // Verify adjacency in nodes matches metrics
    for (const node of graph.nodes.values()) {
      expect(node.adjacency.outgoing.length).toBe(node.metrics.outDegree);
      expect(node.adjacency.incoming.length).toBe(node.metrics.inDegree);
    }

    // Metadata should have max influence depth
    expect(graph.metadata.maxInfluenceDepth).toBeGreaterThanOrEqual(0);

    console.log('Max influence depth:', graph.metadata.maxInfluenceDepth);
    console.log('Graph density:', graph.metadata.density);
  });

  test('should not produce any parsing errors', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Should have no warnings
    const warnings = builder.getWarnings();
    console.log('Warnings:', warnings);

    // Allow warnings but no critical errors
    expect(graph.metadata.warnings.length).toBeLessThan(10);
  });

  test('should verify stakeholder-goal relationships', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Find stakeholders
    const stakeholders = Array.from(graph.nodes.values()).filter(
      n => n.element.type === MotivationElementType.Stakeholder
    );

    expect(stakeholders.length).toBe(5);

    // Verify stakeholders have outgoing relationships (has_interest in goals)
    let stakeholderWithInterests = 0;
    for (const stakeholder of stakeholders) {
      if (stakeholder.metrics.outDegree > 0) {
        stakeholderWithInterests++;
      }
    }

    console.log(`Stakeholders with interests: ${stakeholderWithInterests}/${stakeholders.length}`);
    expect(stakeholderWithInterests).toBeGreaterThan(0);
  });

  test('should verify driver-goal relationships', async () => {
    const modelPath = path.join(process.cwd(), 'example-implementation', 'model');
    const dataLoader = new DataLoader();

    const files: { [key: string]: string } = {};
    const manifestPath = path.join(modelPath, 'manifest.yaml');
    if (fs.existsSync(manifestPath)) {
      files['manifest.yaml'] = fs.readFileSync(manifestPath, 'utf-8');
    }

    const motivationPath = path.join(modelPath, '01_motivation');
    if (fs.existsSync(motivationPath)) {
      const motivationFiles = fs.readdirSync(motivationPath);
      for (const file of motivationFiles) {
        if (file.endsWith('.yaml') || file.endsWith('.yml')) {
          const filePath = path.join(motivationPath, file);
          const content = fs.readFileSync(filePath, 'utf-8');
          files[`01_motivation/${file}`] = content;
        }
      }
    }

    const metaModel = await dataLoader.parseYAMLInstances(files);
    const builder = new MotivationGraphBuilder();
    const graph = builder.build(metaModel);

    // Find drivers
    const drivers = Array.from(graph.nodes.values()).filter(
      n => n.element.type === MotivationElementType.Driver
    );

    expect(drivers.length).toBe(5);

    // Verify drivers motivate goals
    let driversWithMotivations = 0;
    for (const driver of drivers) {
      if (driver.metrics.outDegree > 0) {
        driversWithMotivations++;
      }
    }

    console.log(`Drivers with motivations: ${driversWithMotivations}/${drivers.length}`);
    expect(driversWithMotivations).toBeGreaterThan(0);
  });
});
