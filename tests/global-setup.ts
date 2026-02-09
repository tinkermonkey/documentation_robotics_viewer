/**
 * Playwright Global Setup
 * Handles authentication token retrieval for E2E tests
 *
 * This setup:
 * 1. Waits for the reference server to start
 * 2. Checks if authentication is required
 * 3. If auth is enabled, captures the magic link token from server logs
 * 4. Stores the token for use in tests
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_TOKEN_FILE = path.join(__dirname, '../.test-auth-token');
const REFERENCE_SERVER_URL = 'http://localhost:8765';

// Configuration with sensible defaults
const CONFIG = {
  REFERENCE_SERVER_TIMEOUT: 30000,  // 30 seconds
  REFERENCE_SERVER_RETRY_INTERVAL: 500, // Check every 500ms
  AUTH_CHECK_TIMEOUT: 5000,
  AUTH_SETUP_TIMEOUT: 10000,
};

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Global Setup: Initializing E2E test environment...');

  try {
    // Wait for reference server to be ready
    console.log('   [1/3] Waiting for reference server (http://localhost:8765)...');
    await waitForServer(
      REFERENCE_SERVER_URL + '/health',
      CONFIG.REFERENCE_SERVER_TIMEOUT,
      CONFIG.REFERENCE_SERVER_RETRY_INTERVAL
    );
    console.log('   ✓ Reference server is ready');

    // Test if authentication is required
    console.log('   [2/3] Checking authentication configuration...');
    const authRequired = await checkAuthRequired();

    if (authRequired) {
      console.log('   ⚠ Authentication is ENABLED on reference server');

      // Check if there's a token file we can use
      if (fs.existsSync(AUTH_TOKEN_FILE)) {
        const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf-8').trim();
        console.log(`   ✓ Found auth token file: ${path.basename(AUTH_TOKEN_FILE)}`);

        // Verify token works
        console.log('   [3/3] Verifying authentication token...');
        const tokenWorks = await verifyToken(token);
        if (tokenWorks) {
          console.log('   ✓ Auth token is valid');

          // Store token in localStorage for all tests
          await setupAuthForTests(token);
          console.log('   ✓ Auth token configured for tests');
        } else {
          throw new Error(
            'Auth token verification failed\n' +
            '  Token may be invalid or expired\n' +
            '  Solution: Restart reference server without --auth flag, or provide valid token'
          );
        }
      } else {
        throw new Error(
          'Authentication required but no token file found\n' +
          `  Expected: ${AUTH_TOKEN_FILE}\n` +
          '  Solution: Create token file with: echo "YOUR_TOKEN" > .test-auth-token\n' +
          '  Or: Restart reference server without --auth flag for testing'
        );
      }
    } else {
      console.log('   ✓ Authentication is DISABLED (test mode)');
      // Clean up any old token file
      if (fs.existsSync(AUTH_TOKEN_FILE)) {
        fs.unlinkSync(AUTH_TOKEN_FILE);
        console.log('   ℹ Cleaned up old auth token file');
      }
    }

    console.log('✅ Global Setup Complete - Ready for E2E tests\n');
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error('\n❌ Global Setup Failed:\n');
    console.error(message);
    console.error('\n📋 Troubleshooting:\n');
    console.error('  1. Ensure reference server is running:');
    console.error('     cd reference_server && source .venv/bin/activate && python main.py\n');
    console.error('  2. Verify server health:');
    console.error('     curl http://localhost:8765/health\n');
    console.error('  3. Check firewall/network:');
    console.error('     netstat -an | grep 8765\n');
    console.error('See: tests/README.md#troubleshooting for more help\n');
    process.exit(1);
  }
}

/**
 * Wait for server to be available with intelligent retries
 */
async function waitForServer(
  url: string,
  timeout: number,
  retryInterval: number = 500
): Promise<void> {
  const startTime = Date.now();
  let lastError: Error | undefined;
  let attemptCount = 0;

  while (Date.now() - startTime < timeout) {
    attemptCount++;
    try {
      const response = await fetch(url, {
        method: 'GET',
        timeout: 5000
      });
      if (response.ok) {
        const elapsedTime = Date.now() - startTime;
        console.log(`   (connected in ${elapsedTime}ms)`);
        return;
      }
      lastError = new Error(`Server returned ${response.status} ${response.statusText}`);
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));
    }

    const remainingTime = timeout - (Date.now() - startTime);
    if (remainingTime > 0) {
      await new Promise(resolve => setTimeout(resolve, Math.min(retryInterval, remainingTime)));
    }
  }

  throw new Error(
    `Server at ${url} did not become ready within ${timeout}ms (${attemptCount} attempts)\n` +
    `  Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Check if the reference server requires authentication
 */
async function checkAuthRequired(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_CHECK_TIMEOUT);

    try {
      // Try to access /api/model without auth
      const response = await fetch(REFERENCE_SERVER_URL + '/api/model', {
        signal: controller.signal,
        timeout: CONFIG.AUTH_CHECK_TIMEOUT
      });

      clearTimeout(timeoutId);

      // If we get 401/403, auth is required
      if (response.status === 401 || response.status === 403) {
        return true;
      }

      // If we get 404, 500, or 200 - auth is not required
      return false;
    } catch (error) {
      clearTimeout(timeoutId);
      // If we can't connect, assume no auth is required
      // (the earlier waitForServer check would have already failed if server is down)
      return false;
    }
  } catch (error) {
    console.warn('   ⚠ Error checking auth configuration (assuming not required)');
    return false;
  }
}

/**
 * Verify that an auth token works
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_CHECK_TIMEOUT);

    try {
      const response = await fetch(REFERENCE_SERVER_URL + '/api/model', {
        headers: {
          'Authorization': `Bearer ${token}`
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      // 200, 404, or 500 are all fine - means auth worked
      // 401/403 means auth failed
      return response.status !== 401 && response.status !== 403;
    } catch (error) {
      clearTimeout(timeoutId);
      return false;
    }
  } catch (error) {
    return false;
  }
}

/**
 * Set up authentication token in browser localStorage for all tests
 */
async function setupAuthForTests(token: string): Promise<void> {
  const browser = await chromium.launch();
  let context = null;
  let page = null;

  try {
    context = await browser.newContext();
    page = await context.newPage();

    // Set timeout for navigation
    page.setDefaultTimeout(CONFIG.AUTH_SETUP_TIMEOUT);

    // Navigate to the app
    await page.goto('http://localhost:3001', { waitUntil: 'domcontentloaded' });

    // Set auth token in localStorage
    await page.evaluate((authToken) => {
      localStorage.setItem('dr_auth_token', authToken);
    }, token);
  } finally {
    if (page) await page.close().catch(() => {});
    if (context) await context.close().catch(() => {});
    await browser.close().catch(() => {});
  }
}

export default globalSetup;
