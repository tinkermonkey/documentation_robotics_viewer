import { describe, it, expect } from 'vitest';
import {
  isStructuralPredicate,
  isStructuralEdge,
  STRUCTURAL_PREDICATES,
} from '@/apps/embedded/data/predicates';

describe('isStructuralPredicate', () => {
  it('classifies DR structural-category predicates as structural', () => {
    expect(isStructuralPredicate('composes')).toBe(true);
    expect(isStructuralPredicate('extends')).toBe(true);
    expect(isStructuralPredicate('realizes')).toBe(true);
    expect(isStructuralPredicate('aggregates')).toBe(true);
    expect(isStructuralPredicate('specializes')).toBe(true);
  });

  it('classifies behavioral/dependency/other-category predicates as non-structural', () => {
    expect(isStructuralPredicate('uses')).toBe(false);
    expect(isStructuralPredicate('depends-on')).toBe(false);
    expect(isStructuralPredicate('monitors')).toBe(false);
    expect(isStructuralPredicate('references')).toBe(false);
    expect(isStructuralPredicate('serves')).toBe(false);
  });

  it('treats undefined/unknown predicates as non-structural', () => {
    expect(isStructuralPredicate(undefined)).toBe(false);
    expect(isStructuralPredicate('not-a-real-predicate')).toBe(false);
  });

  it('exports exactly the 12-predicate structural category', () => {
    expect([...STRUCTURAL_PREDICATES].sort()).toEqual(
      [
        'aggregates',
        'assigned-to',
        'associated-with',
        'composes',
        'connects',
        'exposes',
        'extends',
        'implements',
        'provides',
        'realizes',
        'scheduled-for',
        'specializes',
      ].sort(),
    );
  });
});

describe('isStructuralEdge', () => {
  it('reads the edge label as the predicate', () => {
    expect(isStructuralEdge({ label: 'composes' })).toBe(true);
    expect(isStructuralEdge({ label: 'uses' })).toBe(false);
    expect(isStructuralEdge({})).toBe(false);
  });
});
