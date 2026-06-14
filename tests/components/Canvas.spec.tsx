// @vitest-environment happy-dom
/**
 * Canvas.spec.tsx — the center pane PageHeader + GraphCanvas composition.
 *
 * Renders the REAL Canvas (Heimdall PageHeader + GraphCanvas) with the REAL
 * data hooks against MSW fixtures. We assert OUR composition: the right eyebrow
 * (INSTANCE MODEL / META-MODEL), title, id chip, and meta per view, and that
 * the GraphCanvas receives the right layer's nodes and REMOUNTS when the
 * view/layer key changes. We do NOT assert pixel positions (happy-dom returns
 * 0 for measurements; Heimdall's internal layout is its own concern).
 */

import { describe, it, expect } from 'vitest';
import { screen, waitFor } from '@testing-library/react';

import { Canvas } from '@/apps/embedded/ui/Canvas';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

/** Number of graph node elements currently rendered in the canvas. */
function graphNodeCount(): number {
  return document.querySelectorAll('[data-testid^="graph-node-"]').length;
}

describe('Canvas — empty state', () => {
  it('shows the model empty hint when no layer is selected', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');

    expect(await screen.findByTestId('canvas-empty')).toHaveTextContent(
      'select a layer to view its instance model',
    );
    // Title falls back to 'Model'; no graph nodes.
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Model');
    expect(graphNodeCount()).toBe(0);
  });
});

describe('Canvas — Model view PageHeader', () => {
  it('renders INSTANCE MODEL eyebrow, layer title, id chip and element meta', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');

    // Eyebrow = "INSTANCE MODEL · {standard}".
    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent(
        'INSTANCE MODEL · ArchiMate 3.2',
      ),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application');
    expect(screen.getByTestId('page-header-id-chip')).toHaveTextContent('application');

    // Meta reports the live element count (54 application elements).
    await waitFor(() =>
      expect(screen.getByTestId('page-header-actions')).toHaveTextContent('54 elements'),
    );
  });

  it('renders the selected layer graph nodes', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('apm'); // 11 elements (small layer)

    await waitFor(() => expect(graphNodeCount()).toBe(11));
  });
});

describe('Canvas — Schema view PageHeader', () => {
  it('renders META-MODEL eyebrow, "{layer} schema" title and node-type meta', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');

    await waitFor(() =>
      expect(screen.getByTestId('page-header-eyebrow')).toHaveTextContent(
        'META-MODEL · JSON Schema Draft 7',
      ),
    );
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Data Model schema');
    // Meta is "{n} node types · {m} relationships".
    await waitFor(() =>
      expect(screen.getByTestId('page-header-actions')).toHaveTextContent(/node types/),
    );
  });
});

describe('Canvas — keyed remount on view/layer switch', () => {
  it('switching the layer swaps the rendered node set', async () => {
    renderWithProviders(<Canvas />);
    useUiStore.getState().setView('model');

    useUiStore.getState().selectLayer('apm'); // 11 nodes
    await waitFor(() => expect(graphNodeCount()).toBe(11));
    const apmNodeIds = [...document.querySelectorAll('[data-testid^="graph-node-"]')].map(
      (n) => n.getAttribute('data-testid'),
    );

    useUiStore.getState().selectLayer('data-store'); // 9 nodes
    await waitFor(() => expect(graphNodeCount()).toBe(9));
    const storeNodeIds = [...document.querySelectorAll('[data-testid^="graph-node-"]')].map(
      (n) => n.getAttribute('data-testid'),
    );

    // The new layer's nodes are entirely different (the key remounted the canvas).
    expect(storeNodeIds.some((id) => apmNodeIds.includes(id))).toBe(false);
  });

  it('switching Model→Schema for one layer swaps instances for node-types', async () => {
    renderWithProviders(<Canvas />);

    // Model view, application layer: 54 instance nodes.
    useUiStore.getState().setView('model');
    useUiStore.getState().selectLayer('application');
    await waitFor(() => expect(graphNodeCount()).toBe(54));
    expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application');

    // Schema view, same layer: node-types (9), title becomes "{layer} schema".
    useUiStore.getState().setView('spec');
    await waitFor(() =>
      expect(screen.getByTestId('page-header-title')).toHaveTextContent('Application schema'),
    );
    await waitFor(() => expect(graphNodeCount()).toBe(9));
  });
});
