import { test, expect } from '@playwright/test';
import { processCrossLayerReferencesWithWorker } from '@/core/services/workerPool';
import { CrossLayerReference, ProcessResult } from '@/core/services/crossLayerProcessor';

test.describe('workerPool', () => {
  test('should use fallback for small datasets (< 50 references)', async () => {
    const references: CrossLayerReference[] = Array.from({ length: 30 }, (_, i) => ({
      sourceId: `source-${i}`,
      targetId: `target-${i}`,
      sourceLayer: 'business',
      targetLayer: 'application',
      relationshipType: 'uses',
    }));

    let fallbackCalled = false;
    const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
      fallbackCalled = true;
      return {
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      };
    };

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(fallbackCalled).toBe(true);
    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should handle empty reference array', async () => {
    const references: CrossLayerReference[] = [];

    const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
      return {
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      };
    };

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should return correct fallback structure for error handling', async () => {
    const references: CrossLayerReference[] = [
      {
        sourceId: 'source-1',
        targetId: 'target-1',
        sourceLayer: 'business',
        targetLayer: 'application',
        relationshipType: 'uses',
        sourceElementName: 'Service A',
        targetElementName: 'Component B',
      },
    ];

    const errorResult: ProcessResult = {
      crossLayerLinks: [],
      filteredCount: 0,
      invalidCount: 1,
      error: {
        message: 'Test error',
        type: 'processing_error',
        severity: 'error',
      },
    };

    const fallbackProcessor = (): ProcessResult => errorResult;

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(result.error).toBeDefined();
    expect(result.error?.message).toBe('Test error');
    expect(result.error?.type).toBe('processing_error');
  });

  test('should prepare large dataset for worker processing', async () => {
    const references: CrossLayerReference[] = Array.from({ length: 100 }, (_, i) => ({
      sourceId: `source-${i}`,
      targetId: `target-${i}`,
      sourceLayer: i % 2 === 0 ? 'business' : 'technology',
      targetLayer: i % 2 === 0 ? 'application' : 'security',
      relationshipType: 'uses',
      sourceElementName: `Source ${i}`,
      targetElementName: `Target ${i}`,
    }));

    let processorCalled = false;
    const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
      processorCalled = true;
      expect(refs.length).toBe(100);
      return {
        crossLayerLinks: refs.map((ref, idx) => ({
          id: `edge-${idx}`,
          source: ref.sourceId,
          target: ref.targetId,
          type: 'crossLayer',
          data: {
            sourceLayer: ref.sourceLayer,
            targetLayer: ref.targetLayer,
            relationshipType: ref.relationshipType || 'unknown',
            sourceElementName: ref.sourceElementName || '',
            targetElementName: ref.targetElementName || '',
          },
        })),
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      };
    };

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(result.crossLayerLinks.length).toBe(100);
    expect(result.error).toBeNull();
  });

  test('should validate fallback processor response structure', async () => {
    const references: CrossLayerReference[] = Array.from({ length: 20 }, (_, i) => ({
      sourceId: `source-${i}`,
      targetId: `target-${i}`,
      sourceLayer: 'business',
      targetLayer: 'application',
      relationshipType: 'uses',
    }));

    const validResult: ProcessResult = {
      crossLayerLinks: [
        {
          id: 'edge-1',
          source: 'source-1',
          target: 'target-1',
          type: 'crossLayer',
          data: {
            sourceLayer: 'business',
            targetLayer: 'application',
            relationshipType: 'uses',
            sourceElementName: 'Service A',
            targetElementName: 'Component B',
          },
        },
      ],
      filteredCount: 5,
      invalidCount: 0,
      error: null,
    };

    const fallbackProcessor = (): ProcessResult => validResult;

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(result).toHaveProperty('crossLayerLinks');
    expect(result).toHaveProperty('filteredCount');
    expect(result).toHaveProperty('invalidCount');
    expect(result).toHaveProperty('error');
    expect(Array.isArray(result.crossLayerLinks)).toBe(true);
    expect(typeof result.filteredCount).toBe('number');
    expect(typeof result.invalidCount).toBe('number');
  });

  test('should handle references with optional fields', async () => {
    const references: CrossLayerReference[] = [
      {
        sourceId: 'source-1',
        targetId: 'target-1',
        sourceLayer: 'business',
        targetLayer: 'application',
      },
      {
        sourceId: 'source-2',
        targetId: 'target-2',
        sourceLayer: 'technology',
        targetLayer: 'security',
        relationshipType: 'secures',
        sourceElementName: 'Database',
        targetElementName: 'Firewall',
      },
    ];

    const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
      expect(refs.length).toBe(2);
      expect(refs[0].relationshipType).toBeUndefined();
      expect(refs[1].relationshipType).toBe('secures');
      return {
        crossLayerLinks: [],
        filteredCount: 0,
        invalidCount: 0,
        error: null,
      };
    };

    const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

    expect(result.error).toBeNull();
  });

  test('should consistently call fallback processor for datasets below threshold', async () => {
    const testSizes = [1, 10, 25, 49]; // All below 50 threshold

    for (const size of testSizes) {
      const references: CrossLayerReference[] = Array.from({ length: size }, (_, i) => ({
        sourceId: `source-${i}`,
        targetId: `target-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
        relationshipType: 'uses',
      }));

      let fallbackCalled = false;
      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        fallbackCalled = true;
        return {
          crossLayerLinks: [],
          filteredCount: 0,
          invalidCount: 0,
          error: null,
        };
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(fallbackCalled).toBe(true);
      expect(result.error).toBeNull();
    }
  });
});
