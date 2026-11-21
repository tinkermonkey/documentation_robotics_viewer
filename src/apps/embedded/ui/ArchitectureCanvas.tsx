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
 *
 * A changeset can be laid over the diagrams: the header's Changeset picker
 * (`C4ChangesetPicker`) sets `uiStore.c4ChangesetId` (the URL's
 * `?changeset=`), `useC4Overlay` diffs the model with it applied (staged) or
 * reverted (applied), and the diagram drawn is the union of both sides
 * (`unionC4View`): marks on what changed, ghosts for what went. The
 * `C4ChangesetBar` under the breadcrumb says what it is and what differs; the
 * drawer lists the changes behind the selected box, each a link to it in the
 * Changesets view. A selection the overlaid diagram doesn't draw is dropped.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button, DetailDrawer, PageHeader, SegmentedControl } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useChatAnchor } from './chatAnchor';
import { MarkdownText } from './MarkdownText';
import { C4Diagram, C4_KIND_LABELS, type C4DiagramOverlay } from './C4Diagram';
import { C4ChangesetPicker } from './C4ChangesetPicker';
import { C4ChangesetBar } from './C4ChangesetBar';
import { OP_OUTLINE, type OverlayOp } from './opStyles';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { specTypeLabel, withCount } from '../data/typeLabel';
import { useC4Layout, useC4Model, useC4Overlay, type C4Overlay } from '../data/c4/useC4Model';
import { C4_SYSTEM_ID, isEmptyC4, type C4Model } from '../data/c4/c4Model';
import { buildC4View, type C4Level, type C4View, type C4ViewElement } from '../data/c4/c4Views';
import { unionC4View, type C4DiffView } from '../data/c4/c4Diff';
import { normalizeOp, type ChangeRecord } from '../data/changesets';
import { sequenceOf } from '../data/modelOverlay';
import { dottedId } from '../data/modelGraph';
import type { ChangesetDetail } from '../data/useChangesets';

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

/** Rows shown per group of "In this changeset" before the rest are counted. */
const CHANGE_ROWS = 25;

interface ChangeLine {
  sequence: number;
  op: OverlayOp;
  opLabel: string;
  name: string;
}

const str = (v: unknown) => (typeof v === 'string' && v.length > 0 ? v : undefined);

/** One change of the changeset as a line: its op, and the element or link it touches. */
function changeLine(change: ChangeRecord, sequence: number, nameOfRef: (ref: string) => string): ChangeLine {
  const op = normalizeOp(change.type);
  const isLink = (change.type ?? '').includes('relationship');
  const state = change.after ?? change.before ?? {};
  let name: string;
  if (isLink) {
    const source = str(state.source);
    const target = str(state.target);
    const predicate = str(state.predicate) ?? str(state.type) ?? 'links to';
    name = source && target ? `${nameOfRef(source)} —${predicate}→ ${nameOfRef(target)}` : (change.elementId ?? 'a link');
  } else {
    name = str(state.name) ?? change.elementId ?? 'an element';
  }
  const opWord = op === 'add' ? 'added' : op === 'delete' ? 'deleted' : 'modified';
  return { sequence, op, opLabel: isLink ? `link ${opWord}` : opWord, name };
}

/**
 * "In this changeset": the changes behind the selected box: its own, those in
 * its parts, and those behind its arrows on this diagram. Each opens in the
 * Changesets view's review, on that change.
 */
