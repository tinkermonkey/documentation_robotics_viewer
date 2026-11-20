/**
 * search.spec.ts — the topbar search's index, ranking, grouping and highlight
 * ranges (`data/search.ts`), over hand-made entries and the real fixtures.
 */

import { describe, it, expect } from 'vitest';

import {
  buildSearchIndex,
  highlightPieces,
  matchName,
  MatchTier,
  searchIndex,
  type SearchEntry,
} from '@/apps/embedded/data/search';
import type { ModelNode } from '@/apps/embedded/data/useModel';
import type { SpecLayerInfo } from '@/apps/embedded/data/useSpec';
import { LAYER_ORDER } from '@/apps/embedded/ui/domain';

import model from '../fixtures/model.json';

function node(id: string, name: string, layer: string, type = 'thing'): ModelNode {
  return { id, name, layer_id: layer, type };
}

const SPEC: Record<string, SpecLayerInfo> = {
  business: { typeCount: 2, typeIds: ['businessservice', 'businessrole'], typeTitles: ['BusinessService', 'BusinessRole'], standard: '' },
  api: { typeCount: 1, typeIds: ['operation'], typeTitles: ['Operation'], standard: '' },
};

describe('search index', () => {
  it('ranks exact, prefix, word-prefix, substring then fuzzy matches and returns highlight ranges', () => {
    expect(matchName('model', 'model')).toEqual({ tier: MatchTier.exact, cost: 0, ranges: [[0, 5]] });
    expect(matchName('model view', 'mod')).toMatchObject({ tier: MatchTier.prefix, ranges: [[0, 3]] });
    expect(matchName('the model view', 'view')).toMatchObject({ tier: MatchTier.wordPrefix, ranges: [[10, 14]] });
    expect(matchName('use-model', 'model')).toMatchObject({ tier: MatchTier.wordPrefix, ranges: [[4, 9]] });
    expect(matchName('remodel', 'model')).toMatchObject({ tier: MatchTier.substring, ranges: [[2, 7]] });
    // Fuzzy prefers word starts: m·g·v on "Model Graph View".
    expect(matchName('model graph view', 'mgv')).toEqual({
      tier: MatchTier.fuzzy,
      cost: expect.any(Number),
      ranges: [[0, 1], [6, 7], [12, 13]],
    });
    // Consecutive fuzzy letters merge into one range.
    expect(matchName('changeset inbox', 'chin')?.ranges).toEqual([[0, 2], [10, 12]]);
    expect(matchName('model', 'xyz')).toBeNull();
    expect(matchName('model', 'ledom')).toBeNull();
    // Too scattered to be what you meant.
    expect(matchName('slugifyname > only hyphenates lower→upper', 'topbar')).toBeNull();

    const index = buildSearchIndex(
      [
        node('1', 'Remodel Tool', 'application'),
        node('2', 'Model', 'application'),
        node('3', 'Model Graph View', 'application'),
        node('4', 'Shared Model Store', 'application'),
        node('5', 'Mobile Device Lab', 'application'),
      ],
      {},
    );
    const names = searchIndex(index, 'model').groups.flatMap((g) => g.hits.map((h) => h.entry.name));
    expect(names).toEqual(['Model', 'Model Graph View', 'Shared Model Store', 'Remodel Tool', 'Mobile Device Lab']);
    // A fuzzy-only match still comes back, after the rest.
    const fuzzy = searchIndex(index, 'mdl').groups.flatMap((g) => g.hits.map((h) => h.entry.name));
    expect(fuzzy).toContain('Mobile Device Lab');

    expect(highlightPieces('Model Graph View', [[0, 1], [6, 7]])).toEqual([
      { text: 'M', match: true },
      { text: 'odel ', match: false },
      { text: 'G', match: true },
      { text: 'raph View', match: false },
    ]);
  });

  it('groups results by layer in spec order and caps them', () => {
    const index = buildSearchIndex(
      [
        node('a', 'Order API', 'api', 'operation'),
        node('b', 'Order Service', 'business', 'businessservice'),
        node('c', 'Order Goal', 'motivation', 'goal'),
      ],
      SPEC,
    );
    // Node types and elements both come in, the element naming its type in full (typeLabel).
    const service = index.find((e) => e.id === 'b')!;
    expect(service).toMatchObject({ kind: 'element', layer: 'business', typeLabel: 'Business Service' });
    expect(index.find((e) => e.id === 'business.businessrole')).toMatchObject({ kind: 'type', name: 'Business Role' });

    // Every group's best match is a prefix ("Order …", "Operation") except
    // business:type, whose Business Role only contains an "o": equally good
    // groups go in spec order (elements before node types), the weaker one after.
    const result = searchIndex(index, 'o');
    expect(result.groups.map((g) => g.key)).toEqual([
      'motivation:element',
      'business:element',
      'api:element',
      'api:type',
      'business:type',
    ]);
    // So the first option, the one Enter picks, is the best match.
    expect(searchIndex(index, 'operation').groups[0].hits[0].entry.name).toBe('Operation');

    // Over the real fixture: the cap holds, and groups whose best match is a
    // prefix ('model') follow LAYER_ORDER.
    const real = buildSearchIndex(model.nodes as ModelNode[], {});
    const capped = searchIndex(real, 'e', 10);
    expect(capped.total).toBeGreaterThan(10);
    expect(capped.groups.flatMap((g) => g.hits)).toHaveLength(10);
    const prefixGroups = searchIndex(real, 'model').groups.filter((g) => g.hits[0].match.tier === MatchTier.prefix);
    expect(prefixGroups.length).toBeGreaterThan(1);
    const ranks = prefixGroups.map((g) => LAYER_ORDER.indexOf(g.layer as never));
    expect([...ranks].sort((a, b) => a - b)).toEqual(ranks);
  });

  it('offers fuzzy matches only when few names match better', () => {
    const better = ['Change Set', 'Changes', 'Change Log', 'Change Inbox', 'Change Review'].map((n, i) =>
      node(`b${i}`, n, 'business'),
    );
    const fuzzy = node('f', 'Cache Hint Angel', 'business');
    // Five real matches: the scattered one is left out.
    expect(searchIndex(buildSearchIndex([...better, fuzzy], {}), 'change').total).toBe(5);
    // With fewer, it fills in after them.
    const thin = searchIndex(buildSearchIndex([better[0], fuzzy], {}), 'change');
    expect(thin.groups[0].hits.map((h) => h.entry.name)).toEqual(['Change Set', 'Cache Hint Angel']);
  });

  it('ignores case and extra spaces, and returns nothing for a blank query', () => {
    const index: SearchEntry[] = buildSearchIndex([node('1', 'DrBot Chat Drawer', 'ux')], {});
    expect(searchIndex(index, '   ').groups).toEqual([]);
    expect(searchIndex(index, '  CHAT   drawer ').groups[0].hits[0].match.tier).toBe(MatchTier.wordPrefix);
  });

  it('stays fast on a large model', () => {
    const nodes: ModelNode[] = [];
    for (let i = 0; i < 20000; i++) nodes.push(node(`n${i}`, `Element number ${i} of layer ${LAYER_ORDER[i % 13]}`, LAYER_ORDER[i % 13]));
    const index = buildSearchIndex(nodes, {});
    const start = performance.now();
    for (const q of ['e', 'el', 'ele', 'elem', 'nmb', '1999', 'layer ux']) searchIndex(index, q);
    expect(performance.now() - start).toBeLessThan(500);
  });
});
