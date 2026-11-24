// @vitest-environment happy-dom
/**
 * C4Diagram.spec.tsx — the drawing of one laid-out C4 view: boundary, cards,
 * arrows, and the keyboard path through the cards. The layout is hand-made
 * (a grid), so this tests the component, not ELK.
 */

import { afterAll, beforeAll, describe, it, expect, vi } from 'vitest';
import { createRef } from 'react';
import type { GraphViewportHandle } from '@tinkermonkey/heimdall-ui';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { C4Diagram, C4_DWELL_MS, nearestCard } from '@/apps/embedded/ui/C4Diagram';
import { buildC4Model } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View, type C4View } from '@/apps/embedded/data/c4/c4Views';
import { C4_CARD, type C4Layout } from '@/apps/embedded/data/c4/c4Layout';
import { ref, sampleModel } from '../unit/c4/fixture';

const { model, n } = sampleModel();
const c4 = buildC4Model(model);

/** In-scope cards in a row inside a boundary, outside cards in a row above it. */
function gridLayout(view: C4View): C4Layout {
  const boxes = new Map<string, { x: number; y: number; width: number; height: number }>();
  const place = (ids: string[], y: number) =>
    ids.forEach((id, i) => boxes.set(id, { x: 40 + i * (C4_CARD.width + 40), y, ...C4_CARD }));
  const inside = view.elements.filter((e) => e.inScope).map((e) => e.id);
  const outside = view.elements.filter((e) => !e.inScope).map((e) => e.id);
  place(outside, 20);
  place(inside, 260);
  const width = 80 + Math.max(inside.length, outside.length) * (C4_CARD.width + 40);
  return {
    width,
    height: 440,
    boxes,
    boundary: view.scope ? { x: 20, y: 200, width: width - 40, height: 220 } : null,
    edges: view.relationships.map((r) => {
      const a = boxes.get(r.sourceId)!;
      const b = boxes.get(r.targetId)!;
      return {
        id: r.id,
        points: [
          { x: a.x + a.width / 2, y: a.y + a.height },
          { x: b.x + b.width / 2, y: b.y },
        ],
        label: { x: a.x, y: a.y + a.height + 4, width: 80, height: 18 },
      };
    }),
  };
}

function setup(view: C4View, selectedId: string | null = null) {
  const onSelect = vi.fn();
  const onDrill = vi.fn();
  const layout = gridLayout(view);
  render(<C4Diagram view={view} layout={layout} selectedId={selectedId} onSelect={onSelect} onDrill={onDrill} />);
  return { onSelect, onDrill, layout };
}

