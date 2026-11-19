// @vitest-environment happy-dom
/**
 * TopbarSearch.spec.tsx — the topbar's type-ahead over the model and the spec.
 *
 * Renders the REAL component + data hooks against the MSW fixtures and drives
 * the real `uiStore`: what a user types, what the listbox offers (grouped by
 * layer, highlighted), and where choosing a result takes them.
 */

import { describe, it, expect } from 'vitest';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { TopbarSearch } from '@/apps/embedded/ui/TopbarSearch';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

import model from '../fixtures/model.json';

const WCAG = model.nodes.find((n) => n.name === 'WCAG 2.1 AA Compliance')!;

async function renderSearch() {
  const user = userEvent.setup();
  renderWithProviders(<TopbarSearch />);
  const input = screen.getByRole('combobox', { name: /search elements and node types/i });
  return { user, input };
}

/** Wait until the fixtures have loaded and `text` lists at least one option. */
async function typeAndWait(user: ReturnType<typeof userEvent.setup>, input: HTMLElement, text: string) {
  await user.click(input);
  await user.type(input, text);
  await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThan(0));
}

describe('topbar search', () => {
  it('typing lists grouped results and Enter on an element navigates as a nav-tree leaf does', async () => {
    const { user, input } = await renderSearch();
    const navSeq = useUiStore.getState().navSeq;

    await typeAndWait(user, input, 'wcag 2.1 aa');

    expect(input).toHaveAttribute('aria-expanded', 'true');
    const listbox = screen.getByRole('listbox', { name: 'Search results' });
    // Grouped by layer: the requirement sits under a labelled Motivation group.
    const group = within(listbox).getByRole('group', { name: /motivation/i });
    const option = within(group).getByRole('option', { name: /WCAG 2\.1 AA Compliance/ });
    // The match is highlighted, and the best match is the active option.
    expect(option.querySelector('mark')?.textContent).toBe('WCAG 2.1 AA');
    expect(option).toHaveAttribute('aria-selected', 'true');
    expect(input).toHaveAttribute('aria-activedescendant', option.id);

    await user.keyboard('{Enter}');

    const s = useUiStore.getState();
    expect(s).toMatchObject({ view: 'model', layerId: 'motivation', selectedId: WCAG.id, focus: 'node' });
    expect(s.navSeq).toBe(navSeq + 1);
    expect(s.expandedLayers.has('model:motivation')).toBe(true);
    // The search clears and closes once it has taken you there.
    expect(input).toHaveValue('');
    expect(input).toHaveAttribute('aria-expanded', 'false');
  });

  it('a node-type result opens it in the Schema view', async () => {
    const { user, input } = await renderSearch();

    await typeAndWait(user, input, 'externaldoc');
    const option = await screen.findByRole('option', { name: /ExternalDocumentation/ });
    expect(option).toHaveAttribute('data-kind', 'type');
    expect(screen.getByRole('group', { name: /API · Schema/ })).toContainElement(option);

    await user.click(option);

    expect(useUiStore.getState()).toMatchObject({
      view: 'spec',
      layerId: 'api',
      selectedId: 'api.externaldocumentation',
    });
  });

  it('keyboard: slash and Cmd-K focus it, arrows move aria-activedescendant, Escape closes', async () => {
    const { user, input } = await renderSearch();

    // `/` from the page focuses the search…
    await user.keyboard('/');
    expect(input).toHaveFocus();
    expect(input).toHaveValue('');
    input.blur();
    // …and so does ⌘K / Ctrl+K.
    await user.keyboard('{Meta>}k{/Meta}');
    expect(input).toHaveFocus();
    input.blur();
    await user.keyboard('{Control>}k{/Control}');
    expect(input).toHaveFocus();

    await user.type(input, 'wcag');
    await waitFor(() => expect(screen.getAllByRole('option').length).toBeGreaterThanOrEqual(2));
    const options = screen.getAllByRole('option');
    expect(input).toHaveAttribute('aria-activedescendant', options[0].id);

    await user.keyboard('{ArrowDown}');
    expect(input).toHaveAttribute('aria-activedescendant', options[1].id);
    expect(options[1]).toHaveAttribute('aria-selected', 'true');
    await user.keyboard('{ArrowUp}{ArrowUp}');
    // Wraps from the first option to the last.
    expect(input).toHaveAttribute('aria-activedescendant', options[options.length - 1].id);

    // Escape closes the list, a second Escape clears the text.
    await user.keyboard('{Escape}');
    expect(input).toHaveAttribute('aria-expanded', 'false');
    expect(input).not.toHaveAttribute('aria-activedescendant');
    expect(input).toHaveValue('wcag');
    await user.keyboard('{Escape}');
    expect(input).toHaveValue('');

    // `/` typed inside a field is just a slash.
    await user.type(input, 'a/b');
    expect(input).toHaveValue('a/b');
  });

  it('says so when nothing matches', async () => {
    const { user, input } = await renderSearch();
    await user.click(input);
    await user.type(input, 'zzzqqqxxx');
    expect(await screen.findByText(/No element or node type matches/)).toBeInTheDocument();
    expect(screen.getByRole('status')).toHaveTextContent('No matches');
  });
});
