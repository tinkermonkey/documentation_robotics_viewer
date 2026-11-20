/**
 * ArchitectureCanvas — the Architecture view: the model as C4 diagrams.
 *
 * A page header with the level control (Context · Containers · Components),
 * a breadcrumb of the scope below the Container level, the `C4Diagram`, and a
 * details drawer for the selected box: what it is, the model elements behind
 * it (each a link into the Model view), its arrows on this diagram, and what
 * was folded onto it.
 *
 * The C4 model comes from `data/c4/` (`useC4Model`): this component only picks
 * the view (level and scope from `uiStore`, which the router mirrors into
 * `?level=` / `?scope=` / `?node=`) and draws it. A line under the diagram says
 * how much of the model the rules placed, so a thin diagram reads as a thin
 * model, not as a complete picture.
 */

import { useMemo, useRef } from 'react';
import { Button, DetailDrawer, PageHeader, SegmentedControl } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useChatAnchor } from './chatAnchor';
import { MarkdownText } from './MarkdownText';
import { C4Diagram, C4_KIND_LABELS } from './C4Diagram';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { specTypeLabel, withCount } from '../data/typeLabel';
import { useC4Layout, useC4Model } from '../data/c4/useC4Model';
import { C4_SYSTEM_ID, isEmptyC4, type C4Model } from '../data/c4/c4Model';
import { buildC4View, type C4Level, type C4View, type C4ViewElement } from '../data/c4/c4Views';

const LEVEL_TITLES: Record<C4Level, string> = {
  context: 'System Context',
  container: 'Containers',
  component: 'Components',
};

const LEVEL_OPTIONS: { value: C4Level; label: string }[] = [
  { value: 'context', label: 'Context' },
  { value: 'container', label: 'Containers' },
  { value: 'component', label: 'Components' },
];

const DRAWER_WIDTH = 340;

function Message({ children, testId }: { children: React.ReactNode; testId?: string }) {
  return (
    <div className="c4-message" role="status" data-testid={testId}>
      {children}
    </div>
  );
}

/** The breadcrumb of a Component diagram's scope: System › Container › … › scope. */
function ScopeTrail({ view, onOpen }: { view: C4View; onOpen: (id: string) => void }) {
  if (view.level !== 'component' || view.trail.length === 0) return null;
  return (
    <nav className="c4-trail" aria-label="Diagram scope" data-testid="c4-trail">
      {view.trail.map((element, i) => {
        const last = i === view.trail.length - 1;
        return (
          <span key={element.id} className="c4-trail__item">
            {i > 0 && (
              <span className="c4-trail__sep" aria-hidden="true">
                ›
              </span>
            )}
            {last ? (
              <span aria-current="page">{element.name}</span>
            ) : (
              <button type="button" className="drv-linkbtn" onClick={() => onOpen(element.id)}>
                {element.name}
              </button>
            )}
          </span>
        );
      })}
    </nav>
  );
}

