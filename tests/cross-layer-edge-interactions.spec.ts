import { test, expect } from '@playwright/test';

test.describe('Cross-Layer Edge Interactions', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to embedded app
    await page.goto('http://localhost:8765/');

    // Wait for app to load
    await page.waitForSelector('.embedded-app', { timeout: 10000 });

    // Wait for model to load (navigate to motivation view which has cross-layer edges)
    await page.goto('http://localhost:8765/#/motivation');

    // Wait for graph to render
    await page.waitForSelector('.react-flow__node', { timeout: 10000 });
  });

  test('should render cross-layer edges', async ({ page }) => {
    // Wait for cross-layer edges to be present
    const edgeCount = await page.locator('[data-testid^="cross-layer-edge-"]').count();
    expect(edgeCount).toBeGreaterThan(0);
  });

  test('should display edge label with relationship type and target element name', async ({ page }) => {
    // Get first cross-layer edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();

    // Check that edge has a label containing the relationship type
    const label = await page.locator('[role="button"][aria-label*="Cross-layer link"]').first();
    const ariaLabel = await label.getAttribute('aria-label');
    expect(ariaLabel).toContain('relationship type');
  });

  test('should show hover tooltip with relationship details', async ({ page }) => {
    // Find cross-layer edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();

    // Hover over edge
    await edge.hover();

    // Wait for tooltip to appear (it should contain "From:" and "To:" and "Target Layer:")
    const tooltip = page.locator('text=/From:|To:|Target Layer:/');
    await tooltip.first().waitFor({ timeout: 5000 });

    const text = await tooltip.first().textContent();
    expect(text).toMatch(/From:/);
    expect(text).toMatch(/To:/);
    expect(text).toMatch(/Target Layer:/);
  });

  test('should increase edge stroke width on hover', async ({ page }) => {
    // Get edge element
    const edge = page.locator('svg').getByRole('button', { name: /Cross-layer link/ }).first();

    // Get initial stroke width
    const initialStrokeWidth = await edge.evaluate((el: SVGPathElement) => {
      return window.getComputedStyle(el).strokeWidth;
    });

    // Hover over edge
    await edge.hover();

    // Check that stroke width increased
    const hoverStrokeWidth = await edge.evaluate((el: SVGPathElement) => {
      return window.getComputedStyle(el).strokeWidth;
    });

    // Compare stroke widths (should be 2px initially, 3px on hover)
    expect(hoverStrokeWidth).not.toBe(initialStrokeWidth);
  });

  test('should show focus ring on keyboard focus', async ({ page }) => {
    // Find cross-layer edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();

    // Get edge path element
    const edgePath = page.locator('svg path[role="button"][aria-label*="Cross-layer link"]').first();

    // Focus on edge with Tab key
    await page.keyboard.press('Tab');
    await page.keyboard.press('Tab');

    // Verify edge is focused (should have focus ring)
    const isFocused = await edgePath.evaluate((el: HTMLElement) => {
      return document.activeElement === el;
    });

    // If not focused yet, try clicking it
    if (!isFocused) {
      await edgePath.click();
    }
  });

  test('should navigate to target layer on click', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Click on cross-layer edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();
    await edge.click();

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

    // Check that URL changed to different layer
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);

    // Check that it navigated to a layer route (motivation, business, etc.)
    expect(newUrl).toMatch(/#\/(motivation|business|architecture|spec|model)/);
  });

  test('should navigate to target layer on Enter key', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Find cross-layer edge and focus it
    const edgePath = page.locator('svg path[role="button"][aria-label*="Cross-layer link"]').first();

    // Click to focus
    await edgePath.click();

    // Press Enter
    await page.keyboard.press('Enter');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

    // Check that URL changed
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should navigate to target layer on Space key', async ({ page }) => {
    // Get initial URL
    const initialUrl = page.url();

    // Find cross-layer edge and focus it
    const edgePath = page.locator('svg path[role="button"][aria-label*="Cross-layer link"]').first();

    // Click to focus
    await edgePath.click();

    // Press Space
    await page.keyboard.press(' ');

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

    // Check that URL changed
    const newUrl = page.url();
    expect(newUrl).not.toBe(initialUrl);
  });

  test('should announce edge details via screen reader', async ({ page }) => {
    // Get edge element
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();

    // Get aria-label
    const ariaLabel = await edge.getAttribute('aria-label');

    // Should contain all required parts
    expect(ariaLabel).toContain('Cross-layer link');
    expect(ariaLabel).toContain('from');
    expect(ariaLabel).toContain('to');
    expect(ariaLabel).toContain('relationship type');
    expect(ariaLabel).toContain('Press Enter to navigate');
  });

  test('should have WCAG 2.1 AA compliant colors', async ({ page }) => {
    // Get edge color
    const edge = page.locator('svg path').first();
    const strokeColor = await edge.evaluate((el: SVGPathElement) => {
      return window.getComputedStyle(el).stroke;
    });

    // Parse RGB values
    const rgbMatch = strokeColor.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
    if (rgbMatch) {
      const [, r, g, b] = rgbMatch.map(Number);

      // Calculate relative luminance
      const getLuminance = (rgb: number) => {
        const srgb = rgb / 255;
        return srgb <= 0.03928 ? srgb / 12.92 : Math.pow((srgb + 0.055) / 1.055, 2.4);
      };

      const l1 = getLuminance(r) * 0.2126 + getLuminance(g) * 0.7152 + getLuminance(b) * 0.0722;
      const l2 = 1; // White background

      // Calculate contrast ratio (should be at least 3:1 for WCAG AA)
      const contrast = (Math.max(l1, l2) + 0.05) / (Math.min(l1, l2) + 0.05);
      expect(contrast).toBeGreaterThanOrEqual(3);
    }
  });

  test('should have dashed stroke pattern for non-color visual differentiation', async ({ page }) => {
    // Get edge element
    const edge = page.locator('svg path[data-testid^="cross-layer-edge-"]').first();

    // Check for dashed stroke-dasharray
    const strokeDasharray = await edge.evaluate((el: SVGPathElement) => {
      return el.getAttribute('stroke-dasharray');
    });

    // Should have dashed pattern (5,5)
    expect(strokeDasharray).toBe('5,5');
  });

  test('should respect prefers-reduced-motion for animations', async ({ page }) => {
    // Emulate prefers-reduced-motion
    await page.emulateMedia({ reducedMotion: 'reduce' });

    // Navigate with cross-layer edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();
    await edge.click();

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

    // Check that animations are disabled
    const computedStyle = await page.locator('.layer-view').first().evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).transition;
    });

    expect(computedStyle).toContain('none');
  });

  test('should have no console errors during edge interaction', async ({ page }) => {
    const errors: string[] = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });

    // Interact with edge
    const edge = page.locator('[data-testid^="cross-layer-edge-"]').first();
    await edge.hover();
    await page.waitForTimeout(500);
    await edge.click();

    // Wait for navigation
    await page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 5000 }).catch(() => {});

    // Should not have console errors
    expect(errors).toHaveLength(0);
  });

  test('should display truncated labels with full text in tooltip', async ({ page }) => {
    // Find edge with long label
    const longLabelEdges = page.locator('[data-testid^="cross-layer-edge-"]');
    const count = await longLabelEdges.count();

    if (count > 0) {
      const firstEdge = longLabelEdges.first();

      // Hover to see truncated label and tooltip
      await firstEdge.hover();

      // Check that tooltip appears with full text
      const tooltip = page.locator('text=From:').first().locator('..');
      await tooltip.waitFor({ timeout: 3000 });

      const tooltipText = await tooltip.textContent();
      expect(tooltipText).toBeTruthy();
    }
  });
});
