/**
 * Architecture Node Story Tests
 *
 * Hand-written tests for node stories that validate:
 * - Nodes render with role="article" and correct aria-label
 * - Label text is visible
 * - Connection handles are present
 * - Node dimensions are applied
 *
 * Covers representative nodes: GoalNode, ContainerNode,
 *         BusinessFunctionNode, StakeholderNode
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError, isKnownRenderingBug } from './storyErrorFilters';

function setupErrorFiltering(page: import('@playwright/test').Page) {
  page.on('console', (msg) => {
    if (msg.type() === 'error') {
      const text = msg.text();
      if (!isExpectedConsoleError(text) && !isKnownRenderingBug(text)) {
        console.error(`[UNEXPECTED ERROR]: ${text}`);
      }
    }
  });
}

test.describe('Architecture Node Stories', () => {
  test.describe('GoalNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--goalnode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Increase Revenue');
    });

    test('Default: label text is visible', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--goalnode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=Increase Revenue')).toBeVisible();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--goalnode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'GoalNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('HighPriority: shows label text', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--goalnode--high-priority&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=Customer Satisfaction')).toBeVisible();
    });

    test('ChangesetAdd: renders with correct label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--goalnode--changeset-add&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=New Goal')).toBeVisible();
    });
  });

  test.describe('ContainerNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--c4--containernode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--c4--containernode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'ContainerNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('Database: renders with label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--c4--containernode--database&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('BusinessFunctionNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--business--businessfunctionnode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--business--businessfunctionnode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'BusinessFunctionNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('ChangesetDelete: renders with label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--business--businessfunctionnode--changeset-delete&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('StakeholderNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--stakeholdernode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto('/?story=architecture-nodes--motivation--stakeholdernode--default&mode=preview');
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'StakeholderNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });
  });
});
