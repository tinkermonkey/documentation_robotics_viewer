// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { NeighborhoodGraphView } from '@/apps/embedded/ui/NeighborhoodGraphView';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';
import type { NeighborhoodGraph } from '@/apps/embedded/data/neighborhoodGraph';

describe('NeighborhoodGraphView', () => {
  describe('rendering behavior', () => {
    it('renders nothing when neighborhood is empty', () => {
      const emptyNeighborhood: NeighborhoodGraph = {
        nodes: [],
        edges: [],
        empty: true,
      };

      const { container } = renderWithProviders(
        <NeighborhoodGraphView neighborhood={emptyNeighborhood} isSpecView={false} />,
      );

      expect(container.firstChild).toBeNull();
    });

    it('renders the graph container when neighborhood has nodes', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'center-id', name: 'Center Node', kind: 'component', layer: 'application', isCenter: true },
          { id: 'neighbor-id', name: 'Neighbor Node', kind: 'component', layer: 'api', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-1',
            predicate: 'calls',
            direction: 'out',
            targetId: 'neighbor-id',
          },
        ],
        empty: false,
      };

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={false} />,
      );

      expect(screen.getByTestId('neighborhood-graph-view')).toBeInTheDocument();
    });
  });

  describe('navigation on neighbor click', () => {
    it('navigates to a neighbor element in model view', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'center-uuid', name: 'Center', kind: 'service', layer: 'application', isCenter: true },
          { id: 'neighbor-uuid', name: 'Neighbor', kind: 'resource', layer: 'api', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-1',
            predicate: 'uses',
            direction: 'out',
            targetId: 'neighbor-uuid',
          },
        ],
        empty: false,
      };

      const store = useUiStore.getState();
      const navigateSpy = vi.spyOn(store, 'navigateToElement');

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={false} />,
      );

      store.navigateToElement('neighbor-uuid', 'api');
      expect(navigateSpy).toHaveBeenCalledWith('neighbor-uuid', 'api');

      navigateSpy.mockRestore();
    });

    it('navigates to a neighbor spec node in spec view', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'application.component', name: 'Component', kind: 'spec node', layer: 'application', isCenter: true },
          { id: 'api.endpoint', name: 'Endpoint', kind: 'spec node', layer: 'api', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-1',
            predicate: 'exposes',
            direction: 'out',
            targetId: 'api.endpoint',
          },
        ],
        empty: false,
      };

      const store = useUiStore.getState();
      const navigateSpy = vi.spyOn(store, 'navigateToSpecNode');

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={true} />,
      );

      store.navigateToSpecNode('api.endpoint', 'api');
      expect(navigateSpy).toHaveBeenCalledWith('api.endpoint', 'api');

      navigateSpy.mockRestore();
    });

    it('does not navigate when clicking the center node', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'center-id', name: 'Center', kind: 'component', layer: 'application', isCenter: true },
          { id: 'neighbor-id', name: 'Neighbor', kind: 'component', layer: 'api', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-1',
            predicate: 'calls',
            direction: 'out',
            targetId: 'neighbor-id',
          },
        ],
        empty: false,
      };

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={false} />,
      );

      expect(screen.getByTestId('neighborhood-graph-view')).toBeInTheDocument();
    });
  });

  describe('incoming and outgoing edges', () => {
    it('renders edges in both directions correctly', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'center-id', name: 'Center', kind: 'component', layer: 'application', isCenter: true },
          { id: 'outgoing-id', name: 'Outgoing Neighbor', kind: 'component', layer: 'api', isCenter: false },
          { id: 'incoming-id', name: 'Incoming Neighbor', kind: 'component', layer: 'data-model', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-out',
            predicate: 'calls',
            direction: 'out',
            targetId: 'outgoing-id',
          },
          {
            id: 'edge-in',
            predicate: 'referenced-by',
            direction: 'in',
            targetId: 'incoming-id',
          },
        ],
        empty: false,
      };

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={false} />,
      );

      expect(screen.getByTestId('neighborhood-graph-view')).toBeInTheDocument();
    });
  });

  describe('styling and accessibility', () => {
    it('has proper container styling', () => {
      const neighborhood: NeighborhoodGraph = {
        nodes: [
          { id: 'center-id', name: 'Center', kind: 'component', layer: 'application', isCenter: true },
          { id: 'neighbor-id', name: 'Neighbor', kind: 'component', layer: 'api', isCenter: false },
        ],
        edges: [
          {
            id: 'edge-1',
            predicate: 'calls',
            direction: 'out',
            targetId: 'neighbor-id',
          },
        ],
        empty: false,
      };

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={neighborhood} isSpecView={false} />,
      );

      const container = screen.getByTestId('neighborhood-graph-view');
      expect(container).toHaveStyle({
        height: '280px',
        width: '100%',
        position: 'relative',
        borderRadius: '8px',
        marginBottom: '20px',
      });
    });
  });
});
