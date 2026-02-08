/**
 * Test Utilities for Enhanced Test Infrastructure Robustness
 *
 * This module provides reusable helpers to improve test reliability:
 * - Eliminates hardcoded wait timeouts
 * - Provides intelligent wait strategies
 * - Centralizes error handling and logging
 * - Offers test data utilities
 * - Manages test state cleanup
 */

import { Page, expect, Locator } from '@playwright/test';

/**
 * Configuration for wait operations
 */
export interface WaitConfig {
  /** Timeout in milliseconds (default: 10000) */
  timeout?: number;
  /** Enable verbose logging for debugging (default: false) */
  verbose?: boolean;
  /** Additional context for error messages */
  context?: string;
}

/**
 * Result of a wait operation
 */
export interface WaitResult<T> {
  success: boolean;
  value?: T;
  error?: Error;
  duration: number;
}

/**
 * ============================================================================
 * PAGE WAIT UTILITIES
 * ============================================================================
 */

/**
 * Wait for a selector with automatic retry on transient failures
 *
 * Replaces: await page.waitForTimeout(2000); await page.waitForSelector(selector);
 *
 * @example
 * ```typescript
 * await waitForElement(page, '[data-testid="graph-container"]', {
 *   timeout: 5000,
 *   context: 'Graph container should be visible'
 * });
 * ```
 */
export async function waitForElement(
  page: Page,
  selector: string,
  config: WaitConfig = {}
): Promise<Locator> {
  const { timeout = 10000, verbose = false, context } = config;
  const startTime = Date.now();

  try {
    const locator = page.locator(selector);
    await locator.waitFor({ timeout });

    const duration = Date.now() - startTime;
    if (verbose) {
      console.log(`✓ Element found "${selector}" (${duration}ms)`);
    }

    return locator;
  } catch (error) {
    const duration = Date.now() - startTime;
    const message = `Failed to find element "${selector}" within ${timeout}ms${
      context ? ` (${context})` : ''
    }`;

    if (verbose) {
      console.error(`✗ ${message}`);
    }

    throw new Error(message);
  }
}

/**
 * Wait for multiple selectors with AND logic (all must be visible)
 *
 * @example
 * ```typescript
 * await waitForAllElements(page, [
 *   '[data-testid="graph"]',
 *   '[data-testid="sidebar"]',
 *   '[data-testid="toolbar"]'
 * ]);
 * ```
 */
export async function waitForAllElements(
  page: Page,
  selectors: string[],
  config: WaitConfig = {}
): Promise<Map<string, Locator>> {
  const { timeout = 10000, verbose = false } = config;
  const results = new Map<string, Locator>();
  const startTime = Date.now();

  for (const selector of selectors) {
    try {
      const locator = await waitForElement(page, selector, {
        timeout,
        verbose: false
      });
      results.set(selector, locator);
    } catch (error) {
      const duration = Date.now() - startTime;
      throw new Error(
        `Failed to find all required elements within ${timeout}ms. ` +
        `Found ${results.size}/${selectors.length}. ` +
        `Missing: "${selector}" (total time: ${duration}ms)`
      );
    }
  }

  const duration = Date.now() - startTime;
  if (verbose) {
    console.log(`✓ All ${selectors.length} elements found (${duration}ms)`);
  }

  return results;
}

/**
 * Wait for any selector (OR logic) - whichever appears first
 *
 * @example
 * ```typescript
 * const result = await waitForAnyElement(page, [
 *   '[data-testid="loading"]',
 *   '[data-testid="error"]',
 *   '[data-testid="content"]'
 * ]);
 * console.log('First element found:', result.selector); // which one?
 * ```
 */
