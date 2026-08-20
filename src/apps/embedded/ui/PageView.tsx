/**
 * PageView — the page-view scaffold (design/node_pages README section 3):
 * breadcrumb, narrative description, 4-stat grid, two-column facts list, and
 * row tables that read the full record for the selected layer / spec node /
 * model element without a graph. Rows and ancestor breadcrumb segments with a
 * resolvable target are navigation links; rows/crumbs without one (e.g.
 * Attributes rows, the current breadcrumb segment) render as plain,
 * non-interactive text rather than faking an affordance they can't act on.
 *
 * Rendered by `Canvas` in place of `GraphCanvas` when `uiStore.mode ===
 * 'page'`. Sources its record from `data/pageData.ts` based on `view` +
 * `focus`:
 *   - focus 'layer'                -> `layerPageData(view, ...)`
 *   - focus 'node', view 'spec'    -> `specNodePageData(...)`
 *   - focus 'node', view 'model'   -> `modelNodePageData(...)`
 *
 * `PageNavTarget`s from the data layer are translated to `uiStore` actions
 * here (the data layer stays pure/store-free). `Canvas` reads the header
 * fields (`pg.eyebrow`/`pg.title`/`pg.idChip`/`pg.meta`/`pg.color`) straight
 * off the `PageData` returned by `usePageData` to swap its `PageHeader`
 * props when a page is showing.
 *
 * Phase 5 (hover tooltips on existing surfaces): a cell built with
 * `pageData.ts`'s `nodeTypeCell`/`predicateCell` carries a `PageCell.tooltip`
 * — `Cell` below wraps it in `NodeTypeBadge` / `PredicateTooltip` instead of
 * plain text, so node-type and predicate references read the identical rich
 * tooltip the graph and Inspector surfaces show. `NodeTypeBadge` needs the
 * `/api/spec` payload, fetched here via `useSpec` (same TanStack Query cache
 * `usePageData` itself reads — no extra request).
 *
 * Phase 6 (cross-view navigation, BA req 26-30): a tooltip-carrying cell's OWN
 * click target can differ from its row's default `target` — a node-type cell
 * always navigates to that type's Schema entry, and a predicate cell backed by
 * a real (INTRA-layer only — see `cellNavTarget`) model link (`tooltip.edge`
 * set) navigates to the edge's SOURCE node with the edge highlighted, which
 * for an incoming-relationship row is a different node than the row's own
 * default target. `cellNavTarget` resolves each cell's own target; `TableRow`
 * falls back to the row's `target` for the first cell that doesn't have one
 * of its own, so a row with no tooltip-driven overrides still reads as "the
 * whole row navigates" (just via that one cell) exactly as before. A row is
 * no longer a single `<button>` (HTML forbids interactive content inside a
 * `<button>`, and a row can now contain more than one independently-targeted
 * cell) — each clickable cell instead renders its own `role="cell"` span
 * wrapping a real `<button>` (not click/keydown handlers bolted onto the
 * `cell` role itself, which isn't exposed as interactive to assistive tech).
 */

import { useMemo } from 'react';
import { useUiStore } from './uiStore';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { buildModelIndex } from '../data/modelGraph';
import type { SpecPayload } from '../data/specGraph';
import {
  layerPageData,
  specNodePageData,
  modelNodePageData,
  type PageData,
  type PageNavTarget,
  type PageRow,
  type PageCell,
} from '../data/pageData';
import { NodeTypeBadge } from './NodeTypeBadge';
import { PredicateTooltip } from './PredicateTooltip';

const MONO = "'JetBrains Mono',monospace";

/** Build the active `PageData` (or null when nothing is selected/resolvable). */
export function usePageData(): PageData | null {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const focus = useUiStore((s) => s.focus);

  const { derived: model } = useModel();
  const { raw: specRaw } = useSpec();
  const index = useMemo(() => buildModelIndex(model), [model]);

  return useMemo(() => {
    if (!layerId || view === 'changesets') return null;
    if (focus === 'layer') {
      return layerPageData(view, layerId, model, index, specRaw);
    }
    if (!selectedId) return null;
    return view === 'spec'
      ? specNodePageData(layerId, selectedId, specRaw, model)
      : modelNodePageData(layerId, selectedId, model, index, specRaw);
  }, [view, layerId, selectedId, focus, model, index, specRaw]);
}

