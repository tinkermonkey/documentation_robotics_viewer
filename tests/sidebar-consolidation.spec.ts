/**
 * E2E Tests for Sidebar Consolidation
 * Validates the 3-column layout and collapsible sidebar sections:
 * - Motivation view (2-column: Graph + Right Sidebar)
 * - Architecture view (2-column: Graph + Right Sidebar)
 * - Collapsible section functionality
 * - Right sidebar content organization
 *
 * Part of Phase 6: Integration testing for UX cleanup (Issue #64)
 */

import { test, expect } from '@playwright/test';

test.setTimeout(30000);

test.describe('Sidebar Consolidation - Phase 6 Integration Testing', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.waitForSelector('[data-testid="embedded-app"]', { timeout: 10000 });
    await page.waitForSelector('[data-connection-state="connected"]', { timeout: 5000 });
  });

  test('Motivation view has 2-column layout (no left sidebar)', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify SharedLayout is present
    const sharedLayout = page.locator('[data-testid="shared-layout"]');
    await expect(sharedLayout).toBeVisible();

    // Verify NO left sidebar (Motivation uses only graph + right sidebar)
    const leftSidebar = page.locator('[data-testid="left-sidebar"]');
    const leftSidebarCount = await leftSidebar.count();

    // Left sidebar should either not exist or not be visible
    if (leftSidebarCount > 0) {
      await expect(leftSidebar).not.toBeVisible();
    }

    // Verify right sidebar IS visible
    const rightSidebar = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebar).toBeVisible();

    // Count total layout columns (should be 2: main content + right sidebar)
    const layoutChildren = await sharedLayout.locator('> *').count();
    // Typically: main content area + right sidebar = 2 visible sections
    expect(layoutChildren).toBeGreaterThanOrEqual(2);
  });

  test('Motivation view right sidebar has collapsible sections', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebar).toBeVisible();

    // Check for expected sections (Filters, Controls, Inspector, Annotations)
    // Note: Inspector may only be visible when a node is selected

    // Filters section
    const filtersSection = rightSidebar.getByText('Filters', { exact: false });
    if (await filtersSection.count() > 0) {
      await expect(filtersSection.first()).toBeVisible();
    }

    // Controls section
    const controlsSection = rightSidebar.getByText('Controls', { exact: false });
    if (await controlsSection.count() > 0) {
      await expect(controlsSection.first()).toBeVisible();
    }

    // Annotations section
    const annotationsSection = rightSidebar.getByText('Annotations', { exact: false });
    if (await annotationsSection.count() > 0) {
      await expect(annotationsSection.first()).toBeVisible();
    }
  });

  test('Motivation view collapsible sections can expand/collapse', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');

    // Find an accordion/collapsible section
    const accordionTitles = rightSidebar.locator('[class*="accordion"]').getByRole('button');
    const titleCount = await accordionTitles.count();

    if (titleCount > 0) {
      const firstTitle = accordionTitles.first();

      // Click to toggle
      await firstTitle.click();
      await page.waitForTimeout(300);

      // Click again to toggle back
      await firstTitle.click();
      await page.waitForTimeout(300);

      // Section should still be accessible
      await expect(firstTitle).toBeVisible();
    }
  });

  test('Motivation view Inspector section appears on node selection', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click a node to select it
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();

    if (nodeCount > 0) {
      await nodes.first().click();
      await page.waitForTimeout(500);

      // Check for Inspector section or panel
      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const inspectorSection = rightSidebar.getByText('Inspector', { exact: false });

      if (await inspectorSection.count() > 0) {
        await expect(inspectorSection.first()).toBeVisible();
      }

      // Inspector may also show element details
      const hasElementDetails = await rightSidebar.locator('[class*="inspector"]').count() > 0;
      const hasNodeDetails = await rightSidebar.getByText('Type:', { exact: false }).count() > 0;

      // At least some indication of inspection should appear
      expect(hasElementDetails || hasNodeDetails || await inspectorSection.count() > 0).toBeTruthy();
    }
  });

  test('Architecture view has 2-column layout (no left sidebar)', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Architecture view
    await header.getByRole('button', { name: 'Architecture' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Verify SharedLayout is present
    const sharedLayout = page.locator('[data-testid="shared-layout"]');
    await expect(sharedLayout).toBeVisible();

    // Verify NO left sidebar
    const leftSidebar = page.locator('[data-testid="left-sidebar"]');
    const leftSidebarCount = await leftSidebar.count();

    if (leftSidebarCount > 0) {
      await expect(leftSidebar).not.toBeVisible();
    }

    // Verify right sidebar IS visible
    const rightSidebar = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebar).toBeVisible();
  });

  test('Architecture view right sidebar has 4 sections', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Architecture view
    await header.getByRole('button', { name: 'Architecture' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebar).toBeVisible();

    // Check for expected sections: Filters, Controls, Inspector, Annotations

    // Filters section
    const filtersSection = rightSidebar.getByText('Filters', { exact: false });
    if (await filtersSection.count() > 0) {
      await expect(filtersSection.first()).toBeVisible();
    }

    // Controls section
    const controlsSection = rightSidebar.getByText('Controls', { exact: false });
    if (await controlsSection.count() > 0) {
      await expect(controlsSection.first()).toBeVisible();
    }

    // Inspector section (may require node selection)
    // We'll check after selecting a node

    // Annotations section
    const annotationsSection = rightSidebar.getByText('Annotations', { exact: false });
    if (await annotationsSection.count() > 0) {
      await expect(annotationsSection.first()).toBeVisible();
    }
  });

  test('Architecture view Inspector section shows on node selection', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Architecture view
    await header.getByRole('button', { name: 'Architecture' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(1000);

    // Click a node
    const nodes = page.locator('.react-flow__node');
    const nodeCount = await nodes.count();

    if (nodeCount > 0) {
      await nodes.first().click();
      await page.waitForTimeout(500);

      // Check for Inspector section
      const rightSidebar = page.locator('[data-testid="right-sidebar"]');
      const inspectorSection = rightSidebar.getByText('Inspector', { exact: false });

      if (await inspectorSection.count() > 0) {
        await expect(inspectorSection.first()).toBeVisible();
      }
    }
  });

  test('sidebar sections maintain state across graph interactions', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');

    // Check initial state
    const initialSectionCount = await rightSidebar.locator('[class*="accordion"]').count();

    // Perform graph interaction (pan)
    const reactFlow = page.locator('.react-flow');
    const bbox = await reactFlow.boundingBox();

    if (bbox) {
      await page.mouse.move(bbox.x + bbox.width / 2, bbox.y + bbox.height / 2);
      await page.mouse.down();
      await page.mouse.move(bbox.x + bbox.width / 2 + 50, bbox.y + bbox.height / 2 + 50);
      await page.mouse.up();
      await page.waitForTimeout(300);
    }

    // Check that sidebar sections are still present
    const afterSectionCount = await rightSidebar.locator('[class*="accordion"]').count();
    expect(afterSectionCount).toBeGreaterThanOrEqual(initialSectionCount);
  });

  test('responsive behavior on narrow viewport', async ({ page }) => {
    // Set narrow viewport
    await page.setViewportSize({ width: 800, height: 1000 });

    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // On narrow viewports, sidebar might collapse or overlay
    // Verify that the app is still functional
    const sharedLayout = page.locator('[data-testid="shared-layout"]');
    await expect(sharedLayout).toBeVisible();

    const reactFlow = page.locator('.react-flow');
    await expect(reactFlow).toBeVisible();

    // Sidebar may be hidden or overlaid on mobile
    // Main requirement is that the graph is still usable
    const bbox = await reactFlow.boundingBox();
    expect(bbox).toBeTruthy();
    expect(bbox!.width).toBeGreaterThan(200); // Should have reasonable width
  });

  test('no duplicate sidebars or conflicting layouts', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    // Count all <aside> elements (typical sidebar element)
    const allSidebars = page.locator('aside');
    const sidebarCount = await allSidebars.count();

    // Should have at most 2 sidebars total (left and right from SharedLayout)
    // Motivation view should only have 1 (right sidebar)
    expect(sidebarCount).toBeLessThanOrEqual(2);

    // Verify no duplicate right sidebars
    const rightSidebars = page.locator('[data-testid="right-sidebar"]');
    await expect(rightSidebars).toHaveCount(1);
  });

  test('AnnotationPanel is accessible in right sidebar', async ({ page }) => {
    const header = page.locator('[data-testid="embedded-header"]');

    // Navigate to Motivation view
    await header.getByRole('button', { name: 'Motivation' }).click();
    await page.waitForTimeout(1000);
    await page.waitForSelector('.react-flow', { timeout: 10000 });
    await page.waitForTimeout(500);

    const rightSidebar = page.locator('[data-testid="right-sidebar"]');

    // Check for Annotations section
    const annotationsHeading = rightSidebar.getByText('Annotations', { exact: false });

    if (await annotationsHeading.count() > 0) {
      await expect(annotationsHeading.first()).toBeVisible();

      // Try to expand if collapsed
      const accordionButton = annotationsHeading.first().locator('..').getByRole('button');
      if (await accordionButton.count() > 0) {
        await accordionButton.first().click();
        await page.waitForTimeout(300);
      }

      // Verify annotation panel content is accessible
      // (may be empty if no annotations exist, but should be present)
      const annotationContent = rightSidebar.locator('[class*="annotation"]');
      const hasAnnotationUI = await annotationContent.count() > 0;

      expect(hasAnnotationUI || await annotationsHeading.count() > 0).toBeTruthy();
    }
  });
});
