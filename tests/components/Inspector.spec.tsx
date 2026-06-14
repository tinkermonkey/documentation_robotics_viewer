// @vitest-environment happy-dom
/**
 * Inspector.spec.tsx — the right-pane element/spec detail surface.
 *
 * Renders the REAL Inspector (Heimdall GraphInspector + our AnnotationsSection)
 * with the REAL data hooks against MSW fixtures. We seed a selection through the
 * real `uiStore` actions, then assert what a user observes: title/id/properties,
 * relationship rows, navigation on click (cross-layer switches layerId), and
 * that AnnotationsSection mounts ONLY for Model elements.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { Inspector } from '@/apps/embedded/ui/Inspector';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';

// Cross-layer element: application "Data Loader" → serves → business
// "Model Loading and Rendering" (verified against the model fixture).
const DATA_LOADER_UUID = 'a5342d6f-daf4-4a6e-a98b-7fada2561798';
const MODEL_LOADING_UUID = 'a138ca69-d437-4841-b96f-5fb5dd703380';

// Annotated motivation goal (has seeded annotations in the fixture).
const GOAL_UUID = '462e2931-4c7c-4051-a9ac-8817c270d650';

/** Seed the store to a selected Model element, then render. */
function renderModelSelection(layerId: string, selectedId: string) {
  const result = renderWithProviders(<Inspector />);
  useUiStore.getState().setView('model');
  useUiStore.getState().selectLayer(layerId);
  useUiStore.getState().selectNode(selectedId);
  return result;
}

describe('Inspector — Model element detail', () => {
  it('renders the element title, id and a curated PROPERTIES grid', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    // Title + id come from the resolved model node.
    expect(await screen.findByTestId('inspector-title')).toHaveTextContent('Data Loader');
    expect(screen.getByTestId('inspector-id')).toHaveTextContent(DATA_LOADER_UUID);

    // The curated metadata grid carries layer + type + provenance (not a raw
    // attribute spread).
    const metadata = screen.getByTestId('inspector-metadata');
    expect(within(metadata).getByText('layer')).toBeInTheDocument();
    expect(within(metadata).getByText('Application')).toBeInTheDocument();
    expect(within(metadata).getByText('type')).toBeInTheDocument();
    expect(within(metadata).getByText('provenance')).toBeInTheDocument();
  });

  it('renders Outgoing + Incoming relationship rows', async () => {
    renderModelSelection('application', DATA_LOADER_UUID);

    // Outgoing list contains the cross-layer "serves" target (the fixture has
    // it twice — assert at least one) plus an intra-layer "depends-on".
    const outgoing = await screen.findByTestId('inspector-outgoing');
    expect(
      within(outgoing).getAllByText('Model Loading and Rendering').length,
    ).toBeGreaterThan(0);
    expect(within(outgoing).getByText('Relationships YAML Parser')).toBeInTheDocument();

    // Incoming list carries inbound relationships from other elements.
    const incoming = await screen.findByTestId('inspector-incoming');
    expect(within(incoming).getByText('Model Store')).toBeInTheDocument();
  });
});

describe('Inspector — relationship navigation', () => {
  it('clicking a cross-layer relationship target navigates + switches layerId', async () => {
    const user = userEvent.setup();
    renderModelSelection('application', DATA_LOADER_UUID);

    const outgoing = await screen.findByTestId('inspector-outgoing');
    const target = within(outgoing).getAllByRole('button', {
      name: /Navigate to Model Loading and Rendering/i,
    })[0];
    await user.click(target);

    // navigateToElement switched the active layer to the target's (business)
    // and selected the target, while staying in the model view.
    await waitFor(() => {
      const s = useUiStore.getState();
      expect(s.view).toBe('model');
      expect(s.layerId).toBe('business');
      expect(s.selectedId).toBe(MODEL_LOADING_UUID);
    });
  });
});

describe('Inspector — AnnotationsSection mounting', () => {
  it('mounts the annotations section for a selected Model element', async () => {
    renderModelSelection('motivation', GOAL_UUID);

    // The annotations section appears (keyed by the element's dotted id) and
    // loads the seeded annotations.
    expect(await screen.findByTestId('annotations-section')).toBeInTheDocument();
    expect(
      await screen.findByText('Seed annotation for the goal element.'),
    ).toBeInTheDocument();
  });

  it('does NOT mount the annotations section when nothing is selected', async () => {
    renderWithProviders(<Inspector />);
    useUiStore.getState().setView('model');

    // GraphInspector shows its own empty state; no annotations section.
    expect(await screen.findByTestId('inspector-empty')).toBeInTheDocument();
    expect(screen.queryByTestId('annotations-section')).not.toBeInTheDocument();
  });

  it('does NOT mount the annotations section for a Schema node', async () => {
    renderWithProviders(<Inspector />);
    // Schema view with a spec node selected — annotations apply to Model
    // elements only.
    useUiStore.getState().setView('spec');
    useUiStore.getState().selectLayer('data-model');
    useUiStore.getState().selectNode('data-model.objectschema');

    await waitFor(() =>
      expect(useUiStore.getState().view).toBe('spec'),
    );
    expect(screen.queryByTestId('annotations-section')).not.toBeInTheDocument();
  });
});
