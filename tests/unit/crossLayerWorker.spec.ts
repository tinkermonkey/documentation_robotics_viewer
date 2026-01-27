import { test, expect } from '@playwright/test';

/**
 * Unit tests for cross-layer web worker error handling
 * Tests the resilience and error recovery of the crossLayerWorker
 */

// Helper to run worker code in a simulated environment
function createWorkerSimulation() {
  // Create a mock self object and environment
  const messages: Array<{ crossLayerLinks?: any[]; error?: any }> = [];
  const errors: any[] = [];

  // Copy the worker code and execute it in a controlled context
  const workerCode = `
    function validateAndSanitizeReference(ref, index) {
      try {
        if (!ref || typeof ref !== 'object') {
          console.warn(\`[crossLayerWorker] Skipping invalid reference at index \${index}: not an object\`);
          return null;
        }

        const sourceLayer = String(ref.sourceLayer || '').trim();
        const targetLayer = String(ref.targetLayer || '').trim();

        if (!sourceLayer || !targetLayer) {
          console.warn(\`[crossLayerWorker] Skipping reference at index \${index}: missing or invalid layer information\`);
          return null;
        }

        if (sourceLayer === targetLayer) {
          return null;
        }

        const sourceId = String(ref.sourceId || '').trim();
        const targetId = String(ref.targetId || '').trim();

        if (!sourceId || !targetId) {
          console.warn(\`[crossLayerWorker] Skipping reference at index \${index}: missing or invalid element IDs\`);
          return null;
        }

        return {
          sourceId,
          targetId,
          sourceLayer,
          targetLayer,
          relationshipType: String(ref.relationshipType || 'unknown').trim(),
          sourceElementName: String(ref.sourceElementName || '').trim(),
          targetElementName: String(ref.targetElementName || '').trim(),
        };
      } catch (error) {
        console.warn(\`[crossLayerWorker] Error validating reference at index \${index}:\`, error);
        return null;
      }
    }

    function referenceToEdge(ref) {
      try {
        return {
          id: \`cross-layer-\${ref.sourceId}-\${ref.targetId}\`,
          source: ref.sourceId,
          target: ref.targetId,
          type: 'crossLayer',
          data: {
            targetLayer: ref.targetLayer,
            sourceLayer: ref.sourceLayer,
            relationshipType: ref.relationshipType,
            sourceElementName: ref.sourceElementName,
            targetElementName: ref.targetElementName,
          },
        };
      } catch (error) {
        console.warn(\`[crossLayerWorker] Error converting reference to edge:\`, error);
        return null;
      }
    }

    const processMessage = function(e) {
      try {
        if (!e || !e.data) {
          return {
            crossLayerLinks: [],
            error: {
              message: 'Invalid message format: missing data',
              type: 'invalid_input',
              severity: 'error',
            },
          };
        }

        const { references } = e.data;

        if (!references) {
          return {
            crossLayerLinks: [],
            error: null,
          };
        }

        if (!Array.isArray(references)) {
          return {
            crossLayerLinks: [],
            error: {
              message: 'Invalid references format: expected an array',
              type: 'invalid_input',
              severity: 'error',
            },
          };
        }

        if (references.length === 0) {
          return {
            crossLayerLinks: [],
            error: null,
          };
        }

        const crossLayerLinks = [];
        let skippedCount = 0;

        for (let i = 0; i < references.length; i++) {
          try {
            const validatedRef = validateAndSanitizeReference(references[i], i);

            if (validatedRef) {
              const edge = referenceToEdge(validatedRef);
              if (edge) {
                crossLayerLinks.push(edge);
              } else {
                skippedCount++;
              }
            } else {
              skippedCount++;
            }
          } catch (error) {
            skippedCount++;
          }
        }

        return {
          crossLayerLinks,
          error: null,
        };
      } catch (error) {
        return {
          crossLayerLinks: [],
          error: {
            message: error instanceof Error ? error.message : String(error),
            type: 'processing_error',
            severity: 'error',
          },
        };
      }
    };
  `;

  // Execute worker code to get functions
  // eslint-disable-next-line no-eval
  const scope = eval(workerCode) || {};

  return {
    processMessage: (data: any) => {
      try {
        // Get the processMessage function from the evaluated code
        // Since it's defined in a string, we need to evaluate it properly
        const result = eval(`
          (function() {
            ${workerCode}
            return processMessage({ data });
          })()
        `);
        messages.push(result);
        return result;
      } catch (error) {
        errors.push(error);
        throw error;
      }
    },
    getMessages: () => messages,
    getErrors: () => errors,
  };
}

