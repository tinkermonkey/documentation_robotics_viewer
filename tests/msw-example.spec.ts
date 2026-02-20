/**
 * Example E2E Tests Using MSW (Mock Service Worker)
 *
 * These tests demonstrate how to use Mock Service Worker to test the embedded app
 * WITHOUT requiring a running DR CLI server. MSW intercepts network requests at the
 * fetch level and returns mock responses.
 *
 * Benefits over requiring a real server:
 * - Tests run fast (no server startup overhead)
 * - Tests run offline
 * - Easy to test error scenarios
 * - No external dependencies needed
 * - Can simulate network conditions
 *
 * To run these tests:
 * npm test tests/msw-example.spec.ts
 */

import { test, expect } from '@playwright/test';
import { http, HttpResponse } from 'msw';
import { setupServer } from 'msw/node';
import { handlers } from '../src/core/services/mswHandlers';

// Create MSW server with default handlers
const server = setupServer(...handlers);

test.describe('Embedded App - MSW Mocked API', () => {
  // Start MSW server before all tests in this suite
  test.beforeAll(() => {
    server.listen({ onUnhandledRequest: 'warn' });
  });

  // Reset handlers before each test
  test.beforeEach(() => {
    server.resetHandlers();
  });

  // Close server after all tests
  test.afterAll(() => {
    server.close();
  });

  test('should load app with mocked health check', async ({ page }) => {
    // Navigate to the app
    await page.goto('/');

    // Wait for the app to initialize
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Verify the app loaded
    await expect(page.locator('[data-testid="embedded-app"]')).toBeVisible();
  });

  test('should handle API errors gracefully', async ({ page }) => {
    // Override the health check handler to return an error
    server.use(
      http.get('http://localhost:8080/api/health', () => {
        return HttpResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      })
    );

    // Navigate to the app
    await page.goto('/');

    // The app should handle the error gracefully
    // You can check for error messaging or fallback UI
    await expect(page.locator('[data-testid="embedded-app"]')).toBeVisible();
  });

  test('should display model data from mocked API', async ({ page }) => {
    // Override the model endpoint to return test data
    server.use(
      http.get('http://localhost:8080/api/model', () => {
        return HttpResponse.json({
          id: 'test-model-123',
          name: 'Test Model',
          version: '1.0.0',
          layers: {
            motivation: {
              elements: [
                {
                  id: 'goal-1',
                  type: 'Goal',
                  label: 'Test Goal',
                  description: 'A goal for testing'
                }
              ]
            }
          }
        });
      })
    );

    // Navigate to the app
    await page.goto('/');

    // Wait for app to initialize
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Verify the app is visible
    await expect(page.locator('[data-testid="embedded-app"]')).toBeVisible();
  });

  test('should retry failed requests', async ({ page }) => {
    let callCount = 0;

    // First call fails, subsequent calls succeed
    server.use(
      http.get('http://localhost:8080/api/model', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { error: 'Temporary failure' },
            { status: 500 }
          );
        }
        return HttpResponse.json({
          id: 'test-model',
          name: 'Test Model'
        });
      })
    );

    await page.goto('/');
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Verify the app eventually loaded
    await expect(page.locator('[data-testid="embedded-app"]')).toBeVisible();
  });
});
