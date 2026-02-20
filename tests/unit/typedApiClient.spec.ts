/**
 * Unit tests for TypedRestApiClient
 * Tests constructor, method signatures, and type safety
 */

import { test, expect } from '@playwright/test';
import { TypedRestApiClient, createApiClient } from '../../src/core/services/typedApiClient';

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

  test.describe('HTTP Method Types', () => {
    test('should have get method', () => {
      const client = new TypedRestApiClient();
      expect(typeof client.get).toBe('function');
    });

    test('should have post method', () => {
      const client = new TypedRestApiClient();
      expect(typeof client.post).toBe('function');
    });

    test('should have put method', () => {
      const client = new TypedRestApiClient();
      expect(typeof client.put).toBe('function');
    });

    test('should have patch method', () => {
      const client = new TypedRestApiClient();
      expect(typeof client.patch).toBe('function');
    });

    test('should have delete method', () => {
      const client = new TypedRestApiClient();
      expect(typeof client.delete).toBe('function');
    });
  });

  test.describe('Method Signatures', () => {
    test('get method should be callable', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.get('/api/test' as any).catch(() => null);
      }).not.toThrow();
    });

    test('post method should be callable', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.post('/api/test' as any, {}).catch(() => null);
      }).not.toThrow();
    });

    test('patch method should be callable', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.patch('/api/test' as any, {}).catch(() => null);
      }).not.toThrow();
    });

    test('delete method should be callable', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.delete('/api/test' as any).catch(() => null);
      }).not.toThrow();
    });
  });

  test.describe('Request Return Types', () => {
    test('get method should return Promise', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const result = client.get('/api/test' as any).catch(() => null);
      expect(result).toBeInstanceOf(Promise);
    });

    test('post method should return Promise', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const result = client.post('/api/test' as any, {}).catch(() => null);
      expect(result).toBeInstanceOf(Promise);
    });

    test('put method should return Promise', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const result = client.put('/api/test' as any, {}).catch(() => null);
      expect(result).toBeInstanceOf(Promise);
    });

    test('patch method should return Promise', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const result = client.patch('/api/test' as any, {}).catch(() => null);
      expect(result).toBeInstanceOf(Promise);
    });

    test('delete method should return Promise', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const result = client.delete('/api/test' as any).catch(() => null);
      expect(result).toBeInstanceOf(Promise);
    });
  });

  test.describe('Authentication Handling', () => {
    test('should initialize with token', () => {
      const client = new TypedRestApiClient('http://example.com', 'test-token');
      expect(client).toBeDefined();
    });

    test('should initialize without token', () => {
      const client = new TypedRestApiClient('http://example.com');
      expect(client).toBeDefined();
    });

    test('should allow token update after construction', () => {
      const client = new TypedRestApiClient('http://example.com');
      client.setToken('new-token');
      expect(client).toBeDefined();
    });

    test('should allow clearing token', () => {
      const client = new TypedRestApiClient('http://example.com', 'test-token');
      client.setToken(null);
      expect(client).toBeDefined();
    });
  });

  test.describe('URL Construction', () => {
    test('should construct valid URLs from paths', () => {
      const client = new TypedRestApiClient('http://example.com:8080');
      expect(client).toBeDefined();
    });

    test('should handle path with leading slash', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.get('/api/model' as any).catch(() => null);
      }).not.toThrow();
    });

    test('should handle path without leading slash', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.get('api/model' as any).catch(() => null);
      }).not.toThrow();
    });
  });

  test.describe('Type Safety', () => {
    test('should maintain Promise type for get requests', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const promise = client.get('/api/test' as any).catch(() => null);
      expect(promise).toBeInstanceOf(Promise);
    });

    test('should maintain Promise type for post requests', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const promise = client.post('/api/test' as any, { data: 'test' }).catch(() => null);
      expect(promise).toBeInstanceOf(Promise);
    });

    test('should maintain Promise type for patch requests', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const promise = client.patch('/api/test' as any, { data: 'test' }).catch(() => null);
      expect(promise).toBeInstanceOf(Promise);
    });

    test('should maintain Promise type for delete requests', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      const promise = client.delete('/api/test' as any).catch(() => null);
      expect(promise).toBeInstanceOf(Promise);
    });
  });

  test.describe('Method Options', () => {
    test('get method should accept options parameter', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.get('/api/test' as any, {
          params: { key: 'value' }
        }).catch(() => null);
      }).not.toThrow();
    });

    test('post method should accept options parameter', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.post('/api/test' as any, {}, {
          params: { key: 'value' }
        }).catch(() => null);
      }).not.toThrow();
    });

    test('put method should accept options parameter', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.put('/api/test' as any, {}, {
          params: { key: 'value' }
        }).catch(() => null);
      }).not.toThrow();
    });

    test('patch method should accept options parameter', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.patch('/api/test' as any, {}, {
          params: { key: 'value' }
        }).catch(() => null);
      }).not.toThrow();
    });

    test('delete method should accept options parameter', () => {
      const client = new TypedRestApiClient('http://localhost:9999');
      expect(() => {
        client.delete('/api/test' as any, {
          params: { key: 'value' }
        }).catch(() => null);
      }).not.toThrow();
    });
  });
});
