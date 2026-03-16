/**
 * Unit tests for SpecParser
 *
 * Tests the parsing of JSON spec files into internal model format,
 * with special focus on filtering phantom relationships with empty IDs.
 */

import { test, expect } from '@playwright/test';
import { SpecParser } from '../../src/core/services/specParser';
import { LayerType } from '../../src/core/types';

test.describe('SpecParser', () => {
  let parser: SpecParser;

  test.beforeEach(() => {
    parser = new SpecParser();
  });

  test.describe('parse()', () => {
    test('should parse a valid layer spec', () => {
      const spec = {
        format: 'json',
        version: '0.1.0',
        elements: [
          { id: 'el-1', type: 'Component', name: 'Service A' },
          { id: 'el-2', type: 'Component', name: 'Service B' },
        ],
        relationships: [
          { id: 'rel-1', source: 'el-1', target: 'el-2', type: 'depends-on' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.id).toBe(LayerType.Application);
      expect(layer.type).toBe(LayerType.Application);
      expect(layer.elements.length).toBe(2);
      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].sourceId).toBe('el-1');
      expect(layer.relationships[0].targetId).toBe('el-2');
    });

    test('should throw error when spec is not an object', () => {
      expect(() => parser.parse(null, LayerType.Application)).toThrow(
        'Invalid JSON spec: must be an object'
      );
    });

    test('should handle empty elements array', () => {
      const spec = {
        elements: [],
        relationships: [],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.elements.length).toBe(0);
      expect(layer.relationships.length).toBe(0);
    });
  });

  test.describe('parseRelationships() - phantom relationship filtering', () => {
    test('should filter out relationships with missing sourceId', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
        ],
        relationships: [
          // Valid relationship
          { id: 'rel-1', source: 'el-1', target: 'el-1', type: 'self-ref' },
          // Phantom: missing source
          { id: 'rel-2', target: 'el-1', type: 'unknown-source' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].id).toBe('rel-1');
    });

    test('should filter out relationships with missing targetId', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
        ],
        relationships: [
          // Valid relationship
          { id: 'rel-1', source: 'el-1', target: 'el-1', type: 'self-ref' },
          // Phantom: missing target
          { id: 'rel-2', source: 'el-1', type: 'unknown-target' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].id).toBe('rel-1');
    });

    test('should filter out relationships with both sourceId and targetId missing', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
        ],
        relationships: [
          // Valid relationship
          { id: 'rel-1', source: 'el-1', target: 'el-1', type: 'self-ref' },
          // Phantom: missing both source and target
          { id: 'rel-2', type: 'incomplete' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].id).toBe('rel-1');
    });

    test('should filter out all relationships with empty IDs', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
        ],
        relationships: [
          // Multiple phantom relationships with various missing fields
          { id: 'rel-1', type: 'unknown' },
          { id: 'rel-2', source: '', target: '', type: 'empty-strings' },
          { id: 'rel-3', sourceId: '', targetId: '', type: 'explicit-empty' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(0);
    });

    test('should preserve valid relationships alongside filtered phantom ones', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
          { id: 'el-2', name: 'Element 2' },
          { id: 'el-3', name: 'Element 3' },
        ],
        relationships: [
          { id: 'rel-1', source: 'el-1', target: 'el-2', type: 'depends-on' },
          { id: 'rel-2', source: 'el-2', type: 'incomplete' }, // phantom
          { id: 'rel-3', source: 'el-2', target: 'el-3', type: 'depends-on' },
          { id: 'rel-4', target: 'el-1', type: 'incomplete' }, // phantom
          { id: 'rel-5', source: 'el-3', target: 'el-1', type: 'depends-on' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(3);
      expect(layer.relationships.map(r => r.id)).toEqual(['rel-1', 'rel-3', 'rel-5']);
    });

    test('should support sourceId and targetId as alternative field names', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
          { id: 'el-2', name: 'Element 2' },
        ],
        relationships: [
          { id: 'rel-1', sourceId: 'el-1', targetId: 'el-2', type: 'depends-on' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(1);
      expect(layer.relationships[0].sourceId).toBe('el-1');
      expect(layer.relationships[0].targetId).toBe('el-2');
    });

    test('should handle relationships with no relationships array', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);

      expect(layer.relationships.length).toBe(0);
    });

    test('should return empty relationships when relationships is not an array', () => {
      const spec = {
        elements: [],
        relationships: 'not-an-array',
      };

      const layer = parser.parse(spec, LayerType.Application);
      expect(layer.relationships.length).toBe(0);
    });
  });

  test.describe('validateLayer()', () => {
    test('should validate a layer with valid relationships', () => {
      const spec = {
        elements: [
          { id: 'el-1', name: 'Element 1' },
          { id: 'el-2', name: 'Element 2' },
        ],
        relationships: [
          { id: 'rel-1', source: 'el-1', target: 'el-2', type: 'depends-on' },
        ],
      };

      const layer = parser.parse(spec, LayerType.Application);
      const validation = parser.validateLayer(layer);

      expect(validation.valid).toBe(true);
      expect(validation.errors.length).toBe(0);
    });

    test('should report error for relationship with non-existent source', () => {
      const layer = {
        id: LayerType.Application,
        type: LayerType.Application,
        name: 'Application',
        elements: [
          { id: 'el-1', type: 'Component', name: 'Element 1', layerId: LayerType.Application, properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, relationships: { incoming: [], outgoing: [] } },
        ],
        relationships: [
          { id: 'rel-1', sourceId: 'non-existent', targetId: 'el-1', type: 'depends-on' as const, properties: {} },
        ],
        data: { format: 'json', version: '0.1.0', metadata: {} },
      };

      const validation = parser.validateLayer(layer);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('non-existent source'))).toBe(true);
    });

    test('should report error for relationship with non-existent target', () => {
      const layer = {
        id: LayerType.Application,
        type: LayerType.Application,
        name: 'Application',
        elements: [
          { id: 'el-1', type: 'Component', name: 'Element 1', layerId: LayerType.Application, properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, relationships: { incoming: [], outgoing: [] } },
        ],
        relationships: [
          { id: 'rel-1', sourceId: 'el-1', targetId: 'non-existent', type: 'depends-on' as const, properties: {} },
        ],
        data: { format: 'json', version: '0.1.0', metadata: {} },
      };

      const validation = parser.validateLayer(layer);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('non-existent target'))).toBe(true);
    });

    test('should skip validation for relationships with empty IDs', () => {
      // This should not happen after parsing, but test defensive coding
      const layer = {
        id: LayerType.Application,
        type: LayerType.Application,
        name: 'Application',
        elements: [
          { id: 'el-1', type: 'Component', name: 'Element 1', layerId: LayerType.Application, properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, relationships: { incoming: [], outgoing: [] } },
        ],
        relationships: [
          { id: 'rel-1', sourceId: '', targetId: '', type: 'depends-on' as const, properties: {} },
        ],
        data: { format: 'json', version: '0.1.0', metadata: {} },
      };

      const validation = parser.validateLayer(layer);

      // Should not report errors for empty IDs (they're skipped)
      expect(validation.errors.some(e => e.includes("''"))).toBe(false);
    });

    test('should report duplicate element ID error', () => {
      const layer = {
        id: LayerType.Application,
        type: LayerType.Application,
        name: 'Application',
        elements: [
          { id: 'el-1', type: 'Component', name: 'Element 1', layerId: LayerType.Application, properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, relationships: { incoming: [], outgoing: [] } },
          { id: 'el-1', type: 'Component', name: 'Element 2', layerId: LayerType.Application, properties: {}, visual: { position: { x: 0, y: 0 }, size: { width: 100, height: 100 } }, relationships: { incoming: [], outgoing: [] } },
        ],
        relationships: [],
        data: { format: 'json', version: '0.1.0', metadata: {} },
      };

      const validation = parser.validateLayer(layer);

      expect(validation.valid).toBe(false);
      expect(validation.errors.some(e => e.includes('Duplicate element ID'))).toBe(true);
    });
  });
});
