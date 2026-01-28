import { test, expect } from '@playwright/test';
import { processReferences } from '../../src/core/services/crossLayerProcessor';
import { ReferenceType } from '../../src/core/types';

/**
 * Unit tests for cross-layer reference processing
 * Tests the error handling and graceful degradation of cross-layer edge extraction
 *
 * Note: Tests import the shared processReferences function from crossLayerProcessor.ts
 * to ensure test and worker implementations remain in sync. This avoids code duplication
 * and makes maintenance easier.
 */

test.describe('Cross-Layer Reference Processing', () => {
  test('should handle missing references gracefully', () => {
    const result = processReferences(undefined as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe('invalid_input');
  });

  test('should handle empty reference array', () => {
    const result = processReferences([]);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.filteredCount).toBe(0);
    expect(result.invalidCount).toBe(0);
    expect(result.error).toBeNull();
  });

  test('should return error when references is not an array', () => {
    const result = processReferences({ some: 'object' } as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe('invalid_input');
    expect(result.error?.message).toContain('expected an array');
  });

  test('should return error when references is a string', () => {
    const result = processReferences('not an array' as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error?.type).toBe('invalid_input');
  });

  test('should skip references with missing sourceLayer', () => {
    const result = processReferences([
      {
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.invalidCount).toBe(1);
    expect(result.filteredCount).toBe(0);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing targetLayer', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.invalidCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing sourceId', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        targetId: 'app-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.invalidCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing targetId', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.invalidCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should filter same-layer references separately from invalid ones', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'business',
        sourceId: 'bus-1',
        targetId: 'bus-2',
      },
    ]);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.filteredCount).toBe(1);
    expect(result.invalidCount).toBe(0);
    expect(result.error).toBeNull();
  });

  test('should successfully extract valid cross-layer reference', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
        relationshipType: 'implements',
        sourceElementName: 'BusinessService',
        targetElementName: 'ApplicationService',
      },
    ]);

    expect(result.crossLayerLinks).toHaveLength(1);
    const edge = result.crossLayerLinks[0];
    expect(edge.id).toBe('cross-layer-bus-1-app-1');
    expect(edge.source).toBe('bus-1');
    expect(edge.target).toBe('app-1');
    expect(edge.type).toBe('crossLayer');
    expect(edge.data.sourceLayer).toBe('Business');
    expect(edge.data.targetLayer).toBe('Application');
    expect(edge.data.relationshipType).toBe(ReferenceType.Custom);
    expect(edge.data.sourceElementName).toBe('BusinessService');
    expect(edge.data.targetElementName).toBe('ApplicationService');
    expect(result.error).toBeNull();
  });

  test('should handle mixed valid, invalid, and filtered references', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
      // Invalid: missing targetId
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-2',
      },
      {
        sourceLayer: 'application',
        targetLayer: 'datamodel',
        sourceId: 'app-2',
        targetId: 'data-1',
      },
      // Filtered: same layer
      {
        sourceLayer: 'business',
        targetLayer: 'business',
        sourceId: 'bus-3',
        targetId: 'bus-4',
      },
    ] as any);

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.invalidCount).toBe(1);
    expect(result.filteredCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should handle null references in array', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
      null,
      {
        sourceLayer: 'application',
        targetLayer: 'datamodel',
        sourceId: 'app-2',
        targetId: 'data-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.invalidCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should handle undefined references in array', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
      undefined,
      {
        sourceLayer: 'application',
        targetLayer: 'datamodel',
        sourceId: 'app-2',
        targetId: 'data-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.invalidCount).toBe(1);
    expect(result.error).toBeNull();
  });

  test('should handle non-object items in references array', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
      'invalid string',
      42,
      {
        sourceLayer: 'application',
        targetLayer: 'datamodel',
        sourceId: 'app-2',
        targetId: 'data-1',
      },
    ] as any);

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.invalidCount).toBe(2);
    expect(result.error).toBeNull();
  });

  test('should trim whitespace from string properties', () => {
    const result = processReferences([
      {
        sourceLayer: '  business  ',
        targetLayer: '  application  ',
        sourceId: '  bus-1  ',
        targetId: '  app-1  ',
        relationshipType: '  implements  ',
        sourceElementName: '  Service1  ',
        targetElementName: '  Service2  ',
      },
    ]);

    expect(result.crossLayerLinks).toHaveLength(1);
    const edge = result.crossLayerLinks[0];
    expect(edge.source).toBe('bus-1');
    expect(edge.target).toBe('app-1');
    // 'implements' is not a standard ReferenceType, so it becomes Custom
    expect(edge.data.relationshipType).toBe(ReferenceType.Custom);
    expect(edge.data.sourceElementName).toBe('Service1');
    expect(result.error).toBeNull();
  });

  test('should use default relationship type for missing relationshipType', () => {
    const result = processReferences([
      {
        sourceLayer: 'business',
        targetLayer: 'application',
        sourceId: 'bus-1',
        targetId: 'app-1',
      },
    ]);

    expect(result.crossLayerLinks).toHaveLength(1);
    expect(result.crossLayerLinks[0].data.relationshipType).toBe(ReferenceType.Custom);
    expect(result.error).toBeNull();
  });

  test('should handle large number of references', () => {
    const references = [];

    for (let i = 0; i < 1000; i++) {
      references.push({
        sourceLayer: i % 2 === 0 ? 'business' : 'application',
        targetLayer: i % 2 === 0 ? 'application' : 'datamodel',
        sourceId: `source-${i}`,
        targetId: `target-${i}`,
        relationshipType: 'depends_on',
      });
    }

    const result = processReferences(references);

    expect(result.crossLayerLinks).toHaveLength(1000);
    expect(result.error).toBeNull();
  });

  test('should return proper error structure', () => {
    const result = processReferences('not an array' as any);

    expect(result.error).toHaveProperty('message');
    expect(result.error).toHaveProperty('type');
    expect(result.error).toHaveProperty('severity');
    expect(result.error?.severity).toBe('error');
  });

  test('should always return crossLayerLinks property', () => {
    const testCases = [
      [],
      'invalid' as any,
      [{ sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1', targetId: 'a1' }],
    ];

    testCases.forEach((testCase) => {
      const result = processReferences(testCase);
      expect(result).toHaveProperty('crossLayerLinks');
      expect(Array.isArray(result.crossLayerLinks)).toBe(true);
    });
  });

  test('should always return filteredCount property', () => {
    const testCases = [
      [],
      'invalid' as any,
      [
        { sourceLayer: 'business', targetLayer: 'business', sourceId: 'b1', targetId: 'b2' },
        { sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1', targetId: 'a1' },
      ],
    ];

    testCases.forEach((testCase) => {
      const result = processReferences(testCase);
      expect(result).toHaveProperty('filteredCount');
      expect(typeof result.filteredCount).toBe('number');
    });
  });

  test('should always return invalidCount property', () => {
    const testCases = [
      [],
      [{ sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1' }],
    ];

    testCases.forEach((testCase) => {
      const result = processReferences(testCase);
      expect(result).toHaveProperty('invalidCount');
      expect(typeof result.invalidCount).toBe('number');
    });
  });

  test('should always return error property', () => {
    const testCases = [
      [],
      'invalid' as any,
      [{ sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1', targetId: 'a1' }],
    ];

    testCases.forEach((testCase) => {
      const result = processReferences(testCase);
      expect(result).toHaveProperty('error');
    });
  });
});
