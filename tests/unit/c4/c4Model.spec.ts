/**
 * c4Model — a DR model read as a C4 model by the rules in c4Rules.ts.
 * Checked against a small hand-built model (tests/unit/c4/fixture.ts), and
 * for invariants against the real /api fixtures.
 */

import { describe, it, expect } from 'vitest';

import {
  C4_APP_CONTAINER_ID,
  C4_SYSTEM_ID,
  C4_UNASSIGNED_ID,
  buildC4Model,
  c4Ancestors,
  isEmptyC4,
} from '@/apps/embedded/data/c4/c4Model';
import { C4_RULES, checkRules, specCatalog, type SpecCatalog } from '@/apps/embedded/data/c4/c4Rules';
import type { ModelPayload } from '@/apps/embedded/data/useModel';
import { derive, link, node, ref, sampleModel } from './fixture';
import modelFixture from '../../fixtures/model.json';
import specFixture from '../../fixtures/spec.json';
import catalogFixture from '../../fixtures/spec-catalog.json';

/** The catalog of the spec the rules are written for (see tests/fixtures/README.md). */
const currentCatalog: SpecCatalog = {
  types: new Set(catalogFixture.types),
  relationships: new Set(catalogFixture.relationships),
  predicates: new Set(catalogFixture.relationships.map((r) => r.split('|')[1])),
};

describe('c4 model: elements and identity', () => {
  it('merges a persona and its business role into one person', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);

    const people = c4.elements.filter((e) => e.kind === 'person');
    expect(people.map((p) => p.name).sort()).toEqual(['Developer', 'Model Author', 'Reviewer']);

    // Same name: one element. Different names joined by `references`: the role's element.
    const reviewer = c4.byId.get(c4.elementOf.get(n.persona.id)!)!;
    expect(reviewer.sources.map((s) => s.ref).sort()).toEqual([ref(n.persona), ref(n.role)].sort());
    expect(c4.elementOf.get(n.author.id)).toBe(c4.elementOf.get(n.authorRole.id));
    expect(c4.byId.get(c4.elementOf.get(n.author.id)!)!.name).toBe('Model Author');
  });

  it('reads an actor by its type, and one external system for a same-named actor and stakeholder', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);

    expect(c4.byId.get(c4.elementOf.get(n.human.id)!)!.kind).toBe('person');
    const external = c4.elements.filter((e) => e.kind === 'external-system');
    expect(external).toHaveLength(1);
    expect(external[0].sources.map((s) => s.id).sort()).toEqual([n.cliActor.id, n.cliStakeholder.id].sort());
    // An internal stakeholder and an actor of unknown type are not C4 elements.
    expect(c4.elementOf.has(n.team.id)).toBe(false);
    expect(c4.elementOf.has(n.untyped.id)).toBe(false);
  });

  it('gives a container its technology from the model, and a component the system software serving it', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    expect(c4.byId.get(ref(n.app))!.technology).toBe('web app');
    expect(c4.byId.get(ref(n.db))).toMatchObject({ kind: 'container', shape: 'datastore', technology: 'localstorage' });
    expect(c4.byId.get(ref(n.canvas))!.technology).toBe('Heimdall UI');
    // System software is a technology line, never a box.
    expect(c4.elementOf.has(n.heimdall.id)).toBe(false);
    expect(c4.elements.some((e) => e.name === 'Heimdall UI')).toBe(false);
  });
});

