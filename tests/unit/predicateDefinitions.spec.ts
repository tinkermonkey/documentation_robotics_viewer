import { describe, it, expect } from 'vitest';
import {
  PREDICATE_DEFINITIONS,
  predicateDefinition,
  type PredicateCategory,
} from '@/apps/embedded/data/predicateDefinitions';
import { STRUCTURAL_PREDICATES } from '@/apps/embedded/data/predicates';
import modelFixture from '../fixtures/model.json';
import specFixture from '../fixtures/spec.json';

interface RawModel {
  links: Array<{ type: string }>;
}

interface RawSpecSchema {
  relationshipSchemas?: Record<string, { predicate: string }>;
}

interface RawSpec {
  schemas: Record<string, RawSpecSchema>;
}

const model = modelFixture as unknown as RawModel;
const spec = specFixture as unknown as RawSpec;

// Every predicate string actually used in the live fixture model, from both
// `/api/model` links and `/api/spec` relationship schemas.
function allUsedPredicates(): Set<string> {
  const used = new Set<string>();
  for (const link of model.links) used.add(link.type);
  for (const schema of Object.values(spec.schemas)) {
    for (const rel of Object.values(schema.relationshipSchemas ?? {})) {
      used.add(rel.predicate);
    }
  }
  return used;
}

const VALID_CATEGORIES: ReadonlySet<PredicateCategory> = new Set([
  'motivation',
  'business',
  'security',
  'structural',
  'dependency',
  'behavioral',
  'apm',
  'testing',
  'traceability',
  'governance',
  'ux',
  'data',
]);

describe('PREDICATE_DEFINITIONS / predicateDefinition', () => {
  it('the fixture model really uses 66 distinct predicates', () => {
    expect(allUsedPredicates().size).toBe(66);
  });

  it('defines every predicate used in the live fixture model (BA req 12 coverage)', () => {
    const missing = [...allUsedPredicates()].filter((p) => !PREDICATE_DEFINITIONS[p]);
    expect(missing).toEqual([]);
  });

  it('every catalog entry has a non-empty description and a valid category', () => {
    for (const [predicate, def] of Object.entries(PREDICATE_DEFINITIONS)) {
      expect(def.description.length, `${predicate} description`).toBeGreaterThan(0);
      expect(VALID_CATEGORIES.has(def.category), `${predicate} category "${def.category}"`).toBe(
        true,
      );
    }
  });

  it('predicateDefinition() returns the same entry as the raw map for every catalog predicate', () => {
    for (const predicate of Object.keys(PREDICATE_DEFINITIONS)) {
      expect(predicateDefinition(predicate)).toBe(PREDICATE_DEFINITIONS[predicate]);
    }
  });

  it('predicateDefinition() returns undefined for an unknown predicate', () => {
    expect(predicateDefinition('not-a-real-predicate')).toBeUndefined();
  });

  it('predicateDefinition() returns undefined for undefined input', () => {
    expect(predicateDefinition(undefined)).toBeUndefined();
  });

  it("every predicates.ts STRUCTURAL_PREDICATES entry resolves to category 'structural'", () => {
    for (const predicate of STRUCTURAL_PREDICATES) {
      const def = predicateDefinition(predicate);
      expect(def, `missing definition for structural predicate "${predicate}"`).toBeDefined();
      expect(def?.category).toBe('structural');
    }
  });

  it('spot-checks a few well-known predicates', () => {
    expect(predicateDefinition('composes')?.category).toBe('structural');
    expect(predicateDefinition('composes')?.archimateAlignment).toBe('Composition');
    expect(predicateDefinition('monitors')?.category).toBe('apm');
    expect(predicateDefinition('renders')?.category).toBe('ux');
    expect(predicateDefinition('depends-on')?.category).toBe('dependency');
  });
});
