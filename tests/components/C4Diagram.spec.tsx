// @vitest-environment happy-dom
/**
 * C4Diagram.spec.tsx — the drawing of one laid-out C4 view: boundary, cards,
 * arrows, and the keyboard path through the cards. The layout is hand-made
 * (a grid), so this tests the component, not ELK.
 */

import { describe, it, expect, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';

import { C4Diagram, nearestCard } from '@/apps/embedded/ui/C4Diagram';
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
