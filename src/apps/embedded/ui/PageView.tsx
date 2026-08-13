/**
 * PageView — the page-view scaffold (design/node_pages README section 3):
 * breadcrumb, narrative description, 4-stat grid, two-column facts list, and
 * row tables that read the full record for the selected layer / spec node /
 * model element without a graph, with every row/crumb a navigation link.
 *
 * Rendered by `Canvas` in place of `GraphCanvas` when `uiStore.mode ===
 * 'page'`. Sources its record from `data/pageData.ts` based on `view` +
 * `focus`:
 *   - focus 'layer'                -> `layerPageData(view, ...)`
 *   - focus 'node', view 'spec'    -> `specNodePageData(...)`
 *   - focus 'node', view 'model'   -> `modelNodePageData(...)`
 *
 * `PageNavTarget`s from the data layer are translated to `uiStore` actions
 * here (the data layer stays pure/store-free). This also exposes the header
 * fields (eyebrow/title/idChip/meta/color) via `usePageHeader` so `Canvas`
 * can swap its `PageHeader` props when a page is showing.
 */

import { useMemo } from 'react';
import { useUiStore } from './uiStore';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { buildModelIndex } from '../data/modelGraph';
import {
  layerPageData,
  specNodePageData,
  modelNodePageData,
  type PageData,
  type PageNavTarget,
  type PageRow,
  type PageCell,
} from '../data/pageData';

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
      case 'specNode':
        navigateToSpecNode(target.specNodeId, target.layerId);
        return;
    }
  };
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

function Cell({ cell }: { cell: PageCell }) {
  return (
    <span style={{ ...CELL_STYLE[cell.kind], ...(cell.color ? { color: cell.color } : null) }}>
      {cell.text}
    </span>
  );
}

function Breadcrumb({ pg, onNavigate }: { pg: PageData; onNavigate: (t?: PageNavTarget) => void }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
      {pg.crumbs.map((c, i) => {
        const textStyle: React.CSSProperties = {
          fontFamily: MONO,
          fontSize: 11,
          color: c.current ? 'rgb(var(--canvas-fg-1))' : 'rgb(var(--canvas-fg-3))',
        };
        return (
          <span key={`${c.label}-${i}`} style={{ display: 'contents' }}>
            {i > 0 && (
              <span style={{ fontFamily: MONO, fontSize: 11, color: 'rgb(var(--canvas-fg-4))' }}>
                /
              </span>
            )}
            {c.target ? (
              <button
                type="button"
                className="drv-crumb"
                onClick={() => onNavigate(c.target)}
                style={{ background: 'none', border: 'none', padding: 0, ...textStyle }}
              >
                {c.label}
              </button>
            ) : (
              <span style={textStyle}>{c.label}</span>
            )}
          </span>
        );
      })}
    </div>
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
  onNavigate,
}: {
  row: PageRow;
  widths: string;
  onNavigate: (t?: PageNavTarget) => void;
}) {
  const cells = row.cells.map((c, i) => <Cell key={i} cell={c} />);

  // Only rows with a navigation target are interactive — a row with no
  // target (e.g. an Attributes row) stays a plain, non-clickable row rather
  // than faking an affordance it can't act on.
  if (!row.target) {
    return <div style={{ ...ROW_STYLE, gridTemplateColumns: widths }}>{cells}</div>;
  }

  return (
    <button
      type="button"
      className="drv-row"
      onClick={() => onNavigate(row.target)}
      style={{
        ...ROW_STYLE,
        gridTemplateColumns: widths,
        width: '100%',
        background: 'none',
        border: 'none',
        borderBottom: '1px solid rgb(var(--canvas-border))',
        textAlign: 'left',
        font: 'inherit',
      }}
    >
      {cells}
    </button>
  );
}

function Tables({ pg, onNavigate }: { pg: PageData; onNavigate: (t?: PageNavTarget) => void }) {
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
            <span style={{ fontFamily: MONO, fontSize: 10, color: 'rgb(var(--canvas-fg-4))' }}>
              {t.rows.length ? t.rows.length : ''}
            </span>
          </div>
          {t.rows.length === 0 ? (
            <span style={{ fontSize: 13, color: 'rgb(var(--canvas-fg-3))' }}>{t.emptyText}</span>
          ) : (
            <div>
              <div
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
                  color: 'rgb(var(--canvas-fg-4))',
                  borderBottom: '1px solid rgb(var(--canvas-border))',
                }}
              >
                {t.columns.map((c) => (
                  <span
                    key={c}
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {c}
                  </span>
                ))}
              </div>
              {t.rows.map((r, i) => (
                <TableRow key={i} row={r} widths={t.widths} onNavigate={onNavigate} />
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
        <Tables pg={pg} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export default PageView;
