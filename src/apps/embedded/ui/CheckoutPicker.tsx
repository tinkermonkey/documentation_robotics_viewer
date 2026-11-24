/**
 * Checkout picker — choosing which project and checkout of the dr CLI's
 * central process (`dr serve`) this tab shows.
 *
 * - `CheckoutPickerPage`: what a bare `/#/` opens (and an old unscoped
 *   `/#/<section>/<view>` link, whose destination it carries over to the
 *   checkout chosen). Every project with its checkouts, from `GET /api/projects`.
 *   A farm with exactly one checkout opens it straight away.
 * - `CheckoutSwitcher`: the topbar's project and checkout Selects; switching
 *   opens the same view in the other checkout, without a new link.
 * - `CheckoutUnavailablePage`: shown instead of the views when the route's
 *   checkout can't be served (404, `checkout.removed`, `server.stopping`).
 *
 * The pages navigate with `useNavigate` and the route's path pattern (they
 * only render under the router); the switcher, which renders in the shell's
 * topbar like the rest of `ui/` (tests mount it without a router), sets the
 * hash. Neither imports the router (which imports the UI).
 */

import { useEffect, useMemo } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { Badge, Button, Select } from '@tinkermonkey/heimdall-ui';
import {
  useProjectCheckouts,
  useProjects,
  type CheckoutSummary,
  type ProjectSummary,
} from '../data/useProjects';
import { useCheckoutStore, type CheckoutRef, type CheckoutUnavailable } from '../stores/checkoutStore';
import { useUiStore } from './uiStore';
import { checkoutBase, parseNext, type PendingDestination } from '../routes/checkoutLinks';

const SelectItem = Select.Item;

/** The checkout route's path pattern (router.tsx's `checkoutShellRoute`). */
export const CHECKOUT_SHELL_PATH = '/p/$project/c/$checkout/$section/$view' as const;

/** The search a switch carries to another checkout: what means the same thing in every checkout. */
function carriedSearch(section: string): Record<string, string | undefined> {
  const s = useUiStore.getState();
  if (section === 'model' || section === 'spec') return { layer: s.layerId ?? undefined };
  if (section === 'architecture') return { level: s.c4Level };
  return {};
}

function useOpenCheckout() {
  const navigate = useNavigate();
  return (ref: CheckoutRef, destination?: PendingDestination | null, replace = false) => {
    void navigate({
      to: CHECKOUT_SHELL_PATH,
      params: {
        project: ref.project,
        checkout: ref.checkout,
        section: destination?.section ?? 'model',
        view: destination?.view ?? 'graph',
      },
      search: destination?.search ?? {},
      replace,
    } as never);
  };
}

const pageStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'rgb(var(--shell-bg))',
  color: 'rgb(var(--shell-fg-1))',
  display: 'flex',
  justifyContent: 'center',
  padding: '64px 24px',
  boxSizing: 'border-box',
};

const panelStyle: React.CSSProperties = {
  width: '100%',
  maxWidth: 720,
  display: 'flex',
  flexDirection: 'column',
  gap: 16,
};

function Heading({ title, lead }: { title: string; lead: React.ReactNode }) {
  return (
    <header style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <h1 style={{ fontSize: 20, fontWeight: 600, margin: 0 }}>{title}</h1>
      <p style={{ margin: 0, fontSize: 13, lineHeight: 1.5, color: 'rgb(var(--shell-fg-2))' }}>{lead}</p>
    </header>
  );
}

function checkoutLabel(c: CheckoutSummary): string {
  return c.branch && c.branch !== c.key ? `${c.key} (${c.branch})` : c.key;
}

