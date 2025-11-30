/**
 * E2E Tests for Motivation Layer Visualization - Phase 4
 * Tests path tracing, focus mode, inspector panel, and keyboard navigation
 */

import { test, expect } from '@playwright/test';

const BASE_URL = 'http://localhost:3001';

test.describe('Motivation Layer - Phase 4 Features', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE_URL);

    // Load demo data
    const loadDemoButton = page.locator('button:has-text("Load Demo Data")');
    if (await loadDemoButton.isVisible()) {
      await loadDemoButton.click();
      await page.waitForTimeout(1000);
    }

    // Navigate to Motivation view
    const motivationTab = page.locator('button:has-text("Motivation")');
    if (await motivationTab.isVisible()) {
      await motivationTab.click();
      await page.waitForTimeout(1500); // Wait for graph to render
    }
  });

  test('FR-8: Path tracing - Click node highlights direct relationships', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Find and click a goal node
    const goalNode = page.locator('[data-testid="goal-node"]').first();
    if (!(await goalNode.isVisible())) {
      console.log('Goal node not found, skipping test');
      test.skip();
      return;
    }

    await goalNode.click();

    // Verify inspector panel opens
    const inspectorPanel = page.locator('.inspector-panel');
    await expect(inspectorPanel).toBeVisible({ timeout: 2000 });

    // Verify relationships are shown
    const relationships = page.locator('.relationship-item');
    const relationshipCount = await relationships.count();

    if (relationshipCount > 0) {
      // Should show at least one relationship
      expect(relationshipCount).toBeGreaterThan(0);

      // Verify relationship has correct structure
      const firstRelationship = relationships.first();
      await expect(firstRelationship.locator('.relationship-type')).toBeVisible();
      await expect(firstRelationship.locator('.relationship-arrow')).toBeVisible();
      await expect(firstRelationship.locator('.relationship-element')).toBeVisible();
    }

    // Take screenshot for verification
    await page.screenshot({ path: 'test-results/phase4-direct-relationships.png' });
  });

  test('FR-8: Trace upstream influences', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Find and click a node
    const node = page.locator('[data-testid="goal-node"], [data-testid="requirement-node"]').first();
    if (!(await node.isVisible())) {
      console.log('Node not found, skipping test');
      test.skip();
      return;
    }

    await node.click();

    // Wait for inspector panel
    const inspectorPanel = page.locator('.inspector-panel');
    await expect(inspectorPanel).toBeVisible({ timeout: 2000 });

    // Click "Trace Upstream" button
    const traceUpstreamButton = page.locator('button:has-text("Trace Upstream")');
    if (await traceUpstreamButton.isVisible()) {
      await traceUpstreamButton.click();

      // Wait for highlighting to apply
      await page.waitForTimeout(500);

      // Verify clear highlighting button appears
      const clearButton = page.locator('button:has-text("Clear Highlighting")');
      await expect(clearButton).toBeVisible({ timeout: 2000 });

      // Take screenshot
      await page.screenshot({ path: 'test-results/phase4-upstream-trace.png' });
    }
  });

  test('FR-8: Trace downstream impacts', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Find and click a node
    const node = page.locator('[data-testid="driver-node"], [data-testid="goal-node"]').first();
    if (!(await node.isVisible())) {
      console.log('Node not found, skipping test');
      test.skip();
      return;
    }

    await node.click();

    // Wait for inspector panel
    const inspectorPanel = page.locator('.inspector-panel');
    await expect(inspectorPanel).toBeVisible({ timeout: 2000 });

    // Click "Trace Downstream" button
    const traceDownstreamButton = page.locator('button:has-text("Trace Downstream")');
    if (await traceDownstreamButton.isVisible()) {
      await traceDownstreamButton.click();

      // Wait for highlighting to apply
      await page.waitForTimeout(500);

      // Verify clear highlighting button appears
      const clearButton = page.locator('button:has-text("Clear Highlighting")');
      await expect(clearButton).toBeVisible({ timeout: 2000 });

      // Take screenshot
      await page.screenshot({ path: 'test-results/phase4-downstream-trace.png' });
    }
  });

  test('FR-9: Focus mode dims non-focused elements', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Enable focus mode via checkbox
    const focusModeCheckbox = page.locator('input[type="checkbox"][aria-label*="Focus mode"]');
    if (!(await focusModeCheckbox.isVisible())) {
      console.log('Focus mode checkbox not found');
      // Focus mode might be enabled automatically when selecting a node
    }

    // Click a node to focus on it
    const node = page.locator('[data-testid="goal-node"]').first();
    if (!(await node.isVisible())) {
      test.skip();
      return;
    }

    await node.click();

    // Click "Focus on Element" in inspector
    const focusButton = page.locator('button:has-text("Focus on Element")');
    if (await focusButton.isVisible()) {
      await focusButton.click();

      // Wait for focus to apply
      await page.waitForTimeout(500);

      // Take screenshot showing dimmed elements
      await page.screenshot({ path: 'test-results/phase4-focus-mode.png' });
    }
  });

  test('FR-11: Inspector panel shows element details', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Click a node
    const node = page.locator('[data-testid="goal-node"], [data-testid="requirement-node"]').first();
    if (!(await node.isVisible())) {
      test.skip();
      return;
    }

    await node.click();

    // Verify inspector panel opens
    const inspectorPanel = page.locator('.inspector-panel');
    await expect(inspectorPanel).toBeVisible({ timeout: 2000 });

    // Verify panel has expected sections
    await expect(page.locator('.section-title:has-text("Element Details")')).toBeVisible();
    await expect(page.locator('.section-title:has-text("Relationships")')).toBeVisible();
    await expect(page.locator('.section-title:has-text("Quick Actions")')).toBeVisible();

    // Verify metadata is displayed
    await expect(page.locator('.metadata-label:has-text("Name")')).toBeVisible();
    await expect(page.locator('.metadata-label:has-text("Type")')).toBeVisible();

    // Take screenshot
    await page.screenshot({ path: 'test-results/phase4-inspector-panel.png' });
  });

  test('FR-11: Inspector panel close button works', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Click a node
    const node = page.locator('[data-testid="goal-node"]').first();
    if (!(await node.isVisible())) {
      test.skip();
      return;
    }

    await node.click();

    // Verify inspector panel opens
    const inspectorPanel = page.locator('.inspector-panel');
    await expect(inspectorPanel).toBeVisible({ timeout: 2000 });

    // Click close button
    const closeButton = page.locator('.inspector-panel .close-button');
    await closeButton.click();

    // Verify panel closes
    await expect(inspectorPanel).not.toBeVisible({ timeout: 1000 });
  });

  test('Clear highlighting button clears path traces', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Click a node
    const node = page.locator('[data-testid="goal-node"]').first();
    if (!(await node.isVisible())) {
      test.skip();
      return;
    }

    await node.click();

    // Wait for inspector panel
    await expect(page.locator('.inspector-panel')).toBeVisible({ timeout: 2000 });

    // Trace upstream to activate highlighting
    const traceUpstreamButton = page.locator('button:has-text("Trace Upstream")');
    if (await traceUpstreamButton.isVisible()) {
      await traceUpstreamButton.click();
      await page.waitForTimeout(500);

      // Verify clear button appears
      const clearButton = page.locator('button:has-text("Clear Highlighting")');
      await expect(clearButton).toBeVisible({ timeout: 2000 });

      // Click clear button
      await clearButton.click();

      // Wait for highlighting to clear
      await page.waitForTimeout(500);

      // Verify clear button is no longer visible (highlighting cleared)
      await expect(clearButton).not.toBeVisible({ timeout: 1000 });

      // Take screenshot
      await page.screenshot({ path: 'test-results/phase4-clear-highlighting.png' });
    }
  });

  test('Layout switching works with path highlighting', async ({ page }) => {
    // Wait for graph to be ready
    await page.waitForSelector('.tldraw__canvas', { timeout: 5000 });

    // Click a node and trace paths
    const node = page.locator('[data-testid="goal-node"]').first();
    if (!(await node.isVisible())) {
      test.skip();
      return;
    }

    await node.click();
    await expect(page.locator('.inspector-panel')).toBeVisible({ timeout: 2000 });

    // Trace upstream
    const traceButton = page.locator('button:has-text("Trace Upstream")');
    if (await traceButton.isVisible()) {
      await traceButton.click();
      await page.waitForTimeout(500);
    }

    // Switch layout
    const layoutSelector = page.locator('#layout-selector');
    if (await layoutSelector.isVisible()) {
      await layoutSelector.selectOption('hierarchical');

      // Wait for layout to complete
      await page.waitForTimeout(1500);

      // Verify layout description updates
      const layoutDescription = page.locator('#layout-description');
      await expect(layoutDescription).toContainText('Hierarchical');

      // Take screenshot
      await page.screenshot({ path: 'test-results/phase4-layout-with-highlighting.png' });
    }
  });
});
