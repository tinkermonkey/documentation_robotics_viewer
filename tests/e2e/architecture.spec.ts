/**
 * architecture.spec.ts — the Architecture view (C4 diagrams) against the built
 * bundle and the repo's committed model: the Container diagram's content, the
 * drill-down into components, and `?level=` / `?scope=` / `?node=` in the URL
 * (router.tsx's AppShellRoute).
 */

import { test, expect, type Page } from '@playwright/test';
import { gotoView, ROUTES } from './helpers';

function hashSearchParams(url: string): URLSearchParams {
  return new URLSearchParams(url.split('?')[1] ?? '');
}

const card = (page: Page, name: string) => page.locator('[data-testid="c4-card"]', { hasText: name }).first();

async function diagramAt(page: Page, level: string) {
  await expect(page.getByTestId('c4-diagram')).toHaveAttribute('data-level', level);
}

test.describe('Architecture view — C4 diagrams', () => {
  test('the Container diagram shows the people, the viewer app, its storage and the DR CLI server, and nothing from the technology layer', async ({
    page,
  }) => {
    await gotoView(page, `${ROUTES.architecture}?level=container`);
    await diagramAt(page, 'container');

    await expect(page.getByTestId('c4-boundary')).toBeVisible();
    for (const name of ['Architecture Reviewer', 'Model Author', 'Embedded Architecture Viewer', 'Browser localStorage', 'DR CLI Server']) {
      await expect(card(page, name)).toBeVisible();
    }
    await expect(card(page, 'Embedded Architecture Viewer')).toHaveAttribute('data-kind', 'container');
    await expect(card(page, 'Architecture Reviewer')).toHaveAttribute('data-kind', 'person');
    await expect(card(page, 'DR CLI Server')).toHaveAttribute('data-kind', 'external-system');

    // System software is a technology line on a card, never a card.
    const kinds = await page.locator('[data-testid="c4-card"]').evaluateAll((els) => els.map((el) => el.getAttribute('data-kind')));
    expect(new Set(kinds)).toEqual(new Set(['person', 'external-system', 'container']));
    for (const name of ['React 19', 'Heimdall UI', 'Vite Dev Server', 'Docker Agent Container']) {
      await expect(page.locator('.c4-card__name', { hasText: name })).toHaveCount(0);
    }

    // The arrows the model supports, as the text list assistive technology reads.
    const arrows = page.getByTestId('c4-relationship-list').locator('li');
    await expect(arrows.filter({ hasText: /Architecture Reviewer uses Embedded Architecture Viewer/ })).toHaveCount(1);
    await expect(arrows.filter({ hasText: /Embedded Architecture Viewer reads\/writes Browser localStorage/ })).toHaveCount(1);
    await expect(arrows.filter({ hasText: /Embedded Architecture Viewer depends on DR CLI Server/ })).toHaveCount(1);
  });

  test('drills from a container into its components and down to Graph Canvas, and Back returns', async ({ page }) => {
    await gotoView(page, `${ROUTES.architecture}?level=container`);
    await diagramAt(page, 'container');

    await page.getByRole('button', { name: /^Open Embedded Architecture Viewer: / }).click();
    await diagramAt(page, 'component');
    await expect(page).toHaveURL(/level=component/);
    expect(hashSearchParams(page.url()).get('scope')).toBe('ux.uxapplication.embedded-architecture-viewer');
    await expect(card(page, 'App Shell')).toBeVisible();

    await page.getByRole('button', { name: /^Open App Shell: / }).click();
    await expect(page.getByTestId('c4-trail')).toContainText('App Shell');
    await page.getByRole('button', { name: /^Open Graph Canvas: / }).click();
    expect(hashSearchParams(page.url()).get('scope')).toBe('application.applicationcomponent.graph-canvas');
    await expect(page.getByTestId('c4-trail')).toHaveText(/Embedded Architecture Viewer.*App Shell.*Graph Canvas/s);
    await expect(card(page, 'Inspector Drawer')).toBeVisible();

    // Each drill-down pushed a history entry.
    await page.goBack();
    await expect.poll(() => hashSearchParams(page.url()).get('scope')).toBe('application.applicationcomponent.app-shell');
    await page.goBack();
    await page.goBack();
    await diagramAt(page, 'container');
    await expect(page).toHaveURL(/level=container/);
  });

  test('restores level and scope from the URL, and the selected box', async ({ page }) => {
    await gotoView(
      page,
      `${ROUTES.architecture}?level=component&scope=application.applicationcomponent.graph-canvas&node=application.applicationcomponent.inspector-drawer`,
    );
    await diagramAt(page, 'component');
    await expect(page.getByRole('heading', { name: /^Graph Canvas/ })).toBeVisible();
    await expect(card(page, 'Inspector Drawer')).toHaveClass(/c4-card--selected/);
    await expect(page.getByTestId('c4-details')).toContainText('Inspector Drawer');
    // The nav tree marks the same scope.
    await expect(page.getByTestId('nav-c4-application.applicationcomponent.graph-canvas')).toHaveClass(/nav-item--active/);

    await page.reload();
    await diagramAt(page, 'component');
    await expect(card(page, 'Inspector Drawer')).toHaveClass(/c4-card--selected/);
    const params = hashSearchParams(page.url());
    expect(params.get('level')).toBe('component');
    expect(params.get('scope')).toBe('application.applicationcomponent.graph-canvas');
  });

  test('selecting a box replaces the history entry; a source link opens the element in the Model view', async ({ page }) => {
    await gotoView(page, `${ROUTES.architecture}?level=container`);
    await diagramAt(page, 'container');
    const before = await page.evaluate(() => history.length);

    await card(page, 'Browser localStorage').locator('.c4-card__main').click();
    await expect(page).toHaveURL(/node=data-store\.database\.browser-local-storage/);
    expect(await page.evaluate(() => history.length)).toBe(before);

    await page.getByTestId('c4-source-link').first().click();
    await expect(page).toHaveURL(/#\/model\//);
    await expect(page).toHaveURL(/[?&]layer=data-store(&|$)/);
  });

  test('the Architecture section of the nav tree opens the diagrams', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const nav = page.getByTestId('nav-tree');
    await nav.getByRole('button', { name: /^Architecture/ }).first().click();
    await expect(page).toHaveURL(/#\/architecture\/diagram/);
    await diagramAt(page, 'context');
    await page.getByTestId('nav-c4-containers').click();
    await diagramAt(page, 'container');
  });
});
