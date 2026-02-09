/**
 * Accessibility Story Tests
 *
 * Periodic accessibility validation using @axe-core/playwright.
 * NOT included in CI pipeline — run manually or on schedule:
 *   npm run test:stories:a11y
 *
 * Tests WCAG 2.1 AA compliance across story categories:
 * - Graph view stories (scoped to .react-flow)
 * - Panel stories (full page scan)
 * - Node stories (verify role="article" and aria-label)
 *
 * Note: color-contrast rule is disabled for React Flow elements
 * as they manage their own color scheme.
 */

import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
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

test.describe('Accessibility - Graph Views', () => {
  const graphStories = [
    { key: 'views---layouts--graph-views--c4graphview--default', name: 'C4GraphView Default' },
    { key: 'views---layouts--graph-views--motivationgraphview--default', name: 'MotivationGraphView Default' },
    { key: 'views---layouts--graph-views--businesslayerview--default', name: 'BusinessLayerView Default' },
    { key: 'views---layouts--graph-views--graphviewer--complete-model', name: 'GraphViewer CompleteModel' },
  ];

  for (const story of graphStories) {
    test(`${story.name}: WCAG 2.1 AA compliance`, async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(`/?story=${story.key}&mode=preview`);
      await page.locator('[data-storyloaded="true"]').waitFor({ state: 'attached', timeout: 15000 }).catch(() => {
        return page.locator('.react-flow__node').first().waitFor({ state: 'attached', timeout: 10000 });
      });

      const results = await new AxeBuilder({ page })
        .include('.react-flow')
        .disableRules(['color-contrast'])
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(
        results.violations,
        `${story.name} has ${results.violations.length} accessibility violation(s): ${results.violations.map(v => `${v.id}: ${v.description}`).join('; ')}`
      ).toHaveLength(0);
    });
  }
});

test.describe('Accessibility - Panels', () => {
  const panelStories = [
    { key: 'panels---inspectors--common--annotationpanel--with-annotations', name: 'AnnotationPanel WithAnnotations' },
    { key: 'panels---inspectors--c4--c4controlpanel--context-level', name: 'C4ControlPanel ContextLevel' },
    { key: 'panels---inspectors--common--nodedetailspanel--goal-node-selected', name: 'NodeDetailsPanel GoalNodeSelected' },
    { key: 'panels---inspectors--common--schemainfopanel--default', name: 'SchemaInfoPanel Default' },
  ];

  for (const story of panelStories) {
    test(`${story.name}: WCAG 2.1 AA compliance`, async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(`/?story=${story.key}&mode=preview`);
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 500)));

      const results = await new AxeBuilder({ page })
        .disableRules(['color-contrast'])
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze();

      expect(
        results.violations,
        `${story.name} has ${results.violations.length} accessibility violation(s): ${results.violations.map(v => `${v.id}: ${v.description}`).join('; ')}`
      ).toHaveLength(0);
    });
  }
});

test.describe('Accessibility - Nodes', () => {
  const nodeStories = [
    { key: 'architecture-nodes--motivation--goalnode--default', name: 'GoalNode', expectedLabel: 'Increase Revenue' },
    { key: 'architecture-nodes--c4--containernode--default', name: 'ContainerNode' },
    { key: 'architecture-nodes--business--businessfunctionnode--default', name: 'BusinessFunctionNode' },
    { key: 'architecture-nodes--motivation--stakeholdernode--default', name: 'StakeholderNode' },
  ];

  for (const story of nodeStories) {
    test(`${story.name}: has role="article" and aria-label`, async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(`/?story=${story.key}&mode=preview`);
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });

      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();

      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel, `${story.name} should have aria-label`).toBeTruthy();

      if (story.expectedLabel) {
        expect(ariaLabel).toContain(story.expectedLabel);
      }
    });
  }
});
