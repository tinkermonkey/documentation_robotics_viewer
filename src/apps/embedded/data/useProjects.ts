/**
 * useProjects — the farm's projects and checkouts, for the checkout picker
 * and the topbar's switcher.
 *
 * `GET /api/projects` lists every project with its checkouts;
 * `GET /api/projects/{project}/checkouts` lists one project's. Both are the
 * dr CLI's central process (`dr serve`); an older CLI (a per-project
 * `dr visualize`) has neither and answers 404, which reads as `unsupported`.
 * Nothing from the wire reaches React unchecked: malformed entries are dropped.
 */

import { useMemo } from 'react';
import {
  ApiError,
  useGetapiprojects,
  useGetapiprojectsprojectcheckouts,
} from '../../../core/services/generatedApiClient';

export type CheckoutState = 'present' | 'missing' | 'prunable';

export interface CheckoutSummary {
  /** The checkout's name in routes and API paths (`main`, or a worktree's name). */
  key: string;
  path: string;
  branch: string | null;
  state: CheckoutState;
  activeChangeset: string | null;
  stagedChangesets: number;
}

export interface ProjectSummary {
  name: string;
  repository: string;
  checkouts: CheckoutSummary[];
}

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

const STATES: readonly CheckoutState[] = ['present', 'missing', 'prunable'];

export function toCheckout(raw: unknown): CheckoutSummary | null {
  if (!isObject(raw) || typeof raw.key !== 'string' || !raw.key) return null;
  const state = STATES.includes(raw.state as CheckoutState) ? (raw.state as CheckoutState) : 'present';
  return {
    key: raw.key,
    path: typeof raw.path === 'string' ? raw.path : '',
    branch: typeof raw.branch === 'string' ? raw.branch : null,
    state,
    activeChangeset: typeof raw.activeChangeset === 'string' ? raw.activeChangeset : null,
    stagedChangesets: typeof raw.stagedChangesets === 'number' ? raw.stagedChangesets : 0,
  };
}

/** The main checkout first, then the worktrees by name. */
export function sortCheckouts(checkouts: CheckoutSummary[]): CheckoutSummary[] {
  return [...checkouts].sort((a, b) =>
    a.key === 'main' ? -1 : b.key === 'main' ? 1 : a.key.localeCompare(b.key),
  );
}

function toCheckouts(raw: unknown): CheckoutSummary[] {
  if (!Array.isArray(raw)) return [];
  return sortCheckouts(raw.map(toCheckout).filter((c): c is CheckoutSummary => c !== null));
}

export function toProjects(raw: unknown): ProjectSummary[] {
  if (!isObject(raw) || !Array.isArray(raw.projects)) return [];
  return raw.projects
    .filter((p): p is Record<string, unknown> => isObject(p) && typeof p.name === 'string' && !!p.name)
    .map((p) => ({
      name: p.name as string,
      repository: typeof p.repository === 'string' ? p.repository : '',
      checkouts: toCheckouts(p.checkouts),
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/** The server has no project routes: not the central process. */
export function isProjectsUnsupported(error: unknown): boolean {
  return (error instanceof ApiError && (error.status === 404 || error.status === 405)) || error instanceof SyntaxError;
}

export type ProjectsView =
  | { kind: 'loading' }
  | { kind: 'unsupported' }
  | { kind: 'error'; message: string }
  | { kind: 'ready'; projects: ProjectSummary[] };

const NO_RETRY_WHEN_UNSUPPORTED = (failures: number, error: unknown) => !isProjectsUnsupported(error) && failures < 1;

export function useProjects(): ProjectsView {
  const query = useGetapiprojects({ retry: NO_RETRY_WHEN_UNSUPPORTED, staleTime: 30_000 });
  return useMemo<ProjectsView>(() => {
    if (query.error) {
      if (isProjectsUnsupported(query.error)) return { kind: 'unsupported' };
      const message = query.error instanceof ApiError ? (query.error.serverMessage ?? query.error.message) : String(query.error);
      return { kind: 'error', message };
    }
    if (!query.data) return { kind: 'loading' };
    return { kind: 'ready', projects: toProjects(query.data) };
  }, [query.error, query.data]);
}

/** One project's checkouts (`[]` while loading or when the project is unknown). */
export function useProjectCheckouts(project: string | null): { checkouts: CheckoutSummary[]; isLoading: boolean } {
  const query = useGetapiprojectsprojectcheckouts(project ?? '', {
    enabled: !!project,
    retry: NO_RETRY_WHEN_UNSUPPORTED,
    staleTime: 30_000,
  });
  const checkouts = useMemo(
    () => (isObject(query.data) ? toCheckouts(query.data.checkouts) : []),
    [query.data],
  );
  return { checkouts, isLoading: query.isLoading };
}
