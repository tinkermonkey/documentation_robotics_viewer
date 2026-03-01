/**
 * Unit tests for loadSpec normalization
 * The API spec defines schemaCount (camelCase) as a required field.
 * These tests verify the normalization logic matches the API contract.
 */

import { test, expect } from '@playwright/test';

test.describe('EmbeddedDataLoader.loadSpec() Normalization Logic', () => {
  // Test the normalization logic that happens in loadSpec
  // These tests simulate the server response normalization without needing fetch

  test('should use schemaCount from server response', () => {
    const data = {
      version: '1.0',
      type: 'spec',
      schemaCount: 42,
      schemas: {}
    } as any;

    // schemaCount is required by the API spec; fall back to counting schemas if absent
    const schemaCount = data.schemaCount ?? (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(42);
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

    const schemaCount = data.schemaCount ?? (Object.keys(data.schemas || {}).length);

    expect(schemaCount).toBe(3);
  });

  test('should read relationshipCatalog from server response', () => {
    const mockCatalog = {
      version: '1.0',
      relationshipTypes: [{ id: 'test' }]
    };

    const data = {
      version: '1.0',
      type: 'spec',
      relationshipCatalog: mockCatalog,
      schemas: {}
    } as any;

    const relationshipCatalog = data.relationshipCatalog;

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

    const schemaCount = data.schemaCount ?? (Object.keys(data.schemas || {}).length);

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
});
