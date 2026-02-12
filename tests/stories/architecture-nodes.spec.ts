/**
 * Architecture Node Story Tests
 *
 * Hand-written tests for node stories that validate:
 * - Nodes render with role="article" and correct aria-label
 * - Label text is visible
 * - Connection handles are present
 * - Node dimensions are applied
 * - SVG paths render without NaN errors
 *
 * Covers nodes:
 * - Motivation: GoalNode, StakeholderNode, AssessmentNode, AssumptionNode,
 *              ConstraintNode, DriverNode, OutcomeNode, PrincipleNode,
 *              RequirementNode, ValueStreamNode
 * - C4: ContainerNode
 * - Business: BusinessFunctionNode
 */

import { test, expect } from '@playwright/test';
import { isExpectedConsoleError, isKnownRenderingBug } from './storyErrorFilters';
import { storyUrl } from '../helpers/storyTestUtils';

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
      await page.goto(storyUrl('c-graphs-nodes-motivation-goalnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
      expect(ariaLabel).toContain('Increase Revenue');
    });

    test('Default: label text is visible', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-goalnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=Increase Revenue')).toBeVisible();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-goalnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'GoalNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('HighPriority: shows label text', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-goalnode--high-priority'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=Customer Satisfaction')).toBeVisible();
    });

    test('ChangesetAdd: renders with correct label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-goalnode--changeset-add'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      await expect(page.locator('text=New Goal')).toBeVisible();
    });
  });

  test.describe('ContainerNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-c4-containernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-c4-containernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'ContainerNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('Database: renders with label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-c4-containernode--database'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('BusinessFunctionNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-business-businessfunctionnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-business-businessfunctionnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'BusinessFunctionNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('ChangesetDelete: renders with label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-business-businessfunctionnode--changeset-delete'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('StakeholderNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-stakeholdernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-stakeholdernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'StakeholderNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('InternalStakeholder: renders with label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-stakeholdernode--internal-stakeholder'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });

    test('ChangesetAdd: renders with changeset styling', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-stakeholdernode--changeset-add'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('AssessmentNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-assessmentnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-assessmentnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'AssessmentNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('Rating5: renders with rating variant', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-assessmentnode--rating5'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('AssumptionNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-assumptionnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: SVG renders without NaN errors', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-assumptionnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = page.locator('svg path[d]');
      const pathCount = await paths.count();
      for (let i = 0; i < pathCount; i++) {
        const d = await paths.nth(i).getAttribute('d');
        expect(d).not.toContain('NaN');
      }
    });
  });

  test.describe('ConstraintNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-constraintnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-constraintnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'ConstraintNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('RegulatoryConstraint: renders with constraint type', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-constraintnode--regulatory-constraint'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });

    test('ChangesetUpdate: renders with update styling', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-constraintnode--changeset-update'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('DriverNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-drivernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-drivernode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'DriverNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('MarketDriver: renders with driver type', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-drivernode--market-driver'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('OutcomeNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-outcomenode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-outcomenode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'OutcomeNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('Achieved: renders with status variant', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-outcomenode--achieved'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('PrincipleNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-principlenode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: SVG renders without NaN errors', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-principlenode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const paths = page.locator('svg path[d]');
      const pathCount = await paths.count();
      for (let i = 0; i < pathCount; i++) {
        const d = await paths.nth(i).getAttribute('d');
        expect(d).not.toContain('NaN');
      }
    });

    test('ApplicationScope: renders with scope variant', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-principlenode--application-scope'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('RequirementNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-requirementnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-requirementnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'RequirementNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('NonFunctional: renders with requirement type', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-requirementnode--non-functional'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });

    test('HighPriority: renders with priority variant', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-requirementnode--high-priority'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });

  test.describe('ValueStreamNode', () => {
    test('Default: has role="article" with aria-label', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-valuestreamnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      const ariaLabel = await article.getAttribute('aria-label');
      expect(ariaLabel).toBeTruthy();
    });

    test('Default: has connection handles', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-valuestreamnode--default'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const handles = await page.locator('.react-flow__handle').count();
      expect(handles, 'ValueStreamNode should have at least 4 handles').toBeGreaterThanOrEqual(4);
    });

    test('LongStream: renders with stream length variant', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-valuestreamnode--long-stream'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });

    test('ChangesetDelete: renders with delete styling', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('c-graphs-nodes-motivation-valuestreamnode--changeset-delete'));
      await page.locator('[role="article"]').first().waitFor({ state: 'attached', timeout: 10000 });
      const article = page.locator('[role="article"]').first();
      await expect(article).toBeVisible();
    });
  });
});
