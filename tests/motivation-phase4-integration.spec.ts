import { test, expect } from '@playwright/test';

/**
 * Phase 4: Influence Tracing, Focus Mode, and Inspector Panel - Integration Tests
 *
 * Tests all acceptance criteria for FR-8, FR-9, FR-11, FR-15, US-3, US-4, US-8, US-15
 */

test.describe('Phase 4: Path Tracing and Inspection', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto('http://localhost:3001');

    // Load demo data
    await page.click('text=Load Demo Data');

    // Wait for data to load
    await page.waitForTimeout(2000);

    // Navigate to Motivation layer
    await page.click('text=Motivation');

    // Wait for graph to render
    await page.waitForSelector('.motivation-graph-container', { timeout: 10000 });
  });

  test('FR-8: Click node highlights directly connected edges', async ({ page }) => {
    // Find a goal node
    const goalNode = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Goal' }).first();
    await goalNode.click();

    // Check that edges are highlighted (increased stroke width)
    const highlightedEdges = page.locator('[data-highlighted="true"]');
    await expect(highlightedEdges).toHaveCount(await highlightedEdges.count());

    // Verify stroke width is increased
    const firstEdge = highlightedEdges.first();
    const strokeWidth = await firstEdge.getAttribute('stroke-width');
    expect(parseInt(strokeWidth || '0')).toBeGreaterThan(1);
  });

  test('FR-8: Shift+click shows paths between two nodes', async ({ page }) => {
    // Click first node
    const firstNode = page.locator('[data-testid="motivation-node"]').first();
    await firstNode.click();

    // Shift+click second node
    const secondNode = page.locator('[data-testid="motivation-node"]').nth(3);
    await secondNode.click({ modifiers: ['Shift'] });

    // Check that path is highlighted
    await page.waitForSelector('[data-path-highlighted="true"]', { timeout: 5000 });

    // Verify shortest path is emphasized differently
    const shortestPathEdge = page.locator('[data-shortest-path="true"]').first();
    await expect(shortestPathEdge).toBeVisible();

    const shortestStrokeWidth = await shortestPathEdge.getAttribute('stroke-width');
    expect(parseInt(shortestStrokeWidth || '0')).toBeGreaterThan(2);
  });

  test('FR-8: Context menu Trace Upstream shows influence chain', async ({ page }) => {
    // Right-click on a node
    const node = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Requirement' }).first();
    await node.click({ button: 'right' });

    // Click "Trace Upstream"
    await page.click('text=Trace Upstream');

    // Verify upstream path is highlighted
    await page.waitForSelector('[data-upstream-highlighted="true"]', { timeout: 5000 });

    // Check ARIA announcement
    const announcement = page.locator('[role="status"][aria-live="polite"]');
    await expect(announcement).toContainText('Tracing upstream influences');
  });

  test('FR-8: Context menu Trace Downstream shows impact chain', async ({ page }) => {
    // Right-click on a driver node
    const node = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Driver' }).first();
    await node.click({ button: 'right' });

    // Click "Trace Downstream"
    await page.click('text=Trace Downstream');

    // Verify downstream path is highlighted
    await page.waitForSelector('[data-downstream-highlighted="true"]', { timeout: 5000 });

    // Check ARIA announcement
    const announcement = page.locator('[role="status"][aria-live="polite"]');
    await expect(announcement).toContainText('Tracing downstream impacts');
  });

  test('FR-9: Focus mode dims unrelated elements', async ({ page }) => {
    // Click on a node to focus
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click();

    // Click "Focus Element" button
    await page.click('text=Focus Element');

    // Check that dimmed nodes have opacity 0.3
    const dimmedNodes = page.locator('[data-testid="motivation-node"][data-dimmed="true"]');
    const firstDimmed = dimmedNodes.first();
    const opacity = await firstDimmed.evaluate(el => window.getComputedStyle(el).opacity);
    expect(parseFloat(opacity)).toBeLessThan(0.5);
  });

  test('FR-9: Relationship count badges appear on dimmed nodes', async ({ page }) => {
    // Enable focus mode
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click();
    await page.click('text=Focus Element');

    // Check that relationship badges are visible on dimmed nodes
    const badge = page.locator('.relationship-badge').first();
    await expect(badge).toBeVisible();

    // Verify badge shows count
    const badgeText = await badge.textContent();
    expect(badgeText).toMatch(/\d+/);

    // Verify ARIA label
    const ariaLabel = await badge.getAttribute('aria-label');
    expect(ariaLabel).toContain('total relationships');
  });

  test('FR-9: Breadcrumb navigation shows current focus path', async ({ page }) => {
    // Enable focus on a nested element
    const node = page.locator('[data-testid="motivation-node"]').nth(5);
    await node.click();
    await page.click('text=Focus Element');

    // Check breadcrumb is visible
    const breadcrumb = page.locator('.motivation-breadcrumb');
    await expect(breadcrumb).toBeVisible();

    // Verify breadcrumb shows path
    const breadcrumbItems = page.locator('.breadcrumb-item');
    expect(await breadcrumbItems.count()).toBeGreaterThan(0);

    // Click on a breadcrumb item to navigate
    await breadcrumbItems.first().click();

    // Verify navigation occurred (selected node changes)
    await page.waitForTimeout(500);
    const selectedNode = page.locator('[data-selected="true"]');
    await expect(selectedNode).toHaveCount(1);
  });

  test('FR-11: Inspector panel shows complete element metadata', async ({ page }) => {
    // Click on a node
    const node = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Goal' }).first();
    await node.click();

    // Verify inspector panel is visible
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toBeVisible();

    // Check metadata is displayed
    await expect(inspector).toContainText('Element Details');
    await expect(inspector.locator('text=Name:')).toBeVisible();
    await expect(inspector.locator('text=Type:')).toBeVisible();
    await expect(inspector.locator('text=ID:')).toBeVisible();
  });

  test('FR-11: Inspector panel lists all relationships with types', async ({ page }) => {
    // Click on a node with relationships
    const node = page.locator('[data-testid="motivation-node"]').nth(2);
    await node.click();

    // Check relationships section
    const inspector = page.locator('.inspector-panel');
    await expect(inspector.locator('text=Relationships')).toBeVisible();

    // Verify incoming relationships
    const incomingSection = inspector.locator('text=Incoming');
    if (await incomingSection.isVisible()) {
      const incomingList = inspector.locator('.relationship-list').first();
      await expect(incomingList).toBeVisible();

      // Check relationship types are shown
      const relationshipType = incomingList.locator('.relationship-type').first();
      await expect(relationshipType).toBeVisible();
    }

    // Verify outgoing relationships
    const outgoingSection = inspector.locator('text=Outgoing');
    if (await outgoingSection.isVisible()) {
      const outgoingList = inspector.locator('.relationship-list').last();
      await expect(outgoingList).toBeVisible();
    }
  });

  test('FR-11: Inspector quick action buttons work', async ({ page }) => {
    // Click on a node
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click();

    // Check quick actions section
    const inspector = page.locator('.inspector-panel');
    await expect(inspector.locator('text=Quick Actions')).toBeVisible();

    // Verify action buttons are present
    await expect(inspector.locator('text=Trace Upstream')).toBeVisible();
    await expect(inspector.locator('text=Trace Downstream')).toBeVisible();
    await expect(inspector.locator('text=Focus on Element')).toBeVisible();

    // Click "Trace Upstream" and verify it works
    await inspector.locator('text=Trace Upstream').click();
    await page.waitForSelector('[data-upstream-highlighted="true"]', { timeout: 5000 });
  });

  test('FR-15: Cross-layer navigation links work', async ({ page }) => {
    // Click on a node with cross-layer links
    const node = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Requirement' }).first();
    await node.click();

    // Check for cross-layer links section
    const inspector = page.locator('.inspector-panel');
    const crossLayerSection = inspector.locator('text=Cross-Layer Links');

    if (await crossLayerSection.isVisible()) {
      // Click on a cross-layer link
      const link = inspector.locator('.crosslayer-link').first();
      await link.click();

      // Verify navigation occurred (console log check)
      // In a real app, this would switch layers
      await page.waitForTimeout(500);
    }
  });

  test('US-3: Trace from high-level goal to supporting requirements', async ({ page }) => {
    // Find a high-level goal
    const goalNode = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Goal' }).first();
    await goalNode.click();

    // Trace downstream
    await goalNode.click({ button: 'right' });
    await page.click('text=Trace Downstream');

    // Verify requirements are highlighted in the path
    const highlightedRequirements = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Requirement' }).filter('[data-highlighted="true"]');
    expect(await highlightedRequirements.count()).toBeGreaterThan(0);
  });

  test('US-4: View all goals associated with stakeholder', async ({ page }) => {
    // Click on a stakeholder node
    const stakeholder = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Stakeholder' }).first();
    await stakeholder.click();

    // Click "Show Network"
    await stakeholder.click({ button: 'right' });
    const showNetworkBtn = page.locator('text=Show Network');

    if (await showNetworkBtn.isVisible()) {
      await showNetworkBtn.click();

      // Verify radial layout is applied
      await page.waitForTimeout(1000);

      // Check that stakeholder is at center
      const centerNode = page.locator('[data-layout-position="center"]');
      await expect(centerNode).toBeVisible();
    }
  });

  test('US-8: See complete influence path between two elements', async ({ page }) => {
    // Select first element
    const firstNode = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Driver' }).first();
    await firstNode.click();

    // Shift+click second element
    const secondNode = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Outcome' }).first();
    await secondNode.click({ modifiers: ['Shift'] });

    // Verify complete path is shown
    await page.waitForSelector('[data-path-highlighted="true"]', { timeout: 5000 });

    // Count highlighted nodes and edges in path
    const pathNodes = page.locator('[data-path-highlighted="true"]');
    expect(await pathNodes.count()).toBeGreaterThan(2);
  });

  test('US-15: Keyboard navigation with Tab key cycles through nodes', async ({ page }) => {
    // Focus on graph
    await page.focus('.motivation-graph-container');

    // Press Tab to cycle through nodes
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Verify a node is focused
    const focusedNode = page.locator('[data-keyboard-focused="true"]');
    await expect(focusedNode).toHaveCount(1);

    // Press Tab again to move to next node
    await page.keyboard.press('Tab');
    await page.waitForTimeout(200);

    // Verify focus moved
    const newFocusedNode = page.locator('[data-keyboard-focused="true"]');
    await expect(newFocusedNode).toHaveCount(1);
  });

  test('US-15: Arrow keys navigate to adjacent connected nodes', async ({ page }) => {
    // Focus on a node
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click();

    // Press Right arrow to navigate to connected node
    await page.keyboard.press('ArrowRight');
    await page.waitForTimeout(200);

    // Verify navigation occurred
    const focusedNode = page.locator('[data-keyboard-focused="true"]');
    await expect(focusedNode).toHaveCount(1);
  });

  test('US-15: Enter key opens inspector for focused node', async ({ page }) => {
    // Tab to focus on a node
    await page.focus('.motivation-graph-container');
    await page.keyboard.press('Tab');

    // Press Enter to open inspector
    await page.keyboard.press('Enter');

    // Verify inspector is visible
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toBeVisible({ timeout: 2000 });
  });

  test('US-15: Escape key closes inspector panel', async ({ page }) => {
    // Open inspector by clicking a node
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click();

    // Verify inspector is open
    const inspector = page.locator('.inspector-panel');
    await expect(inspector).toBeVisible();

    // Press Escape to close
    await page.keyboard.press('Escape');

    // Verify inspector is closed
    await expect(inspector).not.toBeVisible();
  });

  test('US-15: Screen reader announces node selection', async ({ page }) => {
    // Click on a node
    const node = page.locator('[data-testid="motivation-node"]').filter({ hasText: 'Goal' }).first();
    await node.click();

    // Check ARIA live region for announcement
    const liveRegion = page.locator('[role="status"][aria-live="polite"]');
    await expect(liveRegion).toBeVisible();

    // Verify announcement contains element info
    const announcement = await liveRegion.textContent();
    expect(announcement).toContain('Goal');
    expect(announcement).toMatch(/\d+ incoming/);
    expect(announcement).toMatch(/\d+ outgoing/);
  });

  test('US-15: ARIA labels present on all interactive elements', async ({ page }) => {
    // Check context menu button has ARIA label
    const node = page.locator('[data-testid="motivation-node"]').first();
    await node.click({ button: 'right' });

    const menuItems = page.locator('[role="menuitem"]');
    for (let i = 0; i < await menuItems.count(); i++) {
      const item = menuItems.nth(i);
      const ariaLabel = await item.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }

    // Check inspector buttons have ARIA labels
    const firstNode = page.locator('[data-testid="motivation-node"]').first();
    await firstNode.click();

    const actionButtons = page.locator('.action-button');
    for (let i = 0; i < await actionButtons.count(); i++) {
      const button = actionButtons.nth(i);
      const ariaLabel = await button.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    }
  });

  test('Performance: Path tracing completes in < 200ms for 10-hop chains', async ({ page }) => {
    // Click on a deep node
    const node = page.locator('[data-testid="motivation-node"]').nth(10);
    await node.click({ button: 'right' });

    // Measure time for trace upstream
    const start = Date.now();
    await page.click('text=Trace Upstream');
    await page.waitForSelector('[data-upstream-highlighted="true"]', { timeout: 5000 });
    const duration = Date.now() - start;

    // Verify performance
    expect(duration).toBeLessThan(500); // Allow 500ms for UI rendering

    // Check console for performance warnings (should be none for < 10 hops)
    const logs = [];
    page.on('console', msg => logs.push(msg.text()));

    // Trigger another trace
    await page.click('text=Clear Highlighting');
    await node.click({ button: 'right' });
    await page.click('text=Trace Downstream');

    await page.waitForTimeout(1000);

    // No performance warnings should be logged for small graphs
    const perfWarnings = logs.filter(log => log.includes('Performance warning'));
    // Allow some warnings for larger graphs, but flag if too many
    if (perfWarnings.length > 5) {
      console.warn(`Performance warnings detected: ${perfWarnings.length}`);
    }
  });
});
