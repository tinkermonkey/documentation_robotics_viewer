// @vitest-environment happy-dom
/**
 * useEdgeInteraction.spec.tsx — the hook's own prop-bag wiring:
 * `edgeSelectionProps` mirrors `uiStore.selectedEdgeId`/`selectEdge`. That's
 * the hook's whole surface now — see its own doc comment for why there's no
 * hover half to test here (hover deliberately doesn't touch this hook or
 * `uiStore.highlightedEdgeId` at all). The "does GraphCanvas actually call
 * `onEdgeSelect` on click and render `edgeTooltip` on hover" half is covered
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
