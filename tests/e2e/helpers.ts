/**
 * Shared E2E helpers (Phase D) — Playwright only.
 *
 * These run against the REAL `dr visualize` server booted by
 * `playwright.config.ts` (the built bundle + the repo's committed `.dr` model on
 * port 8099), so all counts are deterministic and match the Phase A fixtures.
 */

import { type Page, type Locator, type APIRequestContext, expect } from '@playwright/test';

/** The dedicated E2E base URL (mirrors playwright.config.ts). */
export const BASE_URL = 'http://localhost:8099';

/** Hash routes of the SPA. */
export const ROUTES = {
  model: '#/model/graph',
  spec: '#/spec/graph',
  changesets: '#/changesets/list',
  architecture: '#/architecture/diagram',
} as const;

/** The 12-layer domain palette (slug → hex), verbatim from `ui/domain.ts`. */
export const DOMAIN_HEX: Record<string, string> = {
  motivation: '#8B5CF6',
  business: '#F59E0B',
  security: '#F43F5E',
  application: '#818CF8',
  technology: '#22D3EE',
  api: '#10B981',
  'data-model': '#2DD4BF',
  'data-store': '#38BDF8',
  ux: '#F472B6',
  navigation: '#A78BFA',
  apm: '#FB923C',
  testing: '#4ADE80',
};

