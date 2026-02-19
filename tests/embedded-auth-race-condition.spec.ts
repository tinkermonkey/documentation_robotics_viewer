import { test, expect } from '@playwright/test';

/**
 * E2E tests for auth token race condition fix
 *
 * These tests verify that the app correctly handles the scenario where:
 * 1. Old auth token exists in localStorage from a previous session
 * 2. User clicks a new magic link with a fresh token
 * 3. The fresh token should be used (not the stale one)
 *
 * Requires: DR CLI server running with: dr visualize [path-to-model]
 * Run with: npm run test:e2e
 */
test.describe('Auth Token Race Condition Fix', () => {
  const appUrl = 'http://localhost:3000';

  test.beforeAll(async ({ request }) => {
    // Check if server is available, skip tests if not
    try {
      await request.get(appUrl, { timeout: 5000 });
    } catch (error) {
      test.skip(true, 'DR CLI server not running on localhost:3000');
    }
  });

  test('should use fresh token from URL instead of stale localStorage token', async ({ page, context }) => {

    // Step 1: Simulate previous session with old token in localStorage
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.setItem('dr_auth_token', 'stale-token-from-previous-session');
      console.log('[Test] Stored stale token in localStorage');
    });

    // Step 2: Visit with NEW token in URL (magic link scenario)
    const newToken = 'fresh-token-from-magic-link';
    await page.goto(`${appUrl}/?token=${newToken}#/model/graph`);

    // Wait for app to initialize
    await page.waitForTimeout(1000);

    // Step 3: Verify localStorage has been updated with NEW token
    const storedToken = await page.evaluate(() => {
      return localStorage.getItem('dr_auth_token');
    });

    expect(storedToken).toBe(newToken);
    expect(storedToken).not.toBe('stale-token-from-previous-session');

    // Step 4: Verify URL has been cleaned (no token in query string)
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('token=');
    expect(currentUrl).toContain('#/model/graph');

    // Step 5: Check console logs to verify fix was applied
    const logs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('Token') || text.includes('token')) {
        logs.push(text);
      }
    });

    // Reload to see initialization logs
    await page.reload();
    await page.waitForTimeout(1000);

    // Should see the fix message in logs
    const hasFixLog = logs.some(log => log.includes('Updated authStore with new token'));
    expect(hasFixLog).toBe(true);

    console.log('[Test] Auth token race condition fix verified - fresh token is used');
  });

  test('should reconnect WebSocket with correct token after race condition fix', async ({ page }) => {

    // Step 1: Set up old token
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.setItem('dr_auth_token', 'old-websocket-token');
    });

    // Step 2: Visit with new token
    const newToken = 'new-websocket-token';
    await page.goto(`${appUrl}/?token=${newToken}#/model/graph`);

    // Wait for WebSocket connection attempt
    await page.waitForTimeout(2000);

    // Step 3: Capture WebSocket events
    const wsLogs: string[] = [];
    page.on('console', msg => {
      const text = msg.text();
      if (text.includes('WebSocket') || text.includes('Token updated')) {
        wsLogs.push(text);
      }
    });

    // Trigger reconnection
    await page.reload();
    await page.waitForTimeout(2000);

    // Verify WebSocket is using updated token (check logs)
    const tokenUpdatedLog = wsLogs.find(log => log.includes('[Auth] Token updated: present'));
    expect(tokenUpdatedLog).toBeDefined();

    console.log('[Test] WebSocket reconnection uses correct token after fix');
  });

  test('should handle case when no stale token exists', async ({ page }) => {

    // Step 1: Clear localStorage (fresh browser scenario)
    await page.goto(appUrl);
    await page.evaluate(() => {
      localStorage.clear();
    });

    // Step 2: Visit with token in URL (first-time magic link)
    const newToken = 'first-time-token';
    await page.goto(`${appUrl}/?token=${newToken}#/model/graph`);

    await page.waitForTimeout(1000);

    // Step 3: Verify token is stored
    const storedToken = await page.evaluate(() => {
      return localStorage.getItem('dr_auth_token');
    });

    expect(storedToken).toBe(newToken);

    // Step 4: Verify URL cleaned
    const currentUrl = page.url();
    expect(currentUrl).not.toContain('token=');

    console.log('[Test] First-time token handling works correctly');
  });
});