export async function waitForAnyElement(
  page: Page,
  selectors: string[],
  config: WaitConfig = {}
): Promise<{ selector: string; locator: Locator }> {
  const { timeout = 10000, verbose = false } = config;
  const startTime = Date.now();

  // Create promise race for first successful selector
  const promises = selectors.map(async (selector) => {
    try {
      const locator = page.locator(selector);
      await locator.waitFor({ timeout });
      return { selector, locator };
    } catch {
      throw new Error(`Selector not found: ${selector}`);
    }
  });

  try {
    const result = await Promise.race(promises);
    const duration = Date.now() - startTime;
    if (verbose) {
      console.log(`✓ Found element "${result.selector}" (${duration}ms)`);
    }
    return result;
  } catch (error) {
    const duration = Date.now() - startTime;
    throw new Error(
      `None of the selectors appeared within ${timeout}ms ` +
      `(checked: ${selectors.length}, total time: ${duration}ms)`
    );
  }
}

/**
 * Wait for WebSocket connection with automatic retries
 *
 * Replaces: await page.waitForTimeout(2000); // hope server is ready
 *
 * @example
 * ```typescript
 * await waitForWebSocketConnection(page, {
 *   timeout: 15000,
 *   context: 'Waiting for real-time sync connection'
 * });
 * ```
 */
export async function waitForWebSocketConnection(
  page: Page,
  config: WaitConfig = {}
): Promise<void> {
  const { timeout = 10000, verbose = false, context } = config;

  await waitForElement(page, '[data-connection-state="connected"]', {
    timeout,
    verbose,
    context: context || 'WebSocket connection'
  });
}

/**
 * Wait for console messages (useful for debugging)
 *
 * @example
 * ```typescript
 * const message = await waitForConsoleMessage(page, /Layout complete/, {
 *   timeout: 5000
 * });
 * ```
 */
export async function waitForConsoleMessage(
  page: Page,
  pattern: RegExp,
  config: WaitConfig = {}
): Promise<string> {
  const { timeout = 10000, verbose = false } = config;
  const startTime = Date.now();
  const messages: string[] = [];

  return new Promise((resolve, reject) => {
    const handler = (msg: any) => {
      const text = msg.text();
      messages.push(text);

      if (pattern.test(text)) {
        cleanup();
        const duration = Date.now() - startTime;
        if (verbose) {
          console.log(`✓ Console message matched in ${duration}ms: "${text}"`);
        }
        resolve(text);
      }
    };

    const timeoutId = setTimeout(() => {
      cleanup();
      reject(new Error(
        `Console message matching /${pattern.source}/ not found within ${timeout}ms. ` +
        `Saw ${messages.length} messages`
      ));
    }, timeout);

    const cleanup = () => {
      clearTimeout(timeoutId);
      page.removeListener('console', handler);
    };

    page.on('console', handler);
  });
}

/**
 * ============================================================================
 * ASSERTION UTILITIES
 * ============================================================================
 */

/**
 * Assert no console errors occurred (ignores warnings and info)
 *
 * @example
 * ```typescript
 * await assertNoConsoleErrors(page);
 * // or with filtering
 * await assertNoConsoleErrors(page, {
 *   ignorePatterns: [/^Expected behavior/, /known warning/]
 * });
 * ```
 */
export async function assertNoConsoleErrors(
  page: Page,
  options?: {
    ignorePatterns?: RegExp[];
    throwOnWarning?: boolean;
  }
): Promise<void> {
  const errors: string[] = [];
  const warnings: string[] = [];

  page.on('console', (msg) => {
    const text = msg.text();
    const shouldIgnore =
      options?.ignorePatterns?.some((pattern) => pattern.test(text)) ?? false;

    if (!shouldIgnore) {
      if (msg.type() === 'error') {
        errors.push(text);
      } else if (msg.type() === 'warning' && options?.throwOnWarning) {
        warnings.push(text);
      }
    }
  });

  // Give page time to log errors
  await page.waitForTimeout(500);

  if (errors.length > 0) {
    throw new Error(
      `Console errors detected:\n${errors.map((e) => `  - ${e}`).join('\n')}`
    );
  }

  if (warnings.length > 0) {
    throw new Error(
      `Console warnings detected:\n${warnings.map((w) => `  - ${w}`).join('\n')}`
    );
  }
}

