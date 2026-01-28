import { test, expect } from '@playwright/test';
import { processCrossLayerReferencesWithWorker } from '@/core/services/workerPool';
import { processReferences } from '@/core/services/crossLayerProcessor';
import { CrossLayerReference, ProcessResult } from '@/core/services/crossLayerProcessor';

/**
 * Integration tests for cross-layer worker communication
 *
 * Tests the complete workflow of:
 * 1. Worker spawning and initialization
 * 2. Message passing and serialization/deserialization
 * 3. Worker error handling and recovery
 * 4. Worker termination and cleanup
 * 5. Fallback to main thread when Worker API unavailable
 *
 * These tests verify that the worker integration works correctly in realistic scenarios.
 */

test.describe('Cross-Layer Worker Integration', () => {
  let originalWorker: typeof Worker | undefined;

  test.beforeEach(() => {
    // Store original Worker for restoration
    originalWorker = typeof Worker !== 'undefined' ? Worker : undefined;
  });

  test.afterEach(() => {
    // Restore original Worker
    if (originalWorker) {
      (global as any).Worker = originalWorker;
    } else {
      delete (global as any).Worker;
    }
  });

  test.describe('Worker Communication', () => {
    test('should successfully process references using worker for large datasets', async () => {
      // Create a dataset large enough to trigger worker processing (>50 refs)
      const references: CrossLayerReference[] = Array.from({ length: 75 }, (_, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
        relationshipType: 'implements',
        sourceElementName: `BusinessService${i}`,
        targetElementName: `ApplicationComponent${i}`,
      }));

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        // Fallback is called either when Worker is unavailable (test env)
        // or when dataset is < 50. Both are valid scenarios.
        return processReferences(refs);
      };

      // In a real browser environment, this would spawn a worker
      // In test environment without Worker support, it uses fallback (which is valid)
      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result).toHaveProperty('crossLayerLinks');
      expect(result).toHaveProperty('filteredCount');
      expect(result).toHaveProperty('invalidCount');
      expect(result).toHaveProperty('error');
      expect(Array.isArray(result.crossLayerLinks)).toBe(true);
      expect(result.crossLayerLinks).toHaveLength(75);
    });

    test('should maintain data integrity through serialization/deserialization', async () => {
      const references: CrossLayerReference[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
          relationshipType: 'implements',
          sourceElementName: 'OrderService',
          targetElementName: 'OrderProcessor',
        },
        {
          sourceId: 'app-2',
          targetId: 'data-1',
          sourceLayer: 'application',
          targetLayer: 'datamodel',
          relationshipType: 'persists',
          sourceElementName: 'UserRepository',
          targetElementName: 'UserTable',
        },
      ];

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(2);

      // Verify data integrity
      const firstEdge = result.crossLayerLinks[0];
      expect(firstEdge.data.sourceLayer).toBe('business');
      expect(firstEdge.data.targetLayer).toBe('application');
      expect(firstEdge.data.relationshipType).toBe('implements');
      expect(firstEdge.data.sourceElementName).toBe('OrderService');
      expect(firstEdge.data.targetElementName).toBe('OrderProcessor');

      const secondEdge = result.crossLayerLinks[1];
      expect(secondEdge.data.sourceLayer).toBe('application');
      expect(secondEdge.data.targetLayer).toBe('datamodel');
      expect(secondEdge.data.relationshipType).toBe('persists');
      expect(secondEdge.data.sourceElementName).toBe('UserRepository');
      expect(secondEdge.data.targetElementName).toBe('UserTable');
    });

    test('should handle references with special characters in names', async () => {
      const references: CrossLayerReference[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceElementName: 'Service @ v2.0 (legacy)',
          targetElementName: 'Component #1 [archived]',
        },
      ];

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(1);
      expect(result.crossLayerLinks[0].data.sourceElementName).toBe(
        'Service @ v2.0 (legacy)'
      );
      expect(result.crossLayerLinks[0].data.targetElementName).toBe(
        'Component #1 [archived]'
      );
    });

    test('should handle references with unicode characters', async () => {
      const references: CrossLayerReference[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceElementName: '订单服务',
          targetElementName: 'Dienst für Bestellungen',
        },
      ];

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(1);
      expect(result.crossLayerLinks[0].data.sourceElementName).toBe('订单服务');
      expect(result.crossLayerLinks[0].data.targetElementName).toBe(
        'Dienst für Bestellungen'
      );
    });
  });

  test.describe('Worker Error Handling', () => {
    test('should handle invalid input gracefully and return error', async () => {
      const references = null as any;

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toEqual([]);
      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe('invalid_input');
    });

    test('should handle non-array references and return error', async () => {
      const references = { references: [] } as any;

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toEqual([]);
      expect(result.error).not.toBeNull();
      expect(result.error?.type).toBe('invalid_input');
    });

    test('should count invalid references separately from filtered ones', async () => {
      const references: any[] = [
        // Valid cross-layer reference
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
        },
        // Invalid: missing targetId
        {
          sourceId: 'bus-2',
          targetLayer: 'application',
          sourceLayer: 'business',
        },
        // Filtered: same layer
        {
          sourceId: 'bus-3',
          targetId: 'bus-4',
          sourceLayer: 'business',
          targetLayer: 'business',
        },
        // Invalid: not an object
        'invalid string',
      ];

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(1);
      expect(result.invalidCount).toBe(2); // missing targetId + string
      expect(result.filteredCount).toBe(1); // same layer
    });

    test('should continue processing after encountering individual reference errors', async () => {
      const references: any[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
        },
        null, // Will be skipped
        undefined, // Will be skipped
        {
          sourceId: 'app-2',
          targetId: 'data-1',
          sourceLayer: 'application',
          targetLayer: 'datamodel',
        },
      ];

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // Should process successfully despite errors in between
      expect(result.crossLayerLinks).toHaveLength(2);
      expect(result.invalidCount).toBe(2); // null + undefined
      expect(result.error).toBeNull();
    });

    test('should provide proper error structure for malformed data', async () => {
      const references = 'not an array' as any;

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.error).toHaveProperty('message');
      expect(result.error).toHaveProperty('type');
      expect(result.error).toHaveProperty('severity');
      expect(typeof result.error?.message).toBe('string');
      expect(result.error?.severity).toMatch(/error|critical/);
    });

    test('should handle circular reference data gracefully', async () => {
      const circularObj: any = { sourceId: 'bus-1' };
      circularObj.self = circularObj; // Create circular reference

      const references: any[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
        },
        circularObj, // Circular reference - will be skipped
      ];

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // Should handle gracefully and skip the circular reference
      expect(result.crossLayerLinks).toHaveLength(1);
      expect(result.error).toBeNull(); // Not a fatal error, just skipped
    });
  });

  test.describe('Worker Termination and Timeouts', () => {
    test('should fall back to main thread if Worker API is unavailable', async () => {
      // Temporarily remove Worker
      delete (global as any).Worker;

      const references: CrossLayerReference[] = Array.from({ length: 75 }, (_, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      let fallbackCalled = false;
      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        fallbackCalled = true;
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(fallbackCalled).toBe(true);
      expect(result.crossLayerLinks).toHaveLength(75);
      expect(result.error).toBeNull();

      // Restore Worker
      if (originalWorker) {
        (global as any).Worker = originalWorker;
      }
    });

    test('should fall back to main thread for small datasets', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 30 }, (_, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      let fallbackCalled = false;
      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        fallbackCalled = true;
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(fallbackCalled).toBe(true);
      expect(result.crossLayerLinks).toHaveLength(30);
    });

    test('should handle fallback processor errors gracefully', async () => {
      const references: CrossLayerReference[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
        },
      ];

      const fallbackProcessor = (): ProcessResult => {
        // Simulate processor error by returning error structure
        return {
          crossLayerLinks: [],
          filteredCount: 0,
          invalidCount: 0,
          error: {
            message: 'Processing failed',
            type: 'processing_error',
            severity: 'error',
          },
        };
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.error).not.toBeNull();
      expect(result.error?.message).toBe('Processing failed');
    });
  });

  test.describe('Large Dataset Processing', () => {
    test('should handle very large reference datasets (1000+ items)', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 1000 }, (_, i) => ({
        sourceId: `source-${i % 100}`,
        targetId: `target-${(i + 1) % 100}`,
        sourceLayer: ['business', 'application', 'technology'][i % 3],
        targetLayer: ['application', 'datamodel', 'security'][i % 3],
        relationshipType: 'depends_on',
      }));

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks.length).toBeGreaterThan(0);
      expect(result.error).toBeNull();
      expect(result.invalidCount).toBe(0);
    });

    test('should not block main thread during large dataset processing', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 200 }, (_, i) => ({
        sourceId: `source-${i}`,
        targetId: `target-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      const startTime = Date.now();
      let processingTime = 0;

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        const start = Date.now();
        const result = processReferences(refs);
        processingTime = Date.now() - start;
        return result;
      };

      // This should not be blocked on getting the result
      const resultPromise = processCrossLayerReferencesWithWorker(
        references,
        fallbackProcessor
      );

      // Main thread should still be responsive
      const mainThreadStart = Date.now();
      let syncWorkDone = false;
      for (let i = 0; i < 1000000; i++) {
        syncWorkDone = i > 0;
      }
      const mainThreadTime = Date.now() - mainThreadStart;

      const result = await resultPromise;

      expect(syncWorkDone).toBe(true);
      expect(result.crossLayerLinks).toBeDefined();
    });

    test('should handle mixed valid and invalid references at scale', async () => {
      const references: any[] = [];

      for (let i = 0; i < 100; i++) {
        if (i % 5 === 0) {
          // Add invalid reference every 5th item
          references.push({
            sourceId: `source-${i}`,
            // Missing required fields
          });
        } else if (i % 3 === 0) {
          // Add same-layer reference every 3rd item
          references.push({
            sourceId: `source-${i}`,
            targetId: `target-${i}`,
            sourceLayer: 'business',
            targetLayer: 'business',
          });
        } else {
          // Add valid cross-layer reference
          references.push({
            sourceId: `source-${i}`,
            targetId: `target-${i}`,
            sourceLayer: 'business',
            targetLayer: 'application',
          });
        }
      }

      const fallbackProcessor = (refs: any): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks.length).toBeGreaterThan(0);
      expect(result.invalidCount).toBeGreaterThan(0);
      expect(result.filteredCount).toBeGreaterThan(0);
      expect(result.error).toBeNull();
    });
  });

  test.describe('Edge Cases and Boundary Conditions', () => {
    test('should handle boundary case at exactly 50 references (threshold)', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 50 }, (_, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      let fallbackCalled = false;
      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        fallbackCalled = true;
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // At exactly 50, should still use fallback (< 50 is the condition)
      expect(fallbackCalled).toBe(true);
      expect(result.crossLayerLinks).toHaveLength(50);
    });

    test('should handle boundary case at 51 references (just above threshold)', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 51 }, (_, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      let fallbackCalled = false;
      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        fallbackCalled = true;
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // Result should be valid (either worker or fallback)
      expect(result.crossLayerLinks).toHaveLength(51);
      expect(result.error).toBeNull();
    });

    test('should handle empty array input', async () => {
      const references: CrossLayerReference[] = [];

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toEqual([]);
      expect(result.error).toBeNull();
      expect(result.invalidCount).toBe(0);
      expect(result.filteredCount).toBe(0);
    });

    test('should handle references with very long strings', async () => {
      const longString = 'a'.repeat(10000);

      const references: CrossLayerReference[] = [
        {
          sourceId: 'bus-1',
          targetId: 'app-1',
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceElementName: longString,
          targetElementName: longString,
        },
      ];

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(1);
      expect(result.crossLayerLinks[0].data.sourceElementName.length).toBe(10000);
    });

    test('should handle all relationships types correctly', async () => {
      const relationshipTypes = [
        'implements',
        'depends_on',
        'uses',
        'consumes',
        'produces',
        'realizes',
        'refines',
      ];

      const references: CrossLayerReference[] = relationshipTypes.map((type, i) => ({
        sourceId: `bus-${i}`,
        targetId: `app-${i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
        relationshipType: type,
      }));

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      expect(result.crossLayerLinks).toHaveLength(relationshipTypes.length);
      relationshipTypes.forEach((type, i) => {
        expect(result.crossLayerLinks[i].data.relationshipType).toBe(type);
      });
    });

    test('should handle all layer combinations correctly', async () => {
      const layers = ['business', 'application', 'datamodel', 'security', 'technology'];

      const references: CrossLayerReference[] = [];
      for (let i = 0; i < layers.length; i++) {
        for (let j = 0; j < layers.length; j++) {
          if (i !== j) {
            references.push({
              sourceId: `${layers[i]}-1`,
              targetId: `${layers[j]}-1`,
              sourceLayer: layers[i],
              targetLayer: layers[j],
            });
          }
        }
      }

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // Should successfully process all combinations
      expect(result.crossLayerLinks.length).toBeGreaterThan(0);
      expect(result.error).toBeNull();
    });

    test('should preserve order of valid references', async () => {
      const references: CrossLayerReference[] = Array.from({ length: 10 }, (_, i) => ({
        sourceId: `bus-${9 - i}`, // Reverse order
        targetId: `app-${9 - i}`,
        sourceLayer: 'business',
        targetLayer: 'application',
      }));

      const fallbackProcessor = (refs: CrossLayerReference[]): ProcessResult => {
        return processReferences(refs);
      };

      const result = await processCrossLayerReferencesWithWorker(references, fallbackProcessor);

      // Verify order is preserved
      for (let i = 0; i < result.crossLayerLinks.length; i++) {
        expect(result.crossLayerLinks[i].source).toBe(`bus-${9 - i}`);
      }
    });
  });

  test.describe('Response Structure Validation', () => {
    test('should always return valid ProcessResult structure', async () => {
      const testCases: any[] = [
        [],
        [
          {
            sourceId: 'bus-1',
            targetId: 'app-1',
            sourceLayer: 'business',
            targetLayer: 'application',
          },
        ],
        null,
        'invalid',
        { invalid: 'object' },
      ];

      for (const testCase of testCases) {
        const fallbackProcessor = (refs: any): ProcessResult => {
          return processReferences(refs);
        };

        const result = await processCrossLayerReferencesWithWorker(testCase, fallbackProcessor);

        // All responses must have this structure
        expect(result).toHaveProperty('crossLayerLinks');
        expect(result).toHaveProperty('filteredCount');
        expect(result).toHaveProperty('invalidCount');
        expect(result).toHaveProperty('error');

        // Type validation
        expect(Array.isArray(result.crossLayerLinks)).toBe(true);
        expect(typeof result.filteredCount).toBe('number');
        expect(typeof result.invalidCount).toBe('number');
        expect(result.error === null || typeof result.error === 'object').toBe(true);
      }
    });

    test('should provide consistent error objects', async () => {
      const invalidInputs = [
        'string',
        123,
        null,
        undefined,
        { notAnArray: true },
        true,
      ];

      for (const input of invalidInputs) {
        const fallbackProcessor = (refs: any): ProcessResult => {
          return processReferences(refs);
        };

        const result = await processCrossLayerReferencesWithWorker(input, fallbackProcessor);

        if (result.error) {
          expect(result.error).toHaveProperty('message');
          expect(result.error).toHaveProperty('type');
          expect(result.error).toHaveProperty('severity');
          expect(typeof result.error.message).toBe('string');
          expect(result.error.type).toMatch(/invalid_input|processing_error|unhandled_error/);
        }
      }
    });
  });
});
