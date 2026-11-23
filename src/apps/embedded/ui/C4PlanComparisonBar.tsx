/**
 * C4PlanComparisonBar — the Architecture view's bar for a plan compared with
 * what was built (`?changeset=` the plan, `?built=` the as-built changeset),
 * under the breadcrumb, in place of the changeset bar.
 *
 * It names the plan, picks the as-built changeset (the plan's verification
 * records first, then any other as-built changeset: `asBuiltChoices`), says
 * the dr CLI's overall verdict in its own words, tallies the planned elements
 * and links per verdict, shows the legend of the marks and what the diagrams
 * leave out, and offers Review in Changesets, Show the plan only (the plain
 * overlay) and Clear. With a dr CLI that has no verification route it says
 * so, and how to get one, instead of failing.
 */

import { Button, Select } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { VERDICT_STYLES, verdictOutlineCss } from './verdictStyles';
import { purposeLabel } from '../data/changesetPurpose';
import { useChangesets } from '../data/useChangesets';
import { PLAN_VERDICTS, asBuiltChoices, type PlanVerdict } from '../data/planVerification';
import type { VerdictCounts } from '../data/c4/c4PlanCompare';
import type { C4PlanComparisonState } from '../data/c4/useC4Model';

const SelectItem = Select.Item;
const SelectSectionTitle = Select.SectionTitle;
const SelectSeparator = Select.Separator;

const count = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/** "12 built as planned · 1 planned, not built"; empty verdicts left out. */
export function verdictTally(counts: VerdictCounts): string[] {
  return PLAN_VERDICTS.filter((v) => counts[v] > 0).map((v) => `${counts[v]} ${VERDICT_STYLES[v].label}`);
}

/** The legend's entries, in verdict order. */
const LEGEND: { verdict: PlanVerdict; text: string }[] = [
  { verdict: 'built', text: 'built as planned' },
  { verdict: 'probable', text: 'probably built (matched loosely)' },
  { verdict: 'divergent', text: 'built differently' },
  { verdict: 'missing', text: 'planned, not built' },
  { verdict: 'unverifiable', text: "can't be checked from the code" },
  { verdict: 'unplanned', text: 'built, not planned' },
];

