// @vitest-environment happy-dom

import { describe, it, expect, vi } from 'vitest';
import { screen } from '@testing-library/react';

import { NeighborhoodGraphView, handleNeighborhoodNodeClick } from '@/apps/embedded/ui/NeighborhoodGraphView';
import { renderWithProviders } from '../helpers/renderWithProviders';
import type { NeighborhoodGraph } from '@/apps/embedded/data/neighborhoodGraph';

describe('NeighborhoodGraphView', () => {
  describe('rendering behavior', () => {
    it('renders an empty state when neighborhood is empty', () => {
      const emptyNeighborhood: NeighborhoodGraph = {
        nodes: [],
        edges: [],
        empty: true,
      };

      renderWithProviders(
        <NeighborhoodGraphView neighborhood={emptyNeighborhood} isSpecView={false} />,
      );

      expect(screen.getByTestId('neighborhood-empty-state')).toBeInTheDocument();
      expect(screen.getByTestId('neighborhood-empty-state')).toHaveTextContent('no connections');
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
      const nodes = [
        { id: 'center-uuid', name: 'Center', kind: 'service', layer: 'application', isCenter: true },
        { id: 'neighbor-uuid', name: 'Neighbor', kind: 'resource', layer: 'api', isCenter: false },
      ];

      const navigateToElement = vi.fn();
      const navigateToSpecNode = vi.fn();

      handleNeighborhoodNodeClick('neighbor-uuid', nodes, false, navigateToElement, navigateToSpecNode);

      expect(navigateToElement).toHaveBeenCalledWith('neighbor-uuid', 'api');
      expect(navigateToSpecNode).not.toHaveBeenCalled();
    });

    it('navigates to a neighbor spec node in spec view', () => {
      const nodes = [
        { id: 'application.component', name: 'Component', kind: 'spec node', layer: 'application', isCenter: true },
        { id: 'api.endpoint', name: 'Endpoint', kind: 'spec node', layer: 'api', isCenter: false },
      ];

      const navigateToElement = vi.fn();
      const navigateToSpecNode = vi.fn();

      handleNeighborhoodNodeClick('api.endpoint', nodes, true, navigateToElement, navigateToSpecNode);

      expect(navigateToSpecNode).toHaveBeenCalledWith('api.endpoint', 'api');
      expect(navigateToElement).not.toHaveBeenCalled();
    });

    it('does not navigate when clicking the center node', () => {
      const nodes = [
        { id: 'center-id', name: 'Center', kind: 'component', layer: 'application', isCenter: true },
        { id: 'neighbor-id', name: 'Neighbor', kind: 'component', layer: 'api', isCenter: false },
      ];

      const navigateToElement = vi.fn();
      const navigateToSpecNode = vi.fn();

      handleNeighborhoodNodeClick('center-id', nodes, false, navigateToElement, navigateToSpecNode);

      expect(navigateToElement).not.toHaveBeenCalled();
      expect(navigateToSpecNode).not.toHaveBeenCalled();
    });

    it('does not navigate when node id not found', () => {
      const nodes = [
        { id: 'center-id', name: 'Center', kind: 'component', layer: 'application', isCenter: true },
        { id: 'neighbor-id', name: 'Neighbor', kind: 'component', layer: 'api', isCenter: false },
      ];

      const navigateToElement = vi.fn();
      const navigateToSpecNode = vi.fn();

      handleNeighborhoodNodeClick('nonexistent-id', nodes, false, navigateToElement, navigateToSpecNode);

      expect(navigateToElement).not.toHaveBeenCalled();
      expect(navigateToSpecNode).not.toHaveBeenCalled();
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
