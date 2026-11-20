/**
 * c4Views — one diagram out of the C4 model: what is in scope, what is lifted
 * from outside, and the arrows merged per pair.
 */

import { describe, it, expect } from 'vitest';

import { C4_SYSTEM_ID, buildC4Model } from '@/apps/embedded/data/c4/c4Model';
import {
  OUTSIDE_CAP,
  buildC4View,
  c4NavRows,
  c4ViewKey,
  defaultComponentScope,
  levelOfScope,
  resolveScope,
} from '@/apps/embedded/data/c4/c4Views';
import { parseC4Level } from '@/apps/embedded/data/c4/c4Level';
import { derive, link, node, ref, sampleModel } from './fixture';

const { model, n } = sampleModel();
const c4 = buildC4Model(model);
const ids = (view: ReturnType<typeof buildC4View>, inScope: boolean) =>
  view.elements.filter((e) => e.inScope === inScope).map((e) => e.element.name).sort();

describe('c4 views: levels', () => {
  it('context: the system as one box, with every person and external system', () => {
    const view = buildC4View(c4, 'context');
    expect(view.scope).toBeNull();
    expect(ids(view, true)).toEqual(['Software system']);
    // Developer has no link at all and is still context.
    expect(ids(view, false)).toEqual(['CLI Server', 'Developer', 'Model Author', 'Reviewer']);
    const arrows = view.relationships.map((r) => `${c4.byId.get(r.sourceId)!.name}>${c4.byId.get(r.targetId)!.name}:${r.labels}`);
    expect(arrows.sort()).toEqual(['Model Author>Software system:uses', 'Reviewer>Software system:uses', 'Software system>CLI Server:depends on']);
  });

  it('container: the containers inside the system boundary', () => {
    const view = buildC4View(c4, 'container');
    expect(view.scope?.id).toBe(C4_SYSTEM_ID);
    expect(ids(view, true)).toEqual(['Local Storage', 'Viewer']);
    const readsWrites = view.relationships.find((r) => r.sourceId === ref(n.app) && r.targetId === ref(n.db))!;
    expect(readsWrites.labels).toEqual(['reads/writes']);
    expect(view.elements.find((e) => e.id === ref(n.app))).toMatchObject({ drillable: true, childCount: 4 });
    expect(view.elements.find((e) => e.id === ref(n.db))!.drillable).toBe(false);
  });

  it('keeps technology elements out of context and container diagrams', () => {
    for (const level of ['context', 'container', 'component'] as const) {
      const view = buildC4View(c4, level);
      for (const item of view.elements) {
        expect(['person', 'system', 'external-system', 'container', 'component']).toContain(item.element.kind);
        expect(item.element.sources.every((s) => s.layerId !== 'technology')).toBe(true);
      }
    }
  });
});