/** Convert a `#RRGGBB` hex to a CSS `rgb(r, g, b)` string. */
export function hexToRgb(hex: string): string {
  const h = hex.replace('#', '');
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgb(${r}, ${g}, ${b})`;
}

/**
 * Navigate to a hash route and wait for the shell to mount. The SPA boots at `/`
 * (AuthRoute) then sets the hash; navigating straight to the hash route is the
 * deterministic deep-link path the router supports.
 */
export async function gotoView(page: Page, route: string): Promise<void> {
  await page.goto(`/${route}`);
  await expect(page.getByTestId('app-shell')).toBeVisible();
}

/**
 * Live `/api/model` payload (deterministic: 285 nodes / 445 links / 12 layers).
 */
export async function fetchModel(request: APIRequestContext): Promise<{
  nodes: Array<{ id: string; layer_id: string; type: string; name: string }>;
  links: Array<{ id: string; source: string; target: string; type: string }>;
}> {
  const res = await request.get(`${BASE_URL}/api/model`);
  expect(res.ok()).toBeTruthy();
  return res.json();
}

/** Per-layer element counts from the live model. */
export async function layerCounts(
  request: APIRequestContext,
): Promise<Record<string, number>> {
  const model = await fetchModel(request);
  const counts: Record<string, number> = {};
  for (const node of model.nodes) {
    counts[node.layer_id] = (counts[node.layer_id] ?? 0) + 1;
  }
  return counts;
}

/**
 * How many node types the live spec declares for a layer (its `nodeSchemas`).
 * Read it rather than hard-coding it: a dr CLI release can bump the spec and add
 * a type (CLI 0.6.0's spec 0.14.0 gave Application a 10th).
 */
export async function nodeTypeCount(request: APIRequestContext, layerId: string): Promise<number> {
  const res = await request.get(`${BASE_URL}/api/spec`);
  expect(res.ok()).toBeTruthy();
  const spec = (await res.json()) as {
    schemas: Record<string, { layer?: { id?: string }; nodeSchemas?: Record<string, unknown> }>;
  };
  const entry = Object.values(spec.schemas).find((s) => s?.layer?.id === layerId);
  expect(entry, `no schema for layer ${layerId}`).toBeTruthy();
  return Object.keys(entry?.nodeSchemas ?? {}).length;
}

/**
 * Chat SDK availability gate, read over the WebSocket JSON-RPC `chat.status`
 * method (there is no REST equivalent). Returns `false` if the SDK is
 * unavailable or the probe times out, so the chat spec can skip cleanly.
 */
export async function chatSdkAvailable(page: Page): Promise<boolean> {
  return page.evaluate((base: string) => {
    return new Promise<boolean>((resolve) => {
      try {
        const wsUrl = base.replace(/^http/, 'ws') + '/ws';
        const ws = new WebSocket(wsUrl, ['token', 'none']);
        const done = (v: boolean) => {
          try {
            ws.close();
          } catch {
            /* ignore */
          }
          resolve(v);
        };
        const timer = setTimeout(() => done(false), 8000);
        ws.onopen = () => {
          ws.send(
            JSON.stringify({ jsonrpc: '2.0', id: 99, method: 'chat.status', params: {} }),
          );
        };
        ws.onmessage = (ev) => {
          try {
            const msg = JSON.parse(ev.data as string);
            if (msg.id === 99 && msg.result) {
              clearTimeout(timer);
              done(Boolean(msg.result.sdk_available ?? msg.result.sdkAvailable));
            }
          } catch {
            /* ignore non-JSON frames */
          }
        };
        ws.onerror = () => {
          clearTimeout(timer);
          done(false);
        };
      } catch {
        resolve(false);
      }
    });
  }, BASE_URL);
}

/**
 * Leave a nav-tree layer expanded and selected, and return its first element
 * row: for Model, the first element of the layer's first (A–Z) node-type
 * group, opened here (#592: groups start collapsed); for Schema, the layer's
 * first node-type row.
 *
 * Clicking a layer row TOGGLES it (and selects the layer when expanding),
 * and the app's default selection may have already expanded it, so a blind
 * click could collapse it instead. `label` is the layer's display label
 * (e.g. 'Data Model', 'APM'). The same label appears under Model and Schema
 * when both sections are open; `section` picks which (Model rows come first).
 */
export async function openLayer(
  page: Page,
  label: string,
  section: 'model' | 'spec' = 'model',
): Promise<Locator> {
  const buttons = page.getByRole('button', { name: new RegExp(`^${label} \\d+$`, 'i') });
  const button = section === 'model' ? buttons.first() : buttons.last();
  const row = button.locator('xpath=..');
  const open = row.locator('.drv-chev--open');
  // The app's default selection expands a layer shortly after load; wait for it
  // to land (it writes ?layer=) so it can't toggle the row under us.
  await expect(page).toHaveURL(/[?&]layer=/);
  if ((await open.count()) > 0) {
    await button.click(); // collapse
    await expect(open).toHaveCount(0);
  }
  await expect(async () => {
    if ((await open.count()) === 0) await button.click(); // expand + select the layer
    await expect(open).toHaveCount(1, { timeout: 1_000 });
  }).toPass({ timeout: 10_000 });
  const first = row.locator('xpath=following-sibling::div[1]');
  if (section === 'spec') return first.locator('.drv-nav-l2');
  // The first type group's wrapper holds its header and, once open, its elements.
  const group = first.locator('.drv-nav-group');
  if ((await group.getAttribute('aria-expanded')) !== 'true') await group.click();
  await expect(group).toHaveAttribute('aria-expanded', 'true');
  return first.locator('.drv-nav-l3').first();
}

/**
 * Open the nav tree's changeset groups (#625): Open starts expanded, Closed
 * collapsed, so a row in a collapsed group isn't rendered until it opens.
 * Opens each group that's present and closed; an empty group isn't rendered.
 */
export async function openChangesetGroups(page: Page): Promise<void> {
  const nav = page.getByTestId('nav-tree');
  await expect(nav.locator('[data-testid^="nav-changeset-group-"]').first()).toBeVisible({ timeout: 15_000 });
  for (const key of ['open', 'closed']) {
    const group = nav.getByTestId(`nav-changeset-group-${key}`);
    if ((await group.count()) > 0 && (await group.getAttribute('aria-expanded')) === 'false') {
      await group.click();
      await expect(group).toHaveAttribute('aria-expanded', 'true');
    }
  }
}
