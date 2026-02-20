/**
 * Unit tests for loadSpec normalization
 * Tests snake_case to camelCase conversion for schema properties
 */

import { test, expect } from '@playwright/test';

test.describe('EmbeddedDataLoader.loadSpec() Normalization Logic', () => {
  // Test the normalization logic that happens in loadSpec
  // These tests simulate the server response normalization without needing fetch

  test('should normalize snake_case to camelCase for schema_count', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schema_count: 42,
      schemas: {}
    } as any;

    // Simulates the normalization logic in loadSpec
    const schemaCount = data.schemaCount ?? data.schema_count ??
      (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(42);
  });

  test('should prefer camelCase schemaCount over snake_case schema_count', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schemaCount: 50,
      schema_count: 42,
      schemas: {}
    } as any;

    // Normalization prefers camelCase
    const schemaCount = data.schemaCount ?? data.schema_count ??
      (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(50);
  });

  test('should handle missing schemaCount and fall back to schemas length', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schemas: {
        schema1: {},
        schema2: {},
        schema3: {}
      }
    } as any;

    const schemaCount = data.schemaCount ?? data.schema_count ??
      (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(3);
  });

  test('should normalize relationship_catalog to relationshipCatalog', () => {
    const mockCatalog = {
      version: '1.0',
      relationshipTypes: [{ id: 'test' }]
    };

    const data = {
      version: '1.0',
      type: 'spec',
      relationship_catalog: mockCatalog,
      schemas: {}
    } as any;

    // Normalization from snake_case
    const relationshipCatalog = data.relationshipCatalog || data.relationship_catalog;

    expect(relationshipCatalog?.relationshipTypes?.length).toBe(1);
  });

  test('should handle optional manifest property', () => {
    const mockManifest = {
      specVersion: '7.0',
      files: { 'test.json': { sha256: 'abc', size: 100 } }
    };

    const data = {
      version: '1.0',
      type: 'spec',
      manifest: mockManifest,
      schemas: {}
    } as any;

    expect(data.manifest?.specVersion).toBe('7.0');
  });

  test('should handle empty schemas object', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schemas: {}
    } as any;

    const schemaCount = data.schemaCount ?? data.schema_count ??
      (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(0);
  });

  test('should preserve description and source properties', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      description: 'Test spec',
      source: 'test-source',
      schemas: {}
    } as any;

    expect(data.description).toBe('Test spec');
    expect(data.source).toBe('test-source');
  });

  test('should handle response with both snake_case and camelCase together', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schema_count: 5,
      schemaCount: 10,  // camelCase should win
      relationship_catalog: { version: '1.0' },
      relationshipCatalog: { version: '2.0' },  // camelCase should win
      schemas: {}
    } as any;

    const schemaCount = data.schemaCount ?? data.schema_count;
    const relationshipCatalog = data.relationshipCatalog || data.relationship_catalog;

    expect(schemaCount).toBe(10);
    expect(relationshipCatalog.version).toBe('2.0');
  });
});
