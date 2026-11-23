/**
 * C4ChangesetBar — the Architecture view's bar for the changeset laid over the
 * diagrams (`?changeset=`), under the breadcrumb: its name, purpose and how it
 * is read (staged: applied forward; applied: reverted), a drift badge when the
 * server would refuse to apply it, the tally of what differs on the diagrams,
 * a legend of the marks, the changes no diagram shows, and Clear. A plan
 * with an as-built changeset to compare it with offers "Compare with what was
 * built" (the C4 Plan Comparison Bar takes over).
 *
 * The picker stays in the page header (it is there with or without an
 * overlay); this bar only shows while one is set.
 */

import { Button } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { DriftBadge } from './DriftNotice';
import { OP_OUTLINE, opOutlineCss, type OverlayOp } from './opStyles';
import { ELEMENT_MARKS, RELATIONSHIP_MARKS } from './c4Marks';
import { purposeLabel } from '../data/changesetPurpose';
import { useChangesets, isChangesetGone } from '../data/useChangesets';
import { asBuiltChoices } from '../data/planVerification';
import { C4_ELEMENT_STATUSES, C4_RELATIONSHIP_STATUSES, type C4Diff } from '../data/c4/c4Diff';
import type { C4OverlayState } from '../data/c4/useC4Model';

/** The legend: what each mark means on a C4 diagram. */
const LEGEND: { op: OverlayOp; text: string }[] = [
  { op: 'add', text: 'added' },
  { op: 'update', text: 'changed, moved or relabelled' },
  { op: 'delete', text: 'removed (drawn faded)' },
  { op: 'relink', text: 'arrow relinked' },
];

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "2 added · 1 removed" for boxes and for arrows; empty parts left out. */
export function tallyParts(diff: C4Diff): { boxes: string[]; arrows: string[] } {
  return {
    boxes: C4_ELEMENT_STATUSES.filter((s) => diff.tally.elements[s] > 0).map(
      (s) => `${diff.tally.elements[s]} ${ELEMENT_MARKS[s].label}`,
    ),
    arrows: C4_RELATIONSHIP_STATUSES.filter((s) => diff.tally.relationships[s] > 0).map(
      (s) => `${diff.tally.relationships[s]} ${RELATIONSHIP_MARKS[s].label}`,
    ),
  };
}

export function C4ChangesetBar({ state }: { state: C4OverlayState }) {
  const showC4Overlay = useUiStore((s) => s.showC4Overlay);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const { derived } = useChangesets();
  const { changesetId, detail, overlay, isLoading, error } = state;
  if (!changesetId) return null;

  const summary = derived.list.find((c) => c.id === changesetId);
  const name = detail?.name || summary?.name || changesetId;
  const purpose = purposeLabel(detail?.purpose ?? summary?.purpose);
  const how =
    overlay?.mode === 'revert' ? 'applied, shown reverted' : overlay?.mode === 'apply' ? 'staged, shown applied' : undefined;
  const drift = detail?.drift ?? summary?.drift;
  // A plan can be compared with what was built: its own verification record first, else any as-built changeset.
  const isPlan = (detail?.purpose ?? summary?.purpose) === 'plan';
  const choices = isPlan ? asBuiltChoices(changesetId, derived.list) : { records: [], others: [] };
  const compareWith = choices.records[0] ?? choices.others[0] ?? null;

  let body: React.ReactNode;
  if (error) {
    body = (
      <p className="c4-bar__note" role="status" data-testid="c4-bar-error">
        {isChangesetGone(error)
          ? 'This changeset no longer exists: the diagram shows the model as it is.'
          : 'This changeset could not be loaded: the diagram shows the model as it is.'}
      </p>
    );
  } else if (isLoading || !detail) {
    body = (
      <p className="c4-bar__note" role="status">
        Loading the changeset…
      </p>
    );
  } else if (!overlay) {
    body = (
      <p className="c4-bar__note" role="status" data-testid="c4-bar-unshowable">
        A {detail.status} changeset can&apos;t be laid over the diagrams: only staged and applied ones can.
      </p>
    );
  } else {
    const { diff, mode } = overlay;
    const { boxes, arrows } = tallyParts(diff);
    const leftOut = [
      diff.unshown.length > 0 && `${count(diff.unshown.length, 'change')} not on any diagram`,
      diff.unresolved.length > 0 && `${count(diff.unresolved.length, 'change')} not in the model`,
      diff.netted.length > 0 && `${count(diff.netted.length, 'change')} cancel out`,
    ].filter((s): s is string => !!s);
    body = (
      <>
        <ul className="c4-bar__tally" aria-label="What differs on the diagrams" data-testid="c4-bar-tally">
          {boxes.length === 0 && arrows.length === 0 ? (
            <li>Nothing on the diagrams changes</li>
          ) : (
            <>
              {boxes.length > 0 && <li>Boxes: {boxes.join(' · ')}</li>}
              {arrows.length > 0 && <li>Arrows: {arrows.join(' · ')}</li>}
            </>
          )}
        </ul>
        <ul className="c4-bar__legend" aria-label="Legend" data-testid="c4-bar-legend">
          {LEGEND.map(({ op, text }) => (
            <li key={op}>
              <span className="c4-bar__swatch" style={{ border: opOutlineCss(op) }} aria-hidden="true" />
              <span aria-hidden="true">{OP_OUTLINE[op].glyph} </span>
              {text}
            </li>
          ))}
          <li>“N changes inside”: in a box&apos;s parts</li>
        </ul>
        {leftOut.length > 0 && (
          <ul className="c4-bar__left-out" aria-label="Changes the diagrams leave out" data-testid="c4-bar-left-out">
            {leftOut.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {mode === 'revert' && (
          <p className="c4-bar__note" data-testid="c4-bar-revert-note">
            Shown reverted: an element this changeset deleted comes back, but not the links that went with it when it
            was applied (the changeset doesn&apos;t record them).
          </p>
        )}
      </>
    );
  }

  return (
    <section className="c4-bar" aria-label="Changeset on the diagram" data-testid="c4-changeset-bar">
      <div className="c4-bar__name">
        <span>Changeset</span>
        <strong data-testid="c4-bar-name">{name}</strong>
        {(purpose || how) && <span className="c4-bar__how">{[purpose, how].filter(Boolean).join(' · ')}</span>}
        <DriftBadge drift={drift} />
      </div>
      <div className="c4-bar__actions">
        {compareWith && (
          <Button
            size="sm"
            variant="secondary"
            onClick={() => showC4Overlay(changesetId, compareWith.id)}
            title={`Compare this plan with ${compareWith.name}`}
            data-testid="c4-bar-compare"
          >
            Compare with what was built
          </Button>
        )}
        <button
          type="button"
          className="drv-linkbtn"
          onClick={() => selectChangeset(changesetId)}
          data-testid="c4-bar-review"
        >
          Review in Changesets
        </button>
        <Button size="sm" variant="ghost" onClick={() => showC4Overlay(null)} data-testid="c4-bar-clear">
          Clear
        </Button>
      </div>
      {body}
    </section>
  );
}

export default C4ChangesetBar;
