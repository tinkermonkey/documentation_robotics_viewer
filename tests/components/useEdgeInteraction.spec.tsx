// @vitest-environment happy-dom
/**
 * useEdgeInteraction.spec.tsx — the hook's own prop-bag wiring: `onEdgeHover`
 * drives `uiStore.highlightedEdgeId`, and `edgeSelectionProps` mirrors
 * `uiStore.selectedEdgeId`/`selectEdge`. Since both are now native
 * `GraphCanvas` (heimdall-ui 0.8.0+) props with no DOM-delegation of our own
 * left to test, this just calls the returned handlers/props directly rather
 * than simulating GraphCanvas's internal DOM — the "does GraphCanvas actually
 * call onEdgeHover on pointer-enter and render edgeTooltip" half is covered
 * live against the real component in Canvas.spec.tsx.
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useEdgeInteraction } from '@/apps/embedded/ui/useEdgeInteraction';
import { useUiStore } from '@/apps/embedded/ui/uiStore';

beforeEach(() => {
  useUiStore.setState({ selectedEdgeId: null, highlightedEdgeId: null });
});

describe('useEdgeInteraction', () => {
  it('edgeHoverProps.onEdgeHover(id) sets uiStore.highlightedEdgeId', () => {
    const { result } = renderHook(() => useEdgeInteraction());

    act(() => result.current.edgeHoverProps.onEdgeHover('e1'));
    expect(useUiStore.getState().highlightedEdgeId).toBe('e1');

    act(() => result.current.edgeHoverProps.onEdgeHover('e2'));
    expect(useUiStore.getState().highlightedEdgeId).toBe('e2');
  });

  it('edgeHoverProps.onEdgeHover(undefined) clears uiStore.highlightedEdgeId', () => {
    const { result } = renderHook(() => useEdgeInteraction());

    act(() => result.current.edgeHoverProps.onEdgeHover('e1'));
    expect(useUiStore.getState().highlightedEdgeId).toBe('e1');

    act(() => result.current.edgeHoverProps.onEdgeHover(undefined));
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();
  });

  it('edgeSelectionProps mirrors uiStore.selectedEdgeId and wraps selectEdge', () => {
    const { result, rerender } = renderHook(() => useEdgeInteraction());

    expect(result.current.selectedEdgeId).toBeNull();
    expect(result.current.edgeSelectionProps.selectedEdgeId).toBeUndefined();

    act(() => result.current.edgeSelectionProps.onEdgeSelect('e1'));
    rerender();

    expect(useUiStore.getState().selectedEdgeId).toBe('e1');
    expect(result.current.selectedEdgeId).toBe('e1');
    expect(result.current.edgeSelectionProps.selectedEdgeId).toBe('e1');
  });
});
