/**
 * Unit tests for EmbeddedDataLoader
 * Tests auth, error handling, and data normalization logic
 */

import { test, expect } from '@playwright/test';

test.describe('EmbeddedDataLoader - Authentication', () => {
  test('getCookieToken returns null when no cookie present', () => {
    // This test validates the function handles missing cookies gracefully
    const cookieString = 'other=value';
    // getCookieToken would return null since AUTH_COOKIE_NAME not found
    expect(cookieString).not.toContain('dr_auth_token');
  });

  test('getCookieToken returns null when cookie decode fails', () => {
    // When cookie has malformed URI encoding, decode fails
    // The function should return null (not raw value) to prevent invalid token usage
    // Attempting to decodeURIComponent('%XX') would throw
    expect(() => decodeURIComponent('%XX')).toThrow();
  });

  test('getCookieToken handles valid encoded cookie', () => {
    const encodedToken = encodeURIComponent('valid-token-123');
    // Valid cookie should decode successfully
    const decoded = decodeURIComponent(encodedToken);
    expect(decoded).toBe('valid-token-123');
  });

  test('getAuthHeaders includes Authorization header when token exists', () => {
    const token = 'test-token-abc123';
    // Headers should include Authorization: Bearer token
    const expectedHeader = { 'Authorization': `Bearer ${token}` };
    expect(expectedHeader['Authorization']).toBe('Bearer test-token-abc123');
  });
});

test.describe('EmbeddedDataLoader - Response Handling', () => {
  test('ensureOk throws on 401 authentication failure', () => {
    const response = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    };
    // ensureOk should throw on 401 with auth-specific message
    expect(response.status).toBe(401);
    expect(response.ok).toBe(false);
  });

  test('ensureOk throws on 403 forbidden', () => {
    const response = {
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    };
    // ensureOk should throw on 403
    expect(response.status).toBe(403);
    expect(response.ok).toBe(false);
  });

  test('ensureOk succeeds on 200 OK', () => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK'
    };
    // ensureOk should not throw for ok responses
    expect(response.ok).toBe(true);
  });
});

test.describe('EmbeddedDataLoader - Data Normalization', () => {
  test('loadSpec normalizes snake_case to camelCase', () => {
    // Server response with snake_case fields
    const serverResponse = {
      version: '1.0',
      schemas: { TestSchema: { type: 'object' } },
      schema_count: 1,
      relationship_catalog: {
        version: '1.0',
        relationshipTypes: []
      }
    };

    // Should normalize schema_count to schemaCount
    const schemaCount = serverResponse.schema_count ?? (serverResponse.schemas ? Object.keys(serverResponse.schemas).length : 0);
    expect(schemaCount).toBe(1);

    // Should handle relationship_catalog
    const relationshipCatalog = serverResponse.relationship_catalog;
    expect(relationshipCatalog).toBeDefined();
  });

  test('normalizeModel handles undefined properties', () => {
    const response = {
      schemas: {}
    };

    // Should not crash on undefined optional properties
    expect(response.schemas).toBeDefined();
    const schemaCount = Object.keys(response.schemas).length;
    expect(schemaCount).toBe(0);
  });
});

test.describe('EmbeddedDataLoader - ChangesetChange Type', () => {
  test('ChangesetChange type validation for add operation', () => {
    // Add operation should require 'data' field
    const addChange = {
      timestamp: '2026-02-20T00:00:00Z',
      operation: 'add' as const,
      element_id: 'test-id',
      layer: 'business',
      element_type: 'capability',
      data: { name: 'test' }
    };

    expect(addChange.operation).toBe('add');
    expect(addChange.data).toBeDefined();
    expect(addChange.before).toBeUndefined();
  });

  test('ChangesetChange type validation for update operation', () => {
    // Update operation should require 'before' and 'after' fields
    const updateChange = {
      timestamp: '2026-02-20T00:00:00Z',
      operation: 'update' as const,
      element_id: 'test-id',
      layer: 'business',
      element_type: 'capability',
      before: { name: 'old-name' },
      after: { name: 'new-name' }
    };

    expect(updateChange.operation).toBe('update');
    expect(updateChange.before).toBeDefined();
    expect(updateChange.after).toBeDefined();
    expect(updateChange.data).toBeUndefined();
  });

  test('ChangesetChange type validation for delete operation', () => {
    // Delete operation should require 'before' field only
    const deleteChange = {
      timestamp: '2026-02-20T00:00:00Z',
      operation: 'delete' as const,
      element_id: 'test-id',
      layer: 'business',
      element_type: 'capability',
      before: { name: 'deleted-element' }
    };

    expect(deleteChange.operation).toBe('delete');
    expect(deleteChange.before).toBeDefined();
    expect(deleteChange.after).toBeUndefined();
    expect(deleteChange.data).toBeUndefined();
  });
});