/** Translate a `PageNavTarget` into the matching `uiStore` navigation action. */
function useNavigate() {
  const setView = useUiStore((s) => s.setView);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToElementWithEdge = useUiStore((s) => s.navigateToElementWithEdge);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);

  return (target: PageNavTarget | undefined) => {
    if (!target) return;
    switch (target.kind) {
      case 'section':
        setView(target.view);
        return;
      case 'layer':
        setView(target.view);
        selectLayer(target.layerId);
        return;
      case 'element':
        navigateToElement(target.elementId, target.layerId);
        return;
      case 'elementWithEdge':
        navigateToElementWithEdge(target.elementId, target.layerId, target.edgeId);
        return;
      case 'specNode':
        navigateToSpecNode(target.specNodeId, target.layerId);
        return;
      default: {
        // Exhaustiveness guard: a new `PageNavTarget` variant will fail to
        // compile here instead of silently no-opping at runtime.
        const exhaustive: never = target;
        return exhaustive;
      }
    }
  };
}

/** A cell's OWN navigation target, independent of its row's default `target`
 *  (see the module doc comment's Phase 6 section) — `undefined` when the cell
 *  has no tooltip, or a `predicate` tooltip with no `edge` (a Schema-view
 *  relationship schema has no live edge to highlight). */
function cellNavTarget(cell: PageCell): PageNavTarget | undefined {
  if (cell.tooltip?.kind === 'nodeType') {
    return {
      kind: 'specNode',
      specNodeId: `${cell.tooltip.layerId}.${cell.tooltip.typeId}`,
      layerId: cell.tooltip.layerId,
    };
  }
  if (cell.tooltip?.kind === 'predicate' && cell.tooltip.edge) {
    return {
      kind: 'elementWithEdge',
      elementId: cell.tooltip.edge.sourceElementId,
      layerId: cell.tooltip.edge.sourceLayerId,
      edgeId: cell.tooltip.edge.edgeId,
    };
  }
  return undefined;
}

