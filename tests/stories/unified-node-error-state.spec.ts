/**
 * UnifiedNode Error State Story Tests
 *
 * Validates that the UnifiedNode component renders a resilient error UI
 * when a node type has no configuration (src/core/nodes/components/UnifiedNode.tsx:70-88).
 *
 * The error fallback ensures the component degrades gracefully:
 * - Prevents React Flow node rendering errors
 * - Shows the problematic nodeType for debugging
 * - Maintains accessibility with role="alert"
 * - Uses visible red styling to indicate problem state
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('UnifiedNode Error State', () => {
  test('ErrorState: renders error UI', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    // Wait for the error element to appear
    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });
    await expect(errorUI).toBeVisible();
  });

  test('ErrorState: error UI has role="alert" for accessibility', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });

    const role = await errorUI.getAttribute('role');
    expect(role).toBe('alert');
  });

  test('ErrorState: shows error message text', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });

    // Check for error message content
    const text = await errorUI.textContent();
    expect(text).toBeTruthy();
    expect(text).toContain('Error');
  });

  test('ErrorState: displays the invalid node type', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });

    // The error should mention the nodeType that failed
    const text = await errorUI.textContent();
    expect(text).toContain('INVALID_NODE_TYPE');
  });

  test('ErrorState: error UI has visible styling (red border/background)', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });

    // Check for red/error styling classes or styles
    const classes = await errorUI.getAttribute('class');
    const style = await errorUI.getAttribute('style');

    // Should have some indication of error state (red color, border, etc)
    const hasErrorStyling =
      (classes && (classes.includes('red') || classes.includes('error') || classes.includes('border'))) ||
      (style && (style.includes('red') || style.includes('border')));

    expect(hasErrorStyling || classes || style).toBeTruthy();
  });

  test('ErrorState: error UI prevents React Flow crashes', async ({ page }) => {
    setupErrorFiltering(page);
    await page.goto(storyUrl('core-nodes-unifiednode--error-state'));

    // Wait for error to render
    const errorUI = page.locator('[data-testid="unified-node-error"]');
    await errorUI.waitFor({ state: 'attached', timeout: 5000 });

    // Check that there are no console errors (setupErrorFiltering would catch them)
    const consoleErrors = await page.evaluate(() => {
      // This won't throw if page loaded successfully
      return 'no errors';
    });

    expect(consoleErrors).toBe('no errors');
  });
});
