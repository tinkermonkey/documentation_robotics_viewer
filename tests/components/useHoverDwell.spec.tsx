// @vitest-environment happy-dom
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook } from '@testing-library/react';
import { useHoverDwell } from '@/apps/embedded/ui/useHoverDwell';

beforeEach(() => {
  vi.useFakeTimers();
});
afterEach(() => {
  vi.useRealTimers();
});

describe('useHoverDwell', () => {
  it('reports an id only after it has been hovered for the full delay', () => {
    const { result } = renderHook(() => useHoverDwell(3000));
    act(() => result.current.onHover('e1'));
    act(() => vi.advanceTimersByTime(2999));
    expect(result.current.dwelledId).toBeUndefined();
    act(() => vi.advanceTimersByTime(1));
    expect(result.current.dwelledId).toBe('e1');
  });

  it('clears on leave, and moving to another id restarts the wait', () => {
    const { result } = renderHook(() => useHoverDwell(3000));
    act(() => result.current.onHover('e1'));
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.dwelledId).toBe('e1');

    act(() => result.current.onHover('e2'));
    expect(result.current.dwelledId).toBeUndefined();
    act(() => vi.advanceTimersByTime(2000));
    act(() => result.current.onHover(undefined));
    act(() => vi.advanceTimersByTime(3000));
    expect(result.current.dwelledId).toBeUndefined();
  });
});