export function C4PlanComparisonBar({ state }: { state: C4PlanComparisonState }) {
  const showC4Overlay = useUiStore((s) => s.showC4Overlay);
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const { derived } = useChangesets();
  const { planId, asBuiltId, plan, asBuilt, verification, comparison, error } = state;
  if (!planId || !asBuiltId) return null;

  const summaryOf = (id: string) => derived.list.find((c) => c.id === id);
  const planName = plan?.name || summaryOf(planId)?.name || planId;
  const builtName = asBuilt?.name || summaryOf(asBuiltId)?.name || asBuiltId;
  const { records, others } = asBuiltChoices(planId, derived.list);
  const known = [...records, ...others].some((c) => c.id === asBuiltId);

  let body: React.ReactNode;
  if (error) {
    body = (
      <p className="c4-bar__note" role="status" data-testid="c4-compare-error">
        One of the two changesets could not be loaded: the diagram shows the model as it is.
      </p>
    );
  } else if (verification.kind === 'unavailable') {
    body = (
      <p className="c4-bar__note" role="status" data-testid="c4-compare-unavailable">
        This dr CLI can&apos;t compare a plan with what was built: the diagram shows the plan applied, without verdicts.
        A dr CLI with the plan verification route (<code>GET /api/changesets/:id/verification</code>) can.
      </p>
    );
  } else if (verification.kind === 'error') {
    body = (
      <p className="c4-bar__note" role="status" data-testid="c4-compare-error">
        The comparison failed: {verification.message}
      </p>
    );
  } else if (verification.kind !== 'ready' || !comparison) {
    body = (
      <p className="c4-bar__note" role="status">
        Comparing the plan with what was built…
      </p>
    );
  } else {
    const { verification: report } = verification;
    const elements = verdictTally(comparison.tally.elements);
    const links = verdictTally(comparison.tally.relationships);
    const leftOut = [
      comparison.unshown.elements.length > 0 && `${count(comparison.unshown.elements.length, 'element')} not on any diagram`,
      comparison.unshown.relationships.length > 0 &&
        `${count(comparison.unshown.relationships.length, 'link')} not on any diagram`,
      report.dropped > 0 && `${count(report.dropped, 'item')} the viewer couldn't read`,
    ].filter((s): s is string => !!s);
    body = (
      <>
        {report.verdictText && (
          <p className="c4-bar__note" data-testid="c4-compare-verdict">
            {report.verdictText}
          </p>
        )}
        <ul className="c4-bar__tally" aria-label="Verdicts" data-testid="c4-compare-tally">
          {elements.length === 0 && links.length === 0 ? (
            <li>The plan has nothing to compare</li>
          ) : (
            <>
              {elements.length > 0 && <li>Elements: {elements.join(' · ')}</li>}
              {links.length > 0 && <li>Links: {links.join(' · ')}</li>}
            </>
          )}
        </ul>
        <ul className="c4-bar__legend" aria-label="Legend" data-testid="c4-compare-legend">
          {LEGEND.map(({ verdict, text }) => {
            const outline = verdictOutlineCss(verdict);
            return (
              <li key={verdict}>
                <span
                  className="c4-bar__swatch"
                  style={{ border: outline ?? '1px dashed rgb(var(--canvas-fg-3))' }}
                  aria-hidden="true"
                />
                <span aria-hidden="true">{VERDICT_STYLES[verdict].glyph} </span>
                {text}
              </li>
            );
          })}
          <li>“N inside”: marked parts below a box</li>
        </ul>
        {leftOut.length > 0 && (
          <ul className="c4-bar__left-out" aria-label="What the diagrams leave out" data-testid="c4-compare-left-out">
            {leftOut.map((s) => (
              <li key={s}>{s}</li>
            ))}
          </ul>
        )}
        {report.warning && (
          <p className="c4-bar__note" data-testid="c4-compare-warning">
            {report.warning}
          </p>
        )}
      </>
    );
  }

  return (
    <section className="c4-bar" aria-label="Plan compared with what was built" data-testid="c4-compare-bar">
      <div className="c4-bar__name">
        <span>Plan</span>
        <strong data-testid="c4-compare-plan">{planName}</strong>
        <span>against</span>
        <div style={{ width: 240, maxWidth: '100%' }}>
          <Select
            value={asBuiltId}
            onChange={(v) => showC4Overlay(planId, v)}
            ariaLabel="As-built changeset the plan is compared with"
            placeholder="As built"
            data-testid="c4-compare-built-picker"
          >
            {!known && (
              <SelectItem value={asBuiltId} description="not in the changeset list">
                {builtName}
              </SelectItem>
            )}
            {records.length > 0 && <SelectSectionTitle>This plan&apos;s verification records</SelectSectionTitle>}
            {records.map((cs) => (
              <SelectItem key={cs.id} value={cs.id} description={cs.status === 'committed' ? 'applied' : 'staged'}>
                {cs.name}
              </SelectItem>
            ))}
            {records.length > 0 && others.length > 0 && <SelectSeparator />}
            {others.length > 0 && <SelectSectionTitle>Other as-built changesets</SelectSectionTitle>}
            {others.map((cs) => (
              <SelectItem
                key={cs.id}
                value={cs.id}
                description={[purposeLabel(cs.purpose), cs.status === 'committed' ? 'applied' : 'staged'].filter(Boolean).join(' · ')}
              >
                {cs.name}
              </SelectItem>
            ))}
          </Select>
        </div>
      </div>
      <div className="c4-bar__actions">
        <button type="button" className="drv-linkbtn" onClick={() => selectChangeset(planId)} data-testid="c4-compare-review">
          Review in Changesets
        </button>
        <Button size="sm" variant="ghost" onClick={() => showC4Overlay(planId)} data-testid="c4-compare-plan-only">
          Show the plan only
        </Button>
        <Button size="sm" variant="ghost" onClick={() => showC4Overlay(null)} data-testid="c4-compare-clear">
          Clear
        </Button>
      </div>
      {body}
    </section>
  );
}

export default C4PlanComparisonBar;
