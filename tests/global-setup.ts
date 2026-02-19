/**
 * Playwright Global Setup
 * Handles DR CLI server health checks for E2E tests
 *
 * This setup:
 * 1. Checks if DR CLI server is available at configured URL
 * 2. Provides helpful error messages if server is unavailable
 * 3. Configures authentication if needed
 */

import { chromium, FullConfig } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUTH_TOKEN_FILE = path.join(__dirname, '../.test-auth-token');
const DR_API_URL = process.env.DR_API_URL || 'http://localhost:8080';

// Configuration with sensible defaults
const CONFIG = {
  DR_API_TIMEOUT: 30000,  // 30 seconds
  DR_API_RETRY_INTERVAL: 500, // Check every 500ms
  AUTH_CHECK_TIMEOUT: 5000,
  AUTH_SETUP_TIMEOUT: 10000,
};

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Global Setup: Initializing E2E test environment...');

  try {
    // Check if DR CLI server is available
    console.log(`   [1/2] Checking DR CLI server (${DR_API_URL})...`);
    await checkDRServer(
      DR_API_URL + '/health',
      CONFIG.DR_API_TIMEOUT,
      CONFIG.DR_API_RETRY_INTERVAL
    );
    console.log('   ✓ DR CLI server is available');

    // Test if authentication is required
    console.log('   [2/2] Checking authentication configuration...');
    const authRequired = await checkAuthRequired();

    if (authRequired) {
      console.log('   ⚠ Authentication is ENABLED on DR CLI server');

      // Check if there's a token file we can use
      if (fs.existsSync(AUTH_TOKEN_FILE)) {
        const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf-8').trim();
        console.log(`   ✓ Found auth token file: ${path.basename(AUTH_TOKEN_FILE)}`);

        // Verify token works
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
            '  Solution: Provide a valid token or run DR CLI without --auth flag for testing'
          );
        }
      } else {
        throw new Error(
          'Authentication required but no token file found\n' +
          `  Expected: ${AUTH_TOKEN_FILE}\n` +
          '  Solution: Create token file with: echo "YOUR_TOKEN" > .test-auth-token\n' +
          '  Or: Run DR CLI without --auth flag for testing'
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
    console.error('\n📋 E2E Test Prerequisites:\n');
    console.error('  1. Start DR CLI server:');
    console.error('     dr visualize --model tests/fixtures/test-model.yaml --port 8080\n');
    console.error('  2. Verify server is running:');
    console.error(`     curl ${DR_API_URL}/health\n`);
    console.error('  3. Set custom URL if needed:');
    console.error('     DR_API_URL=http://your-server:8080 npm run test:e2e\n');
    console.error('See: documentation/TESTING.md for more help\n');
    process.exit(1);
  }
}

/**
 * Check if DR CLI server is available with intelligent retries
 */
async function checkDRServer(
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
    `DR CLI server at ${url} did not become ready within ${timeout}ms (${attemptCount} attempts)\n` +
    `  Last error: ${lastError?.message || 'Unknown error'}`
  );
}

/**
 * Check if the DR CLI server requires authentication
 */
async function checkAuthRequired(): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_CHECK_TIMEOUT);

    try {
      // Try to access /api/model without auth
      const response = await fetch(DR_API_URL + '/api/model', {
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
      // (the earlier checkDRServer check would have already failed if server is down)
      return false;
    }
  } catch (error) {
    console.warn('   ⚠ Error checking auth configuration (assuming not required)');
    return false;
  }
}

/**
 * Verify that an auth token works with DR CLI server
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), CONFIG.AUTH_CHECK_TIMEOUT);

    try {
      const response = await fetch(DR_API_URL + '/api/model', {
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
