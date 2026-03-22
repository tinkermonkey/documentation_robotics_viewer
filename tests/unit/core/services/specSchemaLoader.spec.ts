/**
 * Unit tests for specSchemaLoader
 * Tests loading and parsing of spec schemas from layer files
 */

import { test, expect } from '@playwright/test';
import {
  loadSpecSchemas,
} from '../../../../src/core/services/specSchemaLoader';

test.describe('specSchemaLoader', () => {
  test('should load valid spec schemas', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1: Motivation Layer',
        },
        nodeSchemas: {
          goal: { type: 'object' },
          requirement: { type: 'object' },
        },
        relationshipSchemas: {
          'motivation.goal.supports.motivation.goal': {
            id: 'motivation.goal.supports.motivation.goal',
            source_spec_node_id: 'motivation.goal',
            source_layer: 'motivation',
            destination_spec_node_id: 'motivation.goal',
            destination_layer: 'motivation',
            predicate: 'supports',
            cardinality: 'many-to-many',
            strength: 'medium',
            required: false,
          },
        },
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(Object.keys(result).length).toBe(1);
    expect(result['motivation']).toBeDefined();
    expect(result['motivation'].layer.id).toBe('motivation');
    expect(result['motivation'].layer.number).toBe(1);
  });

  test('should index by layer ID', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
      'business.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'business',
          number: 2,
          name: 'Business Layer',
          description: 'Layer 2',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation']).toBeDefined();
    expect(result['business']).toBeDefined();
    expect(result['motivation'].layer.id).toBe('motivation');
    expect(result['business'].layer.id).toBe('business');
  });

  test('should parse node schemas', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {
          goal: { $id: 'motivation.goal', type: 'object' },
          requirement: { $id: 'motivation.requirement', type: 'object' },
        },
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(Object.keys(result['motivation'].nodeSchemas).length).toBe(2);
    expect(result['motivation'].nodeSchemas['goal']).toBeDefined();
    expect(result['motivation'].nodeSchemas['requirement']).toBeDefined();
  });

  test('should parse relationship schemas', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {
          'motivation.goal.supports.motivation.goal': {
            id: 'motivation.goal.supports.motivation.goal',
            source_spec_node_id: 'motivation.goal',
            source_layer: 'motivation',
            destination_spec_node_id: 'motivation.goal',
            destination_layer: 'motivation',
            predicate: 'supports',
            cardinality: 'many-to-many',
            strength: 'medium',
            required: false,
          },
          'motivation.goal.realizes.business.function': {
            id: 'motivation.goal.realizes.business.function',
            source_spec_node_id: 'motivation.goal',
            source_layer: 'motivation',
            destination_spec_node_id: 'business.function',
            destination_layer: 'business',
            predicate: 'realizes',
            cardinality: 'many-to-one',
            strength: 'high',
            required: true,
          },
        },
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation'].relationshipSchemas.length).toBe(2);
    expect(result['motivation'].relationshipSchemas[0].predicate).toBe(
      'supports'
    );
    expect(result['motivation'].relationshipSchemas[1].predicate).toBe(
      'realizes'
    );
  });

  test('should skip base.json and manifest.json files', () => {
    const specFiles = {
      'base.json': {
        specVersion: '0.8.3',
        predicates: {},
      },
      'manifest.json': {
        version: '0.8.3',
      },
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['motivation']).toBeDefined();
    expect(result['base']).toBeUndefined();
  });

  test('should skip files without json extension', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
      'readme.md': {
        content: 'not a json spec file',
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(Object.keys(result)).toHaveLength(1);
    expect(result['motivation']).toBeDefined();
  });

  test('should return empty record for invalid input', () => {
    const result1 = loadSpecSchemas(null as any);
    expect(Object.keys(result1).length).toBe(0);

    const result2 = loadSpecSchemas(undefined as any);
    expect(Object.keys(result2).length).toBe(0);
  });

  test('should skip files with invalid layer metadata', () => {
    const specFiles = {
      'invalid.json': {
        specVersion: '0.8.3',
        layer: {
          // Missing id
          number: 1,
          name: 'Invalid Layer',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
      'valid.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'valid',
          number: 2,
          name: 'Valid Layer',
          description: 'Layer 2',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(Object.keys(result).length).toBe(1);
    expect(result['valid']).toBeDefined();
    expect(result['invalid']).toBeUndefined();
  });

  test('should handle missing nodeSchemas gracefully', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        // Missing nodeSchemas
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation']).toBeDefined();
    expect(result['motivation'].nodeSchemas).toEqual({});
  });

  test('should handle missing relationshipSchemas gracefully', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {
          goal: { type: 'object' },
        },
        // Missing relationshipSchemas
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation']).toBeDefined();
    expect(result['motivation'].relationshipSchemas).toEqual([]);
  });

  test('should skip invalid relationship definitions', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {
          'valid.rel': {
            id: 'motivation.goal.supports.motivation.goal',
            source_spec_node_id: 'motivation.goal',
            source_layer: 'motivation',
            destination_spec_node_id: 'motivation.goal',
            destination_layer: 'motivation',
            predicate: 'supports',
            cardinality: 'many-to-many',
            strength: 'medium',
            required: false,
          },
          'invalid.rel': {
            id: 'invalid',
            // Missing source_spec_node_id
            source_layer: 'motivation',
            destination_spec_node_id: 'motivation.goal',
            destination_layer: 'motivation',
            predicate: 'supports',
            cardinality: 'many-to-many',
            strength: 'medium',
            required: false,
          },
        },
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation'].relationshipSchemas.length).toBe(1);
  });

  test('should handle empty nodeSchemas and relationshipSchemas', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {},
      },
    };

    const result = loadSpecSchemas(specFiles);

    expect(result['motivation']).toBeDefined();
    expect(Object.keys(result['motivation'].nodeSchemas).length).toBe(0);
    expect(result['motivation'].relationshipSchemas.length).toBe(0);
  });

  test('should preserve all relationship fields', () => {
    const specFiles = {
      'motivation.json': {
        specVersion: '0.8.3',
        layer: {
          id: 'motivation',
          number: 1,
          name: 'Motivation Layer',
          description: 'Layer 1',
        },
        nodeSchemas: {},
        relationshipSchemas: {
          'rel-1': {
            id: 'motivation.goal.supports.motivation.goal',
            source_spec_node_id: 'motivation.goal',
            source_layer: 'motivation',
            destination_spec_node_id: 'motivation.goal',
            destination_layer: 'motivation',
            predicate: 'supports',
            cardinality: 'many-to-many',
            strength: 'critical',
            required: true,
          },
        },
      },
    };

    const result = loadSpecSchemas(specFiles);
    const rel = result['motivation'].relationshipSchemas[0];

    expect(rel.id).toBe('motivation.goal.supports.motivation.goal');
    expect(rel.sourceSpecNodeId).toBe('motivation.goal');
    expect(rel.sourceLayer).toBe('motivation');
    expect(rel.destinationSpecNodeId).toBe('motivation.goal');
    expect(rel.destinationLayer).toBe('motivation');
    expect(rel.predicate).toBe('supports');
    expect(rel.cardinality).toBe('many-to-many');
    expect(rel.strength).toBe('critical');
    expect(rel.required).toBe(true);
  });
});
