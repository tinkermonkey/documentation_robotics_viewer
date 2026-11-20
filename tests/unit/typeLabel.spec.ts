/**
 * typeLabel — one display name for a node type (#605), over real spec titles
 * from the /api/spec fixture.
 */

import { describe, it, expect } from 'vitest';

import { pluralize, specTypeLabel, splitWords, typeLabel, withCount } from '@/apps/embedded/data/typeLabel';
import specFixture from '../fixtures/spec.json';

type Schemas = Record<string, { layer?: { id?: string }; nodeSchemas?: Record<string, { title?: string }> }>;
const schemas = (specFixture as unknown as { schemas: Schemas }).schemas;

/** The fixture's title for `layer.type`, so every case below is a real spec title. */
function title(layer: string, type: string): string {
  const t = schemas[`${layer}.json`]?.nodeSchemas?.[type]?.title;
  if (!t) throw new Error(`fixture has no title for ${layer}.${type}`);
  return t;
}

const label = (layer: string, type: string) => typeLabel(title(layer, type), layer);

describe('node type label splits, pluralizes and drops the layer word', () => {
  it('splits a multi-word title, makes it plural, and drops the layer word in the short form', () => {
    expect(label('application', 'applicationcomponent')).toEqual({
      singular: 'Application Component',
      plural: 'Application Components',
      short: 'Components',
    });
    expect(label('business', 'businessprocess')).toEqual({
      singular: 'Business Process',
      plural: 'Business Processes',
      short: 'Processes',
    });
    expect(label('testing', 'testcasesketch').short).toBe('Test Case Sketches');
    expect(label('technology', 'technologyservice').short).toBe('Services');
    expect(label('navigation', 'navigationflow').short).toBe('Flows');
  });

  it('keeps every word of a type whose title does not start with its layer name', () => {
    expect(label('application', 'dataobject')).toEqual({
      singular: 'Data Object',
      plural: 'Data Objects',
      short: 'Data Objects',
    });
    expect(label('motivation', 'requirement').short).toBe('Requirements');
    expect(label('data-model', 'objectschema').short).toBe('Object Schemas');
  });

  it('pluralizes -y, -s, -x and irregular nouns, and leaves an already-plural title alone', () => {
    expect(label('security', 'passwordpolicy').plural).toBe('Password Policies');
    expect(label('data-store', 'index').plural).toBe('Indexes');
    expect(label('security', 'evidence').plural).toBe('Evidence');
    expect(label('ux', 'chartseries').plural).toBe('Chart Series');
    expect(label('api', 'paths').plural).toBe('Paths');
    expect(label('api', 'components').plural).toBe('Components');
    expect(label('security', 'securityconstraints').short).toBe('Constraints');
    expect(label('api', 'info').plural).toBe('Info');
  });

  it('keeps acronyms and known compounds whole', () => {
    expect(label('ux', 'uxapplication')).toEqual({
      singular: 'UX Application',
      plural: 'UX Applications',
      short: 'Applications',
    });
    expect(label('data-model', 'jsonschema').singular).toBe('JSON Schema');
    expect(label('api', 'oauthflow').singular).toBe('OAuth Flow');
    expect(label('api', 'oauthflows').plural).toBe('OAuth Flows');
    expect(label('api', 'openapidocument').singular).toBe('OpenAPI Document');
  });

  it('keeps a title that is only the layer word', () => {
    expect(typeLabel('Application', 'application').short).toBe('Applications');
  });

  it('falls back to the type id when the spec has no title, capitalized', () => {
    expect(specTypeLabel(undefined, 'application', 'workflowstep')).toEqual({
      singular: 'Workflowstep',
      plural: 'Workflowsteps',
      short: 'Workflowsteps',
    });
    expect(typeLabel('workflow-step', 'business').plural).toBe('Workflow Steps');
    // A bare id still breaks at its layer's own word.
    expect(typeLabel('applicationservice', 'application')).toEqual({
      singular: 'Application Service',
      plural: 'Application Services',
      short: 'Services',
    });
    expect(typeLabel('uxapplication', 'ux').singular).toBe('UX Application');
    expect(typeLabel('', 'business').plural).toBe('');
  });

  it('reads a title from the layer spec info by type id', () => {
    const spec = { typeCount: 1, typeIds: ['applicationservice'], typeTitles: ['ApplicationService'], standard: '' };
    expect(specTypeLabel(spec, 'application', 'applicationservice').short).toBe('Services');
  });

  it('puts the count after the label', () => {
    expect(withCount('Components', 37)).toBe('Components · 37');
  });

  it('exposes the word split and plural rules', () => {
    expect(splitWords('NavigationGraph')).toEqual(['Navigation', 'Graph']);
    expect(pluralize('Process')).toBe('Processes');
    expect(pluralize('Status')).toBe('Statuses');
    expect(pluralize('Goal')).toBe('Goals');
  });
});
