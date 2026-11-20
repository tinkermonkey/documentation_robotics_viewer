/**
 * Apply, reviewed: the confirm dialog that lists what lands and what is left
 * out (drops and the changes cascaded with them, blocked deletes taking their
 * links, how many undecided changes land as kept), and the results card a committed changeset shows afterwards (landed
 * by layer, what was left out).
 */

import { Button, Modal, StatTile } from '@tinkermonkey/heimdall-ui';
import { layerLabel } from './domain';
import { useUiStore } from './uiStore';
import { LayerSwatch, plural } from './reviewParts';
import { DriftOverlapList } from './DriftNotice';
import { driftTone, type ChangesetDrift } from '../data/changesetDrift';
import {
  countKinds,
  kindCountsLabel,
  landedByLayer,
  type ApplyPlan,
  type CancelPair,
  type ReviewItem,
} from '../data/changesetReview';

export interface ApplyConfirmProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  name: string;
  plan: ApplyPlan;
  pairs: CancelPair[];
  /** An older dr CLI: every change lands, there is nothing to leave out. */
  local: boolean;
  /**
   * The changeset's drift. An older dr CLI that refuses a drifted commit
   * (`blocks`): say the refusal is the expected outcome. A newer one that lands
   * it over its overlaps (`overlaps`): list each overlap's consequence first.
   */
  drift?: ChangesetDrift;
}

function itemText(item: ReviewItem): string {
  return item.kind === 'link-add' || item.kind === 'link-delete' ? item.summary : item.name;
}

export function ApplyConfirm({ isOpen, onClose, onConfirm, name, plan, pairs, local, drift }: ApplyConfirmProps) {
  const tone = driftTone(drift);
  const lands = plan.landing.length;
  const dropped = plan.dropped.length;
  const k = plan.landingByKind;
  const deletes = k.delete + k['link-delete'];
  const undecided = plan.undecided.length;
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Apply ${name}?`}
      size="lg"
      className="drv-review-modal"
      data-testid="apply-confirm"
      footer={
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <Button variant="secondary" size="sm" onClick={onClose} data-testid="apply-confirm-back">
            Back to review
          </Button>
          <Button variant="accent" size="sm" onClick={onConfirm} data-testid="apply-confirm-button">
            Apply {plural(lands, 'change')}
          </Button>
        </div>
      }
    >
      <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {tone === 'overlaps' && (
          <div role="alert" className="drv-note" data-testid="apply-confirm-drift">
            <strong>The base changed since this was staged.</strong> Applying lands it all the same, over what the
            base changed. {drift!.message}
            <div style={{ marginTop: 8 }}>
              <DriftOverlapList drift={drift} />
            </div>
          </div>
        )}
        {tone === 'blocks' && (
          <div role="alert" className="drv-alert" data-testid="apply-confirm-drift">
            <strong>The base changed since this was staged.</strong> The server will most likely refuse this apply
            for drift, and then nothing is written and your decisions are kept. Asking DrBot to restage it is the way
            forward.
          </div>
        )}
        <p style={{ margin: 0, fontSize: 13.5, lineHeight: 1.55, color: 'rgb(var(--canvas-fg-2))' }}>
          {plural(lands, 'change')} land in the model.
          {dropped > 0 && ` ${dropped} you left out are taken out first and stay in the changeset's history.`}
          {pairs.length > 0 && ` ${plural(pairs.length, 'pair')} added then removed cancel out.`} They are validated
          first; nothing is written if any change fails.
        </p>
        <div className="drv-stat-row">
          <StatTile label="Add" value={k.add} color="emerald" />
          <StatTile label="Update" value={k.update} color="cyan" />
          <StatTile label="Link add" value={k['link-add']} color="emerald" />
          {deletes > 0 && <StatTile label="Delete" value={deletes} color="rose" />}
          {!local && <StatTile label="Left out" value={dropped} color="rose" />}
        </div>
        {undecided > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="apply-confirm-undecided">
            <span className="drv-eyebrow">Undecided, landing as kept</span>
            <span style={{ fontSize: 12.5, color: 'rgb(var(--canvas-fg-2))' }}>
              {undecided === lands ? `All ${lands}` : `${undecided} of the ${lands}`} have no decision (
              {kindCountsLabel(countKinds(plan.undecided))}). Apply lands them as kept; go back to drop or ask about
              any you want held back.
            </span>
          </div>
        )}
        {dropped > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="apply-confirm-dropped">
            <span className="drv-eyebrow">Left out</span>
            <div className="drv-links-list">
              {plan.dropped.map((d) => (
                <FragmentRow key={d.item.seq} seq={d.item.seq}>
                  {itemText(d.item)}
                  <span className="drv-muted">
                    {d.cascadedBy
                      ? ` · left out with ${d.cascadedBy.name} (${d.cascadedBy.seq})`
                      : d.note
                        ? ` · "${d.note}"`
                        : ' · dropped'}
                  </span>
                </FragmentRow>
              ))}
            </div>
          </div>
        )}
        {plan.linksDeleted > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }} data-testid="apply-confirm-links">
            <span className="drv-eyebrow">Deleted with their elements</span>
            <span style={{ fontSize: 12.5, color: 'rgb(var(--canvas-fg-2))' }}>
              {plural(plan.linksDeleted, 'link')} that still {plan.linksDeleted === 1 ? 'uses' : 'use'}{' '}
              {plan.landing
                .filter((i) => plan.deleteBlockedLinks.includes(i.seq))
                .map((i) => i.name)
                .join(', ')}{' '}
              {plan.linksDeleted === 1 ? 'is' : 'are'} deleted with {plan.deleteBlockedLinks.length === 1 ? 'it' : 'them'}.
            </span>
          </div>
        )}
        {local && (
          <p className="drv-note" style={{ margin: 0 }}>
            This dr CLI applies the whole changeset; your verdicts were kept in this browser only.
          </p>
        )}
      </div>
    </Modal>
  );
}

