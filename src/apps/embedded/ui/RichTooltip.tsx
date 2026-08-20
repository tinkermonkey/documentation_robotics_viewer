/**
 * RichTooltip — portal-based, positioned hover/focus card usable by any
 * trigger element (the project-level rich tooltip component). Wraps its
 * `children` (the trigger) in an inline `<span>` that owns the show/hide
 * wiring; the card itself is rendered via `createPortal` into `document.body`
 * so it always paints above the surface that triggered it (the graph canvas,
 * the nav sidebar, or a page view row — see `PredicateTooltip` /
 * `NodeTypeTooltip`, the two content variants built on top of this) without
 * being clipped by an `overflow: hidden` ancestor (`GraphCanvas`, `DetailDrawer`,
 * ...).
 *
 * Positioning (`computeTooltipPosition`, exported for unit testing) measures
 * the trigger + the rendered card after each open and picks the preferred
 * side, flipping to the opposite side when the preferred side wouldn't fit the
 * viewport, then clamps within an 8px viewport margin either way. Recomputed
 * on resize/scroll while open.
 *
 * Opens on hover (after `openDelay`, default 300ms, to avoid flicker while a
 * pointer sweeps across many trigger elements e.g. graph nodes) and
 * immediately on focus (keyboard users get no delay). Closes after
 * `closeDelay` once the pointer leaves BOTH the trigger and the card itself
 * (so the card's own content is hoverable), immediately on blur, and
 * immediately on Escape (which leaves focus exactly where it was — the card
 * has no focusable content of its own to strand it on). The card carries
 * `role="tooltip"`; the trigger carries `aria-describedby` pointing at it
 * only while open.
 */

import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';

export type TooltipPlacement = 'top' | 'bottom' | 'left' | 'right';

export interface TooltipRect {
  width: number;
  height: number;
}

export interface TooltipPosition {
  top: number;
  left: number;
  placement: TooltipPlacement;
}

/** Minimum gap kept between the card and the viewport edge / the anchor. */
const VIEWPORT_MARGIN = 8;

const OPPOSITE_PLACEMENT: Record<TooltipPlacement, TooltipPlacement> = {
  top: 'bottom',
  bottom: 'top',
  left: 'right',
  right: 'left',
};

/**
 * Pure placement math: given the trigger's viewport rect, the card's measured
 * size, and a preferred side, pick top/left. Flips to the opposite side when
 * the preferred side has no room in the current viewport; otherwise keeps the
 * preferred side even if clamping is still needed (e.g. a very short/narrow
 * viewport). Exported so positioning logic is testable without real layout.
 */
export function computeTooltipPosition(
  anchor: DOMRect,
  card: TooltipRect,
  preferred: TooltipPlacement,
  viewport: { width: number; height: number } = {
    width: typeof window !== 'undefined' ? window.innerWidth : 1024,
    height: typeof window !== 'undefined' ? window.innerHeight : 768,
  },
): TooltipPosition {
  const fits = (placement: TooltipPlacement): boolean => {
    switch (placement) {
      case 'top':
        return anchor.top - card.height - VIEWPORT_MARGIN >= 0;
      case 'bottom':
        return anchor.bottom + card.height + VIEWPORT_MARGIN <= viewport.height;
      case 'left':
        return anchor.left - card.width - VIEWPORT_MARGIN >= 0;
      case 'right':
        return anchor.right + card.width + VIEWPORT_MARGIN <= viewport.width;
    }
  };

  const placement = fits(preferred) ? preferred : OPPOSITE_PLACEMENT[preferred];

  let top: number;
  let left: number;
  if (placement === 'top' || placement === 'bottom') {
    top = placement === 'top'
      ? anchor.top - card.height - VIEWPORT_MARGIN
      : anchor.bottom + VIEWPORT_MARGIN;
    left = anchor.left + anchor.width / 2 - card.width / 2;
  } else {
    left = placement === 'left'
      ? anchor.left - card.width - VIEWPORT_MARGIN
      : anchor.right + VIEWPORT_MARGIN;
    top = anchor.top + anchor.height / 2 - card.height / 2;
  }

  const maxLeft = Math.max(VIEWPORT_MARGIN, viewport.width - card.width - VIEWPORT_MARGIN);
  const maxTop = Math.max(VIEWPORT_MARGIN, viewport.height - card.height - VIEWPORT_MARGIN);
  left = Math.min(Math.max(VIEWPORT_MARGIN, left), maxLeft);
  top = Math.min(Math.max(VIEWPORT_MARGIN, top), maxTop);

  return { top, left, placement };
}

