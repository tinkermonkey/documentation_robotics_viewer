/**
 * ChangesetImpactView — the Changesets view's Impact tab: what the changeset
 * touches outside itself, before you Apply it.
 *
 * heimdall-ui 0.11 lanes (`GraphCanvas layout="layer-lanes"`), one lane per DR
 * layer, over `data/changesetImpact.ts`'s reached subgraph. Every element the
 * changeset marks is selected at once (`selectedIds`, multi-origin reach), so
 * the lanes light the union of their reach. Clicking an element isolates its
 * own reach; clicking it again, the background or "Show all" goes back.
 *
 * Lane options: `skipLayerRouting: 'gutter'` (links two or more lanes apart
 * run down a side gutter instead of across the lanes between),
 * `intraLinks: 'bundled'` (a row's same-layer links share one trunk) and the
 * Labels control's `nodeLabels` ('reached': 24px chips named only for the
 * selection and its reach; 'all': labelled boxes).
 *
 * Heimdall's default lane node has no status slot, so the op is drawn by a
 * scoped stylesheet keyed on each node's `data-node-id` — keeping the default
 * node's chips, tags and roving keyboard focus (a custom `renderNode` would
 * lose them). Each op has its own outline style as well as colour.
 */

import { useMemo, useState } from 'react';
import {
  GraphCanvas,
  SegmentedControl,
  followOptionLabel,
  useLayeredGraph,
  type LaneNodeLabels,
} from '@tinkermonkey/heimdall-ui';
import { IMPACT_LAYERING, type ChangesetImpact, type ImpactOp } from '../data/changesetImpact';
import { FOLLOW_DEPTHS, type FollowDepth } from '../data/followDepth';

const FOLLOW_OPTIONS = FOLLOW_DEPTHS.map((d) => ({ value: d, label: followOptionLabel(d) }));
const LABEL_OPTIONS = [
  { value: 'reached', label: 'Reached' },
  { value: 'all', label: 'All' },
];

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

const SCOPE = '.drv-impact';

export function ChangesetImpactView({
  changesetId,
  impact,
  follow,
  onFollowChange,
}: {
  changesetId: string;
  impact: ChangesetImpact;
  follow: FollowDepth;
  onFollowChange: (follow: FollowDepth) => void;
}) {
  const [isolated, setIsolated] = useState<string | null>(null);
  const [labels, setLabels] = useState<LaneNodeLabels>('reached');
  const { nodes, edges, originIds, opOf } = impact;

  // Isolating an element that's no longer in the graph (another follow depth,
  // a refetch) falls back to every origin.
  const isolatedId = isolated && impact.hopOf.has(isolated) ? isolated : null;
  const selectedIds = useMemo(() => (isolatedId ? [isolatedId] : originIds), [isolatedId, originIds]);

  const graph = useLayeredGraph({
    nodes,
    edges,
    layering: IMPACT_LAYERING,
    // Fully controlled: the lanes' own click handling (`select`, which toggles
    // the primary off) is ignored; `onNodeSelect` below decides instead.
    selectedIds,
    follow,
    onFollowChange: (f) => onFollowChange(Math.max(0, Math.min(2, f)) as FollowDepth),
  });

  const styles = useMemo(() => opStyles(SCOPE, opOf), [opOf]);

  const isolatedNode = isolatedId ? nodes.find((n) => n.id === isolatedId) : undefined;
  const opCounts = useMemo(() => {
    const counts = new Map<ImpactOp, number>();
    for (const id of originIds) {
      const op = opOf.get(id);
      if (op) counts.set(op, (counts.get(op) ?? 0) + 1);
    }
    return counts;
  }, [originIds, opOf]);

  if (originIds.length === 0) {
    return (
      <div
        style={{
          flex: 1,
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

  return (
    <div
      className="drv-impact"
      style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', minHeight: 0 }}
      data-testid="changeset-impact"
    >
      <style>{styles}</style>
      <div
        style={{
          flex: 'none',
          display: 'flex',
          flexWrap: 'wrap',
          alignItems: 'center',
          gap: '8px 18px',
          padding: '10px 22px',
          borderBottom: '1px solid rgb(var(--canvas-border))',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="drv-impact__eyebrow" aria-hidden="true">Follow</span>
          <SegmentedControl
            value={follow}
            onChange={(v) => onFollowChange(Number(v) as FollowDepth)}
            options={FOLLOW_OPTIONS}
            aria-label="Follow across layers"
            data-testid="impact-follow-control"
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="drv-impact__eyebrow" aria-hidden="true">Labels</span>
          <SegmentedControl
            value={labels}
            onChange={(v) => setLabels(v as LaneNodeLabels)}
            options={LABEL_OPTIONS}
            aria-label="Node labels"
            data-testid="impact-labels-control"
          />
        </div>
        <ul className="drv-impact__legend" aria-label="Changed elements">
          {(Object.keys(OP_OUTLINE) as ImpactOp[])
            .filter((op) => opCounts.has(op))
            .map((op) => (
              <li key={op} data-op={op}>
                <span
                  aria-hidden="true"
                  className="drv-impact__swatch"
                  style={{
                    outline: `${op === 'relink' ? 3 : 2}px ${OP_OUTLINE[op].style} rgb(var(${OP_OUTLINE[op].token}))`,
                  }}
                />
                {opCounts.get(op)} {OP_OUTLINE[op].label}
              </li>
            ))}
        </ul>
        {impact.unresolved > 0 && (
          <span
            style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-3))' }}
            title="These changes name an element that isn't in the model now (renamed or removed since), so they can't be placed."
            data-testid="impact-unresolved"
          >
            {plural(impact.unresolved, 'change')} not in the model
          </span>
        )}
        {isolatedNode && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginLeft: 'auto' }} data-testid="impact-isolating">
            <span style={{ fontSize: 12, color: 'rgb(var(--canvas-fg-2))' }}>
              Showing the reach of <strong style={{ color: 'rgb(var(--canvas-fg-1))' }}>{isolatedNode.label}</strong>
            </span>
            <button
              type="button"
              className="drv-impact__reset"
              onClick={() => setIsolated(null)}
              data-testid="impact-show-all"
            >
              Show all {plural(originIds.length, 'changed element')}
            </button>
          </div>
        )}
      </div>
      <div style={{ flex: 1, minHeight: 0, display: 'flex' }}>
        <GraphCanvas
          // Refit when the graph's extent changes (another changeset, follow depth or label mode).
          key={`${changesetId}:${follow}:${labels}`}
          layout="layer-lanes"
          layeredGraph={graph}
          laneOptions={{ intraLinks: 'bundled', skipLayerRouting: 'gutter', nodeLabels: labels }}
          fitView
          toolbarPosition="bottom-left"
          onNodeSelect={(id) => setIsolated(id === isolatedId ? null : id)}
          onBackgroundClick={() => setIsolated(null)}
          style={{ flex: 1, minHeight: 360 }}
          aria-label={`Impact of this changeset: ${plural(originIds.length, 'changed element')} and ${plural(impact.outsideCount, 'element')} they reach`}
        />
      </div>
    </div>
  );
}

export default ChangesetImpactView;
