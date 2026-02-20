/**
 * MSW Test Server Setup
 * Configures Mock Service Worker for Playwright E2E tests
 *
 * Usage:
 * - Before running tests: Call setupTestServer()
 * - After tests: Call closeTestServer()
 * - Override handlers: Use server.use() in individual tests
 */

import { setupServer } from 'msw/node';
import { handlers } from './mswHandlers';

/**
 * Global MSW server instance for tests
 */
export const mswServer = setupServer(...handlers);

/**
 * Setup MSW for test execution
 * Call this in test setup files before running tests
 */
export function setupMswForTests() {
  // Start intercepting requests
  mswServer.listen({ onUnhandledRequest: 'warn' });

  // Reset handlers and active listeners before each test
  mswServer.resetHandlers();

  // Cleanup after all tests
  if (typeof afterAll !== 'undefined') {
    afterAll(() => {
      mswServer.close();
    });
  }
}

/**
 * Override MSW handlers for a specific test scenario
 * Useful for testing error cases or specific API responses
 *
 * @example
 * // Mock a failed API request
 * overrideMswHandler(
 *   http.get('http://localhost:8080/api/model', () => {
 *     return HttpResponse.json({ error: 'Server error' }, { status: 500 });
 *   })
 * );
 */
export function overrideMswHandler(...newHandlers: Parameters<typeof mswServer.use>[0][]) {
  mswServer.use(...newHandlers);
}

/**
 * Reset MSW handlers to defaults
 * Useful for cleaning up after override tests
 */
export function resetMswHandlers() {
  mswServer.resetHandlers();
}

/**
 * Close the MSW server
 * Call this in cleanup hooks after tests complete
 */
export function closeMswServer() {
  mswServer.close();
}
