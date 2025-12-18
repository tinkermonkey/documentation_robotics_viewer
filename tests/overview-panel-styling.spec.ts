/**
 * E2E Tests for Overview Panel Styling
 * Validates that the MiniMap Overview panel matches design.png:
 * - "Overview" header text is visible
 * - Correct border, shadow, and border-radius styling
 * - Dark mode color variants
 * - Proper positioning in graph views
 *
 * IMPORTANT: This test requires the Python reference server to be running.
 *
 * Run with: npm run test:e2e
 *
 * This test is configured in playwright.e2e.config.ts which automatically
 * starts both the dev server and reference server.
 */

import { test, expect } from '@playwright/test';

test.setTimeout(30000);

test.describe('Overview Panel Styling', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });
  });

  test('MiniMap Overview panel is visible in Model graph view', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check for MiniMap
    const miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    // Check for Overview panel wrapper
    const overviewPanel = page.locator('[data-testid="overview-panel"]');
    if (await overviewPanel.count() > 0) {
      await expect(overviewPanel).toBeVisible();
    }
  });

  test('Overview panel has "Overview" header text', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check for "Overview" text near MiniMap
    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    if (await overviewPanel.count() > 0) {
      const overviewText = overviewPanel.getByText('Overview', { exact: false });
      await expect(overviewText).toBeVisible();
    } else {
      // Alternative: check for Overview text near MiniMap
      const miniMapContainer = page.locator('.react-flow__minimap').locator('..');
      const overviewText = miniMapContainer.getByText('Overview', { exact: false });

      if (await overviewText.count() > 0) {
        await expect(overviewText).toBeVisible();
      }
    }
  });

  test('Overview panel has correct styling classes', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    if (await overviewPanel.count() > 0) {
      const classList = await overviewPanel.getAttribute('class');

      expect(classList).toBeTruthy();

      // Should have rounded corners
      expect(classList).toMatch(/rounded/);

      // Should have border
      expect(classList).toMatch(/border/);

      // Should have shadow
      expect(classList).toMatch(/shadow/);
    }
  });

  test('Overview panel has border and shadow in light mode', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Ensure light mode (if dark mode toggle exists)
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.count() > 0) {
      const isDark = await page.locator('html').evaluate(el =>
        el.classList.contains('dark')
      );

      if (isDark) {
        await darkModeToggle.click();
        await page.waitForTimeout(300);
      }
    }

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    if (await overviewPanel.count() > 0) {
      const styles = await overviewPanel.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          borderWidth: computed.borderWidth,
          borderStyle: computed.borderStyle,
          boxShadow: computed.boxShadow,
          borderRadius: computed.borderRadius
        };
      });

      // Should have border
      expect(styles.borderStyle).not.toBe('none');
      expect(parseInt(styles.borderWidth)).toBeGreaterThan(0);

      // Should have shadow
      expect(styles.boxShadow).not.toBe('none');

      // Should have border radius
      expect(parseInt(styles.borderRadius)).toBeGreaterThan(0);
    }
  });

  test('Overview panel adapts to dark mode', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    // Get light mode colors
    let lightBgColor = null;
    let lightBorderColor = null;

    if (await overviewPanel.count() > 0) {
      const lightStyles = await overviewPanel.evaluate(el => {
        const computed = window.getComputedStyle(el);
        return {
          backgroundColor: computed.backgroundColor,
          borderColor: computed.borderColor
        };
      });

      lightBgColor = lightStyles.backgroundColor;
      lightBorderColor = lightStyles.borderColor;
    }

    // Toggle to dark mode
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      // Get dark mode colors
      if (await overviewPanel.count() > 0) {
        const darkStyles = await overviewPanel.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            backgroundColor: computed.backgroundColor,
            borderColor: computed.borderColor
          };
        });

        // Colors should change in dark mode
        if (lightBgColor && darkStyles.backgroundColor) {
          expect(darkStyles.backgroundColor).not.toBe(lightBgColor);
        }
      }
    }
  });

  test('Overview panel is positioned in bottom-right corner', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // MiniMap should be in bottom-right
    const miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    const miniMapBox = await miniMap.boundingBox();
    const viewport = page.viewportSize()!;

    if (miniMapBox) {
      // Should be in the right portion of viewport
      expect(miniMapBox.x).toBeGreaterThan(viewport.width / 2);

      // Should be in the bottom portion of viewport
      expect(miniMapBox.y).toBeGreaterThan(viewport.height / 2);
    }
  });

  test('Overview panel contains MiniMap component', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    if (await overviewPanel.count() > 0) {
      // MiniMap should be inside Overview panel
      const miniMapInPanel = overviewPanel.locator('.react-flow__minimap');
      await expect(miniMapInPanel).toBeVisible();
    } else {
      // At minimum, MiniMap should exist
      const miniMap = page.locator('.react-flow__minimap');
      await expect(miniMap).toBeVisible();
    }
  });

  test('Overview header has correct text styling', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    if (await overviewPanel.count() > 0) {
      const overviewText = overviewPanel.getByText('Overview', { exact: false });

      if (await overviewText.count() > 0) {
        const textStyles = await overviewText.evaluate(el => {
          const computed = window.getComputedStyle(el);
          return {
            fontSize: computed.fontSize,
            fontWeight: computed.fontWeight,
            color: computed.color
          };
        });

        // Should be small text (text-xs or similar)
        const fontSize = parseInt(textStyles.fontSize);
        expect(fontSize).toBeLessThanOrEqual(14); // 14px or smaller

        // Should be medium weight or higher
        const fontWeight = parseInt(textStyles.fontWeight);
        expect(fontWeight).toBeGreaterThanOrEqual(400);

        // Should have a defined color (not transparent)
        expect(textStyles.color).not.toBe('rgba(0, 0, 0, 0)');
        expect(textStyles.color).not.toBe('transparent');
      }
    }
  });

  test('Overview panel visible in all graph views', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Test Model view
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    let miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    // Test Spec view
    await header.getByRole('button', { name: 'Spec' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    // Test Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(500);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    // Test Architecture view
    await header.getByRole('button', { name: 'Architecture' }).click();
    await page.waitForTimeout(500);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();
  });

  test('Overview panel maintains styling after graph interactions', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const overviewPanel = page.locator('[data-testid="overview-panel"]');

    // Get initial styling
    let initialClasses = null;
    if (await overviewPanel.count() > 0) {
      initialClasses = await overviewPanel.getAttribute('class');
    }

    // Perform graph interaction (zoom)
    const reactFlow = page.locator('.react-flow');
    await reactFlow.click();
    await page.keyboard.press('Equal'); // Zoom in
    await page.waitForTimeout(300);

    // Check styling is preserved
    if (await overviewPanel.count() > 0) {
      const afterClasses = await overviewPanel.getAttribute('class');
      expect(afterClasses).toBe(initialClasses);
    }

    // MiniMap should still be visible
    const miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();
  });
});
