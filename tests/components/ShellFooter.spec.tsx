// @vitest-environment happy-dom
/**
 * ShellFooter.spec.tsx — the versions the shell footer shows (#573): the rail's
 * SPEC from the spec manifest, the status bar's cli from /health's cliVersion,
 * and "—" when the server sends none — never the API's own 0.1.0.
 *
 * Renders the REAL LeftRail + StatusBar with the REAL data hooks against MSW.
 */

import { describe, it, expect, vi } from 'vitest';
import { act, screen } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { LeftRail } from '@/apps/embedded/ui/LeftRail';
import { StatusBar } from '@/apps/embedded/ui/StatusBar';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';
import { websocketClient } from '@/apps/embedded/services/websocketClient';
import { installMockWebSocket, latestSocket, resetMockWebSockets, restoreWebSocket } from '../helpers/mockWebSocket';

function renderFooter() {
  return renderWithProviders(
    <>
      <LeftRail />
      <StatusBar />
    </>,
  );
}

describe('shell footer', () => {
  it("shows the spec manifest's version and the CLI version /health reports", async () => {
    mswServer.use(
      http.get('*/health', () => HttpResponse.json({ status: 'ok', version: '0.1.0', cliVersion: '0.5.0' })),
      http.get('*/api/spec', () =>
        HttpResponse.json({
          version: '0.1.0',
          type: 'schema-collection',
          description: '',
          source: 'dr-cli',
          schemaCount: 2,
          schemas: { 'manifest.json': { specVersion: '0.13.0' }, 'api.json': { specVersion: '0.13.0' } },
        }),
      ),
    );
    renderFooter();
    expect(await screen.findByText('SPEC 0.13.0')).toBeInTheDocument();
    expect(await screen.findByText('cli 0.5.0 · refs ok')).toBeInTheDocument();
    expect(screen.queryByText(/0\.1\.0/)).not.toBeInTheDocument();
  });

  it('shows — when the server sends no spec or CLI version', async () => {
    let healthAsked = false;
    let specAsked = false;
    mswServer.use(
      http.get('*/health', () => {
        healthAsked = true;
        return HttpResponse.json({ status: 'ok', version: '0.1.0' });
      }),
      http.get('*/api/spec', () => {
        specAsked = true;
        return HttpResponse.json({ version: '0.1.0', type: 'schema-collection', description: '', source: 'dr-cli', schemaCount: 0, schemas: {} });
      }),
    );
    renderFooter();
    await vi.waitFor(() => expect(healthAsked && specAsked).toBe(true));
    // Let both answers render: the footer must still read "—", not the 0.1.0 they carry.
    await new Promise((r) => setTimeout(r, 50));
    expect(screen.getByTestId('rail-spec-version')).toHaveTextContent('SPEC —');
    expect(screen.getByTestId('status-cli-version')).toHaveTextContent('cli — · refs ok');
    expect(screen.queryByText(/0\.1\.0/)).not.toBeInTheDocument();
  });
});

describe('status bar: a commit started elsewhere (#628)', () => {
  it('shows the progress the CLI or DrBot reports for a commit, compactly', async () => {
    resetMockWebSockets();
    const previous = installMockWebSocket();
    websocketClient.connect();
    const socket = latestSocket()!;
    socket.simulateOpen();
    try {
      renderFooter();
      expect(screen.queryByTestId('status-commit-progress')).not.toBeInTheDocument();
      act(() =>
        socket.simulateMessage({
          type: 'changeset.commit.progress',
          changesetId: 'from-cli',
          applied: 340,
          total: 1200,
          phase: 'applying',
          project: 'test-project',
          checkout: 'main',
        }),
      );
      const item = await screen.findByTestId('status-commit-progress');
      expect(item).toHaveTextContent('Applying 340 of 1,200 changes · applying');
      expect(item.querySelector('[role="progressbar"]')).toHaveAttribute('aria-valuenow', '340');
    } finally {
      websocketClient.disconnect();
      restoreWebSocket(previous);
    }
  });
});
