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

import { RichTooltip, TooltipCard, computeTooltipPosition } from '@/apps/embedded/ui/RichTooltip';

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

  it('falls back to a perpendicular side when neither top nor bottom fits', () => {
    // A 300px-tall card around a mid-height anchor in a 400px viewport.
    const short = { width: 1000, height: 400 };
    const anchor = rect({ top: 190, bottom: 210, left: 100, right: 160, width: 60, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 200, height: 300 }, 'top', short);
    expect(pos.placement).toBe('right');
    expect(pos.left).toBe(160 + 8);
    expect(pos.overlapsAnchor).toBe(false);
  });

  it('flags overlapsAnchor when no side fits and clamping covers the trigger', () => {
    // Regression: a tall node-type card covered its page-table link, caught the
    // mouseup, and the link's click never fired.
    const tiny = { width: 300, height: 400 };
    const anchor = rect({ top: 190, bottom: 210, left: 100, right: 160, width: 60, height: 20 });
    const pos = computeTooltipPosition(anchor, { width: 280, height: 300 }, 'top', tiny);
    expect(pos.overlapsAnchor).toBe(true);
  });

  it('does not flag overlapsAnchor for a normal placement', () => {
    const anchor = rect({ top: 300, bottom: 320, left: 400, right: 460, width: 60, height: 20 });
    expect(computeTooltipPosition(anchor, { width: 200, height: 100 }, 'top', viewport).overlapsAnchor).toBe(false);
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

  it('wires aria-describedby on the focusable trigger (not the wrapper) to the open card id', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button>Trigger</button>
      </RichTooltip>,
    );

    const wrapper = screen.getByTestId('tip');
    const button = screen.getByRole('button', { name: 'Trigger' });
    expect(button).not.toHaveAttribute('aria-describedby');

    fireEvent.focus(button);
    const tooltip = screen.getByRole('tooltip');
    // A screen reader reads the description of the focused element.
    expect(button).toHaveAttribute('aria-describedby', tooltip.id);
    expect(button).toHaveAccessibleDescription('Card content');
    expect(wrapper).not.toHaveAttribute('aria-describedby');

    fireEvent.blur(button);
    expect(button).not.toHaveAttribute('aria-describedby');
  });

  it('puts aria-describedby on the wrapper when the trigger has nothing focusable', () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <span>Plain text</span>
      </RichTooltip>,
    );

    const wrapper = screen.getByTestId('tip');
    fireEvent.focus(wrapper);
    expect(wrapper).toHaveAttribute('aria-describedby', screen.getByRole('tooltip').id);
  });

  it("keeps the trigger's own aria-describedby and restores it on close", () => {
    render(
      <RichTooltip content={<span>Card content</span>} data-testid="tip">
        <button aria-describedby="own-hint">Trigger</button>
      </RichTooltip>,
    );

    const button = screen.getByRole('button', { name: 'Trigger' });
    fireEvent.focus(button);
    expect(button).toHaveAttribute('aria-describedby', `own-hint ${screen.getByRole('tooltip').id}`);

    fireEvent.blur(button);
    expect(button).toHaveAttribute('aria-describedby', 'own-hint');
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

describe('TooltipCard — anchor tracking', () => {
  it('hides when its anchor disappears and shows again when it comes back', () => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
    let anchor: DOMRect | null = rect({ top: 300, bottom: 320, left: 300, right: 360, width: 60, height: 20 });
    render(
      <TooltipCard
        getAnchorRect={() => anchor}
        content={<span>Edge hint</span>}
        track
        data-testid="card"
      />,
    );
    const card = screen.getByTestId('card');
    expect(card.style.visibility).toBe('visible');

    anchor = null; // e.g. the hovered edge was filtered out under the pointer
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(card.style.visibility).toBe('hidden');

    anchor = rect({ top: 300, bottom: 320, left: 300, right: 360, width: 60, height: 20 });
    act(() => {
      vi.advanceTimersToNextFrame();
    });
    expect(card.style.visibility).toBe('visible');
    vi.useRealTimers();
  });
});
