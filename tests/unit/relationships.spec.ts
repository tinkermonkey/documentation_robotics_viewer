import { describe, it, expect } from 'vitest';
import {
  relationshipsForElement,
  metadataForElement,
} from '@/apps/embedded/data/relationships';
import { buildModelIndex, resolveEndpoint } from '@/apps/embedded/data/modelGraph';
import type {
  ModelDerived,
  ModelNode,
  ModelLink,
} from '@/apps/embedded/data/useModel';
import modelFixture from '../fixtures/model.json';

interface RawModel {
  nodes: ModelNode[];
  links: ModelLink[];
}
function deriveModel(raw: RawModel): ModelDerived {
  const nodesByLayer: Record<string, ModelNode[]> = {};
  const countsByLayer: Record<string, number> = {};
  for (const n of raw.nodes) {
    countsByLayer[n.layer_id] = (countsByLayer[n.layer_id] ?? 0) + 1;
    (nodesByLayer[n.layer_id] ??= []).push(n);
  }
  return {
    nodes: raw.nodes,
    links: raw.links,
    countsByLayer,
    nodesByLayer,
    relCount: raw.links.length,
  };
}
const model = deriveModel(modelFixture as unknown as RawModel);
const index = buildModelIndex(model);

// A motivation goal known to have both outgoing and incoming + cross-layer rels.
const GOAL_ID = '462e2931-4c7c-4051-a9ac-8817c270d650';

describe('relationshipsForElement', () => {
  it('returns [] for an unknown element id', () => {
    expect(relationshipsForElement(model, 'no-such-uuid', index)).toEqual([]);
  });

  it('derives out/in links with correct target/title/domain/predicate/direction', () => {
    const rels = relationshipsForElement(model, GOAL_ID, index);
    expect(rels.length).toBeGreaterThan(0);

    for (const r of rels) {
      // each link must correspond to a real model link touching GOAL_ID
      const rawId = r.id.replace(/^(out|in)-\d+-/, '');
      const link = model.links.find((l) => l.id === rawId)!;
      expect(link).toBeDefined();
      expect(r.predicate).toBe(link.type);

      const src = resolveEndpoint(index, link.source)!;
      const tgt = resolveEndpoint(index, link.target)!;
      if (r.direction === 'out') {
        expect(src.id).toBe(GOAL_ID);
        expect(r.target).toBe(tgt.id);
        expect(r.targetTitle).toBe(tgt.name);
        expect(r.targetDomain).toBe(tgt.layer_id);
      } else {
        expect(tgt.id).toBe(GOAL_ID);
        expect(r.target).toBe(src.id);
        expect(r.targetTitle).toBe(src.name);
        expect(r.targetDomain).toBe(src.layer_id);
      }
    }
  });

  it('counts reconcile with the raw links touching the element', () => {
    const rels = relationshipsForElement(model, GOAL_ID, index);
    const expectedOut = model.links.filter(
      (l) => resolveEndpoint(index, l.source)?.id === GOAL_ID,
    ).length;
    const expectedIn = model.links.filter(
      (l) => resolveEndpoint(index, l.target)?.id === GOAL_ID,
    ).length;
    expect(rels.filter((r) => r.direction === 'out')).toHaveLength(expectedOut);
    expect(rels.filter((r) => r.direction === 'in')).toHaveLength(expectedIn);
  });

  it('targetDomain is the OTHER endpoint layer → cross-layer rels carry it', () => {
    const self = model.nodes.find((n) => n.id === GOAL_ID)!;
    const rels = relationshipsForElement(model, GOAL_ID, index);
    const crossLayer = rels.filter((r) => r.targetDomain !== self.layer_id);
    expect(crossLayer.length).toBeGreaterThan(0); // this goal has cross-layer rels
    for (const r of crossLayer) {
      // the OTHER endpoint genuinely lives in a different layer
      const other = model.nodes.find((n) => n.id === r.target)!;
      expect(other.layer_id).toBe(r.targetDomain);
      expect(other.layer_id).not.toBe(self.layer_id);
    }
  });

  it('every relationship link has a unique id (no React key clashes)', () => {
    const rels = relationshipsForElement(model, GOAL_ID, index);
    expect(new Set(rels.map((r) => r.id)).size).toBe(rels.length);
  });
});

describe('metadataForElement', () => {
  it('curates a fixed PROPERTIES set (layer/type/provenance/source) — no attribute spread', () => {
    const node: ModelNode = {
      id: 'n1',
      layer_id: 'application',
      type: 'service',
      name: 'My Service',
      description: 'does things',
      attributes: { title: 'should-not-leak', foo: 'bar', count: 42 },
      source_reference: {
        provenance: 'extracted',
        locations: [{ file: 'src/x.ts', symbol: 'doThing' }],
      },
    } as unknown as ModelNode;

    const meta = metadataForElement(node, 'Application');
    expect(meta.id).toBe('n1');
    expect(meta.title).toBe('My Service');
    expect(meta.kind).toBe('service');
    expect(meta.domain).toBe('application');
    expect(meta.description).toBe('does things');

    // curated keys only — NOT the raw attributes.
    expect(Object.keys(meta.metadata ?? {}).sort()).toEqual([
      'layer',
      'provenance',
      'source',
      'type',
    ]);
    expect(meta.metadata?.layer).toBe('Application');
    expect(meta.metadata?.type).toBe('service');
    expect(meta.metadata?.provenance).toBe('extracted');
    // prefers the symbol over the file.
    expect(meta.metadata?.source).toBe('doThing');
    // the colliding `title` attribute is NOT spread into the grid.
    expect(meta.metadata).not.toHaveProperty('title');
    expect(meta.metadata).not.toHaveProperty('foo');
  });

  it('defaults provenance to "authored" and omits source when no reference', () => {
    const node: ModelNode = {
      id: 'n2',
      layer_id: 'business',
      type: 'process',
      name: 'Authored Thing',
    } as unknown as ModelNode;

    const meta = metadataForElement(node, 'Business');
    expect(meta.metadata?.provenance).toBe('authored');
    expect(meta.metadata).not.toHaveProperty('source');
    expect(Object.keys(meta.metadata ?? {}).sort()).toEqual(['layer', 'provenance', 'type']);
  });

  it('falls back to the file path when a location has only a file', () => {
    const node: ModelNode = {
      id: 'n3',
      layer_id: 'api',
      type: 'operation',
      name: 'Op',
      source_reference: { provenance: 'extracted', locations: [{ file: 'README.md' }] },
    } as unknown as ModelNode;
    expect(metadataForElement(node, 'API').metadata?.source).toBe('README.md');
  });

  it('works on a real fixture node (provenance + source resolve)', () => {
    const node = model.nodes.find((n) => n.id === GOAL_ID)!;
    const meta = metadataForElement(node, 'Motivation');
    expect(meta.metadata?.layer).toBe('Motivation');
    expect(meta.metadata?.type).toBe(node.type);
    expect(typeof meta.metadata?.provenance).toBe('string');
  });
});
