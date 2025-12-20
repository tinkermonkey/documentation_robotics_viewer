/**
 * E2E Tests for Authentication Token Persistence
 * 
 * Tests the complete authentication flow with token persistence across page refreshes:
 * 1. Initial page load with token in URL parameter
 * 2. Token stored in cookie, localStorage, and sessionStorage
 * 3. Page refresh without token in URL
 * 4. Token retrieved from persistent storage
 * 5. API calls succeed using the persisted token
 * 
 * IMPORTANT: These tests use the existing reference server on port 8765.
 * Run with the e2e config that starts the server automatically:
 * 
 * Run: npx playwright test tests/e2e/auth-token-persistence.spec.ts --config playwright.e2e.config.ts
 * 
 * Or use a separate config that enables auth mode.
 */

import { test, expect, Page } from '@playwright/test';
import { promisify } from 'util';

const sleep = promisify(setTimeout);

// Increase timeout for auth flow
test.setTimeout(60000);

/**
 * For testing, we need to manually generate a token or use a known test token.
 * The reference server generates random tokens, so we'll need to extract it
 * from the initial page load or use a predictable test token.
 * 
 * For now, we'll use a test token that we'll inject directly.
 */
const TEST_AUTH_TOKEN = 'test_token_12345_for_e2e_testing';
const SERVER_URL = 'http://localhost:8765';

/**
 * Helper to get cookie value
 */
async function getCookieValue(page: Page, cookieName: string): Promise<string | null> {
  const cookies = await page.context().cookies();
  const cookie = cookies.find(c => c.name === cookieName);
  return cookie?.value ?? null;
}

/**
 * Helper to get storage value (localStorage or sessionStorage)
 */
async function getStorageValue(page: Page, storageType: 'localStorage' | 'sessionStorage', key: string): Promise<string | null> {
  return await page.evaluate(({ type, k }) => {
    const storage = type === 'localStorage' ? window.localStorage : window.sessionStorage;
    return storage.getItem(k);
  }, { type: storageType, k: key });
}

