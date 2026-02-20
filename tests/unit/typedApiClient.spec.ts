/**
 * Unit tests for TypedRestApiClient
 * Tests HTTP behavior with fetch mocking, authentication, headers, and error handling
 */

import { test, expect } from '@playwright/test';
import { TypedRestApiClient, createApiClient } from '../../src/core/services/typedApiClient';

// Mock fetch globally for tests
const mockFetch = (response: { ok: boolean; status: number; statusText: string; body: unknown; contentType?: string }) => {
  global.fetch = async (url: string, init?: RequestInit) => {
    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      headers: new Map([['content-type', response.contentType || 'application/json']]),
      text: async () => JSON.stringify(response.body),
      json: async () => response.body,
      get: (key: string) => response.contentType || 'application/json',
    } as Response;
  };
};

test.describe('TypedRestApiClient', () => {
  test.describe('Constructor', () => {
    test('should create instance with default baseUrl', () => {
      const client = new TypedRestApiClient();
      expect(client).toBeDefined();
    });

    test('should create instance with custom baseUrl', () => {
      const client = new TypedRestApiClient('http://example.com:8080');
      expect(client).toBeDefined();
    });

    test('should create instance with custom baseUrl and token', () => {
      const client = new TypedRestApiClient('http://example.com:8080', 'test-token');
      expect(client).toBeDefined();
    });

    test('should accept null token', () => {
      const client = new TypedRestApiClient('http://example.com', null);
      expect(client).toBeDefined();
    });
  });

  test.describe('createApiClient factory function', () => {
    test('should create instance with factory function', () => {
      const client = createApiClient();
      expect(client).toBeDefined();
    });

    test('should create instance with custom baseUrl via factory', () => {
      const client = createApiClient('http://example.com:8080');
      expect(client).toBeDefined();
    });

    test('should create instance with custom token via factory', () => {
      const client = createApiClient('http://example.com:8080', 'test-token');
      expect(client).toBeDefined();
    });

    test('should convert undefined token to null via factory', () => {
      const client = createApiClient('http://example.com:8080', undefined);
      expect(client).toBeDefined();
    });
  });

  test.describe('setToken method', () => {
    test('should accept token update', () => {
      const client = new TypedRestApiClient();
      expect(() => {
        client.setToken('new-token');
      }).not.toThrow();
    });

    test('should accept null token', () => {
      const client = new TypedRestApiClient('http://example.com', 'initial-token');
      expect(() => {
        client.setToken(null);
      }).not.toThrow();
    });
  });

  test.describe('Authorization Header', () => {
    test('should include Authorization header with Bearer token', async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedInit = init;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com', 'test-token-123');
      await client.get('/api/test' as any).catch(() => null);

      expect(capturedInit?.headers).toBeDefined();
      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer test-token-123');
    });

    test('should not include Authorization header when token is null', async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedInit = init;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com', null);
      await client.get('/api/test' as any).catch(() => null);

      expect(capturedInit?.headers).toBeDefined();
      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers['Authorization']).toBeUndefined();
    });

    test('should update Authorization header after setToken', async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedInit = init;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com', 'initial-token');
      client.setToken('new-token-456');
      await client.get('/api/test' as any).catch(() => null);

      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers['Authorization']).toBe('Bearer new-token-456');
    });
  });

  test.describe('Content-Type Header', () => {
    test('should include Content-Type application/json header', async () => {
      let capturedInit: RequestInit | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedInit = init;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.post('/api/test' as any, { data: 'test' }).catch(() => null);

      expect(capturedInit?.headers).toBeDefined();
      const headers = capturedInit?.headers as Record<string, string>;
      expect(headers['Content-Type']).toBe('application/json');
    });
  });

  test.describe('Query Parameter Serialization', () => {
    test('should serialize query parameters in URL', async () => {
      let capturedUrl: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.get('/api/test' as any, { params: { key1: 'value1', key2: 'value2' } }).catch(() => null);

      expect(capturedUrl).toContain('key1=value1');
      expect(capturedUrl).toContain('key2=value2');
    });

    test('should skip null and undefined parameters', async () => {
      let capturedUrl: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.get('/api/test' as any, { params: { key: 'value', nullVal: null, undefinedVal: undefined } }).catch(() => null);

      expect(capturedUrl).toContain('key=value');
      expect(capturedUrl).not.toContain('nullVal');
      expect(capturedUrl).not.toContain('undefinedVal');
    });
  });

  test.describe('Response Parsing', () => {
    test('should parse JSON responses', async () => {
      global.fetch = async (url: string, init?: RequestInit) => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{"key": "value"}',
          json: async () => ({ key: 'value' }),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      const result = await client.get('/api/test' as any).catch(() => null);

      expect(result).toEqual({ key: 'value' });
    });

    test('should return text for non-JSON responses', async () => {
      global.fetch = async (url: string, init?: RequestInit) => {
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'text/plain']]),
          text: async () => 'plain text response',
          json: async () => null,
          get: (key: string) => key === 'content-type' ? 'text/plain' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      const result = await client.get('/api/test' as any).catch(() => null);

      expect(result).toBe('plain text response');
    });
  });

  test.describe('Error Handling', () => {
    test('should throw error on non-2xx response', async () => {
      global.fetch = async (url: string, init?: RequestInit) => {
        return {
          ok: false,
          status: 404,
          statusText: 'Not Found',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => 'Resource not found',
          json: async () => null,
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      let error: Error | undefined;

      try {
        await client.get('/api/test' as any);
      } catch (e) {
        error = e as Error;
      }

      expect(error).toBeDefined();
      expect(error?.message).toContain('API request failed');
      expect(error?.message).toContain('404');
      expect(error?.message).toContain('Not Found');
    });

    test('should include error response body in error message', async () => {
      global.fetch = async (url: string, init?: RequestInit) => {
        return {
          ok: false,
          status: 400,
          statusText: 'Bad Request',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => 'Invalid request parameters',
          json: async () => null,
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      let error: Error | undefined;

      try {
        await client.post('/api/test' as any, {});
      } catch (e) {
        error = e as Error;
      }

      expect(error?.message).toContain('Invalid request parameters');
    });
  });

  test.describe('HTTP Methods', () => {
    test('GET method should send GET request', async () => {
      let capturedMethod: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedMethod = init?.method;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.get('/api/test' as any).catch(() => null);

      expect(capturedMethod).toBe('GET');
    });

    test('POST method should send POST request with body', async () => {
      let capturedMethod: string | undefined;
      let capturedBody: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedMethod = init?.method;
        capturedBody = init?.body as string;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.post('/api/test' as any, { data: 'test-data' }).catch(() => null);

      expect(capturedMethod).toBe('POST');
      expect(capturedBody).toContain('test-data');
    });

    test('PATCH method should send PATCH request with body', async () => {
      let capturedMethod: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedMethod = init?.method;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.patch('/api/test' as any, {}).catch(() => null);

      expect(capturedMethod).toBe('PATCH');
    });

    test('DELETE method should send DELETE request', async () => {
      let capturedMethod: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedMethod = init?.method;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.delete('/api/test' as any).catch(() => null);

      expect(capturedMethod).toBe('DELETE');
    });

    test('PUT method should send PUT request with body', async () => {
      let capturedMethod: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedMethod = init?.method;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com');
      await client.put('/api/test' as any, {}).catch(() => null);

      expect(capturedMethod).toBe('PUT');
    });
  });

  test.describe('URL Construction', () => {
    test('should construct URL with baseUrl and path', async () => {
      let capturedUrl: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://example.com:8080');
      await client.get('/api/models' as any).catch(() => null);

      expect(capturedUrl).toContain('http://example.com:8080');
      expect(capturedUrl).toContain('/api/models');
    });

    test('should handle path with leading slash', async () => {
      let capturedUrl: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://localhost:8080');
      await client.get('/api/test' as any).catch(() => null);

      expect(capturedUrl).toBe('http://localhost:8080/api/test');
    });

    test('should handle path without leading slash', async () => {
      let capturedUrl: string | undefined;

      global.fetch = async (url: string, init?: RequestInit) => {
        capturedUrl = url;
        return {
          ok: true,
          status: 200,
          statusText: 'OK',
          headers: new Map([['content-type', 'application/json']]),
          text: async () => '{}',
          json: async () => ({}),
          get: (key: string) => key === 'content-type' ? 'application/json' : null,
        } as Response;
      };

      const client = new TypedRestApiClient('http://localhost:8080');
      await client.get('api/test' as any).catch(() => null);

      expect(capturedUrl).toContain('api/test');
    });
  });
});
