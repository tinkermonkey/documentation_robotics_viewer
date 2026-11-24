// @vitest-environment happy-dom
/**
 * FirstLoad.spec.tsx — the shell while its first reads are pending (#636).
 *
 * Renders the REAL NavTree, Canvas, LeftRail and StatusBar with the REAL data
 * hooks, with MSW holding `/api/model`, `/api/spec`, the changeset list and
 * `/health` until the test releases them. While held, each region says
 * "Loading…" (or `…`) and shows no count; released, the real counts appear; a
 * failed first read shows an error, never "empty"; and a background refetch
 * never takes a loaded region back to Loading.
 */

import { describe, it, expect, afterEach } from 'vitest';
import { act, screen, waitFor, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';

import { NavTree } from '@/apps/embedded/ui/NavTree';
import { Canvas } from '@/apps/embedded/ui/Canvas';
import { LeftRail } from '@/apps/embedded/ui/LeftRail';
import { StatusBar } from '@/apps/embedded/ui/StatusBar';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { loadStateOf, combineLoadStates } from '@/apps/embedded/data/loadState';
import { renderWithProviders } from '../helpers/renderWithProviders';
import { mswServer } from '../helpers/mswServer';

import model from '../fixtures/model.json';
import spec from '../fixtures/spec.json';
import changesets from '../fixtures/changesets.json';

const MODEL = '*/api/projects/:project/checkouts/:checkout/model';
const CHANGESETS = '*/api/projects/:project/checkouts/:checkout/changesets';
const SPEC = '*/api/spec';
const HEALTH = '*/health';

/** A gate the held handlers wait on; `pending` counts requests waiting at it. */
function gate() {
  let open!: () => void;
  const opened = new Promise<void>((resolve) => {
    open = resolve;
  });
  const state = { pending: 0 };
  const hold = async (body: unknown) => {
    state.pending += 1;
    await opened;
    state.pending -= 1;
    return HttpResponse.json(body as Record<string, unknown>);
  };
  return { open, hold, state };
}

/** Hold the model, spec, changesets and /health reads until `open()`. */
function holdAllReads() {
  const g = gate();
  mswServer.use(
    http.get(MODEL, () => g.hold(model)),
    http.get(SPEC, () => g.hold(spec)),
    http.get(CHANGESETS, () => g.hold(changesets)),
    http.get(HEALTH, () => g.hold({ status: 'ok', version: '0.1.0', cliVersion: '9.9.9' })),
  );
  return g;
}

const modelCount = (layer: string) => model.nodes.filter((n) => n.layer_id === layer).length;
const changesetCount = Object.keys(changesets.changesets).length;

afterEach(() => mswServer.resetHandlers());

describe('loadState', () => {
  it('reads data in hand as ready, even while refetching or after a failed refetch', () => {
    expect(loadStateOf({ data: undefined, isError: false })).toBe('loading');
    expect(loadStateOf({ data: undefined, isError: true })).toBe('error');
    expect(loadStateOf({ data: { nodes: [] }, isError: false })).toBe('ready');
    expect(loadStateOf({ data: { nodes: [] }, isError: true })).toBe('ready');
  });

  it('combines reads: an error wins, then loading', () => {
    expect(combineLoadStates('ready', 'loading', 'error')).toBe('error');
    expect(combineLoadStates('ready', 'loading')).toBe('loading');
    expect(combineLoadStates('ready', 'ready')).toBe('ready');
  });
});

describe('NavTree — first load', () => {
  it('says Loading… with no counts until the reads answer, then shows the real counts', async () => {
    const g = holdAllReads();
    renderWithProviders(<NavTree />);
    act(() => {
      useUiStore.setState({ expandedSections: new Set(['model', 'changesets']) });
    });

    const tree = screen.getByTestId('nav-tree');
    expect(tree).toHaveAttribute('aria-busy', 'true');
    const status = await screen.findByTestId('nav-changesets-status');
    expect(status).toHaveAttribute('role', 'status');
    expect(status).toHaveTextContent('Loading…');
    expect(screen.queryByText('no changesets')).not.toBeInTheDocument();
    // No count on the Changesets section or on any Model layer: no "0" anywhere.
    const changesetsRow = screen.getByText('Changesets').closest('button')!;
    expect(changesetsRow.querySelector('.nav-item__count')).toBeNull();
    const motivation = screen.getByText('Motivation').closest('button')!;
    expect(motivation.querySelector('.nav-item__count')).toBeNull();
    expect(within(tree).queryByText('0')).not.toBeInTheDocument();

    await act(async () => g.open());

    await waitFor(() => expect(within(changesetsRow).getByText(String(changesetCount))).toBeInTheDocument());
    await waitFor(() =>
      expect(within(motivation).getByText(String(modelCount('motivation')))).toBeInTheDocument(),
    );
    expect(screen.queryByTestId('nav-changesets-status')).not.toBeInTheDocument();
    expect(tree).not.toHaveAttribute('aria-busy');
  });

  it('says Loading… under an open Model layer until the model answers', async () => {
    const g = holdAllReads();
    renderWithProviders(<NavTree />);
    act(() => {
      useUiStore.setState({ expandedLayers: new Set(['model:motivation']) });
    });
    expect(await screen.findByText('Loading…')).toBeInTheDocument();
    await act(async () => g.open());
    await waitFor(() => expect(screen.queryByText('Loading…')).not.toBeInTheDocument());
  });

  it('shows a failed first changesets read as an error, never "no changesets"', async () => {
    mswServer.use(http.get(CHANGESETS, () => HttpResponse.json({ error: 'boom' }, { status: 500 })));
    renderWithProviders(<NavTree />);
    act(() => {
      useUiStore.setState({ expandedSections: new Set(['changesets']) });
    });

    const status = await screen.findByTestId('nav-changesets-status');
    await waitFor(() => expect(status).toHaveTextContent('could not load changesets'));
    expect(status).toHaveAttribute('role', 'alert');
    expect(screen.queryByText('no changesets')).not.toBeInTheDocument();
    const changesetsRow = screen.getByText('Changesets').closest('button')!;
    expect(changesetsRow.querySelector('.nav-item__count')).toBeNull();
  });

  it('keeps its counts through a background refetch (no flash back to Loading…)', async () => {
    const { client } = renderWithProviders(<NavTree />);
    act(() => {
      useUiStore.setState({ expandedSections: new Set(['model', 'changesets']) });
    });
    const changesetsRow = screen.getByText('Changesets').closest('button')!;
    await waitFor(() => expect(within(changesetsRow).getByText(String(changesetCount))).toBeInTheDocument());

    const g = holdAllReads();
    await act(async () => {
      void client.invalidateQueries();
    });
    await waitFor(() => expect(g.state.pending).toBeGreaterThan(0));

    expect(screen.queryByText('Loading…')).not.toBeInTheDocument();
    expect(screen.queryByTestId('nav-changesets-status')).not.toBeInTheDocument();
    expect(within(changesetsRow).getByText(String(changesetCount))).toBeInTheDocument();
    expect(screen.getByTestId('nav-tree')).not.toHaveAttribute('aria-busy');
    await act(async () => g.open());
  });
});

describe('Canvas — first load', () => {
  it('shows Loading… and no element count until the model answers', async () => {
    const g = holdAllReads();
    renderWithProviders(<Canvas />);
    act(() => {
      useUiStore.getState().setView('model');
      useUiStore.getState().selectLayer('motivation');
    });

    const status = await screen.findByTestId('canvas-load-status');
    expect(status).toHaveAttribute('role', 'status');
    await waitFor(() => expect(status).toHaveTextContent('Loading…'));
    expect(screen.queryByText('no elements in this layer')).not.toBeInTheDocument();
    expect(screen.getByTestId('canvas-meta')).toHaveTextContent('…');
    expect(screen.getByTestId('canvas-meta')).not.toHaveTextContent('0 elements');

    await act(async () => g.open());
    await waitFor(() =>
      expect(screen.getByTestId('canvas-meta')).toHaveTextContent(`${modelCount('motivation')} elements`),
    );
    expect(screen.queryByTestId('canvas-load-status')).not.toBeInTheDocument();
  });

  it('shows Loading… in page mode instead of a page built from nothing', async () => {
    const g = holdAllReads();
    renderWithProviders(<Canvas />);
    act(() => {
      useUiStore.getState().setView('model');
      useUiStore.getState().selectLayer('motivation');
      useUiStore.getState().setMode('page');
    });

    expect(await screen.findByTestId('canvas-load-status')).toBeInTheDocument();
    expect(screen.queryByTestId('page-view')).not.toBeInTheDocument();
    await act(async () => g.open());
    expect(await screen.findByTestId('page-view')).toBeInTheDocument();
  });

  it('says the model could not be loaded when its first read fails', async () => {
    // A 404 is "checkout missing": useModel doesn't retry it.
    mswServer.use(http.get(MODEL, () => HttpResponse.json({ error: 'not found' }, { status: 404 })));
    renderWithProviders(<Canvas />);
    act(() => {
      useUiStore.getState().setView('model');
      useUiStore.getState().selectLayer('motivation');
    });

    const status = await screen.findByTestId('canvas-load-status');
    await waitFor(() => expect(status).toHaveTextContent('The model could not be loaded.'));
    expect(status).toHaveAttribute('role', 'alert');
    expect(screen.queryByText('no elements in this layer')).not.toBeInTheDocument();
  });
});

describe('LeftRail and StatusBar — first load', () => {
  it('say … until /api/spec, /api/model and /health answer, then the real versions and counts', async () => {
    const g = holdAllReads();
    renderWithProviders(
      <>
        <LeftRail />
        <StatusBar />
      </>,
    );

    expect(screen.getByTestId('rail-spec-version')).toHaveTextContent('SPEC …');
    expect(screen.getByTestId('rail-counts')).toHaveTextContent('…');
    expect(screen.getByTestId('rail-counts')).not.toHaveTextContent('0 layers');
    expect(screen.getByTestId('rail-footer')).toHaveAttribute('aria-busy', 'true');
    expect(screen.getByTestId('status-cli-version')).toHaveTextContent('cli … · refs ok');
    expect(screen.getByTestId('status-elements')).toHaveTextContent('loading model…');

    await act(async () => g.open());

    await waitFor(() =>
      expect(screen.getByTestId('rail-counts')).toHaveTextContent(`layers · ${model.links.length} rels`),
    );
    expect(screen.getByTestId('rail-spec-version')).not.toHaveTextContent('…');
    expect(screen.getByTestId('rail-footer')).not.toHaveAttribute('aria-busy');
    await waitFor(() => expect(screen.getByTestId('status-cli-version')).toHaveTextContent('cli 9.9.9'));
    expect(screen.getByTestId('status-elements')).toHaveTextContent(`${model.nodes.length} elements`);
  });

  it('keeps "—" for a /health that sends no cliVersion once it has answered', async () => {
    renderWithProviders(<StatusBar />);
    await waitFor(() => expect(screen.getByTestId('status-cli-version')).toHaveTextContent('cli — · refs ok'));
  });
});
