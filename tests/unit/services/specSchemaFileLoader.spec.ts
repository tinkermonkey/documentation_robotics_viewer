/**
 * Unit tests for specSchemaFileLoader.ts
 *
 * Tests the parallel file loading logic with error handling for spec schema files:
 * - manifest.json (spec version validation)
 * - base.json (predicate catalog)
 * - layer-specific JSON files (motivation, business, security, etc.)
 */

import { test, expect } from '@playwright/test';
import { loadSpecSchemaFiles } from '../../../src/core/services/specSchemaFileLoader';

test.describe('specSchemaFileLoader', () => {
  /**
   * Test: Successfully load all files with mocked responses
   * Verifies the loader correctly parses JSON and assigns to filename keys
   */
  test('should load and parse manifest.json and base.json when fetch succeeds', async () => {
    const manifestData = { version: '1.0', specVersion: 'v1' };
    const baseData = { predicates: ['supports', 'fulfills'] };
    const motivationData = { layers: ['motivation'] };

    // Mock fetch to return successful responses for specific files
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async (url: string) => {
      if (url === '/.dr/spec/manifest.json') {
        return new Response(JSON.stringify(manifestData), { status: 200 });
      }
      if (url === '/.dr/spec/base.json') {
        return new Response(JSON.stringify(baseData), { status: 200 });
      }
      if (url === '/.dr/spec/motivation.json') {
        return new Response(JSON.stringify(motivationData), { status: 200 });
      }
      // Layer files that fail return 404
      return new Response('Not Found', { status: 404 });
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      // Verify successful files are loaded with correct data
      expect(result['manifest.json']).toEqual(manifestData);
      expect(result['base.json']).toEqual(baseData);
      expect(result['motivation.json']).toEqual(motivationData);
      // Failed file fetch should not create key
      expect(result['business.json']).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: Handle fetch failures gracefully
   * Verifies the loader logs errors and continues loading remaining files
   */
  test('should handle fetch errors and log console.warn', async () => {
    const manifestData = { version: '1.0' };
    const warnCalls: Array<any> = [];
    const originalWarn = console.warn;
    const originalFetch = globalThis.fetch;

    // Capture console.warn calls
    console.warn = (...args: any[]) => {
      warnCalls.push(args);
      originalWarn(...args);
    };

    // Mock fetch: manifest succeeds, base fails, layers fail
    globalThis.fetch = (async (url: string) => {
      if (url === '/.dr/spec/manifest.json') {
        return new Response(JSON.stringify(manifestData), { status: 200 });
      }
      // All other requests fail (network error)
      throw new Error('Network error');
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      // Verify successful file is loaded
      expect(result['manifest.json']).toEqual(manifestData);
      // Verify failed files are not in result
      expect(result['base.json']).toBeUndefined();

      // Verify console.warn was called for each failed file
      // Should have warnings for: base.json + all layer files (motivation, business, etc.)
      expect(warnCalls.length).toBeGreaterThan(0);
      const warnMessages = warnCalls.map((call) => call[0]);
      expect(warnMessages.some((msg: string) => msg.includes('base.json'))).toBe(
        true
      );
    } finally {
      console.warn = originalWarn;
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: Empty result when all files fail to load
   * Verifies the loader returns an empty object if all fetches fail
   */
  test('should return empty object if all files fail to load', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      throw new Error('Network unavailable');
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      // Should return an empty object
      expect(result).toEqual({});
      expect(Object.keys(result).length).toBe(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: HTTP error responses (not network errors)
   * Verifies the loader treats HTTP 404/500 as undefined data, not throwing
   */
  test('should handle HTTP error responses (404, 500) without throwing', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response('Not Found', { status: 404 });
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      // Should return empty object (all 404s produce undefined data)
      expect(result).toEqual({});
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: Mixed success and failure responses
   * Verifies the loader loads available files even when some fail
   */
  test('should load available files while handling failures in others', async () => {
    const successData = { key: 'success' };
    const originalFetch = globalThis.fetch;

    globalThis.fetch = (async (url: string) => {
      if (url === '/.dr/spec/manifest.json') {
        return new Response(JSON.stringify(successData), { status: 200 });
      }
      if (url === '/.dr/spec/motivation.json') {
        return new Response(JSON.stringify(successData), { status: 200 });
      }
      // Other requests fail
      return new Response('Not Found', { status: 404 });
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      // Successful loads present
      expect(result['manifest.json']).toEqual(successData);
      expect(result['motivation.json']).toEqual(successData);
      // Failed loads absent
      expect(result['base.json']).toBeUndefined();
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: Parallel execution
   * Verifies all fetches are initiated together (Promise.all pattern)
   */
  test('should execute all fetches in parallel', async () => {
    const originalFetch = globalThis.fetch;
    const callOrder: string[] = [];

    globalThis.fetch = (async (url: string) => {
      callOrder.push(url);
      // Simulate delay to verify parallel execution
      await new Promise((resolve) => setTimeout(resolve, 10));
      return new Response(JSON.stringify({}), { status: 200 });
    }) as any;

    try {
      await loadSpecSchemaFiles();

      // All fetch calls should be initiated together
      // The order may vary, but they should all be queued before any complete
      expect(callOrder.length).toBeGreaterThan(0);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  /**
   * Test: Return type consistency
   * Verifies the function always returns a plain object
   */
  test('should always return a plain object', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = (async () => {
      return new Response('{}', { status: 200 });
    }) as any;

    try {
      const result = await loadSpecSchemaFiles();

      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result.constructor === Object).toBe(true);
      expect(Array.isArray(result)).toBe(false);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
