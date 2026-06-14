/**
 * changesets.spec.ts — the Changesets diff view.
 *
 * Asserts: selecting a changeset shows op rows (add / update / delete) and
 * StatTiles matching the live API stats, and switching changesets updates the
 * content. Resilient to the repo model's changeset set: it reads the API for the
 * authoritative names + per-changeset stats, and resolves the DEFAULT-selected
 * changeset by the displayed name (the registry orders newest-first by `created`,
 * which is not the API object key order).
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

test.describe('changesets', () => {
  test('selecting a changeset shows op rows and StatTiles matching the API stats', async ({
    page,
    request,
  }) => {
    await gotoView(page, ROUTES.changesets);

    // The default selection is the newest changeset; read its displayed name and
    // resolve that changeset's id + detail (stats) from the API.
    const title = page.getByTestId('page-header-title');
    await expect(title).toBeVisible({ timeout: 15_000 });
    const displayedName = (await title.textContent())!;

    const all = await fetchChangesets(request);
    const selected = all.find((c) => displayedName.startsWith(c.name));
    expect(selected, `displayed "${displayedName}" should match an API changeset`).toBeTruthy();

    const detail = await (
      await request.get(`${BASE_URL}/api/changesets/${selected!.id}`)
    ).json();
    const stats = detail.stats as {
      additions: number;
      modifications: number;
      deletions: number;
    };

    // The header shows the changeset's change count.
    await expect(page.getByTestId('page-header-actions')).toContainText(
      `${detail.changes.length} changes`,
    );

    // Op-coded rows render, with at least one ADD bucket (every changeset adds).
    const rows = page.locator('[data-testid="changeset-row"]');
    await expect(rows.first()).toBeVisible({ timeout: 15_000 });
    expect(await rows.count()).toBeGreaterThan(0);

    // The op-row buckets reconcile with the API stats (relationship-add folds
    // into add, relationship-delete into delete).
    const countByOp = (op: string) =>
      page.locator(`[data-testid="changeset-row"][data-op="${op}"]`).count();
    expect(await countByOp('add')).toBe(stats.additions);
    expect(await countByOp('update')).toBe(stats.modifications);
    expect(await countByOp('delete')).toBe(stats.deletions);

    // The inspector StatTiles match the API stats (Added / Modified / Deleted).
    const inspector = page.getByTestId('inspector');
    await expect(inspector.locator('.stat-tile', { hasText: 'Added' })).toContainText(
      String(stats.additions),
    );
    await expect(inspector.locator('.stat-tile', { hasText: 'Modified' })).toContainText(
      String(stats.modifications),
    );
    await expect(inspector.locator('.stat-tile', { hasText: 'Deleted' })).toContainText(
      String(stats.deletions),
    );
  });

  test('switching changesets updates the content', async ({ page, request }) => {
    const all = await fetchChangesets(request);
    test.skip(all.length < 2, 'needs at least two changesets to switch between');

    await gotoView(page, ROUTES.changesets);

    const title = page.getByTestId('page-header-title');
    await expect(title).toBeVisible({ timeout: 15_000 });
    const firstName = (await title.textContent())!;

    // Pick a different changeset from the nav tree (Changesets section is open).
    const other = all.find((c) => !firstName.startsWith(c.name))!;
    const nav = page.getByTestId('nav-tree');
    await nav
      .getByRole('button', { name: new RegExp(`^${escapeRegExp(other.name)}`) })
      .first()
      .click();

    // Title updates to the new changeset (chip nested in <h1>, so contains).
    await expect(title).toContainText(other.name);
    expect(await title.textContent()).not.toBe(firstName);

    // Rows still render for the newly selected changeset.
    await expect(page.locator('[data-testid="changeset-row"]').first()).toBeVisible();
  });
});

function escapeRegExp(s: string): string {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
