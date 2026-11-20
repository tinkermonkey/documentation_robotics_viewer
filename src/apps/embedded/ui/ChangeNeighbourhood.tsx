/**
 * ChangeNeighbourhood — the selected element (or both ends of a link) and its
 * reach at the inspector's Follow depth, over the model as this changeset
 * leaves it (`changesetImpact` with a focus), in the change inspector.
 *
 * Drawn as compact layer lanes whose elements wrap, not as a `GraphCanvas`
 * lanes graph: Heimdall's lanes put each lane's elements on one row, so in a
 * ~380px column a real neighbourhood (dozens of elements) fits only at an
 * unreadable zoom. Each lane lists its elements nearest first; the focused
 * element is amber, elements this changeset adds are dashed, the others it
 * changes carry the Impact tab's op outline, and elements past the direct
 * links are faded. An element with a change opens it; Open in Impact shows
 * the same reach as a graph.
 */

import { useMemo, useState } from 'react';
import { SegmentedControl, followOptionLabel } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { LAYER_ORDER, layerColor, layerLabel } from './domain';
import { OP_OUTLINE } from './ChangesetImpactView';
import { useModel } from '../data/useModel';
import { changesetImpact } from '../data/changesetImpact';
import { FOLLOW_DEPTHS, type FollowDepth } from '../data/followDepth';
import type { ReviewItem, ReviewModel } from '../data/changesetReview';
import { useTypeName } from '../data/useTypeName';

const FOLLOW_OPTIONS = FOLLOW_DEPTHS.map((d) => ({ value: d, label: followOptionLabel(d) }));
/** Elements a lane lists before "+N more". */
const LANE_LIMIT = 10;

export function ChangeNeighbourhood({ item, model }: { item: ReviewItem; model: ReviewModel }) {
  const follow = useUiStore((s) => s.inspectorFollow);
  const setFollow = useUiStore((s) => s.setInspectorFollow);
  const selectChange = useUiStore((s) => s.selectChange);
  const focusImpact = useUiStore((s) => s.focusImpact);
  const { derived } = useModel();
  const typeNameOf = useTypeName();
  const [open, setOpen] = useState<ReadonlySet<string>>(new Set());

  const focus = useMemo(() => (item.link ? [item.link.source, item.link.target] : [item.elementId]), [item]);
  const impact = useMemo(
    () => changesetImpact(derived, model.items.map((i) => i.record), follow, focus),
    [derived, model.items, follow, focus],
  );
  const lanes = useMemo(() => {
    const by = new Map<string, typeof impact.nodes>();
    for (const n of impact.nodes) {
      const l = n.domainColor ?? '';
      (by.get(l) ?? by.set(l, []).get(l)!).push(n);
    }
    const hop = (id: string) => impact.hopOf.get(id) ?? 0;
    const order = [...LAYER_ORDER, ...[...by.keys()].filter((l) => !LAYER_ORDER.includes(l as never))];
    return order
      .filter((l) => by.has(l))
      .map((layerId) => ({
        layerId,
        nodes: by.get(layerId)!.sort((a, b) => hop(a.id) - hop(b.id) || a.label.localeCompare(b.label)),
      }));
  }, [impact]);

  const origins = new Set(impact.originIds);
  const reached = impact.nodes.length - origins.size;
  return (
    <section className="drv-ci-section" aria-label="Neighbourhood" data-testid="change-neighbourhood">
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className="drv-eyebrow">{item.link ? 'Both ends' : 'Neighbourhood'}</span>
        <SegmentedControl
          value={follow}
          onChange={(v) => setFollow(Number(v) as FollowDepth)}
          options={FOLLOW_OPTIONS}
          aria-label="Follow across layers"
          data-testid="neighbourhood-follow"
        />
      </div>
      {impact.originIds.length === 0 ? (
        <span className="drv-muted" style={{ fontSize: 12.5 }}>
          Not in the model, so there&apos;s nothing to draw around it.
        </span>
      ) : (
        <div className="drv-hood" data-testid="neighbourhood-lanes">
          {lanes.map(({ layerId, nodes }) => {
            const all = open.has(layerId);
            const shown = all ? nodes : nodes.slice(0, LANE_LIMIT);
            return (
              <div key={layerId} className="drv-hood__lane" role="group" aria-label={`${layerLabel(layerId)}: ${nodes.length}`}>
                <span className="drv-hood__head">
                  <span aria-hidden="true" className="drv-end__dot" style={{ background: layerColor(layerId) }} />
                  {layerLabel(layerId)}
                  <span className="drv-muted drv-mono" style={{ fontSize: 10.5 }}>
                    {nodes.length}
                  </span>
                </span>
                <span className="drv-hood__nodes">
                  {shown.map((n) => {
                    const op = impact.opOf.get(n.id);
                    const seq = impact.changesOf.get(n.id)?.find((s) => s !== item.seq);
                    const far = (impact.hopOf.get(n.id) ?? 0) > 1;
                    const isOrigin = origins.has(n.id);
                    const o = op ? OP_OUTLINE[op] : undefined;
                    const label = `${n.label} · ${n.kind ? typeNameOf(layerId, n.kind) : 'element'}${o ? ` · ${o.label}` : ''}${isOrigin ? ' · this change' : ''}`;
                    const cls = `drv-hood__node${isOrigin ? ' drv-hood__node--focus' : ''}${far ? ' drv-hood__node--far' : ''}`;
                    const style = o && op !== 'add' ? { outline: `${op === 'relink' ? 3 : 2}px ${o.style} rgb(var(${o.token}))` } : undefined;
                    const body = (
                      <>
                        {n.label}
                        {op === 'add' && <span className="drv-sr-only"> (added)</span>}
                      </>
                    );
                    return seq !== undefined && !isOrigin ? (
                      <button
                        key={n.id}
                        type="button"
                        className={`${cls}${op === 'add' ? ' drv-hood__node--new' : ''}`}
                        style={style}
                        title={`${label} · open change ${seq}`}
                        onClick={() => selectChange(seq)}
                        data-testid="neighbourhood-node"
                      >
                        {body}
                      </button>
                    ) : (
                      <span
                        key={n.id}
                        className={`${cls}${op === 'add' ? ' drv-hood__node--new' : ''}`}
                        style={style}
                        title={label}
                        data-testid="neighbourhood-node"
                      >
                        {body}
                      </span>
                    );
                  })}
                  {nodes.length > LANE_LIMIT && (
                    <button
                      type="button"
                      className="drv-linkbtn"
                      style={{ fontSize: 11.5 }}
                      aria-expanded={all}
                      onClick={() =>
                        setOpen((s) => {
                          const next = new Set(s);
                          if (all) next.delete(layerId);
                          else next.add(layerId);
                          return next;
                        })
                      }
                    >
                      {all ? 'fewer' : `+${nodes.length - LANE_LIMIT} more`}
                    </button>
                  )}
                </span>
              </div>
            );
          })}
        </div>
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
        <span className="drv-muted" style={{ fontSize: 11.5 }}>
          {reached} reached · dashed = added here · faded = past the direct links
        </span>
        <button
          type="button"
          className="drv-linkbtn"
          style={{ fontSize: 12, whiteSpace: 'nowrap' }}
          onClick={() => focusImpact(focus[0])}
          data-testid="neighbourhood-open-impact"
        >
          Open in Impact →
        </button>
      </div>
    </section>
  );
}

export default ChangeNeighbourhood;