export interface RichTooltipProps {
  /** Tooltip card content — built by a content variant (`PredicateTooltip`, `NodeTypeTooltip`). */
  content: ReactNode;
  /** The trigger — anything; wrapped in an inline `<span>` that owns hover/focus wiring. */
  children: ReactNode;
  /** Preferred side; flips to the opposite side when it doesn't fit the viewport. Default 'top'. */
  placement?: TooltipPlacement;
  /** Hover-open delay in ms (default 300). Focus always opens immediately. */
  openDelay?: number;
  /** Close delay in ms (default 150) so the pointer can travel from the trigger into the card. */
  closeDelay?: number;
  className?: string;
  'data-testid'?: string;
}

export function RichTooltip({
  content,
  children,
  placement = 'top',
  openDelay = 300,
  closeDelay = 150,
  className,
  'data-testid': testId,
}: RichTooltipProps) {
  const reactId = useId();
  const tooltipId = `rich-tooltip-${reactId}`;
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const anchorRef = useRef<HTMLSpanElement | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  const openTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearOpenTimer = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };
  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const openNow = () => {
    clearOpenTimer();
    clearCloseTimer();
    setOpen(true);
  };
  const openAfterDelay = () => {
    clearCloseTimer();
    if (open) return;
    openTimerRef.current = setTimeout(() => {
      openTimerRef.current = null;
      setOpen(true);
    }, openDelay);
  };
  const closeAfterDelay = () => {
    clearOpenTimer();
    closeTimerRef.current = setTimeout(() => {
      closeTimerRef.current = null;
      setOpen(false);
    }, closeDelay);
  };
  const closeNow = () => {
    clearOpenTimer();
    clearCloseTimer();
    setOpen(false);
  };

  // Timers are per-mount; a still-pending one when the trigger unmounts would
  // otherwise fire setOpen on a gone component.
  useEffect(() => () => {
    clearOpenTimer();
    clearCloseTimer();
  }, []);

  useLayoutEffect(() => {
    if (!open || !anchorRef.current || !tooltipRef.current) return;
    const recompute = () => {
      if (!anchorRef.current || !tooltipRef.current) return;
      const anchorRect = anchorRef.current.getBoundingClientRect();
      const cardSize = {
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight,
      };
      setPosition(computeTooltipPosition(anchorRect, cardSize, placement));
    };
    recompute();
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [open, placement]);

  // Escape just dismisses — it deliberately does NOT move focus. The card
  // itself carries no focusable content (both content variants are static
  // text), so whatever was focused before Escape (typically the trigger
  // itself, or a focusable element inside it) never lost focus to begin
  // with; forcing focus onto the wrapper span here would actually STEAL it
  // away from that element instead of preserving it.
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeNow();
    };
    document.addEventListener('keydown', onKeyDown);
    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  return (
    <span
      ref={anchorRef}
      className={className}
      style={{ display: 'inline-block' }}
      onMouseEnter={openAfterDelay}
      onMouseLeave={closeAfterDelay}
      onFocus={openNow}
      onBlur={closeNow}
      aria-describedby={open ? tooltipId : undefined}
      data-testid={testId}
    >
      {children}
      {open &&
        createPortal(
          <div
            ref={tooltipRef}
            id={tooltipId}
            role="tooltip"
            className="rich-tooltip"
            data-placement={position?.placement ?? placement}
            style={{
              position: 'fixed',
              top: position?.top ?? 0,
              left: position?.left ?? 0,
              visibility: position ? 'visible' : 'hidden',
            }}
            onMouseEnter={clearCloseTimer}
            onMouseLeave={closeAfterDelay}
            data-testid={testId ? `${testId}-card` : 'rich-tooltip-card'}
          >
            {content}
          </div>,
          document.body,
        )}
    </span>
  );
}

export default RichTooltip;