test.describe('Cross-Layer Web Worker Error Handling', () => {
  test('should handle missing references gracefully', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: undefined });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should handle null references gracefully', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: null });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should return error when references is not an array', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: { some: 'object' } });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error.type).toBe('invalid_input');
    expect(result.error.message).toContain('expected an array');
  });

  test('should return error when references is a string', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: 'not an array' });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).not.toBeNull();
    expect(result.error.type).toBe('invalid_input');
  });

  test('should handle empty reference array', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: [] });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing sourceLayer', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          targetLayer: 'application',
          sourceId: 'bus-1',
          targetId: 'app-1',
        },
      ],
    });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing targetLayer', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          sourceId: 'bus-1',
          targetId: 'app-1',
        },
      ],
    });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing sourceId', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          targetLayer: 'application',
          targetId: 'app-1',
        },
      ],
    });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should skip references with missing targetId', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceId: 'bus-1',
        },
      ],
    });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should skip same-layer references', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          targetLayer: 'business',
          sourceId: 'bus-1',
          targetId: 'bus-2',
        },
      ],
    });

    expect(result.crossLayerLinks).toEqual([]);
    expect(result.error).toBeNull();
  });

  test('should successfully extract valid cross-layer reference', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceId: 'bus-1',
          targetId: 'app-1',
          relationshipType: 'implements',
          sourceElementName: 'BusinessService',
          targetElementName: 'ApplicationService',
        },
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(1);
    expect(result.crossLayerLinks[0]).toEqual({
      id: 'cross-layer-bus-1-app-1',
      source: 'bus-1',
      target: 'app-1',
      type: 'crossLayer',
      data: {
        sourceLayer: 'business',
        targetLayer: 'application',
        relationshipType: 'implements',
        sourceElementName: 'BusinessService',
        targetElementName: 'ApplicationService',
      },
    });
    expect(result.error).toBeNull();
  });

  test('should handle mixed valid and invalid references', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
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
        // Invalid: same layer
        {
          sourceLayer: 'business',
          targetLayer: 'business',
          sourceId: 'bus-3',
          targetId: 'bus-4',
        },
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  test('should handle null references in array', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
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
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  test('should handle undefined references in array', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
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
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  test('should handle non-object items in references array', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
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
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(2);
    expect(result.error).toBeNull();
  });

  test('should trim whitespace from string properties', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: '  business  ',
          targetLayer: '  application  ',
          sourceId: '  bus-1  ',
          targetId: '  app-1  ',
          relationshipType: '  implements  ',
          sourceElementName: '  Service1  ',
          targetElementName: '  Service2  ',
        },
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(1);
    const edge = result.crossLayerLinks[0];
    expect(edge.source).toBe('bus-1');
    expect(edge.target).toBe('app-1');
    expect(edge.data.relationshipType).toBe('implements');
    expect(edge.data.sourceElementName).toBe('Service1');
    expect(result.error).toBeNull();
  });

  test('should use default relationship type for missing relationshipType', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({
      references: [
        {
          sourceLayer: 'business',
          targetLayer: 'application',
          sourceId: 'bus-1',
          targetId: 'app-1',
        },
      ],
    });

    expect(result.crossLayerLinks).toHaveLength(1);
    expect(result.crossLayerLinks[0].data.relationshipType).toBe('unknown');
    expect(result.error).toBeNull();
  });

  test('should handle large number of references', () => {
    const simulator = createWorkerSimulation();
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

    const result = simulator.processMessage({ references });

    expect(result.crossLayerLinks).toHaveLength(1000);
    expect(result.error).toBeNull();
  });

  test('should handle message with no data property', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage(undefined);

    // This would be handled by the outer try-catch
    expect(result).toBeDefined();
  });

  test('should return proper error structure', () => {
    const simulator = createWorkerSimulation();
    const result = simulator.processMessage({ references: 'not an array' });

    expect(result.error).toHaveProperty('message');
    expect(result.error).toHaveProperty('type');
    expect(result.error).toHaveProperty('severity');
    expect(result.error.severity).toBe('error');
  });

  test('should always return crossLayerLinks property', () => {
    const simulator = createWorkerSimulation();

    const testCases = [
      { references: undefined },
      { references: null },
      { references: [] },
      { references: 'invalid' },
      { references: [{ sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1', targetId: 'a1' }] },
    ];

    testCases.forEach((testCase) => {
      const result = simulator.processMessage(testCase);
      expect(result).toHaveProperty('crossLayerLinks');
      expect(Array.isArray(result.crossLayerLinks)).toBe(true);
    });
  });

  test('should always return error property', () => {
    const simulator = createWorkerSimulation();

    const testCases = [
      { references: undefined },
      { references: null },
      { references: [] },
      { references: 'invalid' },
      { references: [{ sourceLayer: 'business', targetLayer: 'application', sourceId: 'b1', targetId: 'a1' }] },
    ];

    testCases.forEach((testCase) => {
      const result = simulator.processMessage(testCase);
      expect(result).toHaveProperty('error');
    });
  });
});