/**
 * Assert element count matches expectation
 *
 * @example
 * ```typescript
 * await assertElementCount(page, '.react-flow__node', 5, {
 *   context: 'Graph should render 5 nodes'
 * });
 * ```
 */
export async function assertElementCount(
  page: Page,
  selector: string,
  expectedCount: number,
  config?: WaitConfig
): Promise<number> {
  const locator = page.locator(selector);
  const count = await locator.count();

  if (count !== expectedCount) {
    throw new Error(
      `Expected ${expectedCount} elements matching "${selector}", ` +
      `but found ${count}${config?.context ? ` (${config.context})` : ''}`
    );
  }

  return count;
}

/**
 * ============================================================================
 * STORE RESET UTILITIES
 * ============================================================================
 */

/**
 * Reset Zustand store for test isolation
 *
 * @example
 * ```typescript
 * const store = useChatStore.getState();
 * resetStore(store);
 * ```
 */
export function resetStore<T extends { reset?: () => void }>(
  store: T
): void {
  if (typeof store.reset === 'function') {
    store.reset();
  } else {
    console.warn('Store does not implement reset() method');
  }
}

/**
 * ============================================================================
 * ERROR HANDLING UTILITIES
 * ============================================================================
 */

/**
 * Wrap async operations with detailed error context
 *
 * @example
 * ```typescript
 * await withErrorContext('Loading model', async () => {
 *   await page.click('[data-testid="load-button"]');
 *   await waitForElement(page, '[data-testid="graph"]');
 * });
 * ```
 */
export async function withErrorContext<T>(
  context: string,
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn();
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    throw new Error(`[${context}] ${message}`);
  }
}

/**
 * ============================================================================
 * PERFORMANCE UTILITIES
 * ============================================================================
 */

/**
 * Measure operation duration
 *
 * @example
 * ```typescript
 * const { duration, result } = await measureDuration(async () => {
 *   return await page.click('[data-testid="button"]');
 * });
 * console.log(`Operation took ${duration}ms`);
 * ```
 */
export async function measureDuration<T>(
  fn: () => Promise<T>
): Promise<{ duration: number; result: T }> {
  const startTime = performance.now();
  const result = await fn();
  const duration = performance.now() - startTime;

  return { duration, result };
}

/**
 * Assert operation completes within timeout (performance check)
 *
 * @example
 * ```typescript
 * await assertPerformance(async () => {
 *   return await layoutEngine.calculate(model);
 * }, 1000, 'Layout should complete in 1 second');
 * ```
 */
export async function assertPerformance<T>(
  fn: () => Promise<T>,
  maxDuration: number,
  context: string
): Promise<T> {
  const { duration, result } = await measureDuration(fn);

  if (duration > maxDuration) {
    throw new Error(
      `Performance assertion failed: ${context}. ` +
      `Expected <${maxDuration}ms, but took ${duration}ms`
    );
  }

  console.log(`✓ ${context}: ${duration}ms (max: ${maxDuration}ms)`);
  return result;
}

/**
 * ============================================================================
 * DATA UTILITIES
 * ============================================================================
 */

/**
 * Generate deterministic test IDs to avoid flakiness
 *
 * @example
 * ```typescript
 * const elementId = generateTestId('element'); // 'element-1234567890'
 * ```
 */
