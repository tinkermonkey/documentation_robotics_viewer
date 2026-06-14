// @vitest-environment happy-dom
/**
 * NavTree.spec.tsx — the 3-level navigation tree (Section → Layer → Leaf).
 *
 * Renders the REAL NavTree + the REAL data hooks against MSW-served fixtures.
 * Counts come from the live model/spec/changeset payloads; clicks drive the
 * real `uiStore`. We assert what a user sees (rows, counts, active state) and
 * that interactions update presentation state — not implementation details.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { NavTree } from '@/apps/embedded/ui/NavTree';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';
import { renderWithProviders } from '../helpers/renderWithProviders';

import model from '../fixtures/model.json';
import changesets from '../fixtures/changesets.json';

/** Per-layer model element counts from the raw fixture, keyed by slug. */
function modelCountsByLayer(): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const n of model.nodes) {
    counts[n.layer_id] = (counts[n.layer_id] ?? 0) + 1;
  }
  return counts;
}

describe('NavTree — sections', () => {
  it('renders all three sections (Model / Schema / Changesets)', async () => {
    renderWithProviders(<NavTree />);

    expect(await screen.findByText('Model')).toBeInTheDocument();
    expect(screen.getByText('Schema')).toBeInTheDocument();
    expect(screen.getByText('Changesets')).toBeInTheDocument();
  });

  it('shows 12 on the Model section and the live changeset count on Changesets', async () => {
    renderWithProviders(<NavTree />);

    // The Model section row reports 12 layers.
    const modelRow = (await screen.findByText('Model')).closest('button')!;
    expect(within(modelRow).getByText('12')).toBeInTheDocument();

    // The Changesets section reports the live fixture count (3).
    const changesetCount = Object.keys(changesets.changesets).length;
    expect(changesetCount).toBe(3);
    const changesetsRow = screen.getByText('Changesets').closest('button')!;
    await waitFor(() =>
      expect(within(changesetsRow).getByText(String(changesetCount))).toBeInTheDocument(),
    );
  });
});

describe('NavTree — Model layers', () => {
  it('expands the Model section into 12 layer rows', async () => {
    renderWithProviders(<NavTree />);

    // Model is expanded by default in the initial store state — wait for data.
    await screen.findByText('Model');

    // All 12 layer rows render as depth-1 nav items. Leaf (element) rows ALSO
    // carry `nav-item--depth-1` but add the `drv-nav-l2` marker class, so we
    // exclude those to count layer rows specifically — robust even if a layer
    // is expanded and renders leaves.
    await waitFor(() => {
      const layerRows = document
        .querySelector('[data-testid="nav-tree"]')!
        .querySelectorAll('.nav-item--depth-1:not(.drv-nav-l2)');
      expect(layerRows.length).toBe(LAYER_ORDER.length);
    });
  });

  it('each Model layer row shows its live element count', async () => {
    renderWithProviders(<NavTree />);

    const counts = modelCountsByLayer();

    // Wait for the model query to resolve so counts populate (initially 0).
    await waitFor(() => {
      const motivationRow = screen.getAllByText('Motivation')[0].closest('button')!;
      expect(within(motivationRow).getByText(String(counts.motivation))).toBeInTheDocument();
    });

    // Spot-check representative layers by their (label, count) pairing.
    const applicationRow = screen.getAllByText('Application')[0].closest('button')!;
    expect(within(applicationRow).getByText(String(counts.application))).toBeInTheDocument();

    const apiRow = screen.getAllByText('API')[0].closest('button')!;
    expect(within(apiRow).getByText(String(counts.api))).toBeInTheDocument();
  });

  it('expands a layer to reveal its element leaves', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await screen.findByText('Motivation');

    // Expand the motivation layer row.
    const motivationRow = screen.getAllByText('Motivation')[0].closest('button')!;
    await user.click(motivationRow);

    // A known motivation element name appears as a leaf.
    expect(
      await screen.findByText('Visualize Multi-Layer Architecture Models'),
    ).toBeInTheDocument();

    // The store reflects the selected layer.
    expect(useUiStore.getState().layerId).toBe('motivation');
    expect(useUiStore.getState().expandedLayers.has('model:motivation')).toBe(true);
  });
});

describe('NavTree — clicks drive the uiStore', () => {
  it('clicking the Schema section switches the view to spec', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await user.click(await screen.findByText('Schema'));

    expect(useUiStore.getState().view).toBe('spec');
    expect(useUiStore.getState().expandedSections.has('spec')).toBe(true);
  });

  it('clicking a layer row sets layerId + selects no node', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    const businessRow = (await screen.findAllByText('Business'))[0].closest('button')!;
    await user.click(businessRow);

    expect(useUiStore.getState().view).toBe('model');
    expect(useUiStore.getState().layerId).toBe('business');
    expect(useUiStore.getState().selectedId).toBeNull();
  });

  it('clicking a leaf selects that element and marks the row active', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    await screen.findByText('Motivation');
    await user.click(screen.getAllByText('Motivation')[0].closest('button')!);

    const leaf = await screen.findByText('Visualize Multi-Layer Architecture Models');
    await user.click(leaf);

    // The store now holds the element's UUID (leaf id for model = node UUID).
    expect(useUiStore.getState().selectedId).toBe(
      '462e2931-4c7c-4051-a9ac-8817c270d650',
    );
    // The active row carries the active class.
    await waitFor(() =>
      expect(leaf.closest('button')).toHaveClass('nav-item--active'),
    );
  });

  it('clicking a changeset leaf selects it and switches to the changesets view', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Expand the Changesets section.
    await user.click(await screen.findByText('Changesets'));

    // The fixture's newest changeset name renders as a leaf and is clickable.
    const csName = 'pr-497-data-pipeline-updates';
    const leaf = await screen.findByText(csName);
    await user.click(leaf);

    expect(useUiStore.getState().view).toBe('changesets');
    expect(useUiStore.getState().changesetId).toBeTruthy();
  });
});

describe('NavTree — Schema counts differ from Model', () => {
  it('Schema layer counts come from spec node-types (data-model non-zero)', async () => {
    const user = userEvent.setup();
    renderWithProviders(<NavTree />);

    // Switch to Schema and expand it.
    await user.click(await screen.findByText('Schema'));

    // data-model has node-types in the spec even though its model layer differs.
    const dataModelRow = (await screen.findAllByText('Data Model'))[0].closest('button')!;
    const countText = within(dataModelRow)
      .getAllByText(/^\d+$/)[0]
      .textContent!.trim();
    expect(Number(countText)).toBeGreaterThan(0);
  });
});
