/**
 * c4Layout — the ELK adapter: boxes, the boundary and arrow routes for one
 * view. Geometry is asserted by its properties (inside, outside, no overlap),
 * not by coordinates, so a different engine can pass the same tests.
 */

import { describe, it, expect } from 'vitest';

import { buildC4Model } from '@/apps/embedded/data/c4/c4Model';
import { buildC4View } from '@/apps/embedded/data/c4/c4Views';
import { C4_CARD, c4EdgeLabel, layoutC4View, type C4Box } from '@/apps/embedded/data/c4/c4Layout';
import { ref, sampleModel } from './fixture';

const { model, n } = sampleModel();
const c4 = buildC4Model(model);

const inside = (inner: C4Box, outer: C4Box) =>
  inner.x >= outer.x && inner.y >= outer.y && inner.x + inner.width <= outer.x + outer.width && inner.y + inner.height <= outer.y + outer.height;
const overlap = (a: C4Box, b: C4Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

describe('c4 layout', () => {
  it('places every element inside its boundary, and everything else outside it', async () => {
    const view = buildC4View(c4, 'component', ref(n.app));
    const layout = await layoutC4View(view);

    expect(layout.boundary).not.toBeNull();
    for (const item of view.elements) {
      const box = layout.boxes.get(item.id)!;
      expect(box).toMatchObject({ width: C4_CARD.width, height: C4_CARD.height });
      if (item.inScope) expect(inside(box, layout.boundary!)).toBe(true);
      else expect(overlap(box, layout.boundary!)).toBe(false);
    }
    const boxes = [...layout.boxes.values()];
    for (let i = 0; i < boxes.length; i++) {
      for (let j = i + 1; j < boxes.length; j++) expect(overlap(boxes[i], boxes[j])).toBe(false);
    }
    expect(inside({ x: 0, y: 0, width: 0, height: 0 }, { x: 0, y: 0, width: layout.width, height: layout.height })).toBe(true);
  });

  it('routes one arrow per relationship, from box edge to box edge, with a label', async () => {
    const view = buildC4View(c4, 'container');
    const layout = await layoutC4View(view);
    expect(layout.edges.map((e) => e.id).sort()).toEqual(view.relationships.map((r) => r.id).sort());
    for (const edge of layout.edges) {
      expect(edge.points.length).toBeGreaterThanOrEqual(2);
      for (const p of edge.points) {
        expect(Number.isFinite(p.x) && Number.isFinite(p.y)).toBe(true);
        expect(p.x).toBeGreaterThanOrEqual(0);
        expect(p.x).toBeLessThanOrEqual(layout.width);
      }
      expect(edge.label).toBeDefined();
    }
  });

  it('draws a context diagram without a boundary', async () => {
    const layout = await layoutC4View(buildC4View(c4, 'context'));
    expect(layout.boundary).toBeNull();
    expect(layout.boxes.size).toBe(5);
  });

  it('lays out nothing for an empty view', async () => {
    const view = { ...buildC4View(c4, 'context'), elements: [], relationships: [] };
    expect(await layoutC4View(view)).toMatchObject({ width: 0, height: 0, boundary: null, edges: [] });
  });

  it('labels an arrow with its predicates and, past one link, a count', () => {
    expect(c4EdgeLabel(['uses'], 1)).toBe('uses');
    expect(c4EdgeLabel(['uses', 'depends-on'], 3)).toBe('uses, depends-on · 3');
    expect(c4EdgeLabel(['a', 'b', 'c'], 5)).toBe('a, b, … · 5');
  });
});
