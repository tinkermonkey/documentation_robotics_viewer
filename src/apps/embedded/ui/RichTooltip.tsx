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
 *
 * The card itself is `TooltipCard`, exported for surfaces that own their own
 * hover state and only have an element to anchor to — the graph's edge
 * predicate tooltip (Canvas.tsx), anchored to the hovered edge's label.
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

/** The anchor's viewport rect. A DOMRect satisfies it. */
export type TooltipAnchorRect = Pick<DOMRect, 'top' | 'bottom' | 'left' | 'right' | 'width' | 'height'>;

export interface TooltipPosition {
  top: number;
  left: number;
  placement: TooltipPlacement;
  /** True when no side had room and clamping left the card over its own
   *  trigger. The card then lets pointer events through, so it can't swallow
   *  a click on the trigger underneath it. */
  overlapsAnchor: boolean;
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
  anchor: TooltipAnchorRect,
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

  // Preferred side, then its opposite, then the two perpendicular sides. When
  // none fits (a tall card in a short viewport), keep the preferred side and
  // clamp. That can leave the card over its trigger; see `overlapsAnchor`.
  const perpendicular: TooltipPlacement[] =
    preferred === 'top' || preferred === 'bottom' ? ['right', 'left'] : ['bottom', 'top'];
  const placement =
    [preferred, OPPOSITE_PLACEMENT[preferred], ...perpendicular].find(fits) ?? preferred;

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

  const overlapsAnchor =
    left < anchor.right &&
    left + card.width > anchor.left &&
    top < anchor.bottom &&
    top + card.height > anchor.top;

  return { top, left, placement, overlapsAnchor };
}

export interface TooltipCardProps {
  id?: string;
  /** Returns the anchor's current viewport rect, or null when it's gone. */
  getAnchorRect: () => TooltipAnchorRect | null;
  content: ReactNode;
  placement?: TooltipPlacement;
  /** Re-measure every frame while shown, for an anchor that moves on its own
   *  (a graph label while the canvas pans or zooms). Resize and scroll are
   *  always tracked. */
  track?: boolean;
  /** Never take pointer events — for a card that's a pure hint and must not
   *  get between the pointer and what's under it. */
  passThrough?: boolean;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
  'data-testid'?: string;
}

function samePosition(a: TooltipPosition | null, b: TooltipPosition): boolean {
  return (
    !!a &&
    a.top === b.top &&
    a.left === b.left &&
    a.placement === b.placement &&
    a.overlapsAnchor === b.overlapsAnchor
  );
}

/**
 * The positioned card, portaled into `document.body`: measures its anchor and
 * itself and places itself with `computeTooltipPosition` (a side with room,
 * never over the anchor unless nothing fits). Shown for as long as it's
 * mounted. RichTooltip renders this for its own trigger.
 */
export function TooltipCard({
  id,
  getAnchorRect,
  content,
  placement = 'top',
  track = false,
  passThrough = false,
  onMouseEnter,
  onMouseLeave,
  'data-testid': testId,
}: TooltipCardProps) {
  const [position, setPosition] = useState<TooltipPosition | null>(null);
  const tooltipRef = useRef<HTMLDivElement | null>(null);
  // Read through a ref: callers pass a fresh closure every render, and the
  // measuring effect below must not re-subscribe on each one.
  const getAnchorRectRef = useRef(getAnchorRect);
  getAnchorRectRef.current = getAnchorRect;

  useLayoutEffect(() => {
    if (!tooltipRef.current) return;
    let frame: number | null = null;
    const recompute = () => {
      const anchorRect = getAnchorRectRef.current();
      if (!anchorRect || !tooltipRef.current) return;
      const cardSize = {
        width: tooltipRef.current.offsetWidth,
        height: tooltipRef.current.offsetHeight,
      };
      const next = computeTooltipPosition(anchorRect, cardSize, placement);
      setPosition((prev) => (samePosition(prev, next) ? prev : next));
    };
    const loop = () => {
      recompute();
      frame = requestAnimationFrame(loop);
    };
    recompute();
    if (track) frame = requestAnimationFrame(loop);
    window.addEventListener('resize', recompute);
    window.addEventListener('scroll', recompute, true);
    return () => {
      if (frame !== null) cancelAnimationFrame(frame);
      window.removeEventListener('resize', recompute);
      window.removeEventListener('scroll', recompute, true);
    };
  }, [placement, track]);

  return createPortal(
    <div
      ref={tooltipRef}
      id={id}
      role="tooltip"
      className="rich-tooltip"
      data-placement={position?.placement ?? placement}
      style={{
        position: 'fixed',
        top: position?.top ?? 0,
        left: position?.left ?? 0,
        visibility: position ? 'visible' : 'hidden',
        // Covering its own trigger, the card would catch the mouseup of
        // a click on the trigger, so the click never reaches it.
        pointerEvents: passThrough || position?.overlapsAnchor ? 'none' : undefined,
      }}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      data-testid={testId}
    >
      {content}
    </div>,
    document.body,
  );
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
  const anchorRef = useRef<HTMLSpanElement | null>(null);
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
      {open && (
        <TooltipCard
          id={tooltipId}
          getAnchorRect={() => anchorRef.current?.getBoundingClientRect() ?? null}
          content={content}
          placement={placement}
          onMouseEnter={clearCloseTimer}
          onMouseLeave={closeAfterDelay}
          data-testid={testId ? `${testId}-card` : 'rich-tooltip-card'}
        />
      )}
    </span>
  );
}

export default RichTooltip;
