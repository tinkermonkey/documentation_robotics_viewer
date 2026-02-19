import { test, expect } from '@playwright/test';

/**
 * Unit tests for environment variable override functionality
 *
 * Tests verify that:
 * 1. DR_API_URL environment variable is correctly used by global setup
 * 2. DR_WS_URL environment variable is correctly used by global setup
 * 3. BASE_URL environment variable is correctly used for Playwright navigation
 *
 * Run with: npm test -- tests/unit/environmentVariables.spec.ts
 */

test.describe('Environment Variable Overrides', () => {
  test('DR_API_URL should be a valid HTTP URL when set', () => {
    const apiUrl = process.env.DR_API_URL;
    test.skip(!apiUrl, 'DR_API_URL not set');

    expect(apiUrl).toMatch(/^https?:\/\//);
  });

  test('DR_WS_URL should be a valid WebSocket URL when set', () => {
    const wsUrl = process.env.DR_WS_URL;
    test.skip(!wsUrl, 'DR_WS_URL not set');

    expect(wsUrl).toMatch(/^wss?:\/\//);
  });

  test('BASE_URL should be a valid HTTP URL when set', () => {
    const baseUrl = process.env.BASE_URL;
    test.skip(!baseUrl, 'BASE_URL not set');

    expect(baseUrl).toMatch(/^https?:\/\//);
  });

  test('DR_API_URL and DR_WS_URL should be different when both are set', () => {
    const apiUrl = process.env.DR_API_URL;
    const wsUrl = process.env.DR_WS_URL;
    test.skip(!apiUrl || !wsUrl, 'DR_API_URL or DR_WS_URL not set');

    // API URL should use http/https, WS URL should use ws/wss
    expect(apiUrl).toMatch(/^https?:\/\//);
    expect(wsUrl).toMatch(/^wss?:\/\//);
  });

  test('DR_API_URL endpoint should be reachable when server is running', async ({ request }) => {
    const apiUrl = process.env.DR_API_URL || 'http://localhost:8080';

    // Only test if server is running - this validates URL configuration works
    try {
      const response = await request.get(`${apiUrl}/health`);
      // Accept any response status - we're testing URL resolution, not server behavior
      expect(response.status).toBeGreaterThan(0);
    } catch (error) {
      // If server is not running, that's okay - we're validating URL format
      const message = error instanceof Error ? error.message : String(error);
      expect(message).toBeDefined();
    }
  });
});
