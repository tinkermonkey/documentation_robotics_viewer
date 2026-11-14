/**
 * changesets.spec.ts — the Changesets view.
 *
 * Asserts: the view opens on the inbox; opening a changeset from the nav tree
 * shows its review rows and StatTiles matching the live API stats; switching
 * changesets updates the content. Resilient to the repo model's changeset set:
 * it reads the API for the authoritative names + per-changeset stats.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import { gotoView, ROUTES, BASE_URL } from './helpers';

interface ApiChangeset {
  id: string;
  name: string;
  created: string;
  changes_count: number;
}

async function fetchChangesets(request: APIRequestContext): Promise<ApiChangeset[]> {
  const list = await (await request.get(`${BASE_URL}/api/changesets`)).json();
  return Object.entries(list.changesets ?? {}).map(([id, c]: [string, any]) => ({
    id,
    name: c.name,
    created: c.created,
    changes_count: c.changes_count,
  }));
}

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

/** Newest first, as the inbox and nav tree order them. */
function newestFirst(all: ApiChangeset[]): ApiChangeset[] {
  return [...all].sort((a, b) => b.created.localeCompare(a.created));
}

test.describe('changesets', () => {
  test('opens on the inbox; a changeset shows review rows and StatTiles matching the API stats', async ({
    page,
    request,
  }) => {
    await gotoView(page, ROUTES.changesets);
    await expect(page.getByTestId('changeset-inbox')).toBeVisible({ timeout: 15_000 });

    const all = newestFirst(await fetchChangesets(request));
    test.skip(all.length === 0, 'needs a changeset');
    const selected = all[0];
    await page
      .getByTestId('nav-tree')
      .getByRole('button', { name: new RegExp(`^${escapeRegExp(selected.name)}`) })
      .first()
      .click();

    const title = page.getByTestId('page-header-title');
    await expect(title).toContainText(selected.name, { timeout: 15_000 });
    await expect(page).toHaveURL(new RegExp(`[?&]changeset=${selected.id}`));

    const detail = await (await request.get(`${BASE_URL}/api/changesets/${selected.id}`)).json();
    const stats = detail.stats as { additions: number; modifications: number; deletions: number };

    // The header shows the changeset's change count.
    await expect(page.getByTestId('page-header-actions')).toContainText(`${detail.changes.length} changes`);

    // Review rows render (changes that cancel out within the changeset are folded away).
    const rows = page.getByTestId('review-row');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    expect(await rows.count()).toBeGreaterThan(0);

    // The inspector StatTiles match the API stats (Added / Modified / Deleted).
    const inspector = page.getByTestId('inspector');
    await expect(inspector.locator('.stat-tile', { hasText: 'Added' })).toContainText(String(stats.additions));
    await expect(inspector.locator('.stat-tile', { hasText: 'Modified' })).toContainText(String(stats.modifications));
    await expect(inspector.locator('.stat-tile', { hasText: 'Deleted' })).toContainText(String(stats.deletions));

    // Back to the inbox.
    await page.getByTestId('changeset-back-to-inbox').click();
    await expect(page.getByTestId('changeset-inbox')).toBeVisible();
  });

  test('switching changesets updates the content', async ({ page, request }) => {
    const all = newestFirst(await fetchChangesets(request));
    test.skip(all.length < 2, 'needs at least two changesets to switch between');

    await gotoView(page, ROUTES.changesets);
    const nav = page.getByTestId('nav-tree');
    await nav.getByRole('button', { name: new RegExp(`^${escapeRegExp(all[0].name)}`) }).first().click();

    const title = page.getByTestId('page-header-title');
    await expect(title).toContainText(all[0].name, { timeout: 15_000 });

    await nav.getByRole('button', { name: new RegExp(`^${escapeRegExp(all[1].name)}`) }).first().click();
    await expect(title).toContainText(all[1].name);

    // Rows still render for the newly selected changeset.
    await expect(page.getByTestId('review-row').first()).toBeVisible();
  });
});
