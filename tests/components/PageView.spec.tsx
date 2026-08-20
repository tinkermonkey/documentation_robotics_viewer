// @vitest-environment happy-dom
/**
 * PageView.spec.tsx — the page-view scaffold's click-to-navigate wiring.
 *
 * Renders the REAL PageView with a hand-built `PageData` fixture — the
 * pageData.ts builder functions already have thorough unit coverage in
 * tests/unit/pageData.spec.ts, so this file isolates the one thing that
 * module can't cover on its own: that `PageView`'s `useNavigate` actually
 * translates each `PageNavTarget` kind into the right `uiStore` action when a
 * row/crumb is clicked. This is the direct analog of the click-to-navigate
 * wiring `Inspector.spec.tsx` already tests for `GraphInspector` rows.
 */

import { describe, it, expect } from 'vitest';
import { screen, within, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { PageView } from '@/apps/embedded/ui/PageView';
import { useUiStore } from '@/apps/embedded/ui/uiStore';
import { renderWithProviders } from '../helpers/renderWithProviders';
import type { PageData } from '@/apps/embedded/data/pageData';

function buildPageData(overrides: Partial<PageData> = {}): PageData {
  return {
    eyebrow: 'ELEMENT · Data Model',
    title: 'MetaModel',
    idChip: 'meta-model-id',
    meta: '1 outgoing · 0 incoming',
    color: '#2DD4BF',
    crumbs: [
      { label: 'model', target: { kind: 'section', view: 'model' } },
      {
        label: 'data-model',
        target: { kind: 'layer', view: 'model', layerId: 'data-model' },
      },
      { label: 'meta-model-id', current: true },
    ],
    description: 'A test element.',
    stats: [{ label: 'OUTGOING', value: 1, color: '#818CF8' }],
    factsTitle: 'NODE',
    facts: [{ key: 'id', value: 'meta-model-id' }],
    tables: [
      {
        title: 'Outgoing relationships',
        columns: ['predicate', 'target'],
        widths: '1fr 1fr',
        rows: [
          {
            target: { kind: 'element', elementId: 'target-uuid', layerId: 'business' },
            cells: [
              {
                text: 'realizes',
                kind: 'mono',
                tooltip: {
                  kind: 'predicate',
                  predicate: 'realizes',
                  sourceTypeLabel: 'MetaModel',
                  destinationTypeLabel: 'ArchitectureModel',
                },
              },
              { text: 'Architecture Model', kind: 'name' },
            ],
          },
        ],
        emptyText: 'No outgoing relationships.',
      },
      {
        title: 'Related spec node',
        columns: ['spec node'],
        widths: '1fr',
        rows: [
          {
            target: { kind: 'specNode', specNodeId: 'data-model.objectschema', layerId: 'data-model' },
            cells: [
              {
                text: 'ObjectSchema',
                kind: 'name',
                tooltip: { kind: 'nodeType', layerId: 'data-model', typeId: 'objectschema' },
              },
            ],
          },
        ],
        emptyText: 'None.',
      },
      {
        title: 'Attributes',
        columns: ['attribute', 'type'],
        widths: '1fr 1fr',
        rows: [
          { cells: [{ text: 'type', kind: 'mono' }, { text: 'string', kind: 'dim' }] },
        ],
        emptyText: 'No attributes.',
      },
    ],
    ...overrides,
  };
}

describe('PageView — breadcrumb navigation', () => {
  it('clicking a "section" crumb calls setView', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PageView pg={buildPageData()} />);
    useUiStore.getState().setView('spec');

    const crumbs = screen.getAllByTestId('page-crumb');
    await user.click(crumbs[0]); // 'model' section crumb
    expect(useUiStore.getState().view).toBe('model');
  });

  it('clicking a "layer" crumb calls setView + selectLayer', async () => {
    const user = userEvent.setup();
    renderWithProviders(<PageView pg={buildPageData()} />);
    useUiStore.getState().setView('spec');

    const crumbs = screen.getAllByTestId('page-crumb');
    await user.click(crumbs[1]); // 'data-model' layer crumb
    const s = useUiStore.getState();
    expect(s.view).toBe('model');
    expect(s.layerId).toBe('data-model');
  });

  it('the current (terminal) crumb has no target and renders as plain text, not a button', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    // Only the 2 ancestor crumbs are interactive.
    const crumbs = screen.getAllByTestId('page-crumb');
    expect(crumbs).toHaveLength(2);
    expect(crumbs.some((c) => c.textContent === 'meta-model-id')).toBe(false);
    // The terminal segment still renders (as plain text, in the facts block too).
    expect(screen.getAllByText('meta-model-id').length).toBeGreaterThan(0);
  });
});

