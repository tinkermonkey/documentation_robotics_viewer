// @vitest-environment happy-dom
/**
 * Tier1Panel.spec.tsx — Tier 1's state and spend in the Changesets inbox,
 * from `GET /api/tier1` (MSW, bodies from fixtures/tier1.json), for each
 * state, and against an older dr CLI without the route.
 */

import { describe, expect, it } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { http, HttpResponse } from 'msw';

import { Tier1Panel } from '@/apps/embedded/ui/Tier1Panel';
import { ChangesetCanvas } from '@/apps/embedded/ui/ChangesetCanvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import tier1 from '../fixtures/tier1.json';

type State = keyof typeof tier1;

/** Serve one fixture state; records how often the route was asked and with what. */
function serve(state: State) {
  const requests: Request[] = [];
  mswServer.use(
    http.get('*/api/tier1', ({ request }) => {
      requests.push(request);
      return HttpResponse.json(tier1[state]);
    }),
  );
  return requests;
}

describe('Tier1Panel', () => {
  it('shows state, provider and model, and the spend against the cap with the 80% warning', async () => {
    serve('onNearCap');
    renderWithProviders(<Tier1Panel />);

    const panel = await screen.findByTestId('tier1-panel');
    expect(panel).toHaveAttribute('data-state', 'on');
    expect(within(panel).getByTestId('tier1-state')).toHaveTextContent('on');
    expect(within(panel).getByTestId('tier1-model')).toHaveTextContent('cloudflare-workers-ai · @cf/cloudflare/clef');
    expect(within(panel).getByTestId('tier1-spend')).toHaveTextContent('$16.42of the $20.00 monthly cap');
    expect(within(panel).getByTestId('tier1-spend')).toHaveTextContent('$3.58 left · 11,730 cards · resets Dec 1');
    const bar = within(panel).getByRole('progressbar', { name: 'Tier 1 spend this month: $16.42 of $20.00' });
    expect(bar).toHaveAttribute('aria-valuenow', '82');
    // The server's own warning, with its "to raise it" command as code.
    const warning = within(panel).getByTestId('tier1-near-cap');
    expect(warning).toHaveTextContent("Tier 1 has used 82% of this checkout's monthly cap ($16.42 of $20.00).");
    expect(warning.querySelector('code')).toHaveTextContent('dr analyzer tier1 set monthly-cap 40');

    const rows = within(panel).getAllByTestId('tier1-source-row');
    expect(rows.map((r) => r.getAttribute('data-source'))).toEqual(['extract', 'classify', 'probe']);
    expect(rows[0]).toHaveTextContent('extract9,810$13.73');
    expect(rows[2]).toHaveTextContent('probe1<$0.01');

    expect(within(panel).getByTestId('tier1-cache')).toHaveTextContent('11,402 entries');
    // The note names the CLI command; nothing here changes Tier 1.
    expect(within(panel).getByTestId('tier1-note').querySelector('code')).toHaveTextContent(
      'dr analyzer tier1 enable|set|disable',
    );
    expect(within(panel).queryAllByRole('button')).toHaveLength(0);
    expect(within(panel).queryByRole('textbox')).not.toBeInTheDocument();
  });

  it('says where each credential comes from, never more', async () => {
    serve('onNearCap');
    renderWithProviders(<Tier1Panel />);
    const creds = await screen.findAllByTestId('tier1-credential');
    expect(creds.map((c) => c.textContent)).toEqual([
      'accountId: set from CLOUDFLARE_ACCOUNT_ID',
      'apiToken: set from CLOUDFLARE_API_TOKEN',
    ]);
  });

  it('shows no warning below 80% of the cap', async () => {
    serve('on');
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(within(panel).getByTestId('tier1-spend')).toHaveTextContent('$4.20');
    expect(within(panel).queryByTestId('tier1-near-cap')).not.toBeInTheDocument();
    expect(within(panel).queryByTestId('tier1-reason')).not.toBeInTheDocument();
  });

  it('says the cap is reached when capped', async () => {
    serve('capped');
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(panel).toHaveAttribute('data-state', 'capped');
    expect(within(panel).getByTestId('tier1-state')).toHaveTextContent('capped');
    expect(within(panel).getByTestId('tier1-capped')).toHaveTextContent("cap is reached");
    expect(within(panel).getByRole('progressbar')).toHaveAttribute('aria-valuenow', '100');
    expect(within(panel).getByTestId('tier1-credentials')).toHaveTextContent('set from tier1.json');
  });

  it('gives the reason and the missing key without credentials', async () => {
    serve('noCredentials');
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(within(panel).getByTestId('tier1-state')).toHaveTextContent('no credentials');
    expect(within(panel).getByTestId('tier1-reason')).toHaveTextContent(
      'cloudflare-workers-ai needs credentials.apiToken in tier1.json or CLOUDFLARE_API_TOKEN',
    );
    const missing = within(panel)
      .getAllByTestId('tier1-credential')
      .find((c) => c.getAttribute('data-set') === 'false');
    expect(missing).toHaveTextContent('apiToken: missing');
  });

  it('gives the reason and the warnings when misconfigured, without a spend bar', async () => {
    serve('misconfigured');
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(within(panel).getByTestId('tier1-state')).toHaveTextContent('misconfigured');
    expect(within(panel).getByTestId('tier1-reason')).toHaveTextContent('is tracked by git');
    expect(within(panel).getByTestId('tier1-reason').querySelector('code')).toHaveTextContent(
      'git rm --cached .dr/analyzers/cbm/tier1.json',
    );
    expect(within(panel).getByTestId('tier1-warnings')).toHaveTextContent('.dr/ is not ignored by git');
    expect(within(panel).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  it('folds to one line when off, with the reason and the enable command inside', async () => {
    serve('off');
    const user = userEvent.setup();
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(panel.tagName).toBe('DETAILS');
    expect(panel).not.toHaveAttribute('open');
    expect(panel.querySelector('summary')).toHaveTextContent('Tier 1 is off');
    await user.click(panel.querySelector('summary')!);
    expect(within(panel).getByTestId('tier1-reason').querySelector('code')).toHaveTextContent(
      'dr analyzer tier1 enable --provider <name> --model <id>',
    );
    expect(within(panel).queryByRole('progressbar')).not.toBeInTheDocument();
  });

  // The hook's own retry rule decides here (it overrides the test client's
  // retry: false), and TanStack waits ~1s before a retry: had the 404 been
  // retried, the query would still be pending after the first fetch.
  it.each([
    ['a 404', () => new HttpResponse('404 Not Found', { status: 404 })],
    ['a 405', () => new HttpResponse('Method Not Allowed', { status: 405 })],
    ['a 501', () => new HttpResponse('Not Implemented', { status: 501 })],
    ['an HTML page', () => HttpResponse.text('<!doctype html><html></html>')],
  ])('renders nothing on %s from a dr CLI without /api/tier1, after one fetch and no retry', async (_name, reply) => {
    let calls = 0;
    mswServer.use(
      http.get('*/api/tier1', () => {
        calls++;
        return reply();
      }),
    );
    const { container, client } = renderWithProviders(<Tier1Panel />);
    await waitFor(() => expect(client.getQueryState(['getapitier1'])?.status).toBe('error'), { timeout: 500 });
    expect(client.getQueryState(['getapitier1'])?.fetchFailureCount).toBe(1);
    expect(calls).toBe(1);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing for a JSON body that is not a Tier 1 status', async () => {
    mswServer.use(http.get('*/api/tier1', () => HttpResponse.json({ ok: true })));
    const { container, client } = renderWithProviders(<Tier1Panel />);
    await waitFor(() => expect(client.getQueryState(['getapitier1'])?.status).toBe('success'));
    expect(container).toBeEmptyDOMElement();
  });

  it('retries a server error once before saying so', async () => {
    let calls = 0;
    mswServer.use(
      http.get('*/api/tier1', () => {
        calls++;
        return HttpResponse.json({ error: 'ledger unreadable' }, { status: 500 });
      }),
    );
    const { client } = renderWithProviders(<Tier1Panel />);
    await waitFor(() => expect(calls).toBe(1));
    // Still pending: the retry is scheduled, not given up on.
    expect(client.getQueryState(['getapitier1'])?.status).toBe('pending');
    await screen.findByTestId('tier1-error', {}, { timeout: 4000 });
    expect(calls).toBe(2);
  });

  it("says the status couldn't be read on a server error", async () => {
    mswServer.use(http.get('*/api/tier1', () => HttpResponse.json({ error: 'ledger unreadable' }, { status: 500 })));
    renderWithProviders(<Tier1Panel />);
    expect(await screen.findByTestId('tier1-error', {}, { timeout: 4000 })).toHaveTextContent(
      "Tier 1 status couldn't be read: ledger unreadable",
    );
  });

  it('sits in the Changesets inbox', async () => {
    serve('on');
    renderWithProviders(<ChangesetCanvas />);
    act(() => useUiStore.getState().setView('changesets'));
    const inbox = await screen.findByTestId('changeset-inbox');
    expect(await within(inbox).findByTestId('tier1-panel')).toBeInTheDocument();
  });

  it('only reads: a GET with no body', async () => {
    const requests = serve('on');
    renderWithProviders(<Tier1Panel />);
    await screen.findByTestId('tier1-panel');
    expect(requests.map((r) => r.method)).toEqual(['GET']);
    expect(new URL(requests[0].url).search).toBe('');
  });
});

describe('Tier1Panel — cap edge cases', () => {
  const base = tier1.on;

  it("shows the server's reason when capped, not its own words", async () => {
    mswServer.use(
      http.get('*/api/tier1', () =>
        HttpResponse.json({
          ...tier1.capped,
          reason: 'The $20.00 monthly cap is reached; it resets on 1 Dec 2026 (UTC). To raise it: `dr analyzer tier1 set monthly-cap <dollars>`.',
        }),
      ),
    );
    renderWithProviders(<Tier1Panel />);
    const reason = await screen.findByTestId('tier1-reason');
    expect(reason).toHaveTextContent('The $20.00 monthly cap is reached');
    expect(reason.querySelector('code')).toHaveTextContent('dr analyzer tier1 set monthly-cap <dollars>');
    expect(screen.queryByTestId('tier1-capped')).not.toBeInTheDocument();
  });

  it('says Tier 1 asks nothing at a $0 cap: no bar, no reset date, no red', async () => {
    mswServer.use(
      http.get('*/api/tier1', () =>
        HttpResponse.json({
          ...base,
          state: 'capped',
          monthlyCapUsd: 0,
          nearCap: false,
          month: { spentUsd: 0, capUsd: 0, remainingUsd: 0, resetsAt: '2026-12-01T00:00:00.000Z', cards: 0, percentUsed: null },
          bySource: {},
        }),
      ),
    );
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(within(panel).getByTestId('tier1-zero-cap')).toHaveTextContent('The monthly cap is $0, so Tier 1 asks the model nothing');
    expect(within(panel).getByTestId('tier1-zero-cap').querySelector('code')).toHaveTextContent(
      'dr analyzer tier1 set monthly-cap <usd>',
    );
    expect(within(panel).queryByRole('progressbar')).not.toBeInTheDocument();
    expect(within(panel).queryByTestId('tier1-capped')).not.toBeInTheDocument();
    expect(panel).not.toHaveTextContent(/resets|until/);
    expect(panel.className).not.toMatch(/danger/);
  });

  it("uses the server's percentUsed for the bar and the fallback warning", async () => {
    mswServer.use(
      http.get('*/api/tier1', () =>
        HttpResponse.json({
          ...tier1.onNearCap,
          summary: 'Tier 1 is on.',
          month: { ...tier1.onNearCap.month, percentUsed: 82.1 },
        }),
      ),
    );
    renderWithProviders(<Tier1Panel />);
    const bar = await screen.findByRole('progressbar');
    expect(bar).toHaveAttribute('aria-valuenow', '82.1');
    expect(screen.getByTestId('tier1-near-cap')).toHaveTextContent('Tier 1 has used 82.1% of this checkout');
  });

  it('rounds down like the CLI without percentUsed', async () => {
    mswServer.use(
      http.get('*/api/tier1', () =>
        HttpResponse.json({ ...tier1.onNearCap, summary: '', month: { ...tier1.onNearCap.month, spentUsd: 16.99 } }),
      ),
    );
    renderWithProviders(<Tier1Panel />);
    expect(await screen.findByRole('progressbar')).toHaveAttribute('aria-valuenow', '84');
    expect(screen.getByTestId('tier1-near-cap')).toHaveTextContent('Tier 1 has used 84% of');
  });
});

describe('Tier1Panel — malformed bodies render, never crash', () => {
  const serveBody = (body: unknown) => mswServer.use(http.get('*/api/tier1', () => HttpResponse.json(body as object)));

  it.each([
    ['no note or summary', { ...tier1.onNearCap, note: undefined, summary: undefined }],
    ['a non-string note, summary and reason', { ...tier1.noCredentials, note: { x: 1 }, summary: 3, reason: ['r'] }],
    ['a null credential', { ...tier1.onNearCap, credentials: { apiToken: null, accountId: { set: true, from: 'ENV' } } }],
    ['an object for a source’s cards', { ...tier1.onNearCap, bySource: { extract: { cards: { n: 1 }, costUsd: 1, lastAt: 'x' } } }],
    ['no month cards or remainingUsd', { ...tier1.on, month: { spentUsd: 4.2, capUsd: 20 } }],
    ['objects for provider and model', { ...tier1.on, provider: { p: 1 }, model: { m: 1 }, modelId: 7 }],
    ['non-string warnings', { ...tier1.misconfigured, warnings: [{ w: 1 }, null, 'real warning'] }],
    ['no cache', { ...tier1.on, cache: undefined }],
    ['off with nothing but state and month', { state: 'off', month: { spentUsd: 0, capUsd: 20 } }],
  ])('%s', async (_name, body) => {
    serveBody(body);
    renderWithProviders(<Tier1Panel />);
    const panel = await screen.findByTestId('tier1-panel');
    expect(panel).not.toHaveTextContent(/undefined|NaN|\[object Object\]/);
    expect(screen.queryByTestId('error-boundary')).not.toBeInTheDocument();
  });

  it('shows the count and what is left when the body leaves them out', async () => {
    serveBody({ ...tier1.on, month: { spentUsd: 4.2, capUsd: 20 } });
    renderWithProviders(<Tier1Panel />);
    expect(await screen.findByTestId('tier1-spend')).toHaveTextContent('$15.80 left · 0 cards');
  });
});
