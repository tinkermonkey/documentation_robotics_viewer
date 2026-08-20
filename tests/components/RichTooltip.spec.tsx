// @vitest-environment happy-dom
/**
 * RichTooltip.spec.tsx — the portal-based hover/focus tooltip base component
 * (see ui/RichTooltip.tsx). A pure presentational component (no data hooks,
 * no store) rendered directly with Testing Library, same as
 * ModelCardNode.spec.tsx. Covers show/hide (hover with delay, focus
 * immediate, Escape-to-dismiss), the aria-describedby/role="tooltip" wiring,
 * and the `computeTooltipPosition` placement math in isolation.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, render, screen, fireEvent } from '@testing-library/react';

import { RichTooltip, computeTooltipPosition } from '@/apps/embedded/ui/RichTooltip';

function rect(overrides: Partial<DOMRect>): DOMRect {
  return {
    x: 0,
    y: 0,
    width: 0,
    height: 0,
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    toJSON: () => ({}),
    ...overrides,
  } as DOMRect;
}

describe('computeTooltipPosition', () => {
  const viewport = { width: 1000, height: 800 };

  it('places the card above the anchor for the preferred "top" placement when it fits', () => {
    const anchor = rect({ top: 300, bottom: 320, left: 400, right: 460, width: 60, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 100 }, 'top', viewport);
    expect(pos.placement).toBe('top');
    expect(pos.top).toBe(300 - 100 - 8);
    expect(pos.left).toBe(400 + 30 - 100);
  });

  it('flips to "bottom" when "top" has no room', () => {
    const anchor = rect({ top: 10, bottom: 30, left: 400, right: 460, width: 60, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 100 }, 'top', viewport);
    expect(pos.placement).toBe('bottom');
    expect(pos.top).toBe(30 + 8);
  });

  it('flips to "top" when "bottom" has no room', () => {
    const anchor = rect({ top: 750, bottom: 770, left: 400, right: 460, width: 60, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 100 }, 'bottom', viewport);
    expect(pos.placement).toBe('top');
  });

  it('clamps left within the viewport margin near the left edge', () => {
    const anchor = rect({ top: 300, bottom: 320, left: 2, right: 30, width: 28, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 100 }, 'top', viewport);
    expect(pos.left).toBe(8);
  });

  it('clamps left within the viewport margin near the right edge', () => {
    const anchor = rect({ top: 300, bottom: 320, left: 990, right: 998, width: 8, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 100 }, 'top', viewport);
    expect(pos.left).toBe(viewport.width - 200 - 8);
  });
});

describe('RichTooltip — show/hide + accessibility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      vi.runOnlyPendingTimers();
    });
    vi.useRealTimers();
  });

  it('is not rendered until triggered', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens on hover after the open delay and closes after the close delay', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    fireEvent.mouseEnter(screen.getByTestId('tip'));
    // Not yet open — default openDelay is 300ms.
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByRole('tooltip')).toHaveTextContent('Card content');

    fireEvent.mouseLeave(screen.getByTestId('tip'));
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('opens immediately on focus and closes immediately on blur', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    fireEvent.focus(screen.getByTestId('tip'));
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.blur(screen.getByTestId('tip'));
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('wires aria-describedby on the trigger to the open tooltip card id', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    const wrapper = screen.getByTestId('tip');
    expect(wrapper).not.toHaveAttribute('aria-describedby');

    fireEvent.focus(wrapper);
    const tooltip = screen.getByRole('tooltip');
    expect(wrapper).toHaveAttribute('aria-describedby', tooltip.id);
  });

  it('closes on Escape without stealing focus from the trigger', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    // A real keyboard user focuses the interactive trigger itself (not the
    // wrapper span) — the focus event bubbles up to open the tooltip.
    // happy-dom's native `.focus()` moves `document.activeElement` but (unlike
    // a real browser) doesn't reliably dispatch a focus event of its own, so
    // both calls are needed here to get a realistic "the button is actually
    // focused AND React's onFocus fired" state to assert against.
    const button = screen.getByRole('button', { name: 'Trigger' });
    button.focus();
    fireEvent.focus(button);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.keyDown(document, { key: 'Escape' });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
    // Escape only dismisses the card — it must not move focus off the
    // element the keyboard user was already on.
    expect(button).toHaveFocus();
  });

  it('stays open while the pointer moves into the card itself', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    fireEvent.mouseEnter(screen.getByTestId('tip'));
    act(() => {
      vi.advanceTimersByTime(300);
    });
    const card = screen.getByTestId('tip-card');

    fireEvent.mouseLeave(screen.getByTestId('tip'));
    fireEvent.mouseEnter(card);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    fireEvent.mouseLeave(card);
    act(() => {
      vi.advanceTimersByTime(150);
    });
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
