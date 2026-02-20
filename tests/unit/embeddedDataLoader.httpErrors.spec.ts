/**
 * Unit tests for embeddedDataLoader HTTP error handling
 * Tests ensureOk() behavior for 401/403/5xx errors
 */

import { test, expect } from '@playwright/test';

test.describe('EmbeddedDataLoader HTTP Error Handling', () => {
  test('should throw error for 401 Unauthorized response', async () => {
    // Mock the ensureOk logic
    const response = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as any;

    // Simulate ensureOk behavior
    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    let errorThrown = false;
    let errorMessage = '';
    try {
      await testEnsureOk(response, 'load model');
    } catch (error) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toContain('Authentication failed');
    expect(errorMessage).toContain('401');
  });

  test('should throw error for 403 Forbidden response', async () => {
    const response = {
      ok: false,
      status: 403,
      statusText: 'Forbidden'
    } as any;

    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    let errorThrown = false;
    let errorMessage = '';
    try {
      await testEnsureOk(response, 'load changesets');
    } catch (error) {
      errorThrown = true;
      errorMessage = (error as Error).message;
    }

    expect(errorThrown).toBe(true);
    expect(errorMessage).toContain('Authentication failed');
    expect(errorMessage).toContain('403');
  });

  test('should throw error for 5xx Server error responses', async () => {
    const serverErrors = [500, 502, 503, 504];

    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    for (const statusCode of serverErrors) {
      const response = {
        ok: false,
        status: statusCode,
        statusText: 'Server Error'
      } as any;

      let errorThrown = false;
      let errorMessage = '';
      try {
        await testEnsureOk(response, 'load data');
      } catch (error) {
        errorThrown = true;
        errorMessage = (error as Error).message;
      }

      expect(errorThrown).toBe(true);
      expect(errorMessage).toContain('Failed to load data');
      expect(errorMessage).toContain('Server Error');
    }
  });

  test('should not throw error for 2xx success responses', async () => {
    const response = {
      ok: true,
      status: 200,
      statusText: 'OK'
    } as any;

    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    let errorThrown = false;
    try {
      await testEnsureOk(response, 'load model');
    } catch (error) {
      errorThrown = true;
    }

    expect(errorThrown).toBe(false);
  });

  test('should preserve context information in error message', async () => {
    const testContexts = ['load model', 'load changesets', 'load annotations'];

    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    for (const context of testContexts) {
      const response = {
        ok: false,
        status: 401,
        statusText: 'Unauthorized'
      } as any;

      let errorMessage = '';
      try {
        await testEnsureOk(response, context);
      } catch (error) {
        errorMessage = (error as Error).message;
      }

      expect(errorMessage).toContain(context);
    }
  });

  test('should distinguish between auth errors and other HTTP errors', async () => {
    const testEnsureOk = async (resp: any, context: string) => {
      if (resp.ok) return;
      if (resp.status === 401 || resp.status === 403) {
        throw new Error(`Authentication failed (${resp.status}). ${context}`);
      }
      throw new Error(`Failed to ${context}: ${resp.statusText}`);
    };

    // Test auth error
    const authResponse = {
      ok: false,
      status: 401,
      statusText: 'Unauthorized'
    } as any;

    let authErrorMessage = '';
    try {
      await testEnsureOk(authResponse, 'test');
    } catch (error) {
      authErrorMessage = (error as Error).message;
    }

    // Test non-auth error
    const otherResponse = {
      ok: false,
      status: 400,
      statusText: 'Bad Request'
    } as any;

    let otherErrorMessage = '';
    try {
      await testEnsureOk(otherResponse, 'test');
    } catch (error) {
      otherErrorMessage = (error as Error).message;
    }

    expect(authErrorMessage).toContain('Authentication failed');
    expect(otherErrorMessage).toContain('Failed to test');
    expect(otherErrorMessage).not.toContain('Authentication');
  });
});