const CELL_STYLE: Record<PageCell['kind'], React.CSSProperties> = {
  name: {
    fontSize: 13,
    color: 'rgb(var(--canvas-fg-1))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  mono: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgb(var(--canvas-fg-2))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  dim: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgb(var(--canvas-fg-3))',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  num: {
    fontFamily: MONO,
    fontSize: 11,
    color: 'rgb(var(--canvas-fg-2))',
    textAlign: 'right',
  },
};

function Cell({
  cell,
  spec,
  target,
  onNavigate,
}: {
  cell: PageCell;
  spec: SpecPayload | undefined;
  /** This cell's own effective nav target (its own tooltip-driven target, or
   *  the row's default target when `TableRow` assigned it as the fallback) —
   *  `undefined` means the cell is plain, non-interactive text. */
  target?: PageNavTarget;
  onNavigate: (t?: PageNavTarget) => void;
}) {
  const style = { ...CELL_STYLE[cell.kind], ...(cell.color ? { color: cell.color } : null) };
  // A real `<button>` (not a `role="cell"` span faking click/keyboard
  // semantics) — `role="cell"` doesn't imply "interactive" to assistive tech,
  // so a screen reader would announce nothing actionable (WCAG 2.1 SC 4.1.2).
  // `role="cell"` permits an interactive DESCENDANT (unlike `role="row"`,
  // which is why `TableRow` no longer wraps the whole row in a button — see
  // its doc comment) — the button lives inside a plain `role="cell"` span so
  // the grid layout/ARIA structure is unchanged.
  const text = target ? (
    <span role="cell" style={style}>
      <button
        type="button"
        className="drv-cell-link"
        style={{
          ...style,
          textAlign: style.textAlign ?? 'left',
          display: 'block',
          width: '100%',
          border: 'none',
          padding: 0,
          margin: 0,
          cursor: 'pointer',
        }}
        onClick={() => onNavigate(target)}
        data-testid="page-cell-link"
      >
        {cell.text}
      </button>
    </span>
  ) : (
    <span role="cell" style={style} tabIndex={cell.tooltip ? 0 : undefined}>
      {cell.text}
    </span>
  );

  if (cell.tooltip?.kind === 'nodeType') {
    return (
      <NodeTypeBadge
        spec={spec}
        layerId={cell.tooltip.layerId}
        typeId={cell.tooltip.typeId}
        data-testid="page-cell-node-type-tooltip"
      >
        {text}
      </NodeTypeBadge>
    );
  }

  if (cell.tooltip?.kind === 'predicate') {
    return (
      <PredicateTooltip
        predicate={cell.tooltip.predicate}
        sourceTypeLabel={cell.tooltip.sourceTypeLabel}
        destinationTypeLabel={cell.tooltip.destinationTypeLabel}
        data-testid="page-cell-predicate-tooltip"
      >
        {text}
      </PredicateTooltip>
    );
  }

  return text;
}

function Breadcrumb({ pg, onNavigate }: { pg: PageData; onNavigate: (t?: PageNavTarget) => void }) {
  // `color` is intentionally NOT part of the button's inline style — inline
  // styles always win over a stylesheet rule for the same property
  // (including :hover), so a `color` set here would permanently shadow
  // `.drv-crumb:hover`. Interactive crumbs get their color from the
  // `.drv-crumb` / `.drv-crumb--current` classes in domain-and-nav.css
  // instead; only the non-interactive (no target) span sets color inline.
  const monoStyle: React.CSSProperties = { fontFamily: MONO, fontSize: 11 };

  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {pg.crumbs.map((c, i) => (
        <span key={`${c.label}-${i}`} style={{ display: 'contents' }}>
          {i > 0 && (
            <span style={{ ...monoStyle, color: 'rgb(var(--canvas-fg-4))' }} aria-hidden="true">
              /
            </span>
          )}
          {c.target ? (
            <button
              type="button"
              className={`drv-crumb${c.current ? ' drv-crumb--current' : ''}`}
              onClick={() => onNavigate(c.target)}
              data-testid="page-crumb"
              style={{ background: 'none', border: 'none', padding: 0, ...monoStyle }}
            >
              {c.label}
            </button>
          ) : (
            <span
              style={{
                ...monoStyle,
                color: c.current ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-3))',
              }}
            >
              {c.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}

function StatGrid({ pg }: { pg: PageData }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,minmax(0,1fr))', gap: 14 }}>
      {pg.stats.map((s) => (
        <div
          key={s.label}
          style={{
            padding: '12px 14px',
            background: 'rgb(var(--canvas-card))',
            border: '1px solid rgb(var(--canvas-border))',
            borderLeft: `2px solid ${s.color}`,
            borderRadius: 8,
          }}
        >
          <div
            style={{
              fontFamily: MONO,
              fontSize: 10,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              color: 'rgb(var(--canvas-fg-3))',
            }}
          >
            {s.label}
          </div>
          <div
            style={{
              fontSize: 28,
              fontWeight: 700,
              letterSpacing: '-0.02em',
              color: 'rgb(var(--canvas-fg-1))',
              marginTop: 4,
            }}
          >
            {s.value}
          </div>
        </div>
      ))}
    </div>
  );
}

function FactsBlock({ pg }: { pg: PageData }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <span
        style={{
          fontFamily: MONO,
          fontSize: 10,
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          color: 'rgb(var(--canvas-fg-3))',
        }}
      >
        {pg.factsTitle}
      </span>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2,minmax(0,1fr))', gap: '1px 32px' }}>
        {pg.facts.map((f) => (
          <div
            key={f.key}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0,150px) minmax(0,1fr)',
              gap: 12,
              padding: '7px 0',
              borderBottom: '1px solid rgb(var(--canvas-border))',
            }}
          >
            <span
              style={{
                fontFamily: MONO,
                fontSize: 11,
                lineHeight: 1.45,
                color: 'rgb(var(--canvas-fg-3))',
                minWidth: 0,
                overflowWrap: 'anywhere',
                wordBreak: 'break-word',
              }}
            >
              {f.key}
            </span>
            <span
              style={
                f.prose
                  ? { fontSize: 12, color: 'rgb(var(--canvas-fg-1))', overflowWrap: 'anywhere' }
                  : {
                      fontFamily: MONO,
                      fontSize: 11,
                      color: 'rgb(var(--canvas-fg-1))',
                      overflowWrap: 'anywhere',
                    }
              }
            >
              {f.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const ROW_STYLE: React.CSSProperties = {
  display: 'grid',
  gap: 14,
  alignItems: 'center',
  padding: '9px 10px',
  borderBottom: '1px solid rgb(var(--canvas-border))',
  borderRadius: 4,
};

function TableRow({
  row,
  widths,
  spec,
  onNavigate,
}: {
  row: PageRow;
  widths: string;
  spec: SpecPayload | undefined;
  onNavigate: (t?: PageNavTarget) => void;
}) {
  // Each cell resolves its OWN nav target first (a node-type/predicate-with-edge
  // tooltip); the row's default `target` is assigned as a fallback to the first
  // cell that doesn't have one of its own, so a row with no tooltip overrides
  // still reads as "click anywhere relevant to navigate" via that one cell —
  // see the module doc comment's Phase 6 section for why cells, not the whole
  // row, own the click affordance.
  let fallbackAssigned = false;
  const cells = row.cells.map((c, i) => {
    let target = cellNavTarget(c);
    if (!target && row.target && !fallbackAssigned) {
      target = row.target;
      fallbackAssigned = true;
    }
    return <Cell key={i} cell={c} spec={spec} target={target} onNavigate={onNavigate} />;
  });

  return (
    <div
      role="row"
      style={{ ...ROW_STYLE, gridTemplateColumns: widths }}
      data-testid={row.target ? 'page-row' : undefined}
    >
      {cells}
    </div>
  );
}

function Tables({
  pg,
  spec,
  onNavigate,
}: {
  pg: PageData;
  spec: SpecPayload | undefined;
  onNavigate: (t?: PageNavTarget) => void;
}) {
  return (
    <>
      {pg.tables.map((t) => (
        <div key={t.title} style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
            <span
              style={{
                fontFamily: MONO,
                fontSize: 10,
                letterSpacing: '0.1em',
                textTransform: 'uppercase',
                color: 'rgb(var(--canvas-fg-3))',
              }}
            >
              {t.title}
            </span>
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgb(var(--canvas-fg-3))' }}>
              {t.rows.length ? t.rows.length : ''}
            </span>
          </div>
          {t.rows.length === 0 ? (
            <span style={{ fontSize: 13, color: 'rgb(var(--canvas-fg-3))' }}>{t.emptyText}</span>
          ) : (
            <div role="table" aria-label={t.title}>
              <div
                role="row"
                style={{
                  display: 'grid',
                  gridTemplateColumns: t.widths,
                  gap: 14,
                  alignItems: 'center',
                  padding: '0 10px 7px',
                  fontFamily: MONO,
                  fontSize: 10,
                  letterSpacing: '0.08em',
                  textTransform: 'uppercase',
                  // The design specifies --canvas-fg-4 here, but that token
                  // measures ~2.56:1 on the light canvas at this size (real
                  // column-header content, not decorative chrome) — below
                  // the 4.5:1 AA minimum (see tests/e2e/a11y.spec.ts's
                  // "page view mode" scan, which is zero-tolerance since this
                  // is new surface with no inherited contrast debt).
                  // --canvas-fg-3 is the same token this app already trusts
                  // for comparable dim mono labels elsewhere.
                  color: 'rgb(var(--canvas-fg-3))',
                  borderBottom: '1px solid rgb(var(--canvas-border))',
                }}
              >
                {t.columns.map((c) => (
                  <span
                    key={c}
                    role="columnheader"
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              {t.rows.map((r, i) => (
                <TableRow key={i} row={r} widths={t.widths} spec={spec} onNavigate={onNavigate} />
              ))}
            </div>
          )}
        </div>
      ))}
    </>
  );
}

export function PageView({ pg }: { pg: PageData }) {
  const onNavigate = useNavigate();
  const { raw: specRaw } = useSpec();

  return (
    <div
      className="drv-scroll"
      style={{ position: 'absolute', inset: 0, overflowY: 'auto', padding: '2px 22px 44px' }}
      data-testid="page-view"
    >
      <div style={{ maxWidth: 1040, display: 'flex', flexDirection: 'column', gap: 28 }}>
        <Breadcrumb pg={pg} onNavigate={onNavigate} />
        <p
          style={{
            fontSize: 14,
            lineHeight: 1.6,
            color: 'rgb(var(--canvas-fg-2))',
            margin: 0,
            maxWidth: 760,
            textWrap: 'pretty',
          }}
        >
          {pg.description}
        </p>
        <StatGrid pg={pg} />
        <FactsBlock pg={pg} />
        <Tables pg={pg} spec={specRaw} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default PageView;
