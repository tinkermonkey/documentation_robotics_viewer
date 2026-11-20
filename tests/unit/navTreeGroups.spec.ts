import { describe, it, expect } from 'vitest';
import { groupByType, typeGroupKey } from '@/apps/embedded/data/navTreeGroups';
import type { ModelNode } from '@/apps/embedded/data/useModel';
import type { SpecLayerInfo } from '@/apps/embedded/data/useSpec';

const node = (id: string, type: string, name: string): ModelNode => ({ id, type, name, layer_id: 'motivation' });

const spec: SpecLayerInfo = {
  typeCount: 3,
  typeIds: ['requirement', 'goal', 'driver'],
  typeTitles: ['Requirement', 'Goal', 'Driver'],
  standard: '',
};

describe('Nav Tree Groups', () => {
  it("groups a layer's elements by type with counts, sorted", () => {
    const groups = groupByType(
      'motivation',
      [
        node('1', 'requirement', 'zeta'),
        node('2', 'goal', 'Beta'),
        node('3', 'requirement', 'Alpha'),
        node('4', 'goal', 'alpha 10'),
        node('5', 'goal', 'alpha 9'),
        node('6', 'driver', 'Only one'),
        node('7', 'mystery', 'No spec title'),
      ],
      spec,
    );

    // Groups A–Z by the type's short plural; an unknown type falls back to its id.
    expect(groups.map((g) => g.label)).toEqual(['Drivers', 'Goals', 'Mysteries', 'Requirements']);
    expect(groups.map((g) => g.key)).toEqual([
      'motivation.driver',
      'motivation.goal',
      'motivation.mystery',
      'motivation.requirement',
    ]);
    // Elements A–Z inside, case-insensitively and numerically.
    expect(groups[1].nodes.map((n) => n.name)).toEqual(['alpha 9', 'alpha 10', 'Beta']);
    expect(groups[3].nodes.map((n) => n.name)).toEqual(['Alpha', 'zeta']);
    // A type with one element still gets a group.
    expect(groups[0].nodes).toHaveLength(1);
  });

  it('labels every group by its type id without a spec, and groups nothing for an empty layer', () => {
    expect(groupByType('motivation', [node('1', 'goal', 'G')]).map((g) => g.label)).toEqual(['Goals']);
    expect(groupByType('motivation', [])).toEqual([]);
  });

  it('keys a group by the spec node id of its type', () => {
    expect(typeGroupKey('data-model', 'objectschema')).toBe('data-model.objectschema');
  });
});
