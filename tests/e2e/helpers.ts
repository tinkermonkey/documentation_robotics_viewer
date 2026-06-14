/**
 * Shared E2E helpers (Phase D) — Playwright only.
 *
 * These run against the REAL `dr visualize` server booted by
 * `playwright.config.ts` (the built bundle + the repo's committed `.dr` model on
 * port 8099), so all counts are deterministic and match the Phase A fixtures.
 */

import { type Page, type APIRequestContext, expect } from '@playwright/test';

/** The dedicated E2E base URL (mirrors playwright.config.ts). */
export const BASE_URL = 'http://localhost:8099';

/** Hash routes of the SPA. */
export const ROUTES = {
  model: '#/model/graph',
  spec: '#/spec/graph',
  changesets: '#/changesets/list',
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
