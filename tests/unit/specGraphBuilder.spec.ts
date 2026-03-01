/**
 * Unit tests for specGraphBuilder utility functions and SpecGraphBuilder class
 */

import { test, expect } from '@playwright/test';
import { isLayerSchema, sortLayerSchemas, SpecGraphBuilder } from '../../src/apps/embedded/services/specGraphBuilder';
import type { SchemaDefinition, SpecDataResponse } from '../../src/apps/embedded/services/embeddedDataLoader';

// --- isLayerSchema ---

test.describe('isLayerSchema()', () => {
  test('returns true when schema has nodeSchemas', () => {
    const schema: SchemaDefinition = { nodeSchemas: { Foo: {} } } as SchemaDefinition;
    expect(isLayerSchema(schema)).toBe(true);
  });

  test('returns true when schema has layer.name string', () => {
    const schema: SchemaDefinition = { layer: { name: 'Motivation' } } as SchemaDefinition;
    expect(isLayerSchema(schema)).toBe(true);
  });

  test('returns false for manifest schema (no nodeSchemas, no layer.name)', () => {
    const schema: SchemaDefinition = { title: 'Manifest', description: 'manifest schema' } as SchemaDefinition;
    expect(isLayerSchema(schema)).toBe(false);
  });

  test('returns false for base schema with only meta keys', () => {
    const schema: SchemaDefinition = { $schema: 'http://json-schema.org/draft-07/schema#', $id: 'base' } as SchemaDefinition;
    expect(isLayerSchema(schema)).toBe(false);
  });

  test('returns false when layer exists but has no name', () => {
    const schema: SchemaDefinition = { layer: { description: 'something' } } as SchemaDefinition;
    expect(isLayerSchema(schema)).toBe(false);
  });
});

// --- sortLayerSchemas ---

test.describe('sortLayerSchemas()', () => {
  test('sorts entries by numeric prefix ascending', () => {
    const entries: [string, SchemaDefinition][] = [
      ['03_application', {} as SchemaDefinition],
      ['01_motivation', {} as SchemaDefinition],
      ['02_business', {} as SchemaDefinition],
    ];
    const sorted = sortLayerSchemas(entries);
    expect(sorted.map(([k]) => k)).toEqual(['01_motivation', '02_business', '03_application']);
  });

  test('non-prefixed schemas sort to end, alphabetically', () => {
    const entries: [string, SchemaDefinition][] = [
      ['zzz_misc', {} as SchemaDefinition],
      ['01_motivation', {} as SchemaDefinition],
      ['aaa_other', {} as SchemaDefinition],
    ];
    const sorted = sortLayerSchemas(entries);
    expect(sorted[0][0]).toBe('01_motivation');
    expect(sorted[1][0]).toBe('aaa_other');
    expect(sorted[2][0]).toBe('zzz_misc');
  });

  test('does not mutate the input array', () => {
    const entries: [string, SchemaDefinition][] = [
      ['02_business', {} as SchemaDefinition],
      ['01_motivation', {} as SchemaDefinition],
    ];
    const original = [...entries];
    sortLayerSchemas(entries);
    expect(entries[0][0]).toBe(original[0][0]);
    expect(entries[1][0]).toBe(original[1][0]);
  });

  test('handles entries with large numeric prefixes', () => {
    const entries: [string, SchemaDefinition][] = [
      ['10_navigation', {} as SchemaDefinition],
      ['02_business', {} as SchemaDefinition],
      ['09_ux', {} as SchemaDefinition],
    ];
    const sorted = sortLayerSchemas(entries);
    expect(sorted.map(([k]) => k)).toEqual(['02_business', '09_ux', '10_navigation']);
  });
});

// --- SpecGraphBuilder.buildSpecModel ---