function CheckoutRow({
  project,
  checkout,
  onOpen,
}: {
  project: string;
  checkout: CheckoutSummary;
  onOpen: () => void;
}) {
  const present = checkout.state === 'present';
  return (
    <li
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '10px 12px',
        borderTop: '1px solid rgb(var(--shell-border))',
      }}
    >
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>
          {checkout.key}
          {checkout.key === 'main' ? ' · main checkout' : ' · worktree'}
        </span>
        <span
          style={{
            fontSize: 11,
            color: 'rgb(var(--shell-fg-3))',
            fontFamily: "'JetBrains Mono',monospace",
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={checkout.path}
        >
          {checkout.branch ?? 'detached'} · {checkout.path}
        </span>
      </div>
      {checkout.stagedChangesets > 0 && (
        <Badge color="amber">
          {checkout.stagedChangesets} staged
        </Badge>
      )}
      {!present && <Badge color="rose">{checkout.state}</Badge>}
      <Button
        size="sm"
        variant={present ? 'primary' : 'secondary'}
        disabled={!present}
        onClick={onOpen}
        aria-label={`Open ${project}, checkout ${checkout.key}`}
        data-testid={`checkout-open-${project}-${checkout.key}`}
      >
        Open
      </Button>
    </li>
  );
}

function ProjectCard({
  project,
  onOpen,
}: {
  project: ProjectSummary;
  onOpen: (checkout: string) => void;
}) {
  return (
    <section
      aria-label={`Project ${project.name}`}
      style={{
        background: 'rgb(var(--shell-surface))',
        border: '1px solid rgb(var(--shell-border))',
        borderRadius: 'var(--radius-lg, 10px)',
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '12px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        <h2 style={{ margin: 0, fontSize: 15, fontWeight: 600 }}>{project.name}</h2>
        {project.repository && (
          <span style={{ fontSize: 11, color: 'rgb(var(--shell-fg-3))', fontFamily: "'JetBrains Mono',monospace" }}>
            {project.repository}
          </span>
        )}
      </div>
      {project.checkouts.length === 0 ? (
        <p style={{ margin: 0, padding: '10px 12px', fontSize: 12, color: 'rgb(var(--shell-fg-3))' }}>No checkouts.</p>
      ) : (
        <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
          {project.checkouts.map((c) => (
            <CheckoutRow key={c.key} project={project.name} checkout={c} onOpen={() => onOpen(c.key)} />
          ))}
        </ul>
      )}
    </section>
  );
}

/** The one present checkout of the farm, when there is exactly one. */
export function onlyCheckout(projects: ProjectSummary[]): CheckoutRef | null {
  const present = projects.flatMap((p) =>
    p.checkouts.filter((c) => c.state === 'present').map((c) => ({ project: p.name, checkout: c.key })),
  );
  return present.length === 1 ? present[0] : null;
}

export function CheckoutPickerPage({ next }: { next?: string }) {
  const view = useProjects();
  const open = useOpenCheckout();
  const destination = useMemo(() => parseNext(next), [next]);
  const only = view.kind === 'ready' ? onlyCheckout(view.projects) : null;

  // One checkout: nothing to choose.
  useEffect(() => {
    if (only) open(only, destination, true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [only?.project, only?.checkout]);

  return (
    <main style={pageStyle} data-testid="checkout-picker">
      <div style={panelStyle}>
        <Heading
          title="Choose a checkout"
          lead={
            destination
              ? 'This link names no project. Choose the checkout to open it in.'
              : 'This dr process serves every project and checkout (main checkout and worktrees) of your farm. Choose one to open.'
          }
        />
        {view.kind === 'loading' && <p role="status" style={{ fontSize: 13 }}>Loading the projects…</p>}
        {view.kind === 'unsupported' && (
          <p role="alert" style={{ fontSize: 13, lineHeight: 1.5 }}>
            This server doesn&apos;t list projects: it is not the dr CLI&apos;s central process. This viewer needs
            <code> dr serve</code> (or a <code>dr visualize</code> that runs on it); open it from the link that
            <code> dr visualize</code> or DrBot&apos;s review_open gives.
          </p>
        )}
        {view.kind === 'error' && (
          <p role="alert" style={{ fontSize: 13 }}>
            Couldn&apos;t list the projects: {view.message}
          </p>
        )}
        {view.kind === 'ready' && view.projects.length === 0 && (
          <p style={{ fontSize: 13 }}>This farm has no projects yet. Run <code>dr init</code> in a repository.</p>
        )}
        {view.kind === 'ready' &&
          view.projects.map((p) => (
            <ProjectCard
              key={p.name}
              project={p}
              onOpen={(checkout) => open({ project: p.name, checkout }, destination)}
            />
          ))}
      </div>
    </main>
  );
}

const UNAVAILABLE_TEXT: Record<CheckoutUnavailable['reason'], (ref: CheckoutRef) => string> = {
  'not-found': (ref) =>
    `The dr process has no checkout ${ref.checkout} of project ${ref.project}: the project or checkout is unknown, or its folder is gone.`,
  removed: (ref) => `Checkout ${ref.checkout} of project ${ref.project} was removed while it was open.`,
  stopping: () =>
    'The dr process is shutting down. A process started again has a new access token, so open the viewer again from its link (dr visualize, or DrBot’s review_open).',
};

export function CheckoutUnavailablePage({ checkout, unavailable }: { checkout: CheckoutRef; unavailable: CheckoutUnavailable }) {
  const navigate = useNavigate();
  return (
    <main style={pageStyle} data-testid="checkout-unavailable">
      <div style={panelStyle}>
        <Heading title="This checkout can't be shown" lead={UNAVAILABLE_TEXT[unavailable.reason](checkout)} />
        {unavailable.message && (
          <p style={{ margin: 0, fontSize: 12, color: 'rgb(var(--shell-fg-3))', fontFamily: "'JetBrains Mono',monospace" }}>
            {unavailable.message}
          </p>
        )}
        <div>
          <Button variant="primary" onClick={() => void navigate({ to: '/' } as never)} data-testid="checkout-unavailable-picker">
            Choose another checkout
          </Button>
        </div>
      </div>
    </main>
  );
}

/** The hash that opens `ref` at `destination`. */
export function checkoutHash(ref: CheckoutRef, destination: PendingDestination): string {
  const params = new URLSearchParams(destination.search);
  const query = params.toString();
  return `#${checkoutBase(ref)}/${destination.section}/${destination.view}${query ? `?${query}` : ''}`;
}

/** The topbar's project and checkout Selects. */
export function CheckoutSwitcher() {
  const ref = useCheckoutStore((s) => s.ref);
  const projectsView = useProjects();
  const { checkouts } = useProjectCheckouts(ref?.project ?? null);
  const view = useUiStore((s) => s.view);
  const mode = useUiStore((s) => s.mode);
  if (!ref) return null;

  const projects = projectsView.kind === 'ready' ? projectsView.projects : [];
  const switchTo = (next: CheckoutRef) => {
    if (next.project === ref.project && next.checkout === ref.checkout) return;
    const section: string = view;
    const target =
      section === 'changesets'
        ? { section, view: 'list' }
        : section === 'architecture'
          ? { section, view: 'diagram' }
          : { section, view: mode };
    const search = Object.fromEntries(
      Object.entries(carriedSearch(section)).filter((e): e is [string, string] => !!e[1]),
    );
    // A new history entry: Back returns to the checkout left.
    window.location.hash = checkoutHash(next, { ...target, search });
  };
  const projectCheckouts = (name: string) => projects.find((p) => p.name === name)?.checkouts ?? [];
  const shown = checkouts.length > 0 ? checkouts : projectCheckouts(ref.project);

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 'none' }} data-testid="checkout-switcher">
      <Select
        value={ref.project}
        onChange={(project) => {
          const first = projectCheckouts(project).find((c) => c.state === 'present');
          switchTo({ project, checkout: first?.key ?? 'main' });
        }}
        ariaLabel="Project"
        data-testid="checkout-switcher-project"
      >
        {projects.length === 0 && <SelectItem value={ref.project}>{ref.project}</SelectItem>}
        {projects.map((p) => (
          <SelectItem key={p.name} value={p.name}>
            {p.name}
          </SelectItem>
        ))}
      </Select>
      <Select
        value={ref.checkout}
        onChange={(checkout) => switchTo({ project: ref.project, checkout })}
        ariaLabel="Checkout"
        data-testid="checkout-switcher-checkout"
      >
        {!shown.some((c) => c.key === ref.checkout) && <SelectItem value={ref.checkout}>{ref.checkout}</SelectItem>}
        {shown.map((c) => (
          <SelectItem
            key={c.key}
            value={c.key}
            disabled={c.state !== 'present'}
            description={c.state !== 'present' ? c.state : c.key === 'main' ? 'main checkout' : 'worktree'}
          >
            {checkoutLabel(c)}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}
