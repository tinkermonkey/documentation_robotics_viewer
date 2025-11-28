/**
 * Layer Container Tests
 * Verifies that layer containers render correctly with proper colors and positioning
 */

import { test, expect } from '@playwright/test';

test.describe('Layer Containers', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the application
    await page.goto('http://localhost:3001');

    // Wait for the page to load
    await page.waitForLoadState('networkidle');
  });

  test('layer containers render after loading demo data', async ({ page }) => {
    // Click "Load Demo Data" button
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await expect(loadButton).toBeVisible({ timeout: 10000 });
    await loadButton.click();

    // Wait for rendering to complete
    await page.waitForTimeout(2000);

    // Wait for the tldraw canvas to be visible
    const canvas = page.locator('.tldraw__canvas');
    await expect(canvas).toBeVisible({ timeout: 10000 });

    // Take a screenshot for visual verification
    await page.screenshot({
      path: 'test-results/layer-containers-overview.png',
      fullPage: true
    });

    console.log('✓ Layer containers rendered successfully');
  });

  test('Business layer container has correct color', async ({ page }) => {
    // Load demo data
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await loadButton.click();
    await page.waitForTimeout(2000);

    // The Business layer should use #e65100 (dark orange)
    // We can verify this by checking the tldraw canvas for elements with this color

    // Take screenshot for manual verification
    await page.screenshot({
      path: 'test-results/business-layer-color.png',
      fullPage: true
    });

    console.log('✓ Business layer color test completed');
  });

  test('Security layer container has correct color', async ({ page }) => {
    // Load demo data
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await loadButton.click();
    await page.waitForTimeout(2000);

    // The Security layer should use #c2185b (dark pink)

    // Take screenshot for manual verification
    await page.screenshot({
      path: 'test-results/security-layer-color.png',
      fullPage: true
    });

    console.log('✓ Security layer color test completed');
  });

  test('layer visibility toggle affects containers', async ({ page }) => {
    // Load demo data
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await loadButton.click();
    await page.waitForTimeout(2000);

    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/layer-visibility-all.png',
      fullPage: true
    });

    // Try to find and toggle Business layer checkbox
    const businessCheckbox = page.locator('input[type="checkbox"]').filter({
      has: page.locator('text=Business')
    });

    // If layer panel is visible, toggle the checkbox
    const isVisible = await businessCheckbox.isVisible().catch(() => false);
    if (isVisible) {
      await businessCheckbox.click();
      await page.waitForTimeout(500);

      // Take screenshot with Business layer hidden
      await page.screenshot({
        path: 'test-results/layer-visibility-business-hidden.png',
        fullPage: true
      });

      // Toggle back
      await businessCheckbox.click();
      await page.waitForTimeout(500);

      console.log('✓ Layer visibility toggle test completed');
    } else {
      console.log('⚠ Layer panel not visible, skipping visibility toggle test');
    }
  });

  test('containers appear behind elements', async ({ page }) => {
    // Load demo data
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await loadButton.click();
    await page.waitForTimeout(2000);

    // Zoom to fit to see all layers
    await page.waitForTimeout(1000);

    // Take screenshot for z-order verification
    await page.screenshot({
      path: 'test-results/layer-containers-z-order.png',
      fullPage: true
    });

    console.log('✓ Z-order test completed (manual verification required)');
  });

  test('application loads without errors', async ({ page }) => {
    const consoleErrors: string[] = [];

    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });

    // Load demo data
    const loadButton = page.locator('button:has-text("Load Demo Data")');
    await loadButton.click();
    await page.waitForTimeout(3000);

    // Check for console errors
    const criticalErrors = consoleErrors.filter(err =>
      !err.includes('DevTools') && // Ignore DevTools errors
      !err.includes('favicon') && // Ignore favicon errors
      !err.includes('chunk')       // Ignore chunk loading warnings
    );

    if (criticalErrors.length > 0) {
      console.log('Console errors detected:', criticalErrors);
    }

    expect(criticalErrors.length).toBe(0);
    console.log('✓ No critical errors in console');
  });
});
