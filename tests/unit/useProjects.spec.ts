/**
 * The project and checkout listings (GET /api/projects): validated, sorted,
 * and the farm's only checkout found for the picker.
 */
import { describe, expect, it } from 'vitest';
import { isProjectsUnsupported, toProjects } from '@/apps/embedded/data/useProjects';
import { onlyCheckout } from '@/apps/embedded/ui/CheckoutPicker';
import { ApiError } from '@/core/services/generatedApiClient';

const checkout = (key: string, extra: Record<string, unknown> = {}) => ({
  key,
  path: `/farm/${key}`,
  branch: key === 'main' ? 'main' : `claude/${key}`,
  head: 'abc',
  state: 'present',
  activeChangeset: null,
  stagedChangesets: 0,
  ...extra,
});

describe('toProjects', () => {
  it('keeps well-formed projects and checkouts, main checkout first', () => {
    const projects = toProjects({
      projects: [
        { name: 'zeta', repository: '/r/z', model: 'm', checkouts: [checkout('wt-b'), checkout('main'), checkout('wt-a')] },
        { name: 'alpha', repository: '/r/a', model: 'm', checkouts: [{ nokey: true }, checkout('main', { state: 'weird' })] },
        { repository: 'no name' },
        'junk',
      ],
    });
    expect(projects.map((p) => p.name)).toEqual(['alpha', 'zeta']);
    expect(projects[1].checkouts.map((c) => c.key)).toEqual(['main', 'wt-a', 'wt-b']);
    // An unknown state reads as present; a checkout without a key is dropped.
    expect(projects[0].checkouts).toEqual([
      { key: 'main', path: '/farm/main', branch: 'main', state: 'present', activeChangeset: null, stagedChangesets: 0 },
    ]);
    expect(toProjects(null)).toEqual([]);
  });

  it('finds the farm\'s only present checkout', () => {
    const one = toProjects({ projects: [{ name: 'p', checkouts: [checkout('main'), checkout('gone', { state: 'missing' })] }] });
    expect(onlyCheckout(one)).toEqual({ project: 'p', checkout: 'main' });
    const two = toProjects({ projects: [{ name: 'p', checkouts: [checkout('main'), checkout('wt')] }] });
    expect(onlyCheckout(two)).toBeNull();
  });

  it('reads a server without the project routes as unsupported', () => {
    expect(isProjectsUnsupported(new ApiError('GET /api/projects', 404, 'Not Found'))).toBe(true);
    expect(isProjectsUnsupported(new SyntaxError('Unexpected token <'))).toBe(true);
    expect(isProjectsUnsupported(new ApiError('GET /api/projects', 401, '{"error":"no"}'))).toBe(false);
  });
});
