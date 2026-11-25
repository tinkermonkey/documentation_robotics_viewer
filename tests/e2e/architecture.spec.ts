/**
 * architecture.spec.ts — the Architecture view (C4 diagrams) against the built
 * bundle and the repo's committed model: the Container diagram's content, the
 * drill-down into components, and `?level=` / `?scope=` / `?node=` /
 * `?changeset=` (and `?built=`, a plan compared with what was built) in the
 * URL (router.tsx's AppShellRoute), and the Export menu's downloads.
 */

import { readFileSync } from 'node:fs';
import { type Page } from '@playwright/test';
import { test, expect } from './fixtures';
import AxeBuilder from '@axe-core/playwright';
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

  test('selecting a box pushes a history entry (#619); a source link opens the element in the Model view', async ({ page }) => {
    await gotoView(page, `${ROUTES.architecture}?level=container`);
    await diagramAt(page, 'container');
    const before = await page.evaluate(() => history.length);

    await card(page, 'Browser localStorage').locator('.c4-card__main').click();
    await expect(page).toHaveURL(/node=data-store\.database\.browser-local-storage/);
    expect(await page.evaluate(() => history.length)).toBe(before + 1);

    await page.getByTestId('c4-source-link').first().click();
    await expect(page).toHaveURL(/#\/p\/viewer\/c\/main\/model\//);
    await expect(page).toHaveURL(/[?&]layer=data-store(&|$)/);
  });

  test('the Architecture section of the nav tree opens the diagrams', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    const nav = page.getByTestId('nav-tree');
    await nav.getByRole('button', { name: /^Architecture/ }).first().click();
    await expect(page).toHaveURL(/#\/p\/viewer\/c\/main\/architecture\/diagram/);
    await diagramAt(page, 'context');
    await page.getByTestId('nav-c4-containers').click();
    await diagramAt(page, 'container');
  });

  test('a link without ?level= opens the Context diagram in the same history entry, so one Back leaves it', async ({ page }) => {
    await gotoView(page, ROUTES.model);
    await page.evaluate((hash) => {
      window.location.hash = hash;
    }, ROUTES.architecture);
    await diagramAt(page, 'context');
    await expect.poll(() => hashSearchParams(page.url()).get('level')).toBe('context');

    await page.goBack();
    await expect.poll(() => page.url()).toContain('#/p/viewer/c/main/model/');
  });

  test.describe('changeset overlay: ?changeset=', () => {
    // Slice 1's plan (c4-architecture-views-poc), applied: offered reverted.
    const SLICE1_PLAN = 'changeset-1795189106448-lycsp34uv';

    test("the Changesets view's Open in Architecture opens the Context diagram with it overlaid, and Back returns", async ({ page }) => {
      await gotoView(page, `${ROUTES.changesets}?changeset=${SLICE1_PLAN}`);
      await page.getByTestId('changeset-open-architecture').click();
      await diagramAt(page, 'context');
      await expect(page).toHaveURL(/#\/p\/viewer\/c\/main\/architecture\/diagram/);
      const params = hashSearchParams(page.url());
      expect(params.get('level')).toBe('context');
      expect(params.get('changeset')).toBe(SLICE1_PLAN);
      await expect(page.getByTestId('c4-changeset-picker')).toContainText('c4-architecture-views-poc');
      // The bar says what is laid over the diagram, and how.
      const bar = page.getByTestId('c4-changeset-bar');
      await expect(bar.getByTestId('c4-bar-name')).toHaveText('c4-architecture-views-poc');
      await expect(bar).toContainText('applied, shown reverted');

      await page.goBack();
      await expect.poll(() => page.url()).toContain('#/p/viewer/c/main/changesets/list');
      expect(hashSearchParams(page.url()).get('changeset')).toBe(SLICE1_PLAN);
      await expect(page.getByTestId('page-header-title')).toContainText('c4-architecture-views-poc');
    });

    test('the picker sets and clears ?changeset= as history entries, keeping the diagram', async ({ page }) => {
      await gotoView(page, `${ROUTES.architecture}?level=container`);
      await diagramAt(page, 'container');
      await page.getByTestId('c4-changeset-picker').getByRole('button').click();
      await page.getByRole('option', { name: /^c4-architecture-views-poc\s*plan · applied/ }).click();
      await expect.poll(() => hashSearchParams(page.url()).get('changeset')).toBe(SLICE1_PLAN);
      expect(hashSearchParams(page.url()).get('level')).toBe('container');

      await page.getByTestId('c4-changeset-picker').getByRole('button').click();
      await page.getByRole('option', { name: /No changeset/ }).click();
      await expect.poll(() => hashSearchParams(page.url()).get('changeset')).toBeNull();

      await page.goBack();
      await expect.poll(() => hashSearchParams(page.url()).get('changeset')).toBe(SLICE1_PLAN);
      await page.goBack();
      await expect.poll(() => hashSearchParams(page.url()).get('changeset')).toBeNull();
      await diagramAt(page, 'container');
    });

    test('an applied changeset reads reverted: what it added is marked, its parts roll up, and a change opens in the Changesets view', async ({
      page,
    }) => {
      await gotoView(page, `${ROUTES.architecture}?level=container&changeset=${SLICE1_PLAN}`);
      await diagramAt(page, 'container');
      const bar = page.getByTestId('c4-changeset-bar');
      await expect(bar.getByTestId('c4-bar-tally')).toContainText('added');
      await expect(bar.getByTestId('c4-bar-legend')).toBeVisible();
      // Reverting can't bring back links a delete took at commit: the bar says so.
      await expect(bar.getByTestId('c4-bar-revert-note')).toBeVisible();

      // Slice 1 built inside the viewer app: its box counts the changes in its parts.
      const viewer = card(page, 'Embedded Architecture Viewer');
      await expect(viewer.getByTestId('c4-card-rollup')).toContainText(/\d+ changes? inside/);

      // Inside it, what slice 1 added is marked added, with the status in the accessible name.
      await viewer.getByTestId('c4-card-drill').click();
      await diagramAt(page, 'component');
      expect(hashSearchParams(page.url()).get('changeset')).toBe(SLICE1_PLAN);
      const added = page.locator('[data-testid="c4-card"][data-status="added"]').first();
      await expect(added).toBeVisible();
      await expect(added.getByTestId('c4-card-status')).toContainText('+ added');
      const main = added.locator('.c4-card__main');
      await expect(main).toHaveAttribute('aria-label', /, added/);

      // Its drawer lists the changes behind it; one opens in the Changesets view.
      await main.click();
      const changes = page.getByTestId('c4-details-changes');
      await expect(changes.getByTestId('c4-details-change').first()).toBeVisible();
      await changes.getByTestId('c4-details-change-link').first().click();
      await expect.poll(() => page.url()).toContain('#/p/viewer/c/main/changesets/');
      expect(hashSearchParams(page.url()).get('changeset')).toBe(SLICE1_PLAN);
      await expect(page.getByTestId('page-header-title')).toContainText('c4-architecture-views-poc');
    });

    test('Clear in the bar takes the overlay off', async ({ page }) => {
      await gotoView(page, `${ROUTES.architecture}?level=container&changeset=${SLICE1_PLAN}`);
      await diagramAt(page, 'container');
      await expect(page.getByTestId('c4-card-rollup').first()).toBeVisible();
      await page.getByTestId('c4-bar-clear').click();
      await expect.poll(() => hashSearchParams(page.url()).get('changeset')).toBeNull();
      await expect(page.getByTestId('c4-changeset-bar')).toHaveCount(0);
      await expect(page.getByTestId('c4-card-rollup')).toHaveCount(0);
    });

    for (const tone of ['light', 'dark'] as const) {
      test(`the overlaid Container diagram passes axe (WCAG 2.1 AA) on the ${tone} canvas`, async ({ page }) => {
        await gotoView(page, `${ROUTES.architecture}?level=container&changeset=${SLICE1_PLAN}`);
        await diagramAt(page, 'container');
        await expect(page.getByTestId('c4-card-rollup').first()).toBeVisible();
        await page.getByRole('radio', { name: tone, exact: true }).click();
        await expect
          .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
          .toBe(tone === 'dark');
        await page.waitForTimeout(300); // style recalc after the tone flip (see a11y.spec.ts)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${v.id} × ${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
      });
    }
  });

  test.describe('plan vs as built: ?changeset= + ?built=', () => {
    // Slice 2's plan (c4-changeset-overlay) and the extraction of what was built, both applied.
    const SLICE2_PLAN = 'changeset-1795224515851-xnhjkg1i4';
    const SLICE2_BUILT = 'changeset-1795279161409-k7knehp8r';
    const URL = `${ROUTES.architecture}?level=component&changeset=${SLICE2_PLAN}&built=${SLICE2_BUILT}`;

    /** The bar's verdict tally, or (a dr CLI without the verification route) its note saying it can't compare. */
    async function compared(page: Page): Promise<'verdicts' | 'unavailable'> {
      const bar = page.getByTestId('c4-compare-bar');
      await expect(bar).toBeVisible();
      const tally = bar.getByTestId('c4-compare-tally');
      const unavailable = bar.getByTestId('c4-compare-unavailable');
      // The server runs changeset_verify on the read: a second or more locally, over 10 s on a CI runner.
      // The diagram waits for it, so call this before diagramAt.
      await expect(tally.or(unavailable)).toBeVisible({ timeout: 30_000 });
      return (await tally.isVisible()) ? 'verdicts' : 'unavailable';
    }

    test('draws the plan with each box marked by its verdict; Show the plan only goes back to the overlay, and Back to the comparison', async ({ page }) => {
      await gotoView(page, URL);
      // The comparison first: the diagram draws only once the verification read answers.
      const result = await compared(page);
      await diagramAt(page, 'component');
      if (result === 'verdicts') {
        await expect(page.getByTestId('c4-compare-tally')).toContainText('built as planned');
        await expect(page.locator('[data-testid="c4-card"][data-status^="v-"]').first()).toBeVisible();
        await expect(page.getByTestId('c4-card-status').first()).toBeVisible();
      }
      await page.getByTestId('c4-compare-plan-only').click();
      await expect.poll(() => hashSearchParams(page.url()).get('built')).toBeNull();
      expect(hashSearchParams(page.url()).get('changeset')).toBe(SLICE2_PLAN);
      await expect(page.getByTestId('c4-changeset-bar')).toBeVisible();

      // Back returns to the comparison: ?built= is history, in the URL and on screen.
      await page.goBack();
      await expect.poll(() => hashSearchParams(page.url()).get('built')).toBe(SLICE2_BUILT);
      await expect(page.getByTestId('c4-compare-bar')).toBeVisible();
      await expect(page.getByTestId('c4-changeset-bar')).toHaveCount(0);
    });

    for (const tone of ['light', 'dark'] as const) {
      test(`the compared Component diagram passes axe (WCAG 2.1 AA) on the ${tone} canvas`, async ({ page }) => {
        await gotoView(page, URL);
        await compared(page);
        await diagramAt(page, 'component');
        await page.getByRole('radio', { name: tone, exact: true }).click();
        await expect
          .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
          .toBe(tone === 'dark');
        await page.waitForTimeout(300); // style recalc after the tone flip (see a11y.spec.ts)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${v.id} × ${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
      });
    }
  });

  test.describe('export', () => {
    const SLICE1_PLAN = 'changeset-1795189106448-lycsp34uv';
    const FORMATS = [
      ['svg', /^<svg /, '.svg'],
      ['png', null, '.png'],
      ['structurizr', /^workspace /m, '.dsl'],
      ['plantuml', /^@startuml/, '.puml'],
    ] as const;

    async function exportAs(page: Page, id: string) {
      await page.getByTestId('c4-export-menu').getByTestId('row-menu-trigger').click();
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByTestId(`row-menu-action-${id}`).click()]);
      return download;
    }

    for (const overlaid of [false, true]) {
      test(`downloads each format named after the diagram${overlaid ? ', with the overlay marks' : ''}`, async ({ page }) => {
        await gotoView(page, `${ROUTES.architecture}?level=container${overlaid ? `&changeset=${SLICE1_PLAN}` : ''}`);
        await diagramAt(page, 'container');
        if (overlaid) await expect(page.getByTestId('c4-card-rollup').first()).toBeVisible();
        for (const [id, head, ext] of FORMATS) {
          const download = await exportAs(page, id);
          expect(download.suggestedFilename()).toBe(`container-software-system${ext}`);
          const path = await download.path();
          const bytes = readFileSync(path!);
          if (head) expect(bytes.toString('utf8')).toMatch(head);
          else expect(bytes.subarray(1, 4).toString('latin1')).toBe('PNG');
          const text = bytes.toString('utf8');
          if (id === 'svg') {
            const cards = await page.getByTestId('c4-card').count();
            expect(text.match(/data-c4="card"/g)).toHaveLength(cards);
            if (overlaid) expect(text).toMatch(/data-c4="card"[^>]*data-status=/);
          }
          if (id === 'plantuml' && overlaid) expect(text).toContain('SHOW_LEGEND()');
          await expect(page.getByTestId('c4-export-status')).toHaveText(`Downloaded container-software-system${ext}`);
        }
      });
    }

    for (const tone of ['light', 'dark'] as const) {
      test(`the open Export menu passes axe (WCAG 2.1 AA) on the ${tone} canvas`, async ({ page }) => {
        await gotoView(page, `${ROUTES.architecture}?level=container`);
        await diagramAt(page, 'container');
        await page.getByRole('radio', { name: tone, exact: true }).click();
        await expect
          .poll(() => page.evaluate(() => document.body.classList.contains('dark-canvas')))
          .toBe(tone === 'dark');
        await page.getByTestId('c4-export-menu').getByTestId('row-menu-trigger').click();
        await expect(page.getByRole('menu')).toBeVisible();
        await page.waitForTimeout(300); // style recalc after the tone flip (see a11y.spec.ts)
        const results = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const serious = results.violations.filter((v) => v.impact === 'serious' || v.impact === 'critical');
        expect(serious.map((v) => `${v.id} × ${v.nodes.length}: ${v.nodes[0]?.target.join(' ')}`)).toEqual([]);
      });
    }
  });
});