const card = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, `) });

describe('C4Diagram — drawing', () => {
  it('draws the boundary, a card per element and a labelled edge per relationship', () => {
    const view = buildC4View(c4, 'container');
    setup(view);

    expect(screen.getByTestId('c4-diagram')).toHaveAttribute('data-level', 'container');
    expect(within(screen.getByTestId('c4-boundary')).getByText('Software system [Software System]')).toBeInTheDocument();
    expect(screen.getAllByTestId('c4-card')).toHaveLength(view.elements.length);
    expect(screen.getAllByTestId('c4-edge')).toHaveLength(view.relationships.length);

    // A card says what it is in words, not only by its colour.
    expect(card('Viewer')).toHaveAccessibleName('Viewer, Container: web app, 4 parts, Enter opens it');
    expect(card('Local Storage')).toHaveAccessibleName('Local Storage, Container: localstorage');
    expect(screen.getByText('[Container: web app]')).toBeInTheDocument();
    expect(card('Reviewer').closest('[data-testid="c4-card"]')).toHaveClass('c4-card--outside', 'c4-card--person');

    // The arrows are also there as text.
    const list = screen.getByTestId('c4-relationship-list');
    // (A derived arrow counts the two model links of its path.)
    expect(list).toHaveTextContent('Viewer reads/writes Local Storage (2 links)');
    expect(within(list).getAllByRole('listitem')).toHaveLength(view.relationships.length);
  });

  it('draws no boundary on a context diagram', () => {
    setup(buildC4View(c4, 'context'));
    expect(screen.queryByTestId('c4-boundary')).not.toBeInTheDocument();
    expect(card('Software system')).toBeInTheDocument();
  });

  it('selects a card on click, clears it on a second click, and opens one from its parts button', () => {
    const view = buildC4View(c4, 'container');
    const first = setup(view);
    fireEvent.click(card('Local Storage'));
    expect(first.onSelect).toHaveBeenCalledWith(ref(n.db));
    fireEvent.click(screen.getByRole('button', { name: 'Open Viewer: 4 parts' }));
    expect(first.onDrill).toHaveBeenCalledWith(ref(n.app));
  });

  it('marks the selected card and the arrows that touch it', () => {
    const view = buildC4View(c4, 'container');
    const { onSelect } = setup(view, ref(n.db));
    expect(card('Local Storage')).toHaveAttribute('aria-pressed', 'true');
    expect(card('Local Storage').closest('[data-testid="c4-card"]')).toHaveClass('c4-card--selected');
    expect(document.querySelectorAll('.c4-diagram__edge--hot')).toHaveLength(1);
    fireEvent.click(card('Local Storage'));
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

describe('C4Diagram — keyboard', () => {
  it('keeps the cards to one Tab stop', () => {
    setup(buildC4View(c4, 'container'));
    const stops = screen.getAllByTestId('c4-card').map((el) => el.querySelector('.c4-card__main')!.getAttribute('tabindex'));
    expect(stops.filter((t) => t === '0')).toHaveLength(1);
  });

  it('moves between cards with the arrow keys and drills in with Enter', () => {
    const view = buildC4View(c4, 'container');
    const { onDrill, onSelect, layout } = setup(view);

    // Local Storage and Viewer sit side by side inside the boundary (A–Z).
    const storage = card('Local Storage');
    storage.focus();
    fireEvent.keyDown(storage, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(card('Viewer'));
    expect(nearestCard(layout, ref(n.db), 'right')).toBe(ref(n.app));
    expect(nearestCard(layout, ref(n.db), 'left')).toBeNull();

    // Up leaves the boundary for the row of people above it.
    fireEvent.keyDown(card('Viewer'), { key: 'ArrowUp' });
    expect(document.activeElement?.closest('[data-testid="c4-card"]')).toHaveClass('c4-card--outside');

    // Enter opens a card that has parts; it does not select it.
    fireEvent.keyDown(card('Viewer'), { key: 'Enter' });
    expect(onDrill).toHaveBeenCalledWith(ref(n.app));
    expect(onSelect).not.toHaveBeenCalled();
    // Enter on a card with no parts is a plain button press.
    fireEvent.keyDown(storage, { key: 'Enter' });
    expect(onDrill).toHaveBeenCalledTimes(1);
  });

  it('clears the selection with Escape', () => {
    const { onSelect } = setup(buildC4View(c4, 'container'), ref(n.db));
    fireEvent.keyDown(card('Local Storage'), { key: 'Escape' });
    expect(onSelect).toHaveBeenCalledWith(null);
  });
});

describe('C4Diagram — viewport history (#619)', () => {
  // happy-dom lays nothing out: give the container a size so the diagram can report a viewport.
  const sizes: [string, number][] = [['clientWidth', 800], ['clientHeight', 600]];
  beforeAll(() => {
    for (const [prop, value] of sizes) {
      Object.defineProperty(HTMLElement.prototype, prop, { configurable: true, get: () => value });
    }
  });
  afterAll(() => {
    for (const [prop] of sizes) delete (HTMLElement.prototype as unknown as Record<string, unknown>)[prop];
  });

  function mount(props: Partial<React.ComponentProps<typeof C4Diagram>> = {}) {
    const view = buildC4View(c4, 'container');
    const viewportRef = createRef<GraphViewportHandle>();
    const onViewportDwell = vi.fn();
    const onViewportNavigate = vi.fn();
    const onSelect = vi.fn();
    const onDrill = vi.fn();
    render(
      <C4Diagram
        view={view}
        layout={gridLayout(view)}
        selectedId={null}
        onSelect={onSelect}
        onDrill={onDrill}
        viewportRef={viewportRef}
        onViewportDwell={onViewportDwell}
        onViewportNavigate={onViewportNavigate}
        {...props}
      />,
    );
    return { viewportRef, onViewportDwell, onViewportNavigate, onSelect, onDrill };
  }

  it('restores a viewport silently: the world point lands mid-container, nothing is reported', async () => {
    const { viewportRef, onViewportNavigate } = mount();
    // The mount fit (a frame), then its report (a frame after).
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    onViewportNavigate.mockClear();
    viewportRef.current!.setViewport({ center: { x: 100, y: 50 }, zoom: 1 }, { silent: true });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    const vp = viewportRef.current!.getViewport()!;
    expect(vp.center).toEqual({ x: 100, y: 50 });
    expect(vp.zoom).toBe(1);
    expect(onViewportNavigate).not.toHaveBeenCalled();
  });

  it('reports a non-silent setViewport as imperative and its mount fit as a fit', async () => {
    const { viewportRef, onViewportNavigate } = mount();
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    expect(onViewportNavigate).toHaveBeenCalledWith(expect.anything(), { kind: 'fit', reason: 'mount' });
    viewportRef.current!.setViewport({ center: { x: 10, y: 10 }, zoom: 0.5 });
    await new Promise((r) => requestAnimationFrame(() => r(null)));
    expect(onViewportNavigate).toHaveBeenLastCalledWith(
      expect.objectContaining({ center: { x: 10, y: 10 }, zoom: 0.5 }),
      { kind: 'imperative' },
    );
  });

  it('starts at initialViewport instead of the fit', async () => {
    const { viewportRef, onViewportNavigate } = mount({ initialViewport: { center: { x: 300, y: 200 }, zoom: 0.8 } });
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(() => r(null))));
    expect(viewportRef.current!.getViewport()).toMatchObject({ center: { x: 300, y: 200 }, zoom: 0.8 });
    expect(onViewportNavigate).not.toHaveBeenCalled();
  });

  it('reports a dwell once a zoom has been still for C4_DWELL_MS, not before', () => {
    vi.useFakeTimers();
    try {
      const { onViewportDwell } = mount();
      fireEvent.click(screen.getByRole('button', { name: 'Zoom in' }));
      vi.advanceTimersByTime(C4_DWELL_MS - 1);
      expect(onViewportDwell).not.toHaveBeenCalled();
      vi.advanceTimersByTime(1);
      expect(onViewportDwell).toHaveBeenCalledTimes(1);
    } finally {
      vi.useRealTimers();
    }
  });

  it('treats a double-click as one step: the second click does not undo the first', () => {
    const { onSelect } = mount();
    const target = screen.getAllByTestId('c4-card')[0].querySelector('button')!;
    fireEvent.click(target, { detail: 1 });
    fireEvent.click(target, { detail: 2 });
    expect(onSelect).toHaveBeenCalledTimes(1);
  });
});
