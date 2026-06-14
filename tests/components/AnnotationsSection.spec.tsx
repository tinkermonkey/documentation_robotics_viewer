// @vitest-environment happy-dom
/**
 * AnnotationsSection.spec.tsx — the inspector annotations CRUD surface.
 *
 * Renders the REAL AnnotationsSection (Heimdall TextArea/Button/RowMenu/
 * ConfirmDialog/Toast + our useAnnotations hooks) against the STATEFUL MSW
 * annotations store (seeded from the fixture, mutated through real POST/PATCH/
 * DELETE + cache invalidation). We drive interactions with user-event and
 * assert what a user observes — list, add, edit, resolve, delete (via the
 * ConfirmDialog), and a lazy reply. The Modal/Toast render inline in this
 * component tree (not a portal), so they are queryable via `screen`.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { AnnotationsSection } from '@/apps/embedded/ui/AnnotationsSection';
import { renderWithProviders } from '../helpers/renderWithProviders';

// Dotted id of the seeded element (two annotations + one with a reply).
const ELEMENT_ID = 'motivation.goal.visualize-multi-layer-architecture-models';
// An element with no annotations in the fixture (empty-state case).
const EMPTY_ELEMENT_ID = 'motivation.goal.no-annotations-here';

describe('AnnotationsSection — list + empty state', () => {
  it('lists the seeded annotations for the element with a count', async () => {
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    expect(
      await screen.findByText('Seed annotation for the goal element.'),
    ).toBeInTheDocument();
    expect(
      screen.getByText('A second annotation on the same element.'),
    ).toBeInTheDocument();

    // Count badge reflects the two seeded annotations.
    expect(screen.getByTestId('annotations-count')).toHaveTextContent('2');
    // The resolved annotation carries a resolved chip.
    expect(screen.getAllByTestId('annotation-item').length).toBe(2);
  });

  it('shows the empty state for an element with no annotations', async () => {
    renderWithProviders(<AnnotationsSection elementId={EMPTY_ELEMENT_ID} />);
    expect(await screen.findByTestId('annotations-empty')).toHaveTextContent(
      'No annotations yet',
    );
  });
});

describe('AnnotationsSection — add', () => {
  it('adds an annotation via POST and it appears in the list', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    await screen.findByText('Seed annotation for the goal element.');

    const composer = screen.getByTestId('annotation-add-content');
    await user.type(composer, 'A freshly authored note');
    await user.click(screen.getByTestId('annotation-add-submit'));

    // After the POST + list refetch, the new annotation renders.
    expect(
      await screen.findByText('A freshly authored note'),
    ).toBeInTheDocument();
    await waitFor(() =>
      expect(screen.getByTestId('annotations-count')).toHaveTextContent('3'),
    );
  });
});

describe('AnnotationsSection — edit', () => {
  it('edits an annotation via PATCH and the new content renders', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    const firstItem = (await screen.findAllByTestId('annotation-item'))[0];

    // Open the row menu and choose Edit.
    await user.click(within(firstItem).getByTestId('row-menu-trigger'));
    await user.click(await screen.findByText('Edit'));

    // Replace the content and save.
    const editArea = within(firstItem).getByTestId('annotation-edit-content');
    await user.clear(editArea);
    await user.type(editArea, 'Edited annotation body');
    await user.click(within(firstItem).getByTestId('annotation-edit-save'));

    expect(
      await screen.findByText('Edited annotation body'),
    ).toBeInTheDocument();
  });
});

describe('AnnotationsSection — resolve', () => {
  it('resolves an open annotation via PATCH and shows the resolved chip', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    // The first annotation is unresolved in the fixture.
    const firstItem = (await screen.findAllByTestId('annotation-item'))[0];
    expect(firstItem).toHaveAttribute('data-resolved', 'false');

    await user.click(within(firstItem).getByTestId('row-menu-trigger'));
    await user.click(await screen.findByText('Resolve'));

    // After refetch the first item is resolved.
    await waitFor(() => {
      const item = screen.getAllByTestId('annotation-item')[0];
      expect(item).toHaveAttribute('data-resolved', 'true');
    });
  });
});

describe('AnnotationsSection — delete', () => {
  it('deletes via a ConfirmDialog → DELETE and removes the annotation', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    await screen.findByText('Seed annotation for the goal element.');
    const firstItem = screen.getAllByTestId('annotation-item')[0];

    await user.click(within(firstItem).getByTestId('row-menu-trigger'));
    await user.click(await screen.findByText('Delete'));

    // The ConfirmDialog opens (Modal, inline) — confirm.
    const dialog = await screen.findByRole('dialog');
    expect(dialog).toHaveTextContent('Delete annotation');
    await user.click(within(dialog).getByRole('button', { name: /^Delete$/i }));

    // The annotation is removed; count drops to 1.
    await waitFor(() =>
      expect(
        screen.queryByText('Seed annotation for the goal element.'),
      ).not.toBeInTheDocument(),
    );
    await waitFor(() =>
      expect(screen.getByTestId('annotations-count')).toHaveTextContent('1'),
    );
  });
});

describe('AnnotationsSection — replies', () => {
  it('lazily loads + posts a reply via the disclosure', async () => {
    const user = userEvent.setup();
    renderWithProviders(<AnnotationsSection elementId={ELEMENT_ID} />);

    const firstItem = (await screen.findAllByTestId('annotation-item'))[0];

    // Expand the replies disclosure → lazy GET fires and the seeded reply shows.
    await user.click(within(firstItem).getByTestId('annotation-replies-toggle'));
    expect(
      await within(firstItem).findByText('A captured reply on the first annotation.'),
    ).toBeInTheDocument();

    // Post a new reply.
    const replyInput = within(firstItem).getByTestId('annotation-reply-input');
    await user.type(replyInput, 'A brand new reply');
    await user.click(within(firstItem).getByTestId('annotation-reply-submit'));

    expect(
      await within(firstItem).findByText('A brand new reply'),
    ).toBeInTheDocument();
  });
});