describe('PageView — table row navigation', () => {
  // fireEvent.click (not userEvent.click) throughout this file's cell-click
  // tests below — these cells are wrapped in NodeTypeBadge/PredicateTooltip's
  // hover-tracked RichTooltip overlay, and happy-dom/user-event doesn't
  // reliably exclude that shared ancestor when synthesizing the pointer path
  // to the target, so a spurious mouseleave can suppress the click (see
  // CLAUDE.md's "userEvent.click() on a 2nd element inside a hover-tracked
  // overlay" gotcha — confirmed as a test-environment artifact, not a product
  // bug, by the fact fireEvent.click reaches the exact same onClick handler).
  it('clicking a row\'s fallback cell calls navigateToElement using the row\'s own target', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);

    // The "realizes" predicate cell carries no `edge` info, so it falls back
    // to the row's own "element" target (the "Architecture Model" cell has no
    // tooltip and would ALSO fall back, but "realizes" is first in cell order
    // so it claims the fallback — see TableRow's `cellNavTarget`/fallback doc).
    fireEvent.click(screen.getByText('realizes'));
    const s = useUiStore.getState();
    expect(s.view).toBe('model');
    expect(s.layerId).toBe('business');
    expect(s.selectedId).toBe('target-uuid');
  });

  it('clicking a nodeType cell calls navigateToSpecNode using its own resolved target', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    useUiStore.getState().setView('model');

    fireEvent.click(screen.getByText('ObjectSchema'));
    const s = useUiStore.getState();
    expect(s.view).toBe('spec');
    expect(s.layerId).toBe('data-model');
    expect(s.selectedId).toBe('data-model.objectschema');
  });

  it('a row without a target renders as plain text, not an interactive row', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    // 2 rows carry at least one clickable (real `<button>`) cell; the
    // Attributes row does not — assert actual interactivity, not just the
    // `page-row` testid (which only reflects `row.target`'s presence, not
    // whether any cell ended up clickable).
    const interactiveRows = screen.getAllByTestId('page-row');
    expect(interactiveRows).toHaveLength(2);
    interactiveRows.forEach((row) => {
      expect(within(row).getAllByRole('button').length).toBeGreaterThan(0);
    });
    // The attribute's "type" value cell exists, isn't inside any interactive
    // `page-row`, and contains no button of its own.
    const attrCell = screen.getAllByText('type').find((el) => el.getAttribute('role') === 'cell')!;
    expect(attrCell.querySelector('button')).toBeNull();
    expect(interactiveRows.some((row) => row.contains(attrCell))).toBe(false);
  });
});

describe('PageView — node type + predicate cell tooltips', () => {
  it('a nodeType cell triggers the rich NodeTypeTooltip on hover/focus', async () => {
    renderWithProviders(<PageView pg={buildPageData()} />);

    // NodeTypeBadge only wraps the cell once `/api/spec` has resolved (MSW,
    // async) — wait for the RichTooltip trigger wrapper before focusing.
    await waitFor(() =>
      expect(screen.getByTestId('page-cell-node-type-tooltip')).toBeInTheDocument(),
    );
    fireEvent.focus(screen.getByText('ObjectSchema'));

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('.rich-tooltip__specifier')).toHaveTextContent(
      'data-model.objectschema',
    );
  });

  it('a predicate cell triggers the rich PredicateTooltip on hover/focus', async () => {
    renderWithProviders(<PageView pg={buildPageData()} />);

    const trigger = screen.getByText('realizes');
    fireEvent.focus(trigger);

    const tooltip = await screen.findByRole('tooltip');
    expect(tooltip.querySelector('.rich-tooltip__title')).toHaveTextContent('realizes');
    const diagram = within(tooltip).getByTestId('page-cell-predicate-tooltip-diagram');
    expect(within(diagram).getByText('MetaModel')).toBeInTheDocument();
    expect(within(diagram).getByText('ArchitectureModel')).toBeInTheDocument();
  });

  it('a cell without tooltip metadata renders as plain, non-interactive text', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    const attrCell = screen.getAllByText('type').find((el) => el.getAttribute('role') === 'cell')!;
    expect(attrCell).not.toHaveAttribute('tabIndex');
  });
});

