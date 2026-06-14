/**
 * annotations.spec.ts — the inspector AnnotationsSection CRUD, against the REAL
 * `/api/annotations` surface (writes PERSIST to the served `.dr` model).
 *
 * Flow: select a Model element → add an annotation (appears) → edit it → add a
 * reply → resolve it → delete it (ConfirmDialog).
 *
 * CLEAN UP: every annotation created on the test element is removed in
 * `afterEach` (direct DELETE via the API) so the repo model ends clean
 * (GET returns []). The test element's dotted id is computed the same way the
 * app does (`dottedId`/`slugifyName`), so cleanup targets exactly what the UI
 * created.
 */

import { test, expect, type APIRequestContext } from '@playwright/test';
import { gotoView, ROUTES, BASE_URL, fetchModel } from './helpers';

/** App's `slugifyName` (verbatim from `data/modelGraph.ts`). */
function slugifyName(name: string): string {
  return name
    .replace(/([a-z])([A-Z])/g, '$1-$2')
    .replace(/\./g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** Delete every annotation currently attached to an element id. */
async function purgeAnnotations(
  request: APIRequestContext,
  elementId: string,
): Promise<void> {
  const res = await request.get(
    `${BASE_URL}/api/annotations?elementId=${encodeURIComponent(elementId)}`,
  );
  if (!res.ok()) return;
  const body = await res.json();
  for (const ann of body.annotations ?? []) {
    await request.delete(`${BASE_URL}/api/annotations/${ann.id}`);
  }
}

test.describe('annotations', () => {
  // Resolved per-run: the dotted id of the first data-model element (the default
  // selection), so UI flow + cleanup target the same element.
  let testElementId = '';

  test.beforeEach(async ({ request }) => {
    const model = await fetchModel(request);
    const node = model.nodes.find((n) => n.layer_id === 'data-model')!;
    testElementId = `${node.layer_id}.${node.type}.${slugifyName(node.name)}`;
    // Start clean (in case a prior aborted run left residue).
    await purgeAnnotations(request, testElementId);
  });

  test.afterEach(async ({ request }) => {
    // Belt-and-suspenders: remove anything this test created so the repo model
    // is left unchanged (GET returns []).
    await purgeAnnotations(request, testElementId);
    const res = await request.get(
      `${BASE_URL}/api/annotations?elementId=${encodeURIComponent(testElementId)}`,
    );
    const body = await res.json();
    expect(body.annotations ?? []).toHaveLength(0);
  });

  test('create → edit → reply → resolve → delete an annotation', async ({ page }) => {
    await gotoView(page, ROUTES.model);

    // The first data-model node is selected by default; the AnnotationsSection
    // mounts for it. Wait for the section to appear.
    const section = page.getByTestId('annotations-section');
    await expect(section).toBeVisible({ timeout: 15_000 });
    await expect(section.getByTestId('annotations-empty')).toBeVisible();

    // ─── Create ───────────────────────────────────────────────────────────────
    const original = 'E2E annotation (safe to delete)';
    await section.getByTestId('annotation-add-content').fill(original);
    await section.getByTestId('annotation-add-submit').click();

    const item = section.getByTestId('annotation-item');
    await expect(item).toHaveCount(1);
    await expect(item).toContainText(original);
    await expect(section.getByTestId('annotations-count')).toContainText('1');

    // ─── Edit ───────────────────────────────────────────────────────────────
    const edited = 'E2E annotation (edited, safe to delete)';
    await item.getByTestId('row-menu-trigger').click();
    await page.getByTestId('row-menu-action-edit').click();
    await item.getByTestId('annotation-edit-content').fill(edited);
    await item.getByTestId('annotation-edit-save').click();
    await expect(item).toContainText(edited);

    // ─── Reply ───────────────────────────────────────────────────────────────
    await item.getByTestId('annotation-replies-toggle').click();
    const replyText = 'E2E reply (safe to delete)';
    await item.getByTestId('annotation-reply-input').fill(replyText);
    await item.getByTestId('annotation-reply-submit').click();
    await expect(item.getByTestId('annotation-replies')).toContainText(replyText);

    // ─── Resolve ──────────────────────────────────────────────────────────────
    await item.getByTestId('row-menu-trigger').click();
    await page.getByTestId('row-menu-action-resolve').click();
    await expect(item.getByTestId('annotation-resolved-chip')).toBeVisible();
    await expect(item).toHaveAttribute('data-resolved', 'true');

    // ─── Delete (ConfirmDialog) ────────────────────────────────────────────────
    await item.getByTestId('row-menu-trigger').click();
    await page.getByTestId('row-menu-action-delete').click();
    // ConfirmDialog → confirm (scope to the dialog so we don't hit a stray button).
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await dialog.getByRole('button', { name: /^Delete/ }).click();

    await expect(section.getByTestId('annotation-item')).toHaveCount(0);
    await expect(section.getByTestId('annotations-empty')).toBeVisible();
  });
});
