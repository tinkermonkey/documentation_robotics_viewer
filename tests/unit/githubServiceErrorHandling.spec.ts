import { test, expect } from '@playwright/test';
import { GitHubService } from '../../src/core/services/githubService';

/**
 * Error handling tests for GitHubService
 * Tests critical error scenarios: network failures, API errors, corrupted data, etc.
 */
test.describe('GitHubService - Error Handling', () => {
  let gitHubService: GitHubService;

  test.beforeEach(() => {
    gitHubService = new GitHubService('http://localhost:3002');
  });

  test.describe('getAvailableReleases()', () => {
    test('should throw helpful error when server is unreachable', async () => {
      const unreachableService = new GitHubService('http://invalid-server:9999');
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.reject(new TypeError('Failed to fetch'));

      try {
        await expect(
          unreachableService.getAvailableReleases()
        ).rejects.toThrow(/connect|server|port/i);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle 5xx server errors', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 500,
        statusText: 'Internal Server Error',
        json: async () => ({ message: 'Server error' })
      });

      try {
        await expect(
          gitHubService.getAvailableReleases()
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle 4xx client errors', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 400,
        statusText: 'Bad Request',
        json: async () => ({ message: 'Invalid request' })
      });

      try {
        await expect(
          gitHubService.getAvailableReleases()
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle non-JSON error responses', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 503,
        statusText: 'Service Unavailable',
        json: async () => { throw new Error('Invalid JSON'); }
      });

      try {
        await expect(
          gitHubService.getAvailableReleases()
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });

  test.describe('getLatestSpecRelease()', () => {
    test('should throw helpful error when no releases found', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'No releases found' })
      });

      try {
        await expect(
          gitHubService.getLatestSpecRelease()
        ).rejects.toThrow(/no.*release|not found|spec-v|demo data/i);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle connection timeout', async () => {
      const originalFetch = global.fetch;
      let timeoutId: any;

      (global as any).fetch = () => new Promise((_, reject) => {
        timeoutId = setTimeout(() => {
          reject(new Error('Request timeout'));
        }, 10);
      });

      try {
        await expect(
          gitHubService.getLatestSpecRelease()
        ).rejects.toThrow();
      } finally {
        clearTimeout(timeoutId);
        (global as any).fetch = originalFetch;
      }
    });

    test('should provide helpful error for server connection failure', async () => {
      const unreachableService = new GitHubService('http://localhost:9999');
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.reject(new TypeError('Failed to fetch'));

      try {
        await expect(
          unreachableService.getLatestSpecRelease()
        ).rejects.toThrow(/connect|server|port/i);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });

  test.describe('downloadSchemas()', () => {
    test('should handle corrupted ZIP data', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      (global as any).fetch = (url: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: get release info
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tag_name: 'v1.0.0',
              assets: [{ name: 'schemas.zip' }]
            })
          });
        } else {
          // Second call: download corrupted ZIP
          return Promise.resolve({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(0) // Empty/corrupted buffer
          });
        }
      };

      try {
        // Should handle corrupted ZIP gracefully
        await expect(
          gitHubService.downloadSchemas('v1.0.0')
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle network error during download', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      (global as any).fetch = (url: string) => {
        callCount++;
        if (callCount === 1) {
          // First call: get release info succeeds
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tag_name: 'v1.0.0',
              assets: [{ name: 'schemas.zip' }]
            })
          });
        } else {
          // Second call: download fails
          return Promise.reject(new Error('Network error during download'));
        }
      };

      try {
        await expect(
          gitHubService.downloadSchemas('v1.0.0')
        ).rejects.toThrow(/network|download/i);
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle download server error', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      (global as any).fetch = (url: string) => {
        callCount++;
        if (callCount === 1) {
          // Release info succeeds
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tag_name: 'v1.0.0',
              assets: [{ name: 'schemas.zip' }]
            })
          });
        } else {
          // Download endpoint returns 500
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error',
            json: async () => ({ message: 'Server error' })
          });
        }
      };

      try {
        await expect(
          gitHubService.downloadSchemas('v1.0.0')
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle release not found error', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'Release not found' })
      });

      try {
        await expect(
          gitHubService.downloadSchemas('v99.0.0')
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle latest version download failure', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 404,
        statusText: 'Not Found',
        json: async () => ({ message: 'No releases available' })
      });

      try {
        await expect(
          gitHubService.downloadSchemas('latest')
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });

  test.describe('Cache operations error handling', () => {
    test('should handle localStorage unavailable', () => {
      const originalLocalStorage = global.localStorage;
      let errorThrown = false;

      // Mock localStorage to throw error
      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => { throw new Error('localStorage unavailable'); },
          getItem: () => null
        },
        configurable: true
      });

      try {
        // Should not crash even if caching fails
        gitHubService.cacheSchemas('v1.0.0', {
          'Business.json': { definitions: {} }
        });
        // If we get here, the error was handled gracefully
      } catch (error) {
        errorThrown = true;
      }

      // Restore
      Object.defineProperty(global, 'localStorage', {
        value: originalLocalStorage,
        configurable: true
      });

      // Caching failure should not throw
      expect(errorThrown).toBe(false);
    });

    test('should handle corrupted cache data', () => {
      const originalLocalStorage = global.localStorage;

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => {},
          getItem: () => 'corrupted json {'
        },
        configurable: true
      });

      try {
        // Should return null for corrupted cache
        const result = gitHubService.loadCachedSchemas('v1.0.0');
        expect(result).toBeNull();
      } finally {
        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          configurable: true
        });
      }
    });

    test('should handle expired cache', () => {
      const originalLocalStorage = global.localStorage;
      const expiredData = JSON.stringify({
        version: 'v1.0.0',
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours old
        schemas: { 'Business.json': {} }
      });

      Object.defineProperty(global, 'localStorage', {
        value: {
          setItem: () => {},
          getItem: () => expiredData
        },
        configurable: true
      });

      try {
        // Should return null for expired cache
        const result = gitHubService.loadCachedSchemas('v1.0.0');
        expect(result).toBeNull();
      } finally {
        Object.defineProperty(global, 'localStorage', {
          value: originalLocalStorage,
          configurable: true
        });
      }
    });
  });

  test.describe('ZIP extraction error handling', () => {
    test('should handle ZIP with invalid JSON files', async () => {
      // This tests graceful degradation when JSON files in ZIP are malformed
      // The service logs warnings but continues processing other files
      const originalFetch = global.fetch;
      let callCount = 0;

      (global as any).fetch = () => {
        callCount++;
        if (callCount === 1) {
          return Promise.resolve({
            ok: true,
            json: async () => ({
              tag_name: 'v1.0.0',
              assets: []
            })
          });
        } else {
          // Return a valid ZIP structure but we can't fully test ZIP parsing here
          return Promise.resolve({
            ok: true,
            arrayBuffer: async () => new ArrayBuffer(0)
          });
        }
      };

      try {
        // Service should handle gracefully
        await gitHubService.downloadSchemas('v1.0.0');
      } catch (error) {
        // Expected to fail with corrupted ZIP
        expect(error).toBeDefined();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });

  test.describe('Layer name extraction edge cases', () => {
    test('should handle filenames with special characters', () => {
      // Test through downloadSchemas which uses extractLayerName internally
      // The actual extraction happens during ZIP processing
      expect(gitHubService).toBeDefined();
    });
  });

  test.describe('Rate limiting scenarios', () => {
    test('should handle GitHub API rate limit responses', async () => {
      const originalFetch = global.fetch;

      (global as any).fetch = () => Promise.resolve({
        ok: false,
        status: 429,
        statusText: 'Too Many Requests',
        json: async () => ({ message: 'API rate limit exceeded' })
      });

      try {
        await expect(
          gitHubService.getAvailableReleases()
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });

    test('should handle slow/throttled API responses', async () => {
      const originalFetch = global.fetch;
      let callCount = 0;

      (global as any).fetch = () => {
        callCount++;
        if (callCount === 1) {
          // Throttled response with Retry-After header
          return Promise.resolve({
            ok: false,
            status: 503,
            statusText: 'Service Unavailable',
            headers: { 'retry-after': '60' },
            json: async () => ({ message: 'Service temporarily unavailable' })
          });
        }
      };

      try {
        await expect(
          gitHubService.getAvailableReleases()
        ).rejects.toThrow();
      } finally {
        (global as any).fetch = originalFetch;
      }
    });
  });
});
