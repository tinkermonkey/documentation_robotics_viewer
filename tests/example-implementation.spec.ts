import { test, expect } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

/**
 * Integration tests for loading the example-implementation YAML model
 * This verifies that the YAML parser can load real-world instance data
 */

test.describe('Example Implementation YAML Model', () => {
  const exampleImplPath = path.join(__dirname, '..', 'documentation-robotics', 'model');

  test('should have manifest.yaml file', () => {
    const manifestPath = path.join(exampleImplPath, 'manifest.yaml');
    expect(fs.existsSync(manifestPath)).toBeTruthy();

    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as any;

    // Verify manifest structure
    expect(manifest.version).toBe('0.1.0');
    expect(manifest.schema).toBe('documentation-robotics-v1');
    expect(manifest.project).toBeDefined();
    expect(manifest.project.name).toBe('documentation_robotics_viewer');
    expect(manifest.layers).toBeDefined();
  });

  test('should have expected layer directories', () => {
    const manifestPath = path.join(exampleImplPath, 'manifest.yaml');
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as any;

    // Verify each layer directory exists
    const layerDirs = [
      '01_motivation',
      '02_business',
      '03_security',
      '04_application',
      '05_technology',
      '06_api',
      '07_data_model',
      '08_datastore',
      '09_ux',
      '10_navigation',
    ];

    for (const dir of layerDirs) {
      const dirPath = path.join(exampleImplPath, dir);
      expect(fs.existsSync(dirPath)).toBeTruthy();
    }
  });

  test('should contain significant number of elements', () => {
    let fileCount = 0;
    const manifestPath = path.join(exampleImplPath, 'manifest.yaml');
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as any;
    
    for (const [key, layer] of Object.entries(manifest.layers)) {
        if ((layer as any).enabled) {
             const layerPath = path.join(__dirname, '..', (layer as any).path);
             if (fs.existsSync(layerPath)) {
                 const files = fs.readdirSync(layerPath).filter(f => f.endsWith('.yaml') || f.endsWith('.yml'));
                 fileCount += files.length;
             }
        }
    }

    expect(fileCount).toBeGreaterThan(5);
  });

  test('should have 12 enabled layers', () => {
    const manifestPath = path.join(exampleImplPath, 'manifest.yaml');
    const content = fs.readFileSync(manifestPath, 'utf-8');
    const manifest = yaml.load(content) as any;

    const enabledLayers = Object.values(manifest.layers).filter(
      (layer: any) => layer.enabled
    );
    expect(enabledLayers.length).toBe(12);
  });


  test('should parse data model entities', () => {
    const entitiesPath = path.join(exampleImplPath, '07_data_model', 'objects.yaml');
    expect(fs.existsSync(entitiesPath)).toBeTruthy();

    const content = fs.readFileSync(entitiesPath, 'utf-8');
    const entities = yaml.load(content) as any;

    expect(entities).toBeDefined();
    expect(Object.keys(entities).length).toBeGreaterThan(0);
  });

  test('should have projection-rules.yaml', () => {
    const projectionRulesPath = path.join(
      exampleImplPath,
      '..',
      'projection-rules.yaml'
    );
    expect(fs.existsSync(projectionRulesPath)).toBeTruthy();

    const content = fs.readFileSync(projectionRulesPath, 'utf-8');
    const rules = yaml.load(content) as any;

    expect(rules.version).toBe('0.1.0');
    expect(rules.projections).toBeDefined();
    expect(Array.isArray(rules.projections)).toBeTruthy();
    expect(rules.projections.length).toBeGreaterThan(0);
  });
});

