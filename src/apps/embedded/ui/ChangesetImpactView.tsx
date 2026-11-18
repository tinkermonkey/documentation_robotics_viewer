/**
 * ChangesetImpactView — the Changesets view's Impact tab: what the changeset
 * touches outside itself, before you Apply it.
 *
 * heimdall-ui 0.11 lanes (`GraphCanvas layout="layer-lanes"`), one lane per DR
 * layer, over `data/changesetImpact.ts`'s reached subgraph. A large changeset
 * reaches hundreds of elements, so the tab narrows it four ways:
 *
 * - **Find**: elements whose name matches, listed beside the lanes (changed
 *   ones first). ↑↓ move, Enter (or a click) focuses the match.
 * - **Focus** (`uiStore.impactFocus`): one element and its reach at the
 *   Follow depth, instead of every change. Clicking an element focuses it;
 *   clicking it again, the background or Clear focus goes back. The change
 *   inspector's Open in Impact focuses the same way. The focused element's
 *   changes open in the inspector column (Open its change).
 * - **Show** Changes only / Changes + reach, and **filters** with counts:
 *   change (op), layer, element type and link category.
 * - **Large lanes**: a lane with more than `GROUP_THRESHOLD` elements folds
 *   each type with two or more of them into one group node ("46 workflow
 *   steps"); clicking a group opens it. Every element turns grouping off.
 *
 * Every changed element is selected at once when nothing is focused
 * (`selectedIds`, multi-origin reach). Lane options: `skipLayerRouting:
 * 'gutter'`, `intraLinks: 'bundled'` and the Labels control's `nodeLabels`.
 *
 * Heimdall's default lane node has no status slot, so the op is drawn by a
 * scoped stylesheet keyed on each node's `data-node-id` — keeping the default
 * node's chips, tags and roving keyboard focus (a custom `renderNode` would
 * lose them). Each op has its own outline style as well as colour.
 */

import { useMemo, useState, type KeyboardEvent } from 'react';
import {
  FilterBar,
  GraphCanvas,
  SegmentedControl,
  followOptionLabel,
  useLayeredGraph,
  type LaneNodeLabels,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerColor, layerLabel } from './domain';
import {
  GROUP_PREFIX,
  IMPACT_LAYERING,
  NO_IMPACT_FILTER,
  filterImpact,
  groupLargeLanes,
  impactFacets,
  searchImpact,
  type ChangesetImpact,
  type ImpactFacet,
  type ImpactFilter,
  type ImpactOp,
} from '../data/changesetImpact';
import { FOLLOW_DEPTHS, type FollowDepth } from '../data/followDepth';

const FOLLOW_OPTIONS = FOLLOW_DEPTHS.map((d) => ({ value: d, label: followOptionLabel(d) }));
const LABEL_OPTIONS = [
  { value: 'reached', label: 'Reached' },
  { value: 'all', label: 'All' },
];
/** A lane with more elements than this folds its types into groups. */
export const GROUP_THRESHOLD = 24;
/** Type facets shown before "+N more". */
const TYPE_FACETS = 6;
const MAX_MATCHES = 40;

/** Outline per op: a colour token and a line style, so the op isn't colour alone. */
export const OP_OUTLINE: Record<ImpactOp, { token: string; style: string; label: string }> = {
  add: { token: '--status-emerald', style: 'solid', label: 'added' },
  update: { token: '--status-cyan', style: 'dashed', label: 'modified' },
  delete: { token: '--status-rose', style: 'dotted', label: 'deleted' },
  relink: { token: '--status-violet', style: 'double', label: 'relationships changed' },
};

