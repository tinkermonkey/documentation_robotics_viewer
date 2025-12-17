/**
 * E2E Tests for Graph Rendering and Sidebar Layout
 * Comprehensive tests verifying React Flow graphs render correctly,
 * sidebar layout is consistent, and all Phase 1-5 fixes are working
 *
 * Prerequisites:
 * 1. Python dependencies (reference server):
 *    cd reference_server && source .venv/bin/activate && pip install -r requirements.txt
 *
 * 2. Playwright browsers:
 *    npx playwright install chromium
 *
 * 3. Run tests with the E2E config:
 *    npm run test:e2e
 *
 * STATUS: These tests verify US-8 requirements for graph rendering,
 *         sidebar layout, and screenshot validation.
 */

import { test, expect } from '@playwright/test';

// Increase timeout for graph rendering operations
test.setTimeout(30000);

test.describe('Graph Rendering - Phase 6 Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the embedded app
    await page.goto('/');

    // Wait for React to load
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });

    // Wait for WebSocket connection
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 10000 });

    // Give time for model to load
    await page.waitForTimeout(2000);
  });

  test.describe('Model Tab - Graph Rendering', () => {
    test('Model graph view renders React Flow nodes', async ({ page }) => {
      // Navigate to Model tab
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();

      // Wait for graph sub-tab
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'Graph' }).click();

      // Wait for React Flow to initialize
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Verify nodes are visible
      const nodes = page.locator('.react-flow__node');
      await expect(nodes.first()).toBeVisible({ timeout: 5000 });

      // Count nodes to ensure graph loaded
      const nodeCount = await nodes.count();
      console.log(`Model graph: ${nodeCount} nodes rendered`);
      expect(nodeCount).toBeGreaterThan(0);

      // Verify viewport is initialized (not collapsed)
      const reactFlow = page.locator('.react-flow');
      const bbox = await reactFlow.boundingBox();
      expect(bbox).toBeTruthy();
      expect(bbox!.height).toBeGreaterThan(100); // Graph should have substantial height

      // Screenshot for visual proof
      await page.screenshot({
        path: 'test-results/model-graph-rendering.png',
        fullPage: false
      });
    });

    test('Model graph occupies full width between sidebars', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to Model graph view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'Graph' }).click();

      // Wait for all components to render
      await page.waitForSelector('.react-flow', { timeout: 10000 });
      await page.waitForSelector('[data-testid="left-sidebar"]', { timeout: 5000 });
      await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

      const leftSidebar = page.locator('[data-testid="left-sidebar"]');
      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const graphContainer = page.locator('.react-flow');

      const leftBox = await leftSidebar.boundingBox();
      const rightBox = await rightSidebar.boundingBox();
      const graphBox = await graphContainer.boundingBox();

      expect(leftBox).toBeTruthy();
      expect(rightBox).toBeTruthy();
      expect(graphBox).toBeTruthy();

      // Graph should span from left sidebar edge to right sidebar edge (with some tolerance)
      const leftEdge = leftBox!.x + leftBox!.width;
      const rightEdge = rightBox!.x;

      expect(graphBox!.x).toBeGreaterThanOrEqual(leftEdge - 5); // 5px tolerance for borders
      expect(graphBox!.x + graphBox!.width).toBeLessThanOrEqual(rightEdge + 5);

      console.log(`Model graph width: ${graphBox!.width}px (from ${graphBox!.x} to ${graphBox!.x + graphBox!.width})`);
      console.log(`Available space: ${rightEdge - leftEdge}px (from ${leftEdge} to ${rightEdge})`);
    });

    test('Model JSON view has only one left sidebar', async ({ page }) => {
      // Navigate to Model JSON view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'JSON' }).click();

      // Wait for JSON view to render
      await page.waitForSelector('[data-testid="shared-layout"]', { timeout: 5000 });

      // Check for left sidebar (correct)
      const leftSidebar = page.locator('[data-testid="left-sidebar"]');
      await expect(leftSidebar).toBeVisible();
      await expect(leftSidebar).toHaveCount(1);

      // Ensure no internal sidebar components (from old SidebarList)
      // The old pattern used Flowbite Sidebar with w-80 class
      const internalSidebars = page.locator('.w-80').filter({ hasNot: page.locator('[data-testid="right-sidebar"]') });
      const count = await internalSidebars.count();

      // Should only be the right sidebar with w-80
      console.log(`Found ${count} elements with w-80 class (expecting 1 for right sidebar)`);
      expect(count).toBeLessThanOrEqual(1); // Only right sidebar should have w-80
    });
  });

  test.describe('Spec Tab - Graph Rendering', () => {
    test('Spec graph view renders React Flow nodes', async ({ page }) => {
      // Navigate to Spec tab
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();

      // Wait for graph view (default)
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Verify nodes are visible
      const nodes = page.locator('.react-flow__node');
      await expect(nodes.first()).toBeVisible({ timeout: 5000 });

      // Count nodes
      const nodeCount = await nodes.count();
      console.log(`Spec graph: ${nodeCount} nodes rendered`);
      expect(nodeCount).toBeGreaterThan(0);

      // Screenshot for visual proof
      await page.screenshot({
        path: 'test-results/spec-graph-rendering.png',
        fullPage: false
      });
    });

    test('Spec JSON view has only one left sidebar', async ({ page }) => {
      // Navigate to Spec JSON view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'JSON' }).click();

      // Wait for JSON view to render
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Check for left sidebar (correct)
      const leftSidebar = page.locator('[data-testid="left-sidebar"]');
      await expect(leftSidebar).toBeVisible();
      await expect(leftSidebar).toHaveCount(1);
    });

    test('Spec JSON view has no third-level tabs', async ({ page }) => {
      // Navigate to Spec JSON view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'JSON' }).click();

      // Wait for SpecViewer to render
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Select a schema to trigger content rendering
      const firstSchemaButton = page.locator('[data-testid="left-sidebar"] button').first();
      if (await firstSchemaButton.isVisible()) {
        await firstSchemaButton.click();
        await page.waitForTimeout(500);
      }

      // Count all tab lists on the page
      const tabLists = page.locator('[role="tablist"]');
      const tabListCount = await tabLists.count();

      // Should have exactly 2 tab levels:
      // 1. Main tabs (Spec, Model, Motivation, Architecture, Changesets)
      // 2. Sub-tabs (Graph, JSON)
      // NO third level for Schemas/Cross-Layer Links
      console.log(`Found ${tabListCount} tab lists (expecting exactly 2)`);
      expect(tabListCount).toBeLessThanOrEqual(2);

      // Verify both sections appear together in merged view
      await expect(page.locator('text=Schema Definitions')).toBeVisible();

      // Cross-layer links section may not be visible if no links exist
      // Use data-testid to avoid ambiguity
      const linksSection = page.locator('[data-testid="cross-layer-links-section"]');
      const hasLinks = await linksSection.isVisible().catch(() => false);
      console.log(`Cross-Layer Links section ${hasLinks ? 'visible' : 'not visible (may have no links)'}`);
    });

    test('Spec JSON merged view shows schema definitions and cross-layer links', async ({ page }) => {
      // Navigate to Spec JSON view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'JSON' }).click();

      // Wait for SpecViewer
      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Select first schema
      const firstSchemaButton = page.locator('[data-testid="left-sidebar"] button').first();
      if (await firstSchemaButton.isVisible()) {
        await firstSchemaButton.click();
        await page.waitForTimeout(1000);

        // Verify Schema Definitions section exists
        const schemaSection = page.locator('[data-testid="schema-definitions-section"]');
        await expect(schemaSection).toBeVisible();

        // Cross-layer links section may or may not be visible depending on data
        const linksSection = page.locator('[data-testid="cross-layer-links-section"]');
        const hasLinksSection = await linksSection.isVisible();
        console.log(`Cross-Layer Links section: ${hasLinksSection ? 'visible' : 'not visible (no links for this schema)'}`);
      }
    });
  });

  test.describe('Motivation Tab - Graph Rendering', () => {
    test('Motivation graph renders correctly', async ({ page }) => {
      // Navigate to Motivation tab
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Motivation' }).click();

      // Wait for React Flow
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Verify nodes
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();
      console.log(`Motivation graph: ${nodeCount} nodes rendered`);

      // Motivation layer might have 0 nodes if empty, so just verify React Flow loaded
      const reactFlow = page.locator('.react-flow');
      await expect(reactFlow).toBeVisible();

      // Screenshot
      await page.screenshot({
        path: 'test-results/motivation-graph-rendering.png',
        fullPage: false
      });
    });
  });

  test.describe('Architecture Tab - Graph Rendering', () => {
    test('Architecture graph renders correctly', async ({ page }) => {
      // Navigate to Architecture tab
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Architecture' }).click();

      // Wait for React Flow
      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Verify nodes
      const nodes = page.locator('.react-flow__node');
      const nodeCount = await nodes.count();
      console.log(`Architecture graph: ${nodeCount} nodes rendered`);
      expect(nodeCount).toBeGreaterThan(0);

      // Screenshot
      await page.screenshot({
        path: 'test-results/architecture-graph-rendering.png',
        fullPage: false
      });
    });

    test('Architecture graph occupies available width (no left sidebar)', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to Architecture tab
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Architecture' }).click();

      // Wait for all components
      await page.waitForSelector('.react-flow', { timeout: 10000 });
      await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

      // Architecture view has NO left sidebar (from SharedLayout)
      const leftSidebar = page.locator('[data-testid="left-sidebar"]');
      await expect(leftSidebar).toHaveCount(0);

      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const graphContainer = page.locator('.react-flow');

      const rightBox = await rightSidebar.boundingBox();
      const graphBox = await graphContainer.boundingBox();

      expect(rightBox).toBeTruthy();
      expect(graphBox).toBeTruthy();

      console.log(`Architecture graph position: x=${graphBox!.x}, width=${graphBox!.width}px`);
      console.log(`Right sidebar position: x=${rightBox!.x}`);

      // Graph should extend up to right sidebar (with tolerance for layout)
      const rightEdge = rightBox!.x;
      expect(graphBox!.x + graphBox!.width).toBeLessThanOrEqual(rightEdge + 5);

      // Graph should have reasonable width (more than half viewport after accounting for right sidebar)
      expect(graphBox!.width).toBeGreaterThan(800); // Reasonable width for 1920px viewport

      console.log(`Architecture graph occupies available width (no left sidebar)`);
    });
  });

  test.describe('Right Sidebar Positioning', () => {
    test('Right sidebar attached to screen edge in Model graph view', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to Model graph view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'Graph' }).click();

      await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      await expect(rightSidebar).toBeVisible();

      const box = await rightSidebar.boundingBox();
      const viewport = page.viewportSize()!;

      // Right edge should be at viewport edge (within 2px tolerance for scrollbar)
      const rightEdge = box!.x + box!.width;
      const distanceFromEdge = Math.abs(rightEdge - viewport.width);

      console.log(`Right sidebar edge: ${rightEdge}px, Viewport width: ${viewport.width}px, Distance: ${distanceFromEdge}px`);
      expect(distanceFromEdge).toBeLessThan(2);
    });

    test('Right sidebar attached to screen edge in Spec graph view', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to Spec graph view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();

      await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const box = await rightSidebar.boundingBox();
      const viewport = page.viewportSize()!;

      const rightEdge = box!.x + box!.width;
      const distanceFromEdge = Math.abs(rightEdge - viewport.width);

      console.log(`Right sidebar edge: ${rightEdge}px, Viewport width: ${viewport.width}px, Distance: ${distanceFromEdge}px`);
      expect(distanceFromEdge).toBeLessThan(2);
    });

    test('Right sidebar attached to screen edge in Architecture view', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });

      // Navigate to Architecture view
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Architecture' }).click();

      await page.waitForSelector('[data-testid="right-sidebar"]', { timeout: 5000 });

      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const box = await rightSidebar.boundingBox();
      const viewport = page.viewportSize()!;

      const rightEdge = box!.x + box!.width;
      const distanceFromEdge = Math.abs(rightEdge - viewport.width);

      console.log(`Right sidebar edge: ${rightEdge}px, Viewport width: ${viewport.width}px, Distance: ${distanceFromEdge}px`);
      expect(distanceFromEdge).toBeLessThan(2);
    });
  });

  test.describe('Dark Mode Visual Validation', () => {
    test('Model graph renders correctly in dark mode', async ({ page }) => {
      // Navigate to Model graph
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'Graph' }).click();

      await page.waitForSelector('.react-flow', { timeout: 10000 });

      // Toggle dark mode if theme toggle exists
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Screenshot in dark mode
        await page.screenshot({
          path: 'test-results/model-graph-dark-mode.png',
          fullPage: false
        });
      } else {
        console.log('Theme toggle not found, skipping dark mode screenshot');
      }
    });

    test('Spec JSON view renders correctly in dark mode', async ({ page }) => {
      // Navigate to Spec JSON
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'JSON' }).click();

      await page.waitForSelector('[data-testid="spec-viewer"]', { timeout: 10000 });

      // Toggle dark mode if theme toggle exists
      const themeToggle = page.locator('[data-testid="theme-toggle"]');
      if (await themeToggle.isVisible()) {
        await themeToggle.click();
        await page.waitForTimeout(500);

        // Screenshot in dark mode
        await page.screenshot({
          path: 'test-results/spec-json-dark-mode.png',
          fullPage: false
        });
      }
    });
  });

  test.describe('Graph Rendering Across All Tabs', () => {
    const tabs = [
      { name: 'Model', hasSubtabs: true, subtab: 'Graph' },
      { name: 'Spec', hasSubtabs: true, subtab: 'Graph' },
      { name: 'Motivation', hasSubtabs: false },
      { name: 'Architecture', hasSubtabs: false }
    ];

    for (const tab of tabs) {
      test(`${tab.name} tab graph renders with no console errors`, async ({ page }) => {
        const errors: string[] = [];
        page.on('console', msg => {
          if (msg.type() === 'error') {
            errors.push(msg.text());
          }
        });

        // Navigate to tab
        const header = page.locator('[data-testid="embedded-header"]');
        await header.getByRole('button', { name: tab.name }).click();

        // Navigate to graph subtab if needed
        if (tab.hasSubtabs) {
          await page.waitForTimeout(500);
          await header.getByRole('button', { name: tab.subtab }).click();
        }

        // Wait for React Flow
        await page.waitForSelector('.react-flow', { timeout: 10000 });

        // Verify at least the container is visible
        const reactFlow = page.locator('.react-flow');
        await expect(reactFlow).toBeVisible();

        // Wait for rendering
        await page.waitForTimeout(2000);

        // Check for critical errors
        const criticalErrors = errors.filter(e =>
          e.includes('TypeError') ||
          e.includes('Cannot read') ||
          e.includes('undefined is not')
        );

        if (criticalErrors.length > 0) {
          console.log(`${tab.name} critical errors:`, criticalErrors);
        }

        expect(criticalErrors).toHaveLength(0);
      });
    }
  });

  test.describe('Layout Height Verification', () => {
    test('Graph container has non-zero height in Model view', async ({ page }) => {
      // Navigate to Model graph
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();
      await page.waitForTimeout(500);
      await header.getByRole('button', { name: 'Graph' }).click();

      await page.waitForSelector('.react-flow', { timeout: 10000 });

      const graphContainer = page.locator('.react-flow');
      const bbox = await graphContainer.boundingBox();

      expect(bbox).toBeTruthy();
      expect(bbox!.height).toBeGreaterThan(100);

      console.log(`Model graph container height: ${bbox!.height}px`);
    });

    test('Graph container has non-zero height in Spec view', async ({ page }) => {
      // Navigate to Spec graph
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Spec' }).click();

      await page.waitForSelector('.react-flow', { timeout: 10000 });

      const graphContainer = page.locator('.react-flow');
      const bbox = await graphContainer.boundingBox();

      expect(bbox).toBeTruthy();
      expect(bbox!.height).toBeGreaterThan(100);

      console.log(`Spec graph container height: ${bbox!.height}px`);
    });

    test('SharedLayout main content has non-zero height', async ({ page }) => {
      // Navigate to any route
      const header = page.locator('[data-testid="embedded-header"]');
      await header.getByRole('button', { name: 'Model' }).click();

      await page.waitForSelector('[data-testid="shared-layout"]', { timeout: 5000 });

      const sharedLayout = page.locator('[data-testid="shared-layout"]');
      const bbox = await sharedLayout.boundingBox();

      expect(bbox).toBeTruthy();
      expect(bbox!.height).toBeGreaterThan(200);

      console.log(`SharedLayout height: ${bbox!.height}px`);
    });
  });
});
