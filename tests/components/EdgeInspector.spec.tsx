// @vitest-environment happy-dom
/**
 * EdgeInspector.spec.tsx — the selected-edge sidebar detail (ui/EdgeInspector.tsx),
 * rendered through the real `Inspector` with real data hooks against MSW
 * fixtures (same pattern as Inspector.spec.tsx). Covers Phase 5's hover
 * tooltip wiring: the source/destination sections' interactive kind badges
 * and the edge's own interactive predicate badge.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, fireEvent } from '@testing-library/react';

import { Inspector } from '@/apps/embedded/ui/Inspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

// apm layer, "WebSocket Disconnect Alert" (alert) --monitors--> "WebSocket
// Connection State Gauge" (metricinstrument) — verified against the model fixture
// (same edge Canvas.spec.tsx's edge-selection suite uses).
const EDGE_ID =
  'rel:apm.alert.web-socket-disconnect-alert:apm.metricinstrument.web-socket-connection-state-gauge:monitors';

function renderEdgeSelection() {
  const result = renderWithProviders(<Inspector />);
  useUiStore.getState().setView('model');
  useUiStore.getState().selectLayer('apm');
  useUiStore.getState().selectEdge(EDGE_ID);
  return result;
}

describe('EdgeInspector — node type tooltips on source/destination kind badges', () => {
  it('shows the source element type NodeTypeTooltip on hover/focus', async () => {
    renderEdgeSelection();

    const badge = await screen.findByTestId('edge-inspector-source-type-tooltip');
    expect(within(badge).getByText('alert')).toBeInTheDocument();

    fireEvent.focus(within(badge).getByText('alert'));
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('Alert')).toBeInTheDocument();
  });

  it('shows the destination element type NodeTypeTooltip on hover/focus', async () => {
    renderEdgeSelection();

    const badge = await screen.findByTestId('edge-inspector-destination-type-tooltip');
    expect(within(badge).getByText('metricinstrument')).toBeInTheDocument();

    fireEvent.focus(within(badge).getByText('metricinstrument'));
    const tooltip = await screen.findByRole('tooltip');
    expect(within(tooltip).getByText('MetricInstrument')).toBeInTheDocument();
  });
});

describe('EdgeInspector — predicate tooltip on the edge badge', () => {
  it('shows the PredicateTooltip with the known definition + type diagram on hover/focus', async () => {
    renderEdgeSelection();

    const badge = await screen.findByTestId('edge-inspector-predicate-tooltip');
    expect(within(badge).getByText('monitors')).toBeInTheDocument();

    fireEvent.focus(within(badge).getByText('monitors'));
    const tooltip = await screen.findByRole('tooltip');
    expect(
      within(tooltip).getByText('Element observes or tracks another element'),
    ).toBeInTheDocument();
    const diagram = within(tooltip).getByTestId('edge-inspector-predicate-tooltip-diagram');
    expect(within(diagram).getByText('alert')).toBeInTheDocument();
    expect(within(diagram).getByText('metricinstrument')).toBeInTheDocument();
  });
});