/** The drawer's content for the selected box. */
function C4Details({
  item,
  view,
  model,
  onOpen,
  onSelect,
  onClose,
}: {
  item: C4ViewElement;
  view: C4View;
  model: C4Model;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const { derived: spec } = useSpec();
  const { element } = item;

  const typeName = (layerId: string, typeId: string) => specTypeLabel(spec.byLayer[layerId], layerId, typeId);
  const outgoing = view.relationships.filter((r) => r.sourceId === item.id);
  const incoming = view.relationships.filter((r) => r.targetId === item.id);
  const folded = Object.entries(element.folded)
    .map(([type, count]) => {
      const dot = type.indexOf('.');
      const layerId = type.slice(0, dot);
      return { type, count, label: typeName(layerId, type.slice(dot + 1)).plural, layer: layerLabel(layerId) };
    })
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
  const nameOf = (id: string) => model.byId.get(id)?.name ?? id;

  return (
    <div className="c4-details" data-testid="c4-details">
      <div className="c4-details__head">
        <div>
          <div className="c4-details__eyebrow">{C4_KIND_LABELS[element.kind]}</div>
          <h2 className="c4-details__name">{element.name}</h2>
          {element.technology && <div className="c4-details__tech">{element.technology}</div>}
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close details" data-testid="c4-details-close">
          Close
        </Button>
      </div>

      {element.description && <MarkdownText text={element.description} className="drv-markdown--compact" />}

      {item.drillable && (
        <Button size="sm" onClick={() => onOpen(item.id)} data-testid="c4-details-open">
          Open its {item.childCount} {item.childCount === 1 ? 'part' : 'parts'}
        </Button>
      )}

      <section aria-label="Model elements">
        <h3 className="c4-details__section">Model elements</h3>
        {element.sources.length === 0 ? (
          <p className="c4-details__muted">
            {element.id === C4_SYSTEM_ID
              ? 'The system is not an element of the model: it stands for everything the model describes.'
              : 'A stand-in: the model has no element for it.'}
          </p>
        ) : (
          <ul className="c4-details__list">
            {element.sources.map((source) => (
              <li key={source.id}>
                <button
                  type="button"
                  className="drv-linkbtn"
                  onClick={() => navigateToElement(source.id, source.layerId)}
                  title={`Open ${source.ref} in the Model view`}
                  data-testid="c4-source-link"
                >
                  {source.name}
                </button>
                <span className="c4-details__muted">
                  {layerLabel(source.layerId)} · {typeName(source.layerId, source.type).singular}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {(outgoing.length > 0 || incoming.length > 0) && (
        <section aria-label="Relationships on this diagram">
          <h3 className="c4-details__section">On this diagram</h3>
          <ul className="c4-details__list">
            {outgoing.map((rel) => (
              <li key={rel.id}>
                <span className="c4-details__muted">{rel.labels.join(', ')} →</span>
                <button type="button" className="drv-linkbtn" onClick={() => onSelect(rel.targetId)}>
                  {nameOf(rel.targetId)}
                </button>
                {rel.count > 1 && <span className="c4-details__muted">{rel.count} links</span>}
              </li>
            ))}
            {incoming.map((rel) => (
              <li key={rel.id}>
                <span className="c4-details__muted">←</span>
                <button type="button" className="drv-linkbtn" onClick={() => onSelect(rel.sourceId)}>
                  {nameOf(rel.sourceId)}
                </button>
                <span className="c4-details__muted">
                  {rel.labels.join(', ')}
                  {rel.count > 1 ? ` · ${rel.count} links` : ''}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {folded.length > 0 && (
        <section aria-label="Attached model elements">
          <h3 className="c4-details__section">Attached to it</h3>
          <ul className="c4-details__list">
            {folded.map((f) => (
              <li key={f.type}>
                <span>{withCount(f.label, f.count)}</span>
                <span className="c4-details__muted">{f.layer}</span>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

export function ArchitectureCanvas() {
  const c4Level = useUiStore((s) => s.c4Level);
  const c4Scope = useUiStore((s) => s.c4Scope);
  const c4SelectedId = useUiStore((s) => s.c4SelectedId);
  const showC4 = useUiStore((s) => s.showC4);
  const selectC4 = useUiStore((s) => s.selectC4);

  const { derived: raw } = useModel();
  const { model, isLoading, isError } = useC4Model();
  const view = useMemo(() => buildC4View(model, c4Level, c4Scope), [model, c4Level, c4Scope]);
  const { layout, error: layoutError } = useC4Layout(view);

  const bodyRef = useRef<HTMLDivElement>(null);
  useChatAnchor(bodyRef);

  const selected = c4SelectedId ? view.elements.find((e) => e.id === c4SelectedId) : undefined;
  const empty = isEmptyC4(model);

  /** Open the diagram of `id`: the system is the Container diagram, anything else a Component one. */
  const open = (id: string) => (id === C4_SYSTEM_ID ? showC4('container') : showC4('component', id));
  const setLevel = (level: C4Level) => {
    if (level === view.level) return;
    showC4(level, level === 'component' ? c4Scope : null);
  };

  const title = view.level === 'component' ? (view.scope?.name ?? LEVEL_TITLES.component) : LEVEL_TITLES[view.level];
  const inScope = view.elements.filter((e) => e.inScope).length;
  const placed = raw.nodes.length - model.unplaced.total;

  return (
    <div
      style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        minWidth: 0,
        background: 'rgb(var(--canvas-bg))',
        borderTopLeftRadius: 8,
        overflow: 'hidden',
      }}
      data-testid="canvas"
    >
      <PageHeader
        className="canvas-header"
        style={{ flex: 'none', padding: '12px 22px 14px' }}
        eyebrow={<span>ARCHITECTURE · C4</span>}
        title={title}
        idChip={view.level === 'component' ? 'components' : undefined}
        actions={
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
            <span className="c4-count" data-testid="c4-count">
              {view.level === 'context' ? `${view.elements.length - 1} around it` : `${inScope} in scope`}
            </span>
            <SegmentedControl
              value={view.level}
              onChange={(v) => setLevel(v as C4Level)}
              options={LEVEL_OPTIONS}
              aria-label="C4 level"
              data-testid="c4-level-control"
            />
          </div>
        }
      />
      <ScopeTrail view={view} onOpen={open} />

      <div ref={bodyRef} style={{ flex: 1, position: 'relative', minHeight: 0 }} data-testid="c4-body">
        {isError ? (
          <Message testId="c4-error">The model could not be loaded.</Message>
        ) : isLoading ? (
          <Message>Loading the model…</Message>
        ) : empty ? (
          <Message testId="c4-empty">
            Nothing in this model reads as a C4 element yet. The diagrams are built from personas and roles, application
            components and services, UX applications and databases.
          </Message>
        ) : layoutError ? (
          <Message testId="c4-error">The diagram could not be laid out.</Message>
        ) : !layout ? (
          <Message>Laying out…</Message>
        ) : (
          <C4Diagram view={view} layout={layout} selectedId={selected?.id ?? null} onSelect={selectC4} onDrill={open} />
        )}
        <DetailDrawer open={!!selected} width={DRAWER_WIDTH}>
          {selected && (
            <C4Details
              item={selected}
              view={view}
              model={model}
              onOpen={open}
              onSelect={selectC4}
              onClose={() => selectC4(null)}
            />
          )}
        </DetailDrawer>
      </div>

      {!isLoading && !isError && !empty && (
        <div className="c4-footnote" data-testid="c4-footnote">
          <span>
            {model.elements.length} C4 elements from {placed} of {raw.nodes.length} model elements
          </span>
          {model.unplaced.total > 0 && <span>{model.unplaced.total} not on any diagram</span>}
          {view.hiddenOutside > 0 && (
            <span>
              {view.hiddenOutside} more linked {view.hiddenOutside === 1 ? 'element' : 'elements'} outside not shown
            </span>
          )}
          {model.issues.map((issue) => (
            <span key={issue} className="c4-footnote__issue">
              {issue}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export default ArchitectureCanvas;