function cssId(id: string): string {
  return typeof CSS !== 'undefined' && CSS.escape ? CSS.escape(id) : id.replace(/["\\]/g, '\\$&');
}

/** Scoped outline rules, one per marked element. */
export function opStyles(scope: string, opOf: ReadonlyMap<string, ImpactOp>): string {
  const rules: string[] = [];
  for (const [id, op] of opOf) {
    const o = OP_OUTLINE[op];
    const width = op === 'relink' ? 3 : 2;
    rules.push(
      `${scope} [data-node-id="${cssId(id)}"] .graph-lane-node{outline:${width}px ${o.style} rgb(var(${o.token}));outline-offset:2px}`,
    );
  }
  return rules.join('\n');
}

function plural(n: number, word: string): string {
  return `${n} ${word}${n === 1 ? '' : 's'}`;
}

function toggled<T>(set: ReadonlySet<T>, value: T): Set<T> {
  const next = new Set(set);
  if (next.has(value)) next.delete(value);
  else next.add(value);
  return next;
}

const SCOPE = '.drv-impact';

function FacetGroup({
  label,
  facets,
  hidden,
  name,
  onToggle,
  swatch,
  limit,
}: {
  label: string;
  facets: ImpactFacet[];
  hidden: ReadonlySet<string>;
  name: (value: string) => string;
  onToggle: (value: string) => void;
  swatch?: (value: string) => React.ReactNode;
  limit?: number;
}) {
  const [all, setAll] = useState(false);
  if (facets.length === 0) return null;
  const shown = limit && !all ? facets.slice(0, limit) : facets;
  return (
    <div className="drv-facets" role="group" aria-label={`Show ${label.toLowerCase()}`}>
      <span className="drv-impact__eyebrow" aria-hidden="true">
        {label}
      </span>
      {shown.map((f) => (
        <button
          key={f.value}
          type="button"
          className="drv-facet"
          aria-pressed={!hidden.has(f.value)}
          onClick={() => onToggle(f.value)}
          data-testid="impact-facet"
          data-facet={f.value}
        >
          {swatch?.(f.value)}
          {name(f.value)}
          <span className="drv-facet__n">{f.count}</span>
        </button>
      ))}
      {limit && facets.length > limit && (
        <button type="button" className="drv-facet drv-facet--more" onClick={() => setAll((v) => !v)} aria-expanded={all}>
          {all ? 'fewer' : `+${facets.length - limit}`}
        </button>
      )}
    </div>
  );
}

export function ChangesetImpactView({
  changesetId,
  impact,
  focused,
}: {
  changesetId: string;
  /** Every changed element's reach. */
  impact: ChangesetImpact;
  /** The focused element's reach (`uiStore.impactFocus`), EMPTY when nothing is focused. */
  focused: ChangesetImpact;
}) {
  const follow = useUiStore((s) => s.inspectorFollow);
  const setFollow = useUiStore((s) => s.setInspectorFollow);
  const focusRef = useUiStore((s) => s.impactFocus);
  const focusImpact = useUiStore((s) => s.focusImpact);
  const selectChange = useUiStore((s) => s.selectChange);
  const [labels, setLabels] = useState<LaneNodeLabels>('reached');
  const [filter, setFilter] = useState<ImpactFilter>(NO_IMPACT_FILTER);
  const [grouping, setGrouping] = useState(true);
  const [expanded, setExpanded] = useState<ReadonlySet<string>>(new Set());
  const [query, setQuery] = useState('');
  const [active, setActive] = useState(0);

  // A focus on an element that's no longer in the graph (another follow
  // depth, a refetch) falls back to every change.
  const focusId = focusRef && focused.originIds.length > 0 ? focused.originIds[0] : null;
  const base = focusId ? focused : impact;
  const facets = useMemo(() => impactFacets(base), [base]);
  const filtered = useMemo(() => filterImpact(base, filter), [base, filter]);
  const grouped = useMemo(
    () =>
      groupLargeLanes(filtered, {
        threshold: grouping ? GROUP_THRESHOLD : Infinity,
        keep: new Set(focusId ? [focusId] : []),
        expanded,
      }),
    [filtered, grouping, focusId, expanded],
  );
  const shown = grouped.impact;
  const matches = useMemo(() => searchImpact(base, query).slice(0, MAX_MATCHES), [base, query]);

  // The op is in each changed element's name too ("Foo · added"), so it reaches
  // screen readers and the lane name tags, not only the outline.
  const nodes = useMemo(
    () =>
      shown.nodes.map((n) => {
        const op = shown.opOf.get(n.id);
        return op ? { ...n, label: `${n.label} · ${OP_OUTLINE[op].label}` } : n;
      }),
    [shown],
  );
  const selectedIds = useMemo(() => (focusId ? [focusId] : shown.originIds), [focusId, shown.originIds]);

  const graph = useLayeredGraph({
    nodes,
    edges: shown.edges,
    layering: IMPACT_LAYERING,
    // Fully controlled: the lanes' own click handling (`select`, which toggles
    // the primary off) is ignored; `onNodeSelect` below decides instead.
    selectedIds,
    follow,
    onFollowChange: (f) => setFollow(Math.max(0, Math.min(2, f)) as FollowDepth),
  });

  const styles = useMemo(() => opStyles(SCOPE, shown.opOf), [shown.opOf]);

  if (impact.originIds.length === 0) {
    return (
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'grid',
          placeItems: 'center',
          color: 'rgb(var(--canvas-fg-3))',
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 12,
        }}
        data-testid="changeset-impact-empty"
      >
        none of these changes touch an element in the model
      </div>
    );
  }

  const focusNode = focusId ? base.nodes.find((n) => n.id === focusId) : undefined;
  const focusChanges = focusId ? impact.changesOf.get(focusId) ?? [] : [];
  const onNode = (id: string) => {
    if (id.startsWith(GROUP_PREFIX)) {
      setExpanded((s) => new Set(s).add(id.slice(GROUP_PREFIX.length)));
      return;
    }
    focusImpact(id === focusId ? null : id);
  };
  const pick = (id: string) => {
    focusImpact(id);
    setQuery('');
  };
  const onFindKey = (e: KeyboardEvent<HTMLElement>) => {
    if (matches.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      pick(matches[Math.min(active, matches.length - 1)].id);
    }
  };

  const hiddenChips = [
    ...(filter.changesOnly ? [{ id: 'show', label: 'changes only' }] : []),
    ...[...filter.ops].map((o) => ({ id: `op:${o}`, label: `no ${OP_OUTLINE[o].label}` })),
    ...[...filter.layers].map((l) => ({ id: `layer:${l}`, label: `no ${layerLabel(l)}` })),
    ...[...filter.types].map((t) => ({ id: `type:${t}`, label: `no ${t}` })),
    ...[...filter.categories].map((c) => ({ id: `cat:${c}`, label: `no ${c} links` })),
  ];
  const removeChip = (id: string) => {
    const [kind, value] = [id.slice(0, id.indexOf(':')), id.slice(id.indexOf(':') + 1)];
    if (id === 'show') setFilter((f) => ({ ...f, changesOnly: false }));
    else if (kind === 'op') setFilter((f) => ({ ...f, ops: toggled(f.ops, value as ImpactOp) }));
    else if (kind === 'layer') setFilter((f) => ({ ...f, layers: toggled(f.layers, value) }));
    else if (kind === 'type') setFilter((f) => ({ ...f, types: toggled(f.types, value) }));
    else if (kind === 'cat') setFilter((f) => ({ ...f, categories: toggled(f.categories, value) }));
  };
  const groupedLanes = [...grouped.laneCounts].filter(([, c]) => c.shown < c.total);

  return (
    <div
      className="drv-impact"
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      data-testid="changeset-impact"
    >
      <style>{styles}</style>
      <div className="drv-impact__controls">
        <div className="drv-impact__row" onKeyDown={onFindKey}>
          <FilterBar
            className="drv-impact__find"
            value={query}
            onSearchChange={(q) => {
              setQuery(q);
              setActive(0);
            }}
            searchPlaceholder="Find an element by name"
            filters={hiddenChips}
            onFilterRemove={removeChip}
            onClearAll={() => setFilter(NO_IMPACT_FILTER)}
            showingCount={shown.nodes.length}
            totalCount={base.nodes.length}
            aria-label="Find and filter the impact"
            data-testid="impact-find"
          />
        </div>
        <div className="drv-impact__row">
          <div className="drv-impact__ctl">
            <span className="drv-impact__eyebrow" aria-hidden="true">Show</span>
            <SegmentedControl
              value={filter.changesOnly ? 'changes' : 'reach'}
              onChange={(v) => setFilter((f) => ({ ...f, changesOnly: v === 'changes' }))}
              options={[
                { value: 'changes', label: 'Changes only' },
                { value: 'reach', label: 'Changes + reach' },
              ]}
              aria-label="Show"
              data-testid="impact-show-control"
            />
          </div>
          <div className="drv-impact__ctl">
            <span className="drv-impact__eyebrow" aria-hidden="true">Follow</span>
            <SegmentedControl
              value={follow}
              onChange={(v) => setFollow(Number(v) as FollowDepth)}
              options={FOLLOW_OPTIONS}
              aria-label="Follow across layers"
              data-testid="impact-follow-control"
            />
          </div>
          <div className="drv-impact__ctl">
            <span className="drv-impact__eyebrow" aria-hidden="true">Large lanes</span>
            <SegmentedControl
              value={grouping ? 'group' : 'every'}
              onChange={(v) => {
                setGrouping(v === 'group');
                setExpanded(new Set());
              }}
              options={[
                { value: 'group', label: 'Group by type' },
                { value: 'every', label: 'Every element' },
              ]}
              aria-label="Large lanes"
              data-testid="impact-grouping-control"
            />
          </div>
          <div className="drv-impact__ctl">
            <span className="drv-impact__eyebrow" aria-hidden="true">Labels</span>
            <SegmentedControl
              value={labels}
              onChange={(v) => setLabels(v as LaneNodeLabels)}
              options={LABEL_OPTIONS}
              aria-label="Node labels"
              data-testid="impact-labels-control"
            />
          </div>
        </div>
        <div className="drv-impact__row">
          <FacetGroup
            label="Change"
            facets={facets.ops}
            hidden={filter.ops}
            name={(v) => OP_OUTLINE[v as ImpactOp].label}
            onToggle={(v) => setFilter((f) => ({ ...f, ops: toggled(f.ops, v as ImpactOp) }))}
            swatch={(v) => {
              const o = OP_OUTLINE[v as ImpactOp];
              return (
                <span
                  aria-hidden="true"
                  className="drv-impact__swatch"
                  style={{ outline: `${v === 'relink' ? 3 : 2}px ${o.style} rgb(var(${o.token}))` }}
                />
              );
            }}
          />
          <FacetGroup
            label="Layer"
            facets={facets.layers}
            hidden={filter.layers}
            name={layerLabel}
            onToggle={(v) => setFilter((f) => ({ ...f, layers: toggled(f.layers, v) }))}
            swatch={(v) => <span aria-hidden="true" className="drv-end__dot" style={{ background: layerColor(v) }} />}
          />
          <FacetGroup
            label="Type"
            facets={facets.types}
            hidden={filter.types}
            name={(v) => v}
            onToggle={(v) => setFilter((f) => ({ ...f, types: toggled(f.types, v) }))}
            limit={TYPE_FACETS}
          />
          <FacetGroup
            label="Links"
            facets={facets.categories}
            hidden={filter.categories}
            name={(v) => v}
            onToggle={(v) => setFilter((f) => ({ ...f, categories: toggled(f.categories, v) }))}
          />
          {impact.unresolved > 0 && (
            <span
              style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}
              title="These changes name an element that isn't in the model now (renamed or removed since), so they can't be placed."
              data-testid="impact-unresolved"
            >
              {plural(impact.unresolved, 'change')} not in the model
            </span>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <div style={{ flex: 1, minWidth: 0, position: 'relative', display: 'flex', flexDirection: 'column' }}>
          <div className="drv-impact__crumbs" data-testid="impact-breadcrumb">
            {focusNode ? (
              <>
                <button type="button" className="drv-linkbtn" onClick={() => focusImpact(null)}>
                  All changes
                </button>
                <span aria-hidden="true">›</span>
                <strong>{focusNode.label}</strong>
                <span className="drv-muted">
                  · {followOptionLabel(follow)} · {plural(base.nodes.length, 'element')}
                </span>
                <button
                  type="button"
                  className="drv-impact__reset"
                  onClick={() => focusImpact(null)}
                  data-testid="impact-show-all"
                >
                  Clear focus
                </button>
              </>
            ) : (
              <span className="drv-muted">
                All changes · {plural(impact.originIds.length, 'changed element')} reach{' '}
                {plural(impact.outsideCount, 'element')} outside the changeset
              </span>
            )}
            {groupedLanes.length > 0 && (
              <span className="drv-muted" data-testid="impact-grouped-note">
                ·{' '}
                {groupedLanes
                  .map(([l, c]) => `${layerLabel(l)}: ${c.shown} of ${c.total} shown`)
                  .join(' · ')}
                , grouped by type
              </span>
            )}
          </div>
          {shown.nodes.length === 0 ? (
            <div
              style={{ flex: 1, display: 'grid', placeItems: 'center', color: 'rgb(var(--canvas-fg-3))', fontSize: 13 }}
              data-testid="impact-filtered-empty"
            >
              <span>
                Nothing matches these filters.{' '}
                <button type="button" className="drv-linkbtn" onClick={() => setFilter(NO_IMPACT_FILTER)}>
                  Reset filters
                </button>
              </span>
            </div>
          ) : (
            <GraphCanvas
              // Refit when the graph's extent changes (another changeset, focus, follow depth or label mode).
              key={`${changesetId}:${focusId ?? ''}:${follow}:${labels}`}
              layout="layer-lanes"
              layeredGraph={graph}
              laneOptions={{ intraLinks: 'bundled', skipLayerRouting: 'gutter', nodeLabels: labels }}
              fitView
              toolbarPosition="bottom-left"
              onNodeSelect={onNode}
              onBackgroundClick={() => focusImpact(null)}
              style={{ flex: 1, minHeight: 360 }}
              aria-label={
                focusNode
                  ? `Reach of ${focusNode.label}: ${plural(shown.nodes.length, 'element')}`
                  : `Impact of this changeset: ${plural(impact.originIds.length, 'changed element')} and ${plural(impact.outsideCount, 'element')} they reach`
              }
            />
          )}
        </div>

        <aside className="drv-impact__side" aria-label="Find results and focus" data-testid="impact-side">
          {query.trim() ? (
            <>
              <div className="drv-impact__side-head">
                <span className="drv-impact__eyebrow">
                  Matches for “{query.trim()}” · {matches.length}
                </span>
                <span className="drv-muted" style={{ fontSize: 11.5 }}>
                  ↑↓ moves · Enter focuses
                </span>
              </div>
              <ul className="drv-impact__matches" role="listbox" aria-label="Matching elements" data-testid="impact-matches">
                {matches.length === 0 && <li className="drv-muted">No element by that name here.</li>}
                {matches.map((m, i) => (
                  <li key={m.id} role="option" aria-selected={i === active}>
                    <button type="button" className="drv-impact__match" onClick={() => pick(m.id)} onMouseEnter={() => setActive(i)}>
                      <span className="drv-impact__match-name">{m.label}</span>
                      <span className="drv-row__type">
                        {layerLabel(m.layerId).toLowerCase()} · {m.kind} ·{' '}
                        {m.op ? <span className="drv-impact__match-op">{OP_OUTLINE[m.op].label}</span> : 'reached, unchanged'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          ) : focusNode ? (
            <div className="drv-impact__side-head" data-testid="impact-focus">
              <span className="drv-impact__eyebrow">Focused</span>
              <strong style={{ fontSize: 13.5 }}>{focusNode.label}</strong>
              <span className="drv-row__type">
                {layerLabel(focusNode.domainColor).toLowerCase()} · {focusNode.kind}
                {impact.opOf.get(focusNode.id) ? ` · ${OP_OUTLINE[impact.opOf.get(focusNode.id)!].label}` : ' · reached, unchanged'}
              </span>
              <span className="drv-muted" style={{ fontSize: 12 }}>
                {focusChanges.length > 0
                  ? `${plural(focusChanges.length, 'change')} in this changeset touch it`
                  : 'No change in this changeset touches it'}
                ; it reaches {plural(Math.max(0, base.nodes.length - 1), 'element')} at {followOptionLabel(follow).toLowerCase()}.
              </span>
              {focusChanges.length > 0 && (
                <button
                  type="button"
                  className="drv-impact__reset"
                  style={{ alignSelf: 'flex-start' }}
                  onClick={() => selectChange(focusChanges[0])}
                  data-testid="impact-open-change"
                >
                  Open its change
                </button>
              )}
            </div>
          ) : (
            <div className="drv-impact__side-head drv-muted" style={{ fontSize: 12.5 }} data-testid="impact-help">
              <span className="drv-impact__eyebrow">Getting around</span>
              <span>Find an element by name, or click one in the lanes, to see its reach alone.</span>
              <span>Filters narrow the lanes; the counts are for what&apos;s in view now.</span>
              <span>A lane with more than {GROUP_THRESHOLD} elements folds them by type. Click a group to open it, or show Every element.</span>
              <span>Outlines mark what the changeset does to an element; unmarked elements are only reached.</span>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}

export default ChangesetImpactView;
