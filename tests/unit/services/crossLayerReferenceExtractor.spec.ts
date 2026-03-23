/**
 * Unit tests for CrossLayerReferenceExtractor identifier collision detection
 *
 * Tests that identifier collisions across layers are:
 * 1. Detected and reported via console warnings
 * 2. Documented in collision information
 * 3. Properly resolved (using first-found or explicit selection)
 */

import { test, expect } from '@playwright/test';
import { CrossLayerReferenceExtractor } from '../../../src/core/services/crossLayerReferenceExtractor';
import { Layer, ModelElement, ExtractedReference } from '../../../src/core/types/model';

test.describe('CrossLayerReferenceExtractor - Identifier Collision Detection', () => {
  /**
   * Create a mock layer with elements
   */
  function createMockLayer(layerId: string, elements: Partial<ModelElement>[]): Layer {
    return {
      id: layerId,
      elements: elements.map((elem, idx) => ({
        id: elem.id || `${layerId}-elem-${idx}`,
        name: elem.name || `Element ${idx}`,
        type: elem.type || 'generic',
        properties: elem.properties || {},
        ...elem
      })) as ModelElement[]
    };
  }

  /**
   * Test that identical identifiers across different layers are detected
   */
  test('should detect collision when same operationId exists in different layers', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-get-user',
          name: 'GetUser',
          properties: { operationId: 'getUser' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-get-user',
          name: 'GetUser Handler',
          properties: { operationId: 'getUser' }
        }
      ])
    };

    let warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    const metadata = extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    // Should warn about collision
    expect(warnings.length).toBeGreaterThan(0);
    expect(warnings[0]).toContain('Detected');
    expect(warnings[0]).toContain('identifier collision');
    expect(warnings[0]).toContain('getUser');
  });

  /**
   * Test that no collision is reported when identifiers are unique
   */
  test('should not report collision when all identifiers are unique', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-get-user',
          name: 'GetUser',
          properties: { operationId: 'getUser' }
        },
        {
          id: 'api-list-users',
          name: 'ListUsers',
          properties: { operationId: 'listUsers' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-create-user',
          name: 'CreateUserHandler',
          properties: { operationId: 'createUser' }
        }
      ])
    };

    let warningCount = 0;
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (String(args[0]).includes('collision')) {
        warningCount++;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    expect(warningCount).toBe(0);
  });

  /**
   * Test that identifiers with same name from different property paths don't cause collisions
   * (e.g., one element's operationId equals another's resourceRef)
   */
  test('should detect collision across different identifier property types', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-user-op',
          properties: { operationId: 'userResource' }
        }
      ]),
      security: createMockLayer('security', [
        {
          id: 'sec-user-resource',
          properties: { resourceRef: 'userResource' }
        }
      ])
    };

    let hasCollisionWarning = false;
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (String(args[0]).includes('collision')) {
        hasCollisionWarning = true;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    expect(hasCollisionWarning).toBe(true);
  });

  /**
   * Test that three-way collisions are detected
   */
  test('should detect collision when three or more elements share an identifier', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-shared',
          properties: { operationId: 'shared' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-shared',
          properties: { operationId: 'shared' }
        }
      ]),
      datamodel: createMockLayer('datamodel', [
        {
          id: 'dm-shared',
          properties: { operationId: 'shared' }
        }
      ])
    };

    let collisionMessage = '';
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('collision')) {
        collisionMessage = msg;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    // Should mention all three elements
    expect(collisionMessage).toContain('api-shared');
    expect(collisionMessage).toContain('app-shared');
    expect(collisionMessage).toContain('dm-shared');
  });

  /**
   * Test that collisions via element.name property are detected
   */
  test('should detect collision when element.name matches across layers', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      business: createMockLayer('business', [
        {
          id: 'biz-process',
          name: 'ProcessOrder',
          properties: {}
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-process',
          name: 'ProcessOrder',
          properties: {}
        }
      ])
    };

    let hasCollisionWarning = false;
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (String(args[0]).includes('collision') && String(args[0]).includes('ProcessOrder')) {
        hasCollisionWarning = true;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    expect(hasCollisionWarning).toBe(true);
  });

  /**
   * Test that collisions with definitionKey are detected
   */
  test('should detect collision when definitionKey values match across layers', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-user-schema',
          properties: { definitionKey: '#/components/schemas/User' }
        }
      ]),
      datamodel: createMockLayer('datamodel', [
        {
          id: 'dm-user-schema',
          properties: { definitionKey: '#/components/schemas/User' }
        }
      ])
    };

    let hasCollisionWarning = false;
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (String(args[0]).includes('collision') && String(args[0]).includes('#/components/schemas/User')) {
        hasCollisionWarning = true;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    expect(hasCollisionWarning).toBe(true);
  });

  /**
   * Test that reference resolution still works despite collisions
   * (should use the last-found candidate, but log warning)
   */
  test('should resolve references even with identifier collisions', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-op',
          name: 'GetUser',
          properties: { operationId: 'getUser' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-handler',
          name: 'Handler',
          properties: { operationId: 'getUser' }
        }
      ]),
      business: createMockLayer('business', [
        {
          id: 'biz-use-case',
          name: 'UseCase',
          properties: {}
        }
      ])
    };

    const extractedRefs: ExtractedReference[] = [
      {
        sourceElementId: 'biz-use-case',
        sourceLayerId: 'business',
        targetIdentifier: 'getUser',
        referenceType: 'resolveBy_Identifier',
        propertyName: 'operation'
      }
    ];

    let warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    const metadata = extractor.resolveReferences(extractedRefs, layers);

    console.warn = originalWarn;

    // Should have detected collision
    expect(warnings.some(w => w.includes('collision'))).toBe(true);

    // Should still resolve the reference to one of the candidates
    expect(metadata.resolvedReferences.length).toBe(1);
    const resolved = metadata.resolvedReferences[0];
    expect(resolved.target.elementId).toBeDefined();
    expect(['api-op', 'app-handler']).toContain(resolved.target.elementId);
  });

  /**
   * Test that unresolved references are still reported even with collisions
   */
  test('should track unresolved references alongside collisions', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-op',
          properties: { operationId: 'getUser' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-handler',
          properties: { operationId: 'getUser' }
        }
      ])
    };

    const extractedRefs: ExtractedReference[] = [
      {
        sourceElementId: 'api-op',
        sourceLayerId: 'api',
        targetIdentifier: 'getUser',
        referenceType: 'resolveBy_Identifier',
        propertyName: 'operation'
      },
      {
        sourceElementId: 'api-op',
        sourceLayerId: 'api',
        targetIdentifier: 'nonExistent',
        referenceType: 'resolveBy_Identifier',
        propertyName: 'missing'
      }
    ];

    let warnings: string[] = [];
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      warnings.push(String(args[0]));
    };

    const metadata = extractor.resolveReferences(extractedRefs, layers);

    console.warn = originalWarn;

    // Should have collision warning
    expect(warnings.some(w => w.includes('collision'))).toBe(true);

    // Should resolve one ref but not the other
    expect(metadata.resolvedReferences.length).toBe(1);
    expect(metadata.unresolvedReferences.length).toBe(1);
    expect(metadata.unresolvedReferences[0].targetIdentifier).toBe('nonExistent');
  });

  /**
   * Test with route identifier collisions (common in API specs)
   */
  test('should detect collision when route values match across layers', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-get-user-route',
          properties: { route: 'GET /users/:id' }
        }
      ]),
      application: createMockLayer('application', [
        {
          id: 'app-get-user-handler',
          properties: { route: 'GET /users/:id' }
        }
      ])
    };

    let hasCollisionWarning = false;
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      if (String(args[0]).includes('collision') && String(args[0]).includes('GET /users/:id')) {
        hasCollisionWarning = true;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    expect(hasCollisionWarning).toBe(true);
  });

  /**
   * Test collision message formatting and completeness
   */
  test('should format collision warning with all necessary information', () => {
    const extractor = new CrossLayerReferenceExtractor();

    const layers = {
      api: createMockLayer('api', [
        {
          id: 'api-elem-1',
          properties: { operationId: 'duplicateId' }
        }
      ]),
      business: createMockLayer('business', [
        {
          id: 'biz-elem-1',
          properties: { operationId: 'duplicateId' }
        }
      ])
    };

    let warningMessage = '';
    const originalWarn = console.warn;
    console.warn = (...args: unknown[]) => {
      const msg = String(args[0]);
      if (msg.includes('collision')) {
        warningMessage = msg;
      }
    };

    extractor.resolveReferences([], layers);

    console.warn = originalWarn;

    // Should contain key information
    expect(warningMessage).toContain('CrossLayerReferenceExtractor');
    expect(warningMessage).toContain('identifier collision');
    expect(warningMessage).toContain('duplicateId');
    expect(warningMessage).toContain('api-elem-1');
    expect(warningMessage).toContain('biz-elem-1');
  });
});