export function generateTestId(prefix: string): string {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}`;
}

/**
 * Sleep for a specific duration (use sparingly, prefer wait strategies above)
 *
 * DEPRECATED: Use waitForElement() or other wait utilities instead.
 * Only use when absolutely necessary for sync operations.
 *
 * @example
 * ```typescript
 * // BAD: Don't do this
 * await sleep(2000); // Why are we waiting?
 *
 * // GOOD: Do this instead
 * await waitForElement(page, '[data-testid="graph"]');
 * ```
 */
export async function sleep(ms: number): Promise<void> {
  console.warn(
    `⚠️  Using sleep(${ms}ms) - consider using waitForElement() or other wait utilities instead`
  );
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * ============================================================================
 * BATCH UTILITIES
 * ============================================================================
 */

/**
 * Retry a flaky operation with exponential backoff
 *
 * @example
 * ```typescript
 * const result = await retryWithBackoff(
 *   async () => await fetch('/api/data'),
 *   { maxAttempts: 3, initialDelayMs: 100 }
 * );
 * ```
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options?: {
    maxAttempts?: number;
    initialDelayMs?: number;
    backoffMultiplier?: number;
    verbose?: boolean;
  }
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 100,
    backoffMultiplier = 2,
    verbose = false
  } = options ?? {};

  let lastError: Error | undefined;
  let delayMs = initialDelayMs;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      if (verbose && attempt > 1) {
        console.log(`Retry attempt ${attempt}/${maxAttempts}...`);
      }
      return await fn();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt < maxAttempts) {
        if (verbose) {
          console.log(`Attempt ${attempt} failed, waiting ${delayMs}ms...`);
        }
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        delayMs *= backoffMultiplier;
      }
    }
  }

  throw new Error(
    `Operation failed after ${maxAttempts} attempts: ${lastError?.message}`
  );
}

/**
 * ============================================================================
 * TEST SETUP/TEARDOWN UTILITIES
 * ============================================================================
 */

/**
 * Enhanced setup for E2E tests with better error reporting
 *
 * @example
 * ```typescript
 * test.beforeEach(async ({ page }) => {
 *   await setupEmbeddedApp(page);
 * });
 * ```
 */
export async function setupEmbeddedApp(
  page: Page,
  options?: { verbose?: boolean }
): Promise<void> {
  const { verbose = false } = options ?? {};

  try {
    // Navigate to app
    await withErrorContext('Navigate to app', async () => {
      await page.goto('/');
    });

    // Wait for app to load
    await withErrorContext('App initialization', async () => {
      await waitForElement(page, '[data-testid="embedded-app"]', {
        timeout: 10000,
        verbose
      });
    });

    // Wait for connection
    await withErrorContext('WebSocket connection', async () => {
      await waitForWebSocketConnection(page, {
        timeout: 15000,
        verbose
      });
    });

    if (verbose) {
      console.log('✓ App setup complete');
    }
  } catch (error) {
    console.error('App setup failed:', error);
    throw error;
  }
}

/**
 * ============================================================================
 * DEBUGGING UTILITIES
 * ============================================================================
 */

/**
 * Capture diagnostic information for debugging test failures
 *
 * @example
 * ```typescript
 * const diagnostics = await captureDiagnostics(page);
 * console.log('Diagnostics:', diagnostics);
 * ```
 */
export async function captureDiagnostics(
  page: Page
): Promise<{
  url: string;
  title: string;
  elementCount: number;
  consoleMessages: Array<{ type: string; text: string }>;
}> {
  const messages: Array<{ type: string; text: string }> = [];

  page.on('console', (msg) => {
    messages.push({
      type: msg.type(),
      text: msg.text()
    });
  });

  const elementCount = await page.locator('*').count();

  return {
    url: page.url(),
    title: await page.title(),
    elementCount,
    consoleMessages: messages
  };
}

/**
 * Log test progress for better CI debugging
 *
 * @example
 * ```typescript
 * logTestProgress('Started graph rendering test');
 * // ... test code ...
 * logTestProgress('Graph rendered successfully', { success: true });
 * ```
 */
export function logTestProgress(
  message: string,
  options?: { success?: boolean; duration?: number }
): void {
  const timestamp = new Date().toISOString().split('T')[1].split('.')[0];
  const prefix = options?.success ? '✓' : '→';
  const suffix =
    options?.duration !== undefined ? ` (${options.duration}ms)` : '';

  console.log(`[${timestamp}] ${prefix} ${message}${suffix}`);
}