describe('c4 model: containment', () => {
  it('nests components by composes and puts unowned ones in the app container', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    const parentOf = (x: { id: string }) => c4.byId.get(c4.elementOf.get(x.id)!)!.parentId;

    expect(parentOf(n.canvas)).toBe(ref(n.shell));
    expect(parentOf(n.inspector)).toBe(ref(n.canvas));
    // Nothing owns these: they sit in the one application container, which sits in the system.
    expect(parentOf(n.shell)).toBe(ref(n.app));
    expect(parentOf(n.tooltip)).toBe(ref(n.app));
    expect(parentOf(n.transform)).toBe(ref(n.app));
    expect(c4.byId.get(ref(n.app))!.parentId).toBe(C4_SYSTEM_ID);
    expect(c4.byId.get(ref(n.db))!.parentId).toBe(C4_SYSTEM_ID);
    expect(c4Ancestors(c4, ref(n.inspector))).toEqual([ref(n.inspector), ref(n.canvas), ref(n.shell), ref(n.app), C4_SYSTEM_ID]);
  });

  it('puts an element several parents claim under their nearest common ancestor', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    const parentOf = (x: { id: string }) => c4.byId.get(c4.elementOf.get(x.id)!)!.parentId;
    // Lanes and Hive both realize Bands; both are parts of Canvas.
    expect(parentOf(n.bands)).toBe(ref(n.canvas));
    // Shell and Inspector (inside Shell) are both assigned to the store: it belongs to Shell.
    expect(parentOf(n.store)).toBe(ref(n.shell));
  });

  it('stands in a container when the model has none, and says so', () => {
    const a = node('application.applicationcomponent', 'A', { type: 'internal' });
    const c4 = buildC4Model(derive([a], []));
    expect(c4.byId.get(ref(a))!.parentId).toBe(C4_APP_CONTAINER_ID);
    expect(c4.byId.get(C4_APP_CONTAINER_ID)).toMatchObject({ kind: 'container', synthetic: true });
    expect(c4.issues.join(' ')).toMatch(/no application container/);
  });

  it('leaves unowned components unassigned when the model has several application containers', () => {
    const a = node('application.applicationcomponent', 'A', { type: 'internal' });
    const web = node('ux.uxapplication', 'Web', { channel: 'web' });
    const mobile = node('ux.uxapplication', 'Mobile', { channel: 'mobile' });
    const c4 = buildC4Model(derive([a, web, mobile], []));
    expect(c4.byId.get(ref(a))!.parentId).toBe(C4_UNASSIGNED_ID);
    expect(c4.issues.join(' ')).toMatch(/2 application containers/);
  });

  it('never closes a containment cycle', () => {
    const a = node('application.applicationcomponent', 'A', { type: 'internal' });
    const b = node('application.applicationcomponent', 'B', { type: 'internal' });
    const c4 = buildC4Model(derive([a, b], [link(a, 'composes', b), link(b, 'composes', a)]));
    expect(c4.byId.get(ref(b))!.parentId).toBe(ref(a));
    expect(c4.byId.get(ref(a))!.parentId).toBe(C4_APP_CONTAINER_ID);
  });
});

describe('c4 model: relationships', () => {
  const rel = (c4: ReturnType<typeof buildC4Model>, from: string, to: string) =>
    c4.relationships.find((r) => r.sourceId === from && r.targetId === to);

  it('keeps the source ids of every element and relationship', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    const linkIds = new Set(model.links.map((l) => l.id));

    for (const element of c4.elements) {
      if (element.synthetic) continue;
      expect(element.sources.length).toBeGreaterThan(0);
      expect(element.id).toBe(element.sources[0].ref);
    }
    for (const r of c4.relationships) {
      expect(r.linkIds.length).toBeGreaterThan(0);
      for (const id of r.linkIds) expect(linkIds.has(id)).toBe(true);
      expect(c4.byId.has(r.sourceId) && c4.byId.has(r.targetId)).toBe(true);
    }
    const uses = rel(c4, ref(n.inspector), ref(n.tooltip))!;
    expect(uses.labels).toEqual({ uses: 1 });
    expect(uses.derivedBy).toEqual([]);
  });

  it('turns "serves" round, so every arrow reads as a use', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    // The model says Transform serves Canvas; the arrow runs Canvas → Transform.
    expect(rel(c4, ref(n.canvas), ref(n.transform))!.labels).toEqual({ uses: 1 });
    expect(rel(c4, ref(n.transform), ref(n.canvas))).toBeUndefined();
    // Structure draws no arrow.
    expect(rel(c4, ref(n.shell), ref(n.canvas))).toBeUndefined();
  });

  it('derives the arrows the model holds as a two-link path', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    const reviewer = c4.elementOf.get(n.persona.id)!;
    const external = c4.elementOf.get(n.cliActor.id)!;

    // A persona uses what realizes a feature that serves them.
    const uses = rel(c4, reviewer, ref(n.transform))!;
    expect(uses.labels).toEqual({ uses: 1 });
    expect(uses.derivedBy).toEqual(['person-uses-what-realizes-their-feature']);
    expect(uses.linkIds).toHaveLength(2);
    // Whatever accesses a collection reads and writes the database composing it.
    expect(rel(c4, ref(n.store), ref(n.db))!.labels).toEqual({ 'reads/writes': 1 });
    // An API operation folds onto the service it references, which so depends
    // on the external system behind the constraint the operation satisfies.
    expect(rel(c4, ref(n.apiClient), external)!.labels).toEqual({ 'depends on': 1 });
  });

  it('folds what is not a C4 element onto the one it tests or references, and counts the rest', () => {
    const { model, n } = sampleModel();
    const c4 = buildC4Model(model);
    expect(c4.anchorsOf.get(n.test.id)).toEqual([ref(n.transform)]);
    expect(c4.byId.get(ref(n.transform))!.folded['testing.testcasesketch']).toBe(1);
    expect(c4.anchorsOf.get(n.operation.id)).toEqual([ref(n.apiClient)]);
    // Two links away: a property of a schema the transform accesses.
    expect(c4.anchorsOf.get(n.schema.id)).toEqual([ref(n.transform)]);
    expect(c4.anchorsOf.get(n.property.id)).toEqual([ref(n.transform)]);
    // A whole is not folded by its part: the path item composing that operation stays out.
    expect(c4.anchorsOf.has(n.pathItem.id)).toBe(false);
    // Nothing places these.
    expect(c4.unplaced.byType['security.threat']).toBe(1);
    expect(c4.unplaced.byType['technology.node']).toBe(1);
    expect(c4.anchorsOf.has(n.orphan.id)).toBe(false);
  });
});