describe('c4 views: lifting', () => {
  it('lifts an outside neighbour to its nearest visible ancestor and counts the links', () => {
    // Scope: Canvas. Tooltip, Transform and the store are outside it.
    const view = buildC4View(c4, 'component', ref(n.canvas));
    expect(view.level).toBe('component');
    expect(ids(view, true)).toEqual(['Bands', 'Hive', 'Inspector', 'Lanes']);
    expect(view.trail.map((e) => e.name)).toEqual(['Software system', 'Viewer', 'Shell', 'Canvas']);
    expect(ids(view, false)).toContain('Tooltip');
    // Canvas → Transform is the scope's own arrow, not one of its parts': not drawn.
    expect(view.elements.some((e) => e.id === ref(n.transform))).toBe(false);

    // Scope: the app container. Inspector (deep inside Shell) → Tooltip shows as Shell → Tooltip,
    // and Canvas → Transform (also inside Shell) as Shell → Transform.
    const app = buildC4View(c4, 'component', ref(n.app));
    expect(ids(app, true)).toEqual(['API Client', 'Shell', 'Tooltip', 'Transform']);
    const lifted = app.relationships.find((r) => r.sourceId === ref(n.shell) && r.targetId === ref(n.tooltip))!;
    expect(lifted).toMatchObject({ labels: ['uses'], count: 1 });
    expect(app.relationships.some((r) => r.sourceId === ref(n.shell) && r.targetId === ref(n.transform))).toBe(true);
    // The store inside Shell reads the database outside the container.
    expect(app.relationships.find((r) => r.sourceId === ref(n.shell) && r.targetId === ref(n.db))!.labels).toEqual(['reads/writes']);
  });

  it('merges several links between one pair into one arrow with a count and its labels', () => {
    const a = node('application.applicationcomponent', 'A', { type: 'internal' });
    const b = node('application.applicationcomponent', 'B', { type: 'internal' });
    const a1 = node('application.applicationcomponent', 'A1', { type: 'internal' });
    const a2 = node('application.applicationcomponent', 'A2', { type: 'internal' });
    const m = derive([a, b, a1, a2], [
      link(a, 'composes', a1),
      link(a, 'composes', a2),
      link(a1, 'uses', b),
      link(a2, 'uses', b),
      link(a2, 'depends-on', b),
    ]);
    const view = buildC4View(buildC4Model(m), 'component');
    const arrow = view.relationships.find((r) => r.sourceId === ref(a) && r.targetId === ref(b))!;
    expect(arrow.count).toBe(3);
    expect(arrow.labels).toEqual(['uses', 'depends-on']);
    expect(arrow.linkIds).toHaveLength(3);
  });

  it('caps the outside of a component diagram at the most linked, and says how many it left out', () => {
    const scope = node('application.applicationcomponent', 'Scope', { type: 'internal' });
    const part = node('application.applicationcomponent', 'Part', { type: 'internal' });
    const others = Array.from({ length: OUTSIDE_CAP + 3 }, (_, i) =>
      node('application.applicationcomponent', `Other ${String(i).padStart(2, '0')}`, { type: 'internal' }),
    );
    const links = [link(scope, 'composes', part), ...others.map((o) => link(part, 'uses', o))];
    // One of them is linked twice: it must survive the cap.
    const last = others[others.length - 1];
    links.push(link(part, 'depends-on', last));
    const view = buildC4View(buildC4Model(derive([scope, part, ...others], links)), 'component', ref(scope));
    expect(view.elements.filter((e) => !e.inScope)).toHaveLength(OUTSIDE_CAP);
    expect(view.hiddenOutside).toBe(3);
    expect(view.elements.some((e) => e.id === ref(last))).toBe(true);
  });
});

describe('c4 views: scope', () => {
  it('falls back to the default container for an unknown or part-less scope', () => {
    expect(defaultComponentScope(c4)).toBe(ref(n.app));
    expect(resolveScope(c4, 'component', null)).toBe(ref(n.app));
    expect(resolveScope(c4, 'component', 'no.such.element')).toBe(ref(n.app));
    expect(resolveScope(c4, 'component', ref(n.tooltip))).toBe(ref(n.app)); // no parts
    expect(resolveScope(c4, 'component', ref(n.canvas))).toBe(ref(n.canvas));
    expect(resolveScope(c4, 'context', ref(n.canvas))).toBeNull();
    expect(resolveScope(c4, 'container', ref(n.canvas))).toBe(C4_SYSTEM_ID);
    // A model with no components at all: the Components level shows the containers.
    const bare = buildC4Model(derive([node('ux.uxapplication', 'Web', { channel: 'web' })], []));
    expect(buildC4View(bare, 'component').level).toBe('container');
  });

  it('names a level by its scope, and parses a level from a URL', () => {
    expect(levelOfScope(null)).toBe('context');
    expect(levelOfScope(C4_SYSTEM_ID)).toBe('container');
    expect(levelOfScope(ref(n.canvas))).toBe('component');
    expect(parseC4Level('container')).toBe('container');
    expect(parseC4Level('deployment')).toBeNull();
    expect(parseC4Level(undefined)).toBeNull();
  });

  it('lists every element with parts for the nav tree, nested as the model nests them', () => {
    expect(c4NavRows(c4).map((r) => `${'  '.repeat(r.depth)}${r.name} ${r.childCount}`)).toEqual([
      'Viewer 4',
      '  Shell 2',
      '    Canvas 4',
    ]);
  });

  it('keys a view by its content', () => {
    const a = buildC4View(c4, 'container');
    expect(c4ViewKey(a)).toBe(c4ViewKey(buildC4View(c4, 'container')));
    expect(c4ViewKey(a)).not.toBe(c4ViewKey(buildC4View(c4, 'context')));
  });
});
