/**
 * checkoutLinks — the dr CLI's viewer links (viewer-link.ts) read by the router,
 * and the destination an old unscoped link carries through the picker.
 */
import { describe, expect, it } from 'vitest';
import {
  checkoutBase,
  formatNext,
  parseNext,
  readCliLink,
  takeFragmentToken,
} from '@/apps/embedded/routes/checkoutLinks';

describe('checkoutLinks', () => {
  it('encodes each name of the checkout route', () => {
    expect(checkoutBase({ project: 'documentation robotics', checkout: 'wt/a' })).toBe(
      '/p/documentation%20robotics/c/wt%2Fa',
    );
  });

  it('takes the token out of the fragment and keeps the other parameters', () => {
    expect(takeFragmentToken('#/p/x/c/main/changesets/cs-1?element=a.b.c&token=t0k')).toEqual({
      token: 't0k',
      hash: '#/p/x/c/main/changesets/cs-1?element=a.b.c',
    });
    expect(takeFragmentToken('#/p/x/c/main/?token=t0k')).toEqual({ token: 't0k', hash: '#/p/x/c/main/' });
    expect(takeFragmentToken('#/p/x/c/main/model/graph?layer=api')).toEqual({
      token: null,
      hash: '#/p/x/c/main/model/graph?layer=api',
    });
    expect(takeFragmentToken('')).toEqual({ token: null, hash: '' });
  });

  it('reads the changeset and element link forms, and nothing else', () => {
    expect(readCliLink('changesets', 'changeset-17')).toEqual({ kind: 'changeset', changesetId: 'changeset-17' });
    expect(readCliLink('changesets', 'changeset-17', 'api.operation.get-x')).toEqual({
      kind: 'changeset',
      changesetId: 'changeset-17',
      element: 'api.operation.get-x',
    });
    expect(readCliLink('elements', 'api.operation.get-x')).toEqual({ kind: 'element', elementId: 'api.operation.get-x' });
    // The viewer's own pages.
    expect(readCliLink('changesets', 'list')).toBeNull();
    expect(readCliLink('model', 'graph')).toBeNull();
    expect(readCliLink('architecture', 'diagram')).toBeNull();
  });

  it('carries an old unscoped link through the picker, without its token', () => {
    const next = formatNext('model', 'page', { layer: 'api', node: 'uuid-1', token: 'secret', vp: '' });
    expect(next).toBe('model/page?layer=api&node=uuid-1');
    expect(parseNext(next)).toEqual({ section: 'model', view: 'page', search: { layer: 'api', node: 'uuid-1' } });
    expect(parseNext('nope/graph')).toBeNull();
    expect(parseNext(undefined)).toBeNull();
  });
});