describe('c4 rules against the spec', () => {
  const catalog = currentCatalog;

  it('the shipped rules name only what the current spec defines', () => {
    expect(checkRules(C4_RULES, catalog).issues).toEqual([]);
  });

  it('reads a catalog from an /api/spec payload, and reports what an older spec lacks', () => {
    // The spec fixture is an older capture (0.8.4): no Product layer yet.
    const old = specCatalog(specFixture as { schemas?: Record<string, unknown> });
    expect(old).not.toBeNull();
    expect(old!.types.has('application.applicationcomponent')).toBe(true);
    const { rules, issues } = checkRules(C4_RULES, old);
    expect(issues).toEqual(expect.arrayContaining([expect.stringContaining('product.persona')]));
    expect(rules.elements.some((r) => r.type === 'product.persona')).toBe(false);
    expect(rules.elements.some((r) => r.type === 'business.businessrole')).toBe(true);
    expect(specCatalog(undefined)).toBeNull();
    expect(specCatalog({ schemas: { 'base.json': {} } })).toBeNull();
  });

  it('reports rules that name types the spec does not define, and leaves them out', () => {
    const { model, n } = sampleModel();
    const types = new Set(catalog.types);
    types.delete('product.persona');
    const relationships = new Set(catalog.relationships);
    relationships.delete('application.applicationcomponent|composes|application.applicationcomponent');
    const c4 = buildC4Model(model, { catalog: { ...catalog, types, relationships } });

    expect(c4.issues).toEqual(
      expect.arrayContaining([
        expect.stringContaining('element rule for product.persona'),
        expect.stringContaining('containment rule application.applicationcomponent composes'),
      ]),
    );
    // The persona rule is out: only its business role is behind the person.
    expect(c4.elementOf.has(n.persona.id)).toBe(false);
    // The composes rule is out: Canvas is no longer inside Shell.
    expect(c4.byId.get(ref(n.canvas))!.parentId).toBe(ref(n.app));
  });

  it('applies every rule when no spec is loaded', () => {
    expect(checkRules(C4_RULES, null)).toEqual({ rules: C4_RULES, issues: [] });
  });
});

describe('c4 model of the real fixture', () => {
  const payload = modelFixture as unknown as ModelPayload;
  const c4 = buildC4Model(derive(payload.nodes, payload.links), {
    catalog: specCatalog(specFixture as { schemas?: Record<string, unknown> }),
  });

  it('places every element in exactly one parent chain that ends at the system', () => {
    expect(isEmptyC4(c4)).toBe(false);
    for (const element of c4.elements) {
      if (element.kind === 'person' || element.kind === 'external-system' || element.kind === 'system') {
        expect(element.parentId).toBeNull();
      } else {
        const chain = c4Ancestors(c4, element.id);
        expect(chain[chain.length - 1]).toBe(C4_SYSTEM_ID);
      }
    }
  });

  it('accounts for every model element: a C4 element, folded onto one, a technology line, or counted as unplaced', () => {
    const technology = payload.nodes.filter((nd) => nd.layer_id === 'technology' && nd.type === 'systemsoftware').length;
    const placed = payload.nodes.filter((nd) => c4.elementOf.has(nd.id) || c4.anchorsOf.has(nd.id)).length;
    expect(placed + c4.unplaced.total).toBeGreaterThanOrEqual(payload.nodes.length - technology);
    expect(placed + c4.unplaced.total).toBeLessThanOrEqual(payload.nodes.length);
  });
});
