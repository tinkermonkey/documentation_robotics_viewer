/**
 * Example Unit Tests Using MSW (Mock Service Worker)
 *
 * IMPORTANT: This example demonstrates MSW for Node.js-based tests,
 * NOT for Playwright browser E2E tests.
 *
 * MSW Usage Patterns:
 * - Node.js unit/integration tests: Use `setupServer` from 'msw/node'
 * - Playwright browser tests: Use `page.route()` for request interception
 *
 * This file shows the Node.js pattern. For Playwright E2E tests that need
 * API mocking, see the Playwright route interception pattern documented
 * in documentation/MSW_TESTING_GUIDE.md.
 *
 * Benefits of MSW for Node.js tests:
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
import { setupServer } from 'msw/node';
import { http, HttpResponse } from 'msw';
import { handlers } from './helpers/mswHandlers';

/**
 * Example: Node.js API client tests with MSW
 * These run in Node.js, not in the browser
 */
const server = setupServer(...handlers);

test.describe('API Client - MSW Mocked Responses (Node.js)', () => {
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

  test('should handle health check request', async () => {
    // This test demonstrates calling an API that would normally hit the DR CLI server
    // But MSW intercepts it and returns mock data instead
    const response = await fetch('http://localhost:8080/health');
    const data = await response.json() as Record<string, unknown>;

    expect(response.status).toBe(200);
    expect(data).toHaveProperty('status', 'ok');
  });

  test('should handle changeset creation', async () => {
    const changesetData = {
      name: 'Test Changeset',
      description: 'A test changeset'
    };

    const response = await fetch('http://localhost:8080/api/changesets', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(changesetData)
    });

    expect(response.status).toBe(201);
    const changeset = await response.json() as Record<string, unknown>;
    expect(changeset).toHaveProperty('id');
    expect(changeset).toHaveProperty('createdAt');
  });

  test('should handle error scenarios with handler override', async () => {
    // Override the health check handler to return an error
    server.use(
      http.get('http://localhost:8080/health', () => {
        return HttpResponse.json(
          { error: 'Service temporarily unavailable' },
          { status: 503 }
        );
      })
    );

    const response = await fetch('http://localhost:8080/health');
    expect(response.status).toBe(503);
    const data = await response.json() as Record<string, unknown>;
    expect(data).toHaveProperty('error');
  });

  test('should handle model retrieval', async () => {
    const response = await fetch('http://localhost:8080/api/model');
    expect(response.status).toBe(200);
    const model = await response.json() as Record<string, unknown>;

    expect(model).toHaveProperty('uuid');
    expect(model).toHaveProperty('name');
    expect(model).toHaveProperty('version');
  });

  test('should simulate request retry on transient failure', async () => {
    let callCount = 0;

    // Override handler to fail on first call, succeed on second
    server.use(
      http.get('http://localhost:8080/api/spec', () => {
        callCount++;
        if (callCount === 1) {
          return HttpResponse.json(
            { error: 'Temporary failure' },
            { status: 500 }
          );
        }
        return HttpResponse.json({
          motivation: {},
          business: {}
        });
      })
    );

    // First request fails
    let response = await fetch('http://localhost:8080/api/spec');
    expect(response.status).toBe(500);

    // Retry succeeds
    response = await fetch('http://localhost:8080/api/spec');
    expect(response.status).toBe(200);
    const schemas = await response.json() as Record<string, unknown>;
    expect(schemas).toHaveProperty('motivation');
  });

  test('should handle 404 error for non-existent resources', async () => {
    // Test 404 response for missing model
    const response = await fetch('http://localhost:8080/api/model/non-existent');
    expect(response.status).toBe(404);
    const error = await response.json() as Record<string, unknown>;
    expect(error).toHaveProperty('error');
  });

  test('should handle PATCH annotation request', async () => {
    // First, create an annotation
    const createResponse = await fetch('http://localhost:8080/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'Initial annotation',
        elementId: 'elem-1'
      })
    });
    expect(createResponse.status).toBe(201);
    const annotation = await createResponse.json() as Record<string, unknown>;
    const annotationId = annotation.id as string;

    // Now patch it
    const patchResponse = await fetch(`http://localhost:8080/api/annotations/${annotationId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'Updated annotation' })
    });

    expect(patchResponse.status).toBe(200);
    const result = await patchResponse.json() as Record<string, unknown>;
    expect(result).toHaveProperty('id', annotationId);
    expect(result).toHaveProperty('content', 'Updated annotation');
  });

  test('should handle DELETE annotation request', async () => {
    // First, create an annotation
    const createResponse = await fetch('http://localhost:8080/api/annotations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        content: 'To be deleted',
        elementId: 'elem-1'
      })
    });
    expect(createResponse.status).toBe(201);
    const annotation = await createResponse.json() as Record<string, unknown>;
    const annotationId = annotation.id as string;

    // Now delete it
    const deleteResponse = await fetch(`http://localhost:8080/api/annotations/${annotationId}`, {
      method: 'DELETE'
    });

    expect(deleteResponse.status).toBe(204);
  });

  test('should handle PATCH annotation error - annotation not found', async () => {
    const response = await fetch('http://localhost:8080/api/annotations/non-existent', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content: 'test' })
    });

    expect(response.status).toBe(404);
    const error = await response.json() as Record<string, unknown>;
    expect(error).toHaveProperty('error');
  });

  test('should handle DELETE annotation error - annotation not found', async () => {
    const response = await fetch('http://localhost:8080/api/annotations/non-existent', {
      method: 'DELETE'
    });

    expect(response.status).toBe(404);
    const error = await response.json() as Record<string, unknown>;
    expect(error).toHaveProperty('error');
  });
});

/**
 * Playwright Browser Tests with API Mocking
 *
 * NOTE: For Playwright E2E tests with API mocking, use page.route() for
 * browser-based request interception, not MSW's setupServer.
 *
 * For a running DR CLI server (current approach):
 * - Tests validate against real API responses
 * - Useful for integration testing
 * - Requires server infrastructure
 * - See tests/embedded-*.spec.ts for examples
 *
 * For Playwright route interception (alternative):
 * - Can mock API responses without running server
 * - Use `page.route()` to intercept requests
 * - See documentation/MSW_TESTING_GUIDE.md for detailed pattern
 *
 * Example pattern:
 * ```typescript
 * test('example with route interception', async ({ page }) => {
 *   await page.route('http://localhost:8080/api/model', route => {
 *     route.fulfill({ json: { uuid: 'test', name: 'Test Model' } });
 *   });
 *   await page.goto('/');
 *   // Test continues...
 * });
 * ```
 */
