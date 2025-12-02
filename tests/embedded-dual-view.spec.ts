/**
 * E2E Tests for Dual-View URL Routing
 * Tests spec and changeset URL routing and redirects
 *
 * Note: Tests for ViewTabSwitcher visibility and tab switching require the
 * reference server to be running because the UI only shows tabs after data loads.
 * Those tests are covered in embedded-app.spec.ts when run with:
 *   npm run test:embedded (uses playwright.embedded.config.ts)
 *
 * These tests verify URL routing which works without data loading.
 */

import { test, expect } from '@playwright/test';

test.describe('Embedded App - Dual View URL Routing', () => {
  test.describe('URL-based Navigation', () => {
    test('should redirect /spec to /spec/graph by default', async ({ page }) => {
      await page.goto('/spec');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/spec\/graph/);
    });

    test('should redirect /changesets to /changesets/graph by default', async ({ page }) => {
      await page.goto('/changesets');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/changesets\/graph/);
    });

    test('should redirect /model to /model/graph by default', async ({ page }) => {
      await page.goto('/model');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should be redirected to graph view
      await expect(page).toHaveURL(/\/model\/graph/);
    });

    test('should load /spec/json route directly', async ({ page }) => {
      await page.goto('/spec/json');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/spec\/json/);
    });

    test('should load /changesets/list route directly', async ({ page }) => {
      await page.goto('/changesets/list');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on list view
      await expect(page).toHaveURL(/\/changesets\/list/);
    });

    test('should load /model/json route directly', async ({ page }) => {
      await page.goto('/model/json');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Should stay on JSON view
      await expect(page).toHaveURL(/\/model\/json/);
    });
  });

  test.describe('App Structure', () => {
    test('should have header with title', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      await expect(page.locator('.embedded-header h1')).toContainText('Documentation Robotics Viewer');
    });

    test('should have mode selector with all modes', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      const modeSelector = page.locator('.mode-selector');
      await expect(modeSelector).toBeVisible();

      // Check for all mode buttons
      await expect(page.locator('.mode-selector button:has-text("Spec")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Model")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Motivation")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Architecture")')).toBeVisible();
      await expect(page.locator('.mode-selector button:has-text("Changesets")')).toBeVisible();
    });

    test('should have connection status indicator', async ({ page }) => {
      await page.goto('/');
      await page.waitForSelector('.embedded-app', { timeout: 10000 });

      // Connection status should exist (may show connecting, connected, or disconnected)
      await expect(page.locator('.connection-status')).toBeVisible();
    });
  });
});
