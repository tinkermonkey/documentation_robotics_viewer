// @vitest-environment happy-dom
/**
 * useViewportHistory.spec.tsx — the record/restore split: viewports the
 * canvas reports go into uiStore.graphViewport and are NOT applied back to
 * the canvas; a viewport that arrives from outside (the router, on
 * back/forward) is applied with a silent setViewport. The live GraphCanvas
 * behaviour (dwell timing, centerOnSelect interplay) is covered in
 * tests/e2e/routing.spec.ts.
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import type { GraphViewportHandle, GraphViewportSnapshot } from '@tinkermonkey/heimdall-ui';
import { useViewportHistory } from '@/apps/embedded/ui/useViewportHistory';
import { useUiStore } from '@/apps/embedded/ui/uiStore';

const KEY = 'model:application:organic:default:card:true';

function snapshot(x: number, y: number, zoom: number): GraphViewportSnapshot {
  return { center: { x, y }, zoom, bounds: { minX: 0, minY: 0, maxX: 0, maxY: 0 } };
}

function setup(key = KEY) {
  const setViewport = vi.fn();
  const hook = renderHook(({ k }) => useViewportHistory(k), { initialProps: { k: key } });
  const handle: GraphViewportHandle = { setViewport, getViewport: () => null };
  (hook.result.current.viewportRef as { current: GraphViewportHandle | null }).current = handle;
  return { ...hook, setViewport };
}

beforeEach(() => {
  useUiStore.setState({ graphViewport: null });
});

describe('useViewportHistory', () => {
  it('records a dwell, rounded and scoped to the canvas, without applying it back', () => {
    const { result, setViewport } = setup();
    act(() => result.current.onViewportDwell(snapshot(10.04, -3.06, 0.372512)));
    expect(useUiStore.getState().graphViewport).toEqual({
      scope: KEY,
      center: { x: 10, y: -3.1 },
      zoom: 0.3725,
    });
    expect(setViewport).not.toHaveBeenCalled();
  });

  it('records canvas moves except the mount fit', () => {
    const { result } = setup();
    act(() => result.current.onViewportNavigate(snapshot(1, 1, 1), { kind: 'fit', reason: 'mount' }));
    expect(useUiStore.getState().graphViewport).toBeNull();
    act(() =>
      result.current.onViewportNavigate(snapshot(5, 6, 0.5), { kind: 'center-on-select', nodeId: 'n1' }),
    );
    expect(useUiStore.getState().graphViewport?.center).toEqual({ x: 5, y: 6 });
    act(() => result.current.onViewportNavigate(snapshot(7, 8, 0.5), { kind: 'fit', reason: 'toolbar' }));
    expect(useUiStore.getState().graphViewport?.center).toEqual({ x: 7, y: 8 });
  });

  it('applies a viewport set from outside silently, once', () => {
    const { rerender, setViewport } = setup();
    act(() => useUiStore.getState().setGraphViewport({ scope: KEY, center: { x: 3, y: 4 }, zoom: 0.8 }));
    rerender({ k: KEY });
    expect(setViewport).toHaveBeenCalledTimes(1);
    expect(setViewport).toHaveBeenCalledWith({ center: { x: 3, y: 4 }, zoom: 0.8 }, { silent: true, animate: true });
  });

  it('ignores a viewport scoped to another canvas, and offers a matching one as initialViewport', () => {
    const { result, setViewport, rerender } = setup();
    act(() =>
      useUiStore.getState().setGraphViewport({ scope: 'model:business:organic:default:card:true', center: { x: 3, y: 4 }, zoom: 0.8 }),
    );
    expect(setViewport).not.toHaveBeenCalled();
    expect(result.current.initialViewport).toBeUndefined();

    rerender({ k: 'model:business:organic:default:card:true' });
    expect(result.current.initialViewport).toEqual({ center: { x: 3, y: 4 }, zoom: 0.8 });
  });
});
