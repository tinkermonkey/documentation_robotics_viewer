/**
 * markdownExcerpt — the inbox card's one-paragraph excerpt of a changeset's
 * markdown description (#588) and its inline tokens.
 */

import { describe, it, expect } from 'vitest';

import { descriptionExcerpt, inlineTokens } from '@/apps/embedded/ui/markdownExcerpt';

describe('descriptionExcerpt', () => {
  it('takes only the first paragraph and drops list and heading markup', () => {
    const md = [
      '## Intent',
      '',
      "Render a changeset's description",
      'as markdown.',
      '',
      '**In scope**',
      '- `a.b.c`',
    ].join('\n');
    expect(descriptionExcerpt(md)).toBe("Render a changeset's description as markdown.");
    // A list: its first item, without the marker.
    expect(descriptionExcerpt('1. first step\n   continued\n2. second')).toBe('first step continued');
    expect(descriptionExcerpt('* only\n* items')).toBe('only');
    // A paragraph straight above a list ends at the list.
    expect(descriptionExcerpt('Intent here.\n- in scope')).toBe('Intent here.');
    // Only a heading: its text.
    expect(descriptionExcerpt('# Just a title')).toBe('Just a title');
    // A fence and a rule are skipped, a quote unwrapped.
    expect(descriptionExcerpt('```\ncode\n```\n\n---\n\n> quoted *text*')).toBe('quoted *text*');
    // Raw HTML tags go; their text stays text.
    expect(descriptionExcerpt('a <b>bold</b> <img src=x onerror="x()"> end')).toBe('a bold end');
  });

  it('reads plain text unchanged, single newlines folded', () => {
    expect(descriptionExcerpt('Brings the model in line with PR 497')).toBe('Brings the model in line with PR 497');
    expect(descriptionExcerpt('one\r\ntwo')).toBe('one two');
    expect(descriptionExcerpt('')).toBe('');
    expect(descriptionExcerpt(null)).toBe('');
  });
});

describe('inlineTokens', () => {
  it('splits code spans, strong, emphasis and keeps only a link text', () => {
    expect(inlineTokens('use `x_y` and **bold _em_** or *it*, [link](javascript:alert(1)) <https://e.com>')).toEqual([
      { kind: 'text', text: 'use ' },
      { kind: 'code', text: 'x_y' },
      { kind: 'text', text: ' and ' },
      {
        kind: 'strong',
        children: [
          { kind: 'text', text: 'bold ' },
          { kind: 'em', children: [{ kind: 'text', text: 'em' }] },
        ],
      },
      { kind: 'text', text: ' or ' },
      { kind: 'em', children: [{ kind: 'text', text: 'it' }] },
      { kind: 'text', text: ', link https://e.com' },
    ]);
  });

  it('leaves snake_case and lone asterisks as text', () => {
    expect(inlineTokens('snake_case_id and 2 * 3')).toEqual([{ kind: 'text', text: 'snake_case_id and 2 * 3' }]);
  });
});