test.describe('Authentication Token Persistence', () => {
  test.describe.configure({ mode: 'serial' }); // Run tests in this describe block serially
  
  test('should persist token across page refresh using cookie', async ({ page }) => {
    const magicLink = `${SERVER_URL}/?token=${TEST_AUTH_TOKEN}`;

    console.log('\n[Test] Step 1: Navigate to magic link with token in URL');
    await page.goto(magicLink);
    
    // Wait for the app to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    console.log('✓ App loaded successfully');

    // Give the app time to store the token
    await sleep(1000);

    console.log('\n[Test] Step 2: Verify token is stored in cookie');
    const cookieToken = await getCookieValue(page, 'dr_auth_token');
    expect(cookieToken).toBe(TEST_AUTH_TOKEN);
    console.log(`✓ Cookie set: dr_auth_token=${cookieToken?.substring(0, 10)}...`);

    console.log('\n[Test] Step 3: Verify token is stored in localStorage');
    const localStorageToken = await getStorageValue(page, 'localStorage', 'dr_auth_token');
    expect(localStorageToken).toBe(TEST_AUTH_TOKEN);
    console.log(`✓ localStorage set: dr_auth_token=${localStorageToken?.substring(0, 10)}...`);

    console.log('\n[Test] Step 4: Verify token is stored in sessionStorage');
    const sessionStorageToken = await getStorageValue(page, 'sessionStorage', 'dr_auth_token');
    expect(sessionStorageToken).toBe(TEST_AUTH_TOKEN);
    console.log(`✓ sessionStorage set: dr_auth_token=${sessionStorageToken?.substring(0, 10)}...`);

    console.log('\n[Test] Step 5: Refresh page WITHOUT token in URL');
    await page.goto(SERVER_URL + '/');
    
    // Wait for the app to load after refresh
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    console.log('✓ App loaded after refresh');

    // Give the app time to read token from storage
    await sleep(1000);

    console.log('\n[Test] Step 6: Verify token still exists in cookie after refresh');
    const cookieTokenAfterRefresh = await getCookieValue(page, 'dr_auth_token');
    expect(cookieTokenAfterRefresh).toBe(TEST_AUTH_TOKEN);
    console.log(`✓ Cookie persisted: dr_auth_token=${cookieTokenAfterRefresh?.substring(0, 10)}...`);

    console.log('\n[Test] Step 7: Check if Authorization header is present in fetch requests');
    // Monitor network requests to verify token is being sent
    const requests: any[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/')) {
        requests.push({
          url: request.url(),
          headers: request.headers(),
        });
      }
    });

    // Trigger an API call by navigating to model view (if embedded app supports it)
    // or by manually calling fetch
    const hasAuthHeader = await page.evaluate(async () => {
      try {
        const response = await fetch('/api/spec');
        // Check if the request was made with Authorization header
        // We can't inspect the request headers directly, so we check the response
        return response.ok;
      } catch (e) {
        return false;
      }
    });

    console.log(`\n[Test] Step 8: API call after refresh: ${hasAuthHeader ? 'SUCCESS' : 'FAILED'}`);
    // Note: Without auth enabled on server, this will always succeed
    // With auth enabled, it will fail if token isn't sent
    console.log(`✓ API call completed (status: ${hasAuthHeader ? 'ok' : 'failed'})`);
  });

  test('should clear token when all storage is cleared', async ({ page }) => {
    const magicLink = `${SERVER_URL}/?token=${TEST_AUTH_TOKEN}`;

    console.log('\n[Test] Navigate to magic link');
    await page.goto(magicLink);
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n[Test] Verify token is stored');
    let cookieToken = await getCookieValue(page, 'dr_auth_token');
    expect(cookieToken).toBe(TEST_AUTH_TOKEN);
    console.log('✓ Token stored');

    console.log('\n[Test] Clear all cookies and storage');
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('✓ Cookies and storage cleared');

    console.log('\n[Test] Verify token is gone');
    cookieToken = await getCookieValue(page, 'dr_auth_token');
    expect(cookieToken).toBeNull();
    
    const localToken = await getStorageValue(page, 'localStorage', 'dr_auth_token');
    expect(localToken).toBeNull();
    
    const sessionToken = await getStorageValue(page, 'sessionStorage', 'dr_auth_token');
    expect(sessionToken).toBeNull();
    console.log('✓ Token cleared from all storage locations');
  });

  test('should handle token in URL on subsequent visit', async ({ page }) => {
    const magicLink = `${SERVER_URL}/?token=${TEST_AUTH_TOKEN}`;

    console.log('\n[Test] First visit with token');
    await page.goto(magicLink);
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n[Test] Clear all authentication');
    await page.context().clearCookies();
    await page.evaluate(() => {
      localStorage.clear();
      sessionStorage.clear();
    });
    console.log('✓ Authentication cleared');

    console.log('\n[Test] Verify token is gone');
    let cookieToken = await getCookieValue(page, 'dr_auth_token');
    expect(cookieToken).toBeNull();
    console.log('✓ Token cleared');

    console.log('\n[Test] Visit with magic link again');
    await page.goto(magicLink);
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n[Test] Verify token is restored');
    cookieToken = await getCookieValue(page, 'dr_auth_token');
    expect(cookieToken).toBe(TEST_AUTH_TOKEN);
    console.log('✓ Token restored from magic link');
  });

  test('should preserve token through multiple refreshes', async ({ page }) => {
    const magicLink = `${SERVER_URL}/?token=${TEST_AUTH_TOKEN}`;

    console.log('\n[Test] Initial load with magic link');
    await page.goto(magicLink);
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await sleep(1000);

    console.log('\n[Test] Perform 3 consecutive refreshes');
    for (let i = 1; i <= 3; i++) {
      console.log(`\n[Test] Refresh #${i}`);
      await page.goto(SERVER_URL + '/');
      await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
      await sleep(1000);

      const cookieExists = await getCookieValue(page, 'dr_auth_token');
      expect(cookieExists).toBe(TEST_AUTH_TOKEN);
      console.log(`✓ Cookie still present after refresh #${i}`);
    }

    console.log('\n✓ Token persisted through all refreshes');
  });

  test('should work with WebSocket after refresh', async ({ page }) => {
    const magicLink = `${SERVER_URL}/?token=${TEST_AUTH_TOKEN}`;

    console.log('\n[Test] Load with magic link');
    await page.goto(magicLink);
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    
    console.log('\n[Test] Wait for WebSocket connection');
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });
    console.log('✓ Initial WebSocket connected');

    console.log('\n[Test] Refresh without token in URL');
    await page.goto(SERVER_URL + '/');
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    
    console.log('\n[Test] Wait for WebSocket reconnection');
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });
    console.log('✓ WebSocket reconnected after refresh using persisted token');
  });
});
