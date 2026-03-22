/**
 * Unit tests for predicateCatalogLoader
 * Tests loading and indexing of predicate catalog from base.json
 */

import { test, expect } from '@playwright/test';
import {
  loadPredicateCatalog,
  PredicateCatalog,
} from '../../../../src/core/services/predicateCatalogLoader';

test.describe('predicateCatalogLoader', () => {
  test('should load valid predicate catalog', () => {
    const baseJson = {
      predicates: {
        supports: {
          predicate: 'supports',
          inverse: 'supported-by',
          category: 'motivation',
          description: 'Element contributes to achieving or enabling another element',
          archimate_alignment: 'Influence',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
        },
        realizes: {
          predicate: 'realizes',
          inverse: 'realized-by',
          category: 'structural',
          description: 'Element implements or makes concrete another element',
          archimate_alignment: 'Realization',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.size).toBe(2);
    expect(catalog.byInverse.size).toBe(2);
  });

  test('should index predicates by forward name', () => {
    const baseJson = {
      predicates: {
        supports: {
          predicate: 'supports',
          inverse: 'supported-by',
          category: 'motivation',
          description: 'Element contributes to achieving or enabling another element',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    const predDef = catalog.byPredicate.get('supports');
    expect(predDef).toBeDefined();
    expect(predDef?.predicate).toBe('supports');
    expect(predDef?.inverse).toBe('supported-by');
    expect(predDef?.category).toBe('motivation');
  });

  test('should support inverse predicate lookup', () => {
    const baseJson = {
      predicates: {
        supports: {
          predicate: 'supports',
          inverse: 'supported-by',
          category: 'motivation',
          description: 'Element contributes to achieving or enabling another element',
          semantics: {
            directionality: 'bidirectional',
            transitivity: true,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    const forwardPredicate = catalog.byInverse.get('supported-by');
    expect(forwardPredicate).toBe('supports');
  });

  test('should handle missing archimate_alignment gracefully', () => {
    const baseJson = {
      predicates: {
        custom: {
          predicate: 'custom',
          inverse: 'custom-inverse',
          category: 'custom',
          description: 'Custom predicate without archimate alignment',
          semantics: {
            directionality: 'unidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    const predDef = catalog.byPredicate.get('custom');
    expect(predDef?.archimateAlignment).toBeUndefined();
  });

  test('should handle missing default_strength gracefully', () => {
    const baseJson = {
      predicates: {
        custom: {
          predicate: 'custom',
          inverse: 'custom-inverse',
          category: 'custom',
          description: 'Custom predicate without default strength',
          semantics: {
            directionality: 'unidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    const predDef = catalog.byPredicate.get('custom');
    expect(predDef?.defaultStrength).toBeUndefined();
  });

  test('should skip invalid predicate definitions', () => {
    const baseJson = {
      predicates: {
        valid: {
          predicate: 'valid',
          inverse: 'valid-inverse',
          category: 'valid',
          description: 'Valid predicate',
          semantics: {
            directionality: 'unidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
        invalid: {
          predicate: 'invalid',
          // Missing inverse
          category: 'invalid',
          description: 'Invalid predicate',
          semantics: {
            directionality: 'unidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.has('valid')).toBe(true);
    expect(catalog.byPredicate.has('invalid')).toBe(false);
  });

  test('should skip predicates with invalid semantics', () => {
    const baseJson = {
      predicates: {
        invalid: {
          predicate: 'invalid',
          inverse: 'invalid-inverse',
          category: 'invalid',
          description: 'Invalid predicate',
          semantics: {
            directionality: 'unidirectional',
            // Missing transitivity
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.size).toBe(0);
  });

  test('should return empty catalog for null/undefined input', () => {
    const catalog1 = loadPredicateCatalog(null);
    expect(catalog1.byPredicate.size).toBe(0);
    expect(catalog1.byInverse.size).toBe(0);

    const catalog2 = loadPredicateCatalog(undefined);
    expect(catalog2.byPredicate.size).toBe(0);
    expect(catalog2.byInverse.size).toBe(0);
  });

  test('should return empty catalog for missing predicates section', () => {
    const baseJson = {
      specVersion: '0.8.3',
      schemas: {},
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.size).toBe(0);
    expect(catalog.byInverse.size).toBe(0);
  });

  test('should handle empty predicates object', () => {
    const baseJson = {
      predicates: {},
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.size).toBe(0);
    expect(catalog.byInverse.size).toBe(0);
  });

  test('should preserve semantics properties correctly', () => {
    const baseJson = {
      predicates: {
        transitive: {
          predicate: 'transitive',
          inverse: 'transitive-inv',
          category: 'test',
          description: 'Test transitive',
          semantics: {
            directionality: 'unidirectional',
            transitivity: true,
            symmetry: true,
            reflexivity: true,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);
    const predDef = catalog.byPredicate.get('transitive');

    expect(predDef?.semantics.transitivity).toBe(true);
    expect(predDef?.semantics.symmetry).toBe(true);
    expect(predDef?.semantics.reflexivity).toBe(true);
  });

  test('should handle multiple predicates with same inverse prefix', () => {
    const baseJson = {
      predicates: {
        'supported-by-1': {
          predicate: 'supported-by-1',
          inverse: 'supports-1',
          category: 'test',
          description: 'First variant',
          semantics: {
            directionality: 'bidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
        'supported-by-2': {
          predicate: 'supported-by-2',
          inverse: 'supports-2',
          category: 'test',
          description: 'Second variant',
          semantics: {
            directionality: 'bidirectional',
            transitivity: false,
            symmetry: false,
            reflexivity: false,
          },
        },
      },
    };

    const catalog = loadPredicateCatalog(baseJson);

    expect(catalog.byPredicate.size).toBe(2);
    expect(catalog.byInverse.get('supports-1')).toBe('supported-by-1');
    expect(catalog.byInverse.get('supports-2')).toBe('supported-by-2');
  });
});
