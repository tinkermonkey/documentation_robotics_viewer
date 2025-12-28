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

async function globalSetup(config: FullConfig) {
  console.log('\n🔧 Global Setup: Checking authentication...');

  // Wait for reference server to be ready
  console.log('   Waiting for reference server...');
  await waitForServer(REFERENCE_SERVER_URL + '/health', 30000);
  console.log('   ✓ Reference server is ready');

  // Test if authentication is required
  const authRequired = await checkAuthRequired();

  if (authRequired) {
    console.log('   ⚠ Authentication is ENABLED on reference server');
    console.log('   ℹ Tests will fail unless you provide an auth token');
    console.log('   ℹ To disable auth for testing, restart server without --auth flag');

    // Check if there's a token file we can use
    if (fs.existsSync(AUTH_TOKEN_FILE)) {
      const token = fs.readFileSync(AUTH_TOKEN_FILE, 'utf-8').trim();
      console.log(`   ✓ Found auth token from file: ${AUTH_TOKEN_FILE}`);

      // Verify token works
      const tokenWorks = await verifyToken(token);
      if (tokenWorks) {
        console.log('   ✓ Auth token is valid');

        // Store token in localStorage for all tests
        await setupAuthForTests(token);
      } else {
        console.log('   ✗ Auth token is invalid or expired');
        throw new Error('Authentication token is invalid. Please restart the reference server or provide a valid token.');
      }
    } else {
      console.log('   ✗ No auth token found');
      console.log(`   ℹ Expected token file at: ${AUTH_TOKEN_FILE}`);
      console.log('   ℹ To create: echo "YOUR_TOKEN" > .test-auth-token');
      throw new Error('Authentication required but no token found. See logs above for instructions.');
    }
  } else {
    console.log('   ✓ Authentication is DISABLED (test mode)');
    // Clean up any old token file
    if (fs.existsSync(AUTH_TOKEN_FILE)) {
      fs.unlinkSync(AUTH_TOKEN_FILE);
    }
  }

  console.log('✅ Global Setup Complete\n');
}

/**
 * Wait for server to be available
 */
async function waitForServer(url: string, timeout: number): Promise<void> {
  const startTime = Date.now();

  while (Date.now() - startTime < timeout) {
    try {
      const response = await fetch(url);
      if (response.ok) {
        return;
      }
    } catch (error) {
      // Server not ready yet, continue waiting
    }
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  throw new Error(`Server at ${url} did not become ready within ${timeout}ms`);
}

/**
 * Check if the reference server requires authentication
 */
async function checkAuthRequired(): Promise<boolean> {
  try {
    // Try to access /api/model without auth
    const response = await fetch(REFERENCE_SERVER_URL + '/api/model');

    // If we get 401/403, auth is required
    if (response.status === 401 || response.status === 403) {
      return true;
    }

    // If we get 404 or 500, that's fine - auth is not required (data just doesn't exist)
    // If we get 200, auth is not required
    return false;
  } catch (error) {
    console.error('   Error checking auth:', error);
    return false;
  }
}

/**
 * Verify that an auth token works
 */
async function verifyToken(token: string): Promise<boolean> {
  try {
    const response = await fetch(REFERENCE_SERVER_URL + '/api/model', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });

    // 200, 404, or 500 are all fine - means auth worked
    // 401/403 means auth failed
    return response.status !== 401 && response.status !== 403;
  } catch (error) {
    console.error('   Error verifying token:', error);
    return false;
  }
}

/**
 * Set up authentication token in browser localStorage for all tests
 */
async function setupAuthForTests(token: string): Promise<void> {
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  // Navigate to the app
  await page.goto('http://localhost:3001');

  // Set auth token in localStorage
  await page.evaluate((authToken) => {
    localStorage.setItem('dr_auth_token', authToken);
  }, token);

  console.log('   ✓ Auth token configured in localStorage for tests');

  await browser.close();
}

export default globalSetup;
