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
    expect(within(panel).getByTestId('tier1-spend')).toHaveTextContent('$3.58 left · 11730 cards · resets Dec 1');
    const bar = within(panel).getByRole('progressbar', { name: 'Tier 1 spend this month: $16.42 of $20.00' });
    expect(bar).toHaveAttribute('aria-valuenow', '82');
    expect(within(panel).getByTestId('tier1-near-cap')).toHaveTextContent('used 82% of this checkout');

    const rows = within(panel).getAllByTestId('tier1-source-row');
    expect(rows.map((r) => r.getAttribute('data-source'))).toEqual(['extract', 'classify', 'probe']);
    expect(rows[0]).toHaveTextContent('extract9810$13.73');

    expect(within(panel).getByTestId('tier1-cache')).toHaveTextContent('11402 entries');
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

  it('renders nothing against a dr CLI without /api/tier1, and asks only once', async () => {
    let calls = 0;
    mswServer.use(
      http.get('*/api/tier1', () => {
        calls++;
        return new HttpResponse('404 Not Found', { status: 404 });
      }),
    );
    const { container } = renderWithProviders(<Tier1Panel />);
    await waitFor(() => expect(calls).toBe(1));
    // Let a retry, if there were one, land.
    await new Promise((r) => setTimeout(r, 50));
    expect(calls).toBe(1);
    expect(container).toBeEmptyDOMElement();
  });

  it('renders nothing when the route answers something that is not a Tier 1 status', async () => {
    mswServer.use(http.get('*/api/tier1', () => HttpResponse.text('<!doctype html><html></html>')));
    const { container } = renderWithProviders(<Tier1Panel />);
    await new Promise((r) => setTimeout(r, 50));
    expect(container).toBeEmptyDOMElement();
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
