/**
 * C4ChangesetPicker — the Architecture view's "Changeset" control: which
 * changeset to lay over the C4 diagrams.
 *
 * Staged changesets come first (shown forward: base → after), then applied
 * ones (shown reverted: before → current), each labelled with its name and
 * purpose; "None" clears the overlay. Discarded changesets and ones with no
 * changes aren't offered. Selecting calls `uiStore.showC4Overlay`, a
 * navigation, so the router pushes `?changeset=`. A `?changeset=` the list
 * doesn't hold (gone, or not loaded yet) still shows, by its id.
 */

import { Select } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { useChangesets, type ChangesetSummary } from '../data/useChangesets';
import { purposeLabel } from '../data/changesetPurpose';

// Heimdall's Select is compound; bound once so the JSX has no dot notation.
const SelectItem = Select.Item;
const SelectSectionTitle = Select.SectionTitle;
const SelectSeparator = Select.Separator;

/** The Select's value for "no overlay" (a Select value is a string). */
export const NO_OVERLAY = '__none__';

export interface OverlayChoices {
  staged: ChangesetSummary[];
  applied: ChangesetSummary[];
}

/** What the picker offers: staged changesets, then applied ones, each newest first (the list's order). */
export function overlayChoices(list: readonly ChangesetSummary[]): OverlayChoices {
  const offered = list.filter((c) => c.changesCount > 0);
  return {
    staged: offered.filter((c) => c.status === 'staged'),
    applied: offered.filter((c) => c.status === 'committed'),
  };
}

/** The line under a changeset's name: its purpose, and how it is shown. */
export function overlayDescription(cs: ChangesetSummary): string {
  const how = cs.status === 'committed' ? 'applied, shown reverted' : 'staged, shown applied';
  return [purposeLabel(cs.purpose), how].filter(Boolean).join(' · ');
}

export function C4ChangesetPicker() {
  const c4ChangesetId = useUiStore((s) => s.c4ChangesetId);
  const showC4Overlay = useUiStore((s) => s.showC4Overlay);
  const { derived, isLoading } = useChangesets();
  const { staged, applied } = overlayChoices(derived.list);
  const known = !c4ChangesetId || [...staged, ...applied].some((c) => c.id === c4ChangesetId);

  return (
    // Heimdall's Select fills its box: a fixed width keeps it from spanning a wrapped header.
    <div style={{ width: 260, maxWidth: '100%' }}>
      <Select
        value={c4ChangesetId ?? NO_OVERLAY}
        onChange={(v) => showC4Overlay(v === NO_OVERLAY ? null : v)}
        ariaLabel="Changeset shown on the diagram"
        placeholder="Changeset"
        className="c4-changeset-picker"
        data-testid="c4-changeset-picker"
      >
        <SelectItem value={NO_OVERLAY}>No changeset</SelectItem>
        {!known && c4ChangesetId && (
          <SelectItem value={c4ChangesetId} description={isLoading ? 'loading…' : 'not in the changeset list'}>
            {c4ChangesetId}
          </SelectItem>
        )}
        {staged.length > 0 && <SelectSeparator />}
        {staged.length > 0 && <SelectSectionTitle>Staged</SelectSectionTitle>}
        {staged.map((cs) => (
          <SelectItem key={cs.id} value={cs.id} description={overlayDescription(cs)}>
            {cs.name}
          </SelectItem>
        ))}
        {applied.length > 0 && <SelectSeparator />}
        {applied.length > 0 && <SelectSectionTitle>Applied (shown reverted)</SelectSectionTitle>}
        {applied.map((cs) => (
          <SelectItem key={cs.id} value={cs.id} description={overlayDescription(cs)}>
            {cs.name}
          </SelectItem>
        ))}
      </Select>
    </div>
  );
}

export default C4ChangesetPicker;