test.describe('SpecGraphBuilder.buildSpecModel()', () => {
  let builder: SpecGraphBuilder;

  test.beforeEach(() => {
    builder = new SpecGraphBuilder();
  });

  test('returns null when selectedSchemaId is null', () => {
    const specData: SpecDataResponse = { schemas: { '01_motivation': {} as SchemaDefinition } } as SpecDataResponse;
    expect(builder.buildSpecModel(specData, null)).toBeNull();
  });

  test('returns null when specData has no schemas', () => {
    const specData: SpecDataResponse = {} as SpecDataResponse;
    expect(builder.buildSpecModel(specData, '01_motivation')).toBeNull();
  });

  test('returns null when selected schema has no element types', () => {
    const specData: SpecDataResponse = {
      schemas: { '01_motivation': {} as SchemaDefinition },
    } as SpecDataResponse;
    expect(builder.buildSpecModel(specData, '01_motivation')).toBeNull();
  });

  test('creates correct node count from nodeSchemas', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal', description: 'A goal' },
            Driver: { title: 'Driver', description: 'A driver' },
          },
        } as unknown as SchemaDefinition,
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    expect(model).not.toBeNull();
    const layer = model!.layers['01_motivation'];
    expect(layer.elements.length).toBe(2);
  });

  test('creates edges from relationshipCatalog', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
            Driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'influences',
            sourceTypes: ['Goal'],
            targetTypes: ['Driver'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBeGreaterThanOrEqual(1);
    expect(layer.relationships[0].type).toBe('influences');
  });

  test('skips catalog entries where source type not in schema', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'influences',
            sourceTypes: ['Goal'],  // Goal not in schema
            targetTypes: ['Driver'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBe(0);
  });

  test('skips catalog entries where target type not in schema', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'influences',
            sourceTypes: ['Goal'],
            targetTypes: ['Driver'],  // Driver not in schema
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBe(0);
  });

  test('uses relType.id as edge type label', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
            Driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'constrains',
            name: 'Constrains',
            sourceTypes: ['Goal'],
            targetTypes: ['Driver'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships[0].type).toBe('constrains');
  });

  test('falls back to relType.name when id is missing', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
            Driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: '',
            name: 'MyRelName',
            sourceTypes: ['Goal'],
            targetTypes: ['Driver'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships[0].type).toBe('MyRelName');
  });

  test('fuzzy matching: catalog uses namespace-prefixed type "motivation.Goal" → matches schema key "Goal"', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
            Driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'influences',
            sourceTypes: ['motivation.Goal'],
            targetTypes: ['motivation.Driver'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBeGreaterThanOrEqual(1);
    expect(layer.relationships[0].type).toBe('influences');
  });

  test('fuzzy matching: catalog uses uppercase type "GOAL" → matches schema key "goal" (case-insensitive)', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            goal: { title: 'Goal' },
            driver: { title: 'Driver' },
          },
        } as unknown as SchemaDefinition,
      },
      relationshipCatalog: {
        relationshipTypes: [
          {
            id: 'influences',
            sourceTypes: ['GOAL'],
            targetTypes: ['DRIVER'],
          },
        ],
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBeGreaterThanOrEqual(1);
  });

  test('relationshipSchemas dict creates edges using source_spec_node_id and destination_spec_node_id', () => {
    const specData: SpecDataResponse = {
      schemas: {
        'navigation.json': {
          nodeSchemas: {
            breadcrumbconfig: { title: 'BreadcrumbConfig' },
            navigationgraph: { title: 'NavigationGraph' },
          },
          relationshipSchemas: {
            'navigation.breadcrumbconfig.associated-with.navigation.navigationgraph': {
              id: 'navigation.breadcrumbconfig.associated-with.navigation.navigationgraph',
              source_spec_node_id: 'navigation.breadcrumbconfig',
              destination_spec_node_id: 'navigation.navigationgraph',
              predicate: 'associated-with',
            },
          },
        } as unknown as SchemaDefinition,
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, 'navigation.json');
    const layer = model!.layers['navigation.json'];
    expect(layer.relationships.length).toBe(1);
    expect(layer.relationships[0].type).toBe('associated-with');
  });

  test('relationshipSchemas: namespace-prefixed source/dest ids match elementMap keys via findByType', () => {
    const specData: SpecDataResponse = {
      schemas: {
        'ux.json': {
          nodeSchemas: {
            actioncomponent: { title: 'ActionComponent' },
            dataconfig: { title: 'DataConfig' },
          },
          relationshipSchemas: {
            'ux.actioncomponent.binds-to.ux.dataconfig': {
              id: 'ux.actioncomponent.binds-to.ux.dataconfig',
              source_spec_node_id: 'ux.actioncomponent',
              destination_spec_node_id: 'ux.dataconfig',
              predicate: 'binds-to',
            },
          },
        } as unknown as SchemaDefinition,
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, 'ux.json');
    const layer = model!.layers['ux.json'];
    expect(layer.relationships.length).toBe(1);
    expect(layer.relationships[0].type).toBe('binds-to');
  });

  test('relationshipSchemas skips entries with missing source or destination', () => {
    const specData: SpecDataResponse = {
      schemas: {
        'api.json': {
          nodeSchemas: {
            operation: { title: 'Operation' },
          },
          relationshipSchemas: {
            'bad.rel': {
              id: 'bad.rel',
              // source_spec_node_id missing
              destination_spec_node_id: 'api.operation',
              predicate: 'uses',
            },
          },
        } as unknown as SchemaDefinition,
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, 'api.json');
    const layer = model!.layers['api.json'];
    expect(layer.relationships.length).toBe(0);
  });

  test('schema-level relationshipTypes creates edges even without global catalog', () => {
    const specData: SpecDataResponse = {
      schemas: {
        '01_motivation': {
          nodeSchemas: {
            Goal: { title: 'Goal' },
            Driver: { title: 'Driver' },
          },
          relationshipTypes: [
            {
              id: 'influences',
              sourceTypes: ['Goal'],
              targetTypes: ['Driver'],
            },
          ],
        } as unknown as SchemaDefinition,
      },
    } as SpecDataResponse;
    const model = builder.buildSpecModel(specData, '01_motivation');
    const layer = model!.layers['01_motivation'];
    expect(layer.relationships.length).toBeGreaterThanOrEqual(1);
    expect(layer.relationships[0].type).toBe('influences');
  });
});
