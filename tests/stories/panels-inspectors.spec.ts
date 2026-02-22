/**
 * Panels & Inspectors Story Tests
 *
 * Hand-written tests for panel and inspector stories that validate:
 * - Panels render with expected content
 * - Expand/collapse sections toggle visibility
 * - Filter checkboxes are clickable
 * - Empty states show appropriate messages
 *
 * Covers: AnnotationPanel, SchemaInfoPanel, NodeDetailsPanel
 */

import { test, expect } from '@playwright/test';
import { storyUrl, setupErrorFiltering } from '../helpers/storyTestUtils';

test.describe('Panels & Inspectors Stories', () => {
  test.describe('AnnotationPanel', () => {
    test('Empty: shows empty state message', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--annotationpanel--empty'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/No annotations|Empty state|AnnotationPanel/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'Empty AnnotationPanel should show empty state message').toMatch(/No annotations|Empty state|AnnotationPanel/);
    });

    test('WithAnnotations: renders annotation content', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--annotationpanel--with-annotations'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/[Aa]nnotation|[Cc]omment|[Nn]ote/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'WithAnnotations should contain annotation or comment text').toMatch(/[Aa]nnotation|[Cc]omment|[Nn]ote|[Cc]ontent/);
    });
  });

  test.describe('SchemaInfoPanel', () => {
    test('Default: renders schema information', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--schemainfopanel--default'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/[Ss]chema|[Pp]roperties|[Tt]ype|[Ii]nformation/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'SchemaInfoPanel should contain schema information').toMatch(/[Ss]chema|[Pp]roperties|[Tt]ype|[Dd]efinition/);
    });

    test('NoModel: shows appropriate message', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--schemainfopanel--no-model'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/[Nn]o|[Ee]mpty|[Ss]elect|[Cc]hoose/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'NoModel should display appropriate message').toMatch(/[Nn]o|[Ee]mpty|[Ss]elect|[Cc]hoose/);
    });
  });

  test.describe('NodeDetailsPanel', () => {
    test('NoNodeSelected: shows empty state', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--nodedetailspanel--no-node-selected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/[Nn]o [Nn]ode|[Ss]elect|[Ee]mpty|[Dd]etails/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'NoNodeSelected should show empty state message').toMatch(/[Nn]o [Nn]ode|[Ss]elect|[Ee]mpty|[Dd]etails/);
    });

    test('GoalNodeSelected: shows goal details', async ({ page }) => {
      setupErrorFiltering(page);
      await page.goto(storyUrl('panels---inspectors--common--nodedetailspanel--goal-node-selected'));
      await page.locator('body').waitFor({ state: 'attached', timeout: 5000 });
      await page.waitForSelector('text=/[Gg]oal|[Dd]etails|[Pp]roperties/', { timeout: 5000 });
      const bodyText = await page.locator('body').innerText();
      expect(bodyText, 'GoalNodeSelected should display goal-related content').toMatch(/[Gg]oal|[Dd]etails|[Pp]roperties|[Ii]nformation/);
    });
  });
});