function C4ChangesSection({
  id,
  view,
  overlay,
  detail,
}: {
  id: string;
  view: C4DiffView;
  overlay: C4Overlay;
  detail: ChangesetDetail;
}) {
  const selectChangeset = useUiStore((s) => s.selectChangeset);
  const selectChange = useUiStore((s) => s.selectChange);
  const { derived: raw } = useModel();

  const lines = useMemo(() => {
    const bySeq = new Map<number, ChangeRecord>();
    detail.changes.forEach((c, i) => bySeq.set(sequenceOf(c, i), c));
    // A link's ends by name: the model's elements, then those the changeset adds or deletes.
    const names = new Map<string, string>();
    for (const node of raw.nodes) names.set(dottedId(node), node.name);
    for (const c of detail.changes) {
      const name = str((c.after ?? c.before)?.name);
      if (name && c.elementId && !names.has(c.elementId)) names.set(c.elementId, name);
    }
    const nameOfRef = (ref: string) => names.get(ref) ?? ref.split('.').pop() ?? ref;
    const toLines = (seqs: Iterable<number>) =>
      [...new Set(seqs)]
        .sort((a, b) => a - b)
        .flatMap((seq) => (bySeq.has(seq) ? [changeLine(bySeq.get(seq)!, seq, nameOfRef)] : []));
    const own = overlay.diff.elements.get(id)?.sequences ?? [];
    const ownSet = new Set(own);
    const inside = (overlay.diff.rollUp.get(id)?.sequences ?? []).filter((s) => !ownSet.has(s));
    const insideSet = new Set(inside);
    const arrows = view.relationships
      .filter((r) => r.sourceId === id || r.targetId === id)
      .flatMap((r) => view.relationshipDiff.get(r.id)?.sequences ?? [])
      .filter((s) => !ownSet.has(s) && !insideSet.has(s));
    return [
      { title: 'This box', lines: toLines(own) },
      { title: 'Inside it', lines: toLines(inside) },
      { title: 'Its arrows on this diagram', lines: toLines(arrows) },
    ].filter((g) => g.lines.length > 0);
  }, [id, view, overlay, detail, raw]);

  const open = (seq: number) => {
    selectChangeset(detail.id);
    selectChange(seq);
  };

  return (
    <section aria-label="In this changeset" data-testid="c4-details-changes">
      <h3 className="c4-details__section">In this changeset</h3>
      {lines.length === 0 ? (
        <p className="c4-details__muted">No change in {detail.name} touches this box.</p>
      ) : (
        lines.map((group) => (
          <div key={group.title} style={{ marginBottom: 8 }}>
            <p className="c4-details__muted" style={{ marginBottom: 4 }}>
              {group.title}
            </p>
            <ul className="c4-details__list">
              {group.lines.slice(0, CHANGE_ROWS).map((line) => (
                <li key={line.sequence} data-testid="c4-details-change">
                  <span className="c4-details__op" style={{ borderColor: `rgb(var(${OP_OUTLINE[line.op].token}))` }}>
                    <span aria-hidden="true">{OP_OUTLINE[line.op].glyph}&nbsp;</span>
                    {line.opLabel}
                  </span>
                  <span>{line.name}</span>
                  <button
                    type="button"
                    className="drv-linkbtn c4-details__seq"
                    onClick={() => open(line.sequence)}
                    aria-label={`Open change ${line.sequence} in the Changesets view`}
                    title="Open this change in the Changesets view"
                    data-testid="c4-details-change-link"
                  >
                    #{line.sequence}
                  </button>
                </li>
              ))}
            </ul>
            {group.lines.length > CHANGE_ROWS && (
              <p className="c4-details__muted">and {group.lines.length - CHANGE_ROWS} more</p>
            )}
          </div>
        ))
      )}
    </section>
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
  overlay,
  detail,
}: {
  item: C4ViewElement;
  view: C4View;
  model: C4Model;
  onOpen: (id: string) => void;
  onSelect: (id: string) => void;
  onClose: () => void;
  /** The changeset laid over the diagram, if any (with `view` its union view). */
  overlay?: C4Overlay | null;
  detail?: ChangesetDetail | null;
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
  // Only a source the live model holds can open in the Model view: a staged changeset's new elements
  // aren't in it yet, and an applied one's deleted elements no longer are.
  const { derived: live } = useModel();
  const inModel = useMemo(() => new Set(live.nodes.map((n) => n.id)), [live.nodes]);

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

      {overlay?.diff.elements.get(item.id)?.status === 'removed' && (
        <p className="c4-details__muted" data-testid="c4-details-ghost">
          {overlay.mode === 'apply' ? 'The changeset removes this box.' : 'Applying the changeset removed this box.'}
        </p>
      )}

      {item.drillable && overlay?.diff.elements.get(item.id)?.status !== 'removed' && (
        <Button size="sm" onClick={() => onOpen(item.id)} data-testid="c4-details-open">
          Open its {item.childCount} {item.childCount === 1 ? 'part' : 'parts'}
        </Button>
      )}

      {overlay && detail && 'relationshipDiff' in view && (
        <C4ChangesSection id={item.id} view={view as C4DiffView} overlay={overlay} detail={detail} />
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
                {!inModel.has(source.id) ? (
                  <span>{source.name}</span>
                ) : (
                  <button
                    type="button"
                    className="drv-linkbtn"
                    onClick={() => navigateToElement(source.id, source.layerId)}
                    title={`Open ${source.ref} in the Model view`}
                    data-testid="c4-source-link"
                  >
                    {source.name}
                  </button>
                )}
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
  const c4ChangesetId = useUiStore((s) => s.c4ChangesetId);
  const showC4 = useUiStore((s) => s.showC4);
  const selectC4 = useUiStore((s) => s.selectC4);

  const { derived: raw } = useModel();
  const { model, isLoading, isError } = useC4Model();
  const overlayState = useC4Overlay(c4ChangesetId);
  const { overlay, detail } = overlayState;
  const diffView = useMemo(
    () => (overlay ? unionC4View(overlay.base, overlay.after, overlay.diff, c4Level, c4Scope) : null),
    [overlay, c4Level, c4Scope],
  );
  const baseView = useMemo(() => buildC4View(model, c4Level, c4Scope), [model, c4Level, c4Scope]);
  const view: C4View = diffView ?? baseView;
  const drawn = overlay?.union ?? model;
  const { layout, error: layoutError } = useC4Layout(view, overlay ? overlayState.key : '');
  const diagramOverlay = useMemo<C4DiagramOverlay | null>(
    () =>
      overlay && diffView
        ? {
            elements: overlay.diff.elements,
            rollUp: overlay.diff.rollUp,
            relationships: diffView.relationshipDiff,
            nameOf: (id) => overlay.union.byId.get(id)?.name,
          }
        : null,
    [overlay, diffView],
  );

  const bodyRef = useRef<HTMLDivElement>(null);
  useChatAnchor(bodyRef);

  const selected = c4SelectedId ? view.elements.find((e) => e.id === c4SelectedId) : undefined;
  const empty = isEmptyC4(model);

  // A selected box this diagram doesn't draw (a ghost of another changeset, a
  // box the overlay took away) is let go, once the diagram it's checked against
  // is the one that will be drawn.
  const settled = !isLoading && !isError && !empty && !overlayState.isLoading;
  useEffect(() => {
    if (settled && c4SelectedId && !selected) selectC4(null);
  }, [settled, c4SelectedId, selected, selectC4]);

  // A drill-in removes the control that made it (the card, the drawer's button,
  // a breadcrumb link): the next diagram takes focus once it is drawn.
  const [focusDiagram, setFocusDiagram] = useState(false);
  const diagramFocused = useCallback(() => setFocusDiagram(false), []);

  /** Open the diagram of `id`: the system is the Container diagram, anything else a Component one. */
  const open = (id: string) => {
    setFocusDiagram(true);
    if (id === C4_SYSTEM_ID) showC4('container');
    else showC4('component', id);
  };
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
            <C4ChangesetPicker />
          </div>
        }
      />
      <ScopeTrail view={view} onOpen={open} />
      <C4ChangesetBar state={overlayState} />

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
          <C4Diagram
            view={view}
            layout={layout}
            selectedId={selected?.id ?? null}
            onSelect={selectC4}
            onDrill={open}
            takeFocus={focusDiagram}
            onFocused={diagramFocused}
            overlay={diagramOverlay}
          />
        )}
        <DetailDrawer open={!!selected} width={DRAWER_WIDTH}>
          {selected && (
            <C4Details
              item={selected}
              view={view}
              model={drawn}
              onOpen={open}
              onSelect={selectC4}
              onClose={() => selectC4(null)}
              overlay={overlay}
              detail={detail}
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