// A row shaped like `pageData.ts`'s real cross-layer/relationship rows: one
// plain cell (no tooltip — claims the row's own fallback target), one
// predicate cell backed by a real model link (its own `elementWithEdge`
// target, DIFFERENT from the row's target), and one nodeType cell (its own
// `specNode` target, also different from the row's target) — exercising all
// three cell-level target kinds `TableRow`/`cellNavTarget` resolve.
function buildCrossViewPageData(): PageData {
  return buildPageData({
    tables: [
      {
        title: 'Cross-layer references',
        columns: ['from', 'predicate', 'to'],
        widths: '1fr 1fr 1fr',
        rows: [
          {
            target: { kind: 'element', elementId: 'row-fallback-target-uuid', layerId: 'business2' },
            cells: [
              { text: 'AlertSource', kind: 'name' },
              {
                text: 'monitors',
                kind: 'mono',
                tooltip: {
                  kind: 'predicate',
                  predicate: 'monitors',
                  sourceTypeLabel: 'Alert',
                  destinationTypeLabel: 'MetricInstrument',
                  edge: { edgeId: 'edge-99', sourceElementId: 'source-uuid', sourceLayerId: 'apm' },
                },
              },
              {
                text: 'MetricInstrument',
                kind: 'mono',
                tooltip: { kind: 'nodeType', layerId: 'apm', typeId: 'metricinstrument' },
              },
            ],
          },
        ],
        emptyText: 'None.',
      },
    ],
  });
}

describe('PageView — cross-view navigation from node types + edge predicates', () => {
  it('clicking a nodeType cell navigates to the Schema view entry, independent of the row\'s own target', () => {
    renderWithProviders(<PageView pg={buildCrossViewPageData()} />);
    useUiStore.getState().setView('model');

    fireEvent.click(screen.getByText('MetricInstrument'));
    const s = useUiStore.getState();
    expect(s.view).toBe('spec');
    expect(s.layerId).toBe('apm');
    expect(s.selectedId).toBe('apm.metricinstrument');
    // Untouched by a plain nodeType navigation — no edge was highlighted.
    expect(s.highlightedEdgeId).toBeNull();
  });

  it('clicking a predicate cell backed by a real edge navigates to the edge\'s SOURCE node with the edge highlighted', () => {
    renderWithProviders(<PageView pg={buildCrossViewPageData()} />);

    fireEvent.click(screen.getByText('monitors'));
    const s = useUiStore.getState();
    expect(s.view).toBe('model');
    expect(s.layerId).toBe('apm');
    expect(s.selectedId).toBe('source-uuid');
    expect(s.selectedEdgeId).toBeNull(); // node selection, not edge selection
    expect(s.highlightedEdgeId).toBe('edge-99');
  });

  it("the highlight from a predicate click is transient — the next explicit selection clears it", () => {
    renderWithProviders(<PageView pg={buildCrossViewPageData()} />);

    fireEvent.click(screen.getByText('monitors'));
    expect(useUiStore.getState().highlightedEdgeId).toBe('edge-99');

    useUiStore.getState().selectLayer('technology');
    expect(useUiStore.getState().highlightedEdgeId).toBeNull();
  });

  it('a row\'s remaining plain cell still navigates via the row\'s own target', () => {
    renderWithProviders(<PageView pg={buildCrossViewPageData()} />);

    fireEvent.click(screen.getByText('AlertSource'));
    const s = useUiStore.getState();
    expect(s.view).toBe('model');
    expect(s.layerId).toBe('business2');
    expect(s.selectedId).toBe('row-fallback-target-uuid');
  });
});

describe('PageView — accessible structure', () => {
  it('wraps the breadcrumb in a labeled nav landmark', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    expect(screen.getByRole('navigation', { name: 'Breadcrumb' })).toBeInTheDocument();
  });

  it('tables expose ARIA table/row/columnheader/cell roles for header-to-cell association', () => {
    renderWithProviders(<PageView pg={buildPageData()} />);
    const tables = screen.getAllByRole('table');
    expect(tables.length).toBe(3); // one per pg.tables entry
    const outgoing = tables[0];
    expect(within(outgoing).getAllByRole('columnheader').map((h) => h.textContent)).toEqual([
      'predicate',
      'target',
    ]);
    expect(within(outgoing).getAllByRole('cell').length).toBeGreaterThan(0);
  });
});