function FragmentRow({ seq, children }: { seq: number; children: React.ReactNode }) {
  return (
    <>
      <span className="drv-mono drv-muted">{seq}</span>
      <span>{children}</span>
    </>
  );
}

export interface AppliedResultProps {
  /** The changes that landed. */
  landed: ReviewItem[];
  /** Labels of what was left out, if known. */
  leftOut: { seq: number; label: string }[];
  linksDeleted?: number;
  /** How many landed with no per-change decision; undefined when that isn't known (verdicts kept in a browser). */
  undecidedLanded?: number;
}

/** The changeset page once applied: what is in the model, by layer. */
export function AppliedResult({ landed, leftOut, linksDeleted, undecidedLanded }: AppliedResultProps) {
  const setView = useUiStore((s) => s.setView);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const byLayer = landedByLayer(landed);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }} data-testid="applied-result">
      <div className="drv-card drv-card--ok drv-summary">
        <div className="drv-summary__top">
          <span className="drv-summary__headline">{plural(landed.length, 'change')} in the model</span>
        </div>
        <p style={{ margin: 0, fontSize: 13, lineHeight: 1.55, color: 'rgb(var(--canvas-fg-2))' }}>
          Written to {plural(byLayer.length, 'layer file')} under{' '}
          <span className="drv-mono">documentation-robotics/</span>. Commit them with the code; to undo, revert those
          files in git.
          {linksDeleted ? ` ${plural(linksDeleted, 'link')} that still used deleted elements went with them.` : ''}
        </p>
        {undecidedLanded ? (
          <span className="drv-muted" style={{ fontSize: 12.5 }} data-testid="applied-undecided">
            {undecidedLanded === landed.length ? `All ${undecidedLanded}` : `${undecidedLanded} of ${landed.length}`}{' '}
            landed without a per-change decision.
          </span>
        ) : null}
      </div>
      {byLayer.length > 0 && (
        <section className="drv-group" aria-label="Landed by layer">
          <div className="drv-group__head">
            <h3 className="drv-group__title">Landed</h3>
            <span className="drv-group__hint">by layer</span>
          </div>
          <div className="drv-landed">
            {byLayer.map((l) => (
              <LandedRow
                key={l.layerId}
                layerId={l.layerId}
                text={kindCountsLabel(l.counts)}
                onOpen={() => {
                  setView('model');
                  selectLayer(l.layerId);
                }}
              />
            ))}
          </div>
        </section>
      )}
      {leftOut.length > 0 && (
        <div className="drv-card drv-summary" data-testid="applied-left-out">
          <span style={{ fontSize: 14, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}>
            {leftOut.length} left out
          </span>
          <span style={{ fontSize: 12.5 }} className="drv-muted">
            {leftOut.map((d) => d.label).join(', ')}. Kept in this changeset&apos;s record.
          </span>
        </div>
      )}
    </div>
  );
}

function LandedRow({ layerId, text, onOpen }: { layerId: string; text: string; onOpen: () => void }) {
  return (
    <>
      <LayerSwatch layerId={layerId} height={30} />
      {/* Name and counts stack, so they can't run into each other in a narrow inspector. */}
      <span className="drv-landed__layer">
        <span>{layerLabel(layerId)}</span>
        <span className="drv-mono drv-muted" style={{ fontSize: 12 }}>
          {text}
        </span>
      </span>
      <Button variant="link" size="sm" onClick={onOpen} aria-label={`Open ${layerLabel(layerId)} in Model`}>
        Open in Model
      </Button>
    </>
  );
}
