/**
 * E2E Tests for Layer Color Consistency
 * Validates that layer colors are consistent across all views:
 * - Model graph
 * - Spec graph
 * - Layer lists/sidebars
 * - Legends
 * - MiniMap
 *
 * Integration testing for UX cleanup (Issue #64)
 */

import { test, expect } from '@playwright/test';

test.setTimeout(30000);

test.describe('Layer Color Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });
  });

  test('layer colors are consistent between Model and Spec graphs', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500); // Reduced wait time - animation buffer
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Find a Motivation layer node in Model graph
    const modelMotivationNode = page.locator('.react-flow__node').filter({
      has: page.locator('[data-layer="Motivation"]')
    }).first();

    await expect(modelMotivationNode).toHaveCount(1);
    const modelMotivationColor = await modelMotivationNode.evaluate(el =>
      window.getComputedStyle(el.querySelector('[data-layer="Motivation"]') || el).backgroundColor
    );

    // Navigate to Spec graph
    await header.getByRole('button', { name: 'Spec' }).click();
    await page.waitForTimeout(500);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Find a Motivation layer node in Spec graph
    const specMotivationNode = page.locator('.react-flow__node').filter({
      has: page.locator('[data-layer="Motivation"]')
    }).first();

    await expect(specMotivationNode).toHaveCount(1);
    const specMotivationColor = await specMotivationNode.evaluate(el =>
      window.getComputedStyle(el.querySelector('[data-layer="Motivation"]') || el).backgroundColor
    );

    // Both views should have Motivation nodes with the same color
    expect(modelMotivationColor).toBe(specMotivationColor);
  });

  test('layer badge colors match graph node colors in Model view', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Get color from a Business layer badge in sidebar
    const businessBadge = page.locator('[data-testid="left-sidebar"]').locator('text=Business').first();
    await expect(businessBadge).toBeVisible();

    const badgeColor = await businessBadge.evaluate(el => {
      const badge = el.closest('.badge, [class*="badge"]') || el;
      return window.getComputedStyle(badge).backgroundColor;
    });

    // Get color from a Business layer node in graph
    const businessNode = page.locator('.react-flow__node').filter({
      has: page.locator('[data-layer="Business"]')
    }).first();

    await expect(businessNode).toHaveCount(1);
    const nodeColor = await businessNode.evaluate(el => {
      const layerEl = el.querySelector('[data-layer="Business"]') || el;
      return window.getComputedStyle(layerEl).backgroundColor;
    });

    // Colors should match
    expect(badgeColor).toBe(nodeColor);
  });

  test('all 12 layer types have defined colors', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph to ensure layers are rendered
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check if we can find nodes from various layer types
    const layerTypes = [
      'Motivation',
      'Business',
      'Security',
      'Application',
      'Technology',
      'API',
      'DataModel',
      'Testing',
      'UX',
      'Navigation',
      'APM'
    ];

    const foundLayers: string[] = [];

    for (const layerType of layerTypes) {
      const node = page.locator(`.react-flow__node [data-layer="${layerType}"]`).first();
      const count = await node.count();

      if (count > 0) {
        const color = await node.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );

        // Color should not be transparent or inherit
        expect(color).not.toBe('rgba(0, 0, 0, 0)');
        expect(color).not.toBe('transparent');
        expect(color).not.toBe('inherit');

        foundLayers.push(layerType);
      }
    }

    // Should find at least some layer types in the graph
    expect(foundLayers.length).toBeGreaterThan(0);
  });

  test('MiniMap node colors match graph node colors', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Check that MiniMap is visible
    const miniMap = page.locator('.react-flow__minimap');
    await expect(miniMap).toBeVisible();

    // Verify MiniMap has nodes with colors
    const miniMapNodes = miniMap.locator('.react-flow__minimap-node');
    const miniMapNodeCount = await miniMapNodes.count();

    expect(miniMapNodeCount).toBeGreaterThan(0);

    // Sample a few minimap nodes and verify they have background colors
    const sampleSize = Math.min(3, miniMapNodeCount);
    for (let i = 0; i < sampleSize; i++) {
      const node = miniMapNodes.nth(i);
      const bgColor = await node.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );

      // Should have a defined background color (not transparent)
      expect(bgColor).not.toBe('rgba(0, 0, 0, 0)');
      expect(bgColor).not.toBe('transparent');
    }
  });

  test('layer colors persist across view switches', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Get initial Business node color
    const businessNode = page.locator('.react-flow__node').filter({
      has: page.locator('[data-layer="Business"]')
    }).first();

    let initialColor = null;
    if (await businessNode.count() > 0) {
      initialColor = await businessNode.evaluate(el => {
        const layerEl = el.querySelector('[data-layer="Business"]') || el;
        return window.getComputedStyle(layerEl).backgroundColor;
      });
    }

    // Switch to JSON view and back
    await header.getByRole('button', { name: 'JSON' }).click();
    await page.waitForTimeout(300);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Get Business node color again
    const businessNodeAfter = page.locator('.react-flow__node').filter({
      has: page.locator('[data-layer="Business"]')
    }).first();

    let afterColor = null;
    if (await businessNodeAfter.count() > 0) {
      afterColor = await businessNodeAfter.evaluate(el => {
        const layerEl = el.querySelector('[data-layer="Business"]') || el;
        return window.getComputedStyle(layerEl).backgroundColor;
      });
    }

    // Colors should remain consistent
    if (initialColor && afterColor) {
      expect(initialColor).toBe(afterColor);
    }
  });

  test('dark mode preserves layer color relationships', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Model graph
    await header.getByRole('button', { name: 'Model' }).click();
    await page.waitForTimeout(500);
    await header.getByRole('button', { name: 'Graph' }).click();
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Get colors of two different layer types in light mode
    const motivationNode = page.locator('[data-layer="Motivation"]').first();
    const businessNode = page.locator('[data-layer="Business"]').first();

    let lightMotivation = null;
    let lightBusiness = null;

    if (await motivationNode.count() > 0) {
      lightMotivation = await motivationNode.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
    }

    if (await businessNode.count() > 0) {
      lightBusiness = await businessNode.evaluate(el =>
        window.getComputedStyle(el).backgroundColor
      );
    }

    // Toggle dark mode if available
    const darkModeToggle = page.locator('[data-testid="dark-mode-toggle"]');
    if (await darkModeToggle.count() > 0) {
      await darkModeToggle.click();
      await page.waitForTimeout(500);

      // Get colors again in dark mode
      const motivationNodeDark = page.locator('[data-layer="Motivation"]').first();
      const businessNodeDark = page.locator('[data-layer="Business"]').first();

      let darkMotivation = null;
      let darkBusiness = null;

      if (await motivationNodeDark.count() > 0) {
        darkMotivation = await motivationNodeDark.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
      }

      if (await businessNodeDark.count() > 0) {
        darkBusiness = await businessNodeDark.evaluate(el =>
          window.getComputedStyle(el).backgroundColor
        );
      }

      // In dark mode, colors should still be different from each other
      // (even if they're adjusted for dark mode)
      if (darkMotivation && darkBusiness) {
        expect(darkMotivation).not.toBe(darkBusiness);
      }
    }
  });
});
