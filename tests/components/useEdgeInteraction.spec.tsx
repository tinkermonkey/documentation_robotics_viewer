// @vitest-environment happy-dom
/**
 * useEdgeInteraction.spec.tsx — hover delegation for Model graph edge
 * predicates. Renders a minimal harness that mirrors the exact DOM
 * shape `GraphCanvas` produces for an edge (an outer
 * `[data-testid="graph-edge-<id>"]` wrapping a `.graph-edge__label`), spreads
 * `edgeHoverHandlers` on the container the same way `Canvas.tsx` does, and
 * asserts the hook's returned hover state + `uiStore.highlightedEdgeId`.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/react';
import { useEdgeInteraction } from '@/apps/embedded/ui/useEdgeInteraction';
import { useUiStore } from '@/apps/embedded/ui/uiStore';

function Harness() {
  const { hoveredEdgeId, hoveredEdgeAnchor, edgeHoverHandlers } = useEdgeInteraction();
  return (
    <div {...edgeHoverHandlers} data-testid="container">
      <svg>
        <g data-testid="graph-edge-e1">
          <g className="graph-edge__label" data-testid="label-e1">
            <rect />
            <text data-testid="label-e1-text">monitors</text>
          </g>
        </g>
        <g data-testid="graph-edge-e2">
          <g className="graph-edge__label" data-testid="label-e2">
            <text>depends-on</text>
          </g>
        </g>
        {/* The invisible hit-stroke sits directly under graph-edge-<id> but
            OUTSIDE .graph-edge__label — hovering it must NOT trigger the
            tooltip (only the predicate label itself is a hover target). */}
        <path className="graph-edge__hit" data-testid="hit-e1" />
      </svg>
      <div data-testid="hover-state">
        {hoveredEdgeId ?? 'none'}:{hoveredEdgeAnchor ? 'anchored' : 'no-anchor'}
      </div>
    </div>
  );
}

beforeEach(() => {
  useUiStore.setState({ highlightedEdgeId: null });
  vi.clearAllMocks();
});

describe('useEdgeInteraction', () => {
  it('hovering an edge predicate label sets hoveredEdgeId + an anchor rect, and uiStore.highlightedEdgeId', () => {
    const { getByTestId } = render(<Harness />);

    fireEvent.mouseOver(getByTestId('label-e1-text'));

    expect(getByTestId('hover-state')).toHaveTextContent('e1:anchored');
    expect(useUiStore.getState().highlightedEdgeId).toBe('e1');
  });

  it('moving the pointer off the label (not to a child within it) clears the hover state', () => {
    const { getByTestId } = render(<Harness />);
    const label = getByTestId('label-e1');
    const text = getByTestId('label-e1-text');

    fireEvent.mouseOver(text);
    expect(getByTestId('hover-state')).toHaveTextContent('e1:anchored');

    fireEvent.mouseOut(text, { relatedTarget: document.body });
    expect(getByTestId('hover-state')).toHaveTextContent('none:no-anchor');
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();
    void label;
  });

  it('moving between two children of the SAME label does not clear the hover state', () => {
    const { getByTestId, container } = render(<Harness />);
    const text = getByTestId('label-e1-text');
    const label = getByTestId('label-e1');

    fireEvent.mouseOver(text);
    expect(getByTestId('hover-state')).toHaveTextContent('e1:anchored');

    // relatedTarget is still inside the same .graph-edge__label — no clear.
    fireEvent.mouseOut(text, { relatedTarget: label });
    expect(getByTestId('hover-state')).toHaveTextContent('e1:anchored');
    void container;
  });

  it('hovering the invisible hit-stroke (outside the label) does not set hover state', () => {
    const { getByTestId } = render(<Harness />);

    fireEvent.mouseOver(getByTestId('hit-e1'));

    expect(getByTestId('hover-state')).toHaveTextContent('none:no-anchor');
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();
  });

  it('switching hover from one edge to another updates hoveredEdgeId', () => {
    const { getByTestId } = render(<Harness />);

    fireEvent.mouseOver(getByTestId('label-e1'));
    expect(getByTestId('hover-state')).toHaveTextContent('e1:anchored');

    fireEvent.mouseOver(getByTestId('label-e2'));
    expect(getByTestId('hover-state')).toHaveTextContent('e2:anchored');
    expect(useUiStore.getState().highlightedEdgeId).toBe('e2');
  });

  it('does not log a warning for non-edge hover targets', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { container } = render(<Harness />);

    // Hover over a non-edge element that doesn't have .graph-edge__label
    fireEvent.mouseOver(container);

    // No warnings should be logged for non-edge targets.
    expect(warnSpy).not.toHaveBeenCalled();
    warnSpy.mockRestore();
  });

  it('logs a warning if the data-testid ancestor is missing from the Heimdall DOM structure', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function OrphanLabelHarness() {
      const { edgeHoverHandlers } = useEdgeInteraction();
      return (
        <div {...edgeHoverHandlers} data-testid="container">
          <svg>
            {/* A .graph-edge__label that is NOT a descendant of a [data-testid^="graph-edge-"] */}
            <g className="graph-edge__label" data-testid="orphan-label">
              <text>orphaned-label</text>
            </g>
          </svg>
        </div>
      );
    }

    const { getByTestId } = render(<OrphanLabelHarness />);
    fireEvent.mouseOver(getByTestId('orphan-label'));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('Found .graph-edge__label element but no parent [data-testid^="graph-edge-"] ancestor'),
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });

  it('logs a warning if the edge ID suffix is empty after the prefix', () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});

    function EmptyIdHarness() {
      const { edgeHoverHandlers } = useEdgeInteraction();
      return (
        <div {...edgeHoverHandlers} data-testid="container">
          <svg>
            {/* A [data-testid^="graph-edge-"] element with no suffix */}
            <g data-testid="graph-edge-">
              <g className="graph-edge__label" data-testid="label-empty">
                <text>text</text>
              </g>
            </g>
          </svg>
        </div>
      );
    }

    const { getByTestId } = render(<EmptyIdHarness />);
    fireEvent.mouseOver(getByTestId('label-empty'));

    expect(warnSpy).toHaveBeenCalledWith(
      expect.stringContaining('data-testid="graph-edge-" does not have a non-empty suffix'),
      expect.any(Object),
    );
    warnSpy.mockRestore();
  });
});
