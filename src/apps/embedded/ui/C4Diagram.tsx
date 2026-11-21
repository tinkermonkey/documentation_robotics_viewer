/**
 * C4Diagram — draws one laid-out C4 view: the scope's boundary, a card per
 * person, system, container or component, and labelled right-angle arrows.
 *
 * A proof of concept for what Heimdall's GraphCanvas can't draw yet (a
 * rectangular boundary around some nodes, a C4 card): it uses Heimdall's
 * `usePanZoom` for the viewport and canvas tokens for every colour, and takes
 * its geometry from `C4Layout`, so the layout engine can change underneath it.
 *
 * Cards are HTML over an SVG layer of boundary and arrows, both inside one
 * transformed "world" box, so text wraps and the cards are real buttons.
 *
 * Keyboard: the cards are one Tab stop (roving focus). Arrow keys move to the
 * nearest card in that direction, Enter opens a card that has parts (and
 * selects one that has none), Space selects, Escape clears the selection. The
 * arrows are listed as text for assistive technology; the SVG is decorative.
 *
 * With a changeset overlay (`overlay`), each changed card and arrow carries a
 * mark: the op outline of `opStyles.ts` (a colour AND a line style) plus a
 * text chip with a glyph, and its status in its accessible name and in the
 * arrow list, so a mark never reads by colour alone. Removed boxes and arrows
 * are ghosts (dimmed, dotted, never drillable); a box whose parts changed
 * carries a "3 changes inside" chip; a moved box says where it came from.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Icon, usePanZoom, type IconName } from '@tinkermonkey/heimdall-ui';
import type { C4Kind } from '../data/c4/c4Model';
import type { C4View, C4ViewElement } from '../data/c4/c4Views';
import { C4_CARD, c4EdgeLabel, type C4Layout } from '../data/c4/c4Layout';
import type { C4ElementDiff, C4RollUp, C4ViewRelationshipDiff } from '../data/c4/c4Diff';
import { OP_OUTLINE, OVERLAY_OPS, opOutlineCss } from './opStyles';
import {
  ELEMENT_MARKS,
  RELATIONSHIP_MARKS,
  elementStatusWords,
  relationshipStatusWords,
  rollUpLabel,
} from './c4Marks';

/** What a changeset does to the drawn diagram (view ids are union ids, see `c4Diff.ts`). */
export interface C4DiagramOverlay {
  elements: ReadonlyMap<string, C4ElementDiff>;
  rollUp: ReadonlyMap<string, C4RollUp>;
  relationships: ReadonlyMap<string, C4ViewRelationshipDiff>;
  /** The name of a union id that may not be on this diagram (a moved box's former parent). */
  nameOf: (id: string) => string | undefined;
}

export interface C4DiagramProps {
  view: C4View;
  layout: C4Layout;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  /** Open the diagram of an element that has parts. */
  onDrill: (id: string) => void;
  /**
   * Move focus to the diagram's tab-stop card once it is drawn, then call
   * `onFocused`. Set after a drill-in: the control that opened it is gone, and
   * focus would otherwise fall back to the page.
   */
  takeFocus?: boolean;
  onFocused?: () => void;
  /** A changeset laid over the diagram: marks, ghosts and roll-ups. */
  overlay?: C4DiagramOverlay | null;
}

export const C4_KIND_LABELS: Record<C4Kind, string> = {
  person: 'Person',
  system: 'Software System',
  'external-system': 'External System',
  container: 'Container',
  component: 'Component',
};

const KIND_ICONS: Partial<Record<C4Kind, IconName>> = {
  person: 'user',
  'external-system': 'share',
};

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 2;
const FIT_PADDING = 32;
/** Longest label drawn on an arrow; the rest is in its tooltip and the text list. */
const LABEL_CHARS = 28;

/** The line under a card's name: `[Container: web app]`. */
export function c4KindLine(item: C4ViewElement): string {
  const { kind, technology } = item.element;
  return technology ? `${C4_KIND_LABELS[kind]}: ${technology}` : C4_KIND_LABELS[kind];
}

type Direction = 'up' | 'down' | 'left' | 'right';
const ARROW_KEYS: Record<string, Direction> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
};

/** The card nearest to `fromId` in `direction`, by box centres, or null at the edge. */
export function nearestCard(layout: C4Layout, fromId: string, direction: Direction): string | null {
  const from = layout.boxes.get(fromId);
  if (!from) return null;
  const cx = from.x + from.width / 2;
  const cy = from.y + from.height / 2;
  let best: string | null = null;
  let bestScore = Infinity;
  for (const [id, box] of layout.boxes) {
    if (id === fromId) continue;
    const dx = box.x + box.width / 2 - cx;
    const dy = box.y + box.height / 2 - cy;
    const along = direction === 'left' ? -dx : direction === 'right' ? dx : direction === 'up' ? -dy : dy;
    const across = direction === 'left' || direction === 'right' ? Math.abs(dy) : Math.abs(dx);
    if (along <= 1) continue;
    const score = along + across * 2;
    if (score < bestScore) {
      best = id;
      bestScore = score;
    }
  }
  return best;
}

export function C4Diagram({ view, layout, selectedId, onSelect, onDrill, takeFocus, onFocused, overlay }: C4DiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRefs = useRef(new Map<string, HTMLButtonElement>());
  const { transform, bind, zoomTo, panTo, getViewport } = usePanZoom({
    containerRef: containerRef as React.RefObject<HTMLElement>,
    minZoom: MIN_ZOOM,
    maxZoom: MAX_ZOOM,
  });

  const fit = useCallback(() => {
    const el = containerRef.current;
    if (!el || layout.width === 0 || layout.height === 0) return;
    const { clientWidth: cw, clientHeight: ch } = el;
    if (cw === 0 || ch === 0) return;
    const zoom = Math.max(
      MIN_ZOOM,
      Math.min(1, (cw - FIT_PADDING * 2) / layout.width, (ch - FIT_PADDING * 2) / layout.height),
    );
    zoomTo(zoom);
    panTo((cw - layout.width * zoom) / 2, Math.max(FIT_PADDING / 2, (ch - layout.height * zoom) / 2));
  }, [layout, zoomTo, panTo]);

  // A new diagram is framed whole. Not on resize: the user's own pan and zoom hold.
  // A frame later, not in the layout effect: usePanZoom drops a zoomTo / panTo
  // made before its own mount effects have run. `fit` changes with the layout,
  // which is the only thing this follows.
  useEffect(() => {
    const frame = requestAnimationFrame(fit);
    return () => cancelAnimationFrame(frame);
  }, [fit]);

  const zoomBy = (factor: number) => {
    const el = containerRef.current;
    const { zoom } = getViewport();
    zoomTo(zoom * factor, el ? el.clientWidth / 2 : undefined, el ? el.clientHeight / 2 : undefined);
  };

  // Roving focus: the selected card, else the last focused, else the first.
  const [focusId, setFocusId] = useState<string | null>(null);
  const ids = useMemo(() => view.elements.map((e) => e.id), [view.elements]);
  const tabStop = (selectedId && ids.includes(selectedId) ? selectedId : null) ?? (focusId && ids.includes(focusId) ? focusId : null) ?? ids[0] ?? null;
  useEffect(() => {
    if (focusId && !ids.includes(focusId)) setFocusId(null);
  }, [focusId, ids]);

  // After a drill-in, focus the new diagram (its cards are rendered by now).
  useEffect(() => {
    if (!takeFocus) return;
    const card = tabStop ? cardRefs.current.get(tabStop) : undefined;
    (card ?? containerRef.current)?.focus({ preventScroll: true });
    onFocused?.();
  }, [takeFocus, tabStop, layout, onFocused]);

  // A pan drag ends in a click on the background too: only a press that didn't move clears.
  const press = useRef<{ x: number; y: number } | null>(null);
  const onPointerDown = (e: React.PointerEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    press.current = { x: e.clientX, y: e.clientY };
    bind.onPointerDown(e);
  };
  const onBackgroundClick = (e: React.MouseEvent<HTMLElement>) => {
    if ((e.target as HTMLElement).closest('[data-no-drag]')) return;
    const start = press.current;
    press.current = null;
    if (start && Math.hypot(e.clientX - start.x, e.clientY - start.y) > 4) return;
    if (selectedId) onSelect(null);
  };

  /** A removed box is drawn back as a ghost: it can be selected, never opened. */
  const isGhost = (id: string) => overlay?.elements.get(id)?.status === 'removed';
  const canDrill = (item: C4ViewElement) => item.drillable && !isGhost(item.id);

  const onCardKeyDown = (e: React.KeyboardEvent<HTMLButtonElement>, item: C4ViewElement) => {
    const direction = ARROW_KEYS[e.key];
    if (direction) {
      e.preventDefault();
      e.stopPropagation(); // the canvas pans on arrow keys; a focused card moves focus instead
      const next = nearestCard(layout, item.id, direction);
      if (next) {
        setFocusId(next);
        cardRefs.current.get(next)?.focus();
      }
      return;
    }
    if (e.key === 'Enter' && canDrill(item)) {
      e.preventDefault();
      e.stopPropagation();
      onDrill(item.id);
      return;
    }
    if (e.key === 'Escape' && selectedId) {
      e.stopPropagation();
      onSelect(null);
    }
  };

  const nameOf = useMemo(() => new Map(view.elements.map((e) => [e.id, e.element.name])), [view.elements]);
  const relationshipOf = useMemo(() => new Map(view.relationships.map((r) => [r.id, r])), [view.relationships]);
  const touchesSelection = (sourceId: string, targetId: string) =>
    !!selectedId && (sourceId === selectedId || targetId === selectedId);

  const scopeTitle = view.scope ? `${view.scope.name} [${C4_KIND_LABELS[view.scope.kind]}]` : '';
  const diagramName =
    view.level === 'context'
      ? 'System context diagram'
      : `${view.level === 'container' ? 'Container' : 'Component'} diagram of ${view.scope?.name ?? 'the system'}`;

  return (
    <div
      ref={containerRef}
      className="c4-diagram"
      {...bind}
      onPointerDown={onPointerDown}
      onClick={onBackgroundClick}
      aria-label={`${diagramName}. Drag to pan, scroll to zoom.`}
      data-testid="c4-diagram"
      data-level={view.level}
    >
      <div
        className="c4-diagram__world"
        style={{ width: layout.width, height: layout.height, transform, transformOrigin: '0 0' }}
      >
        <svg
          className="c4-diagram__lines"
          width={layout.width}
          height={layout.height}
          viewBox={`0 0 ${layout.width} ${layout.height}`}
          aria-hidden="true"
          focusable="false"
        >
          <defs>
            <marker id="c4-arrow" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 z" className="c4-diagram__arrowhead" />
            </marker>
            <marker id="c4-arrow-hot" markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
              <path d="M0,0 L9,4.5 L0,9 z" className="c4-diagram__arrowhead c4-diagram__arrowhead--hot" />
            </marker>
            {overlay &&
              OVERLAY_OPS.map((op) => (
                <marker key={op} id={`c4-arrow-${op}`} markerWidth="9" markerHeight="9" refX="8" refY="4.5" orient="auto" markerUnits="userSpaceOnUse">
                  <path d="M0,0 L9,4.5 L0,9 z" style={{ fill: `rgb(var(${OP_OUTLINE[op].token}))` }} />
                </marker>
              ))}
          </defs>
          {layout.boundary && (
            <g data-testid="c4-boundary">
              <rect
                className="c4-diagram__boundary"
                x={layout.boundary.x}
                y={layout.boundary.y}
                width={layout.boundary.width}
                height={layout.boundary.height}
                rx={10}
              />
              <text className="c4-diagram__boundary-title" x={layout.boundary.x + 16} y={layout.boundary.y + 26}>
                {scopeTitle}
              </text>
            </g>
          )}
          {layout.edges.map((edge) => {
            const rel = relationshipOf.get(edge.id);
            if (!rel) return null;
            const hot = touchesSelection(rel.sourceId, rel.targetId);
            const change = overlay?.relationships.get(rel.id);
            const mark = change ? RELATIONSHIP_MARKS[change.status] : null;
            const base = c4EdgeLabel(rel.labels, rel.count);
            const full = mark ? `${mark.glyph} ${base}` : base;
            const text = full.length > LABEL_CHARS ? `${full.slice(0, LABEL_CHARS - 1)}…` : full;
            const classes = [
              'c4-diagram__edge',
              hot ? 'c4-diagram__edge--hot' : '',
              change ? `c4-diagram__edge--${change.status}` : '',
            ]
              .filter(Boolean)
              .join(' ');
            const marker = hot ? 'url(#c4-arrow-hot)' : mark?.op ? `url(#c4-arrow-${mark.op})` : 'url(#c4-arrow)';
            return (
              <g key={edge.id} className={classes} data-testid="c4-edge" data-status={change?.status}>
                {change && <title>{`${base}: ${relationshipStatusWords(change)}`}</title>}
                <polyline
                  points={edge.points.map((p) => `${p.x},${p.y}`).join(' ')}
                  markerEnd={marker}
                  style={mark?.op && !hot ? { stroke: `rgb(var(${OP_OUTLINE[mark.op].token}))` } : undefined}
                />
                {edge.label && text && (
                  <g>
                    <rect
                      className="c4-diagram__edge-label-bg"
                      x={edge.label.x}
                      y={edge.label.y}
                      width={edge.label.width}
                      height={edge.label.height}
                      rx={4}
                    />
                    <text
                      className="c4-diagram__edge-label"
                      x={edge.label.x + edge.label.width / 2}
                      y={edge.label.y + edge.label.height / 2}
                      textAnchor="middle"
                      dominantBaseline="central"
                    >
                      {text}
                    </text>
                  </g>
                )}
              </g>
            );
          })}
        </svg>

        {view.elements.map((item) => {
          const box = layout.boxes.get(item.id);
          if (!box) return null;
          const { element } = item;
          const selected = item.id === selectedId;
          const icon = element.shape === 'datastore' ? 'data' : KIND_ICONS[element.kind];
          const drillable = canDrill(item);
          const parts = drillable ? `, ${item.childCount} ${item.childCount === 1 ? 'part' : 'parts'}, Enter opens it` : '';
          const change = overlay?.elements.get(item.id);
          const rollUp = overlay?.rollUp.get(item.id);
          const mark = change ? ELEMENT_MARKS[change.status] : null;
          const words = overlay ? elementStatusWords(change, rollUp, overlay.nameOf) : [];
          const status = words.length > 0 ? `, ${words.join(', ')}` : '';
          const inside = rollUpLabel(rollUp);
          const ghost = change?.status === 'removed';
          const classes = [
            'c4-card',
            `c4-card--${element.kind}`,
            element.shape === 'datastore' ? 'c4-card--datastore' : '',
            item.inScope ? '' : 'c4-card--outside',
            selected ? 'c4-card--selected' : '',
            ghost ? 'c4-card--ghost' : '',
          ]
            .filter(Boolean)
            .join(' ');
          return (
            <div
              key={item.id}
              className={classes}
              style={{ left: box.x, top: box.y, width: C4_CARD.width, height: C4_CARD.height }}
              data-no-drag
              data-testid="c4-card"
              data-c4-id={item.id}
              data-kind={element.kind}
              data-status={change?.status}
            >
              {mark?.op && (
                <span
                  className="c4-card__mark"
                  style={{ border: opOutlineCss(mark.op) }}
                  aria-hidden="true"
                  data-testid="c4-card-mark"
                />
              )}
              <button
                type="button"
                ref={(el) => {
                  if (el) cardRefs.current.set(item.id, el);
                  else cardRefs.current.delete(item.id);
                }}
                className="c4-card__main"
                tabIndex={item.id === tabStop ? 0 : -1}
                aria-pressed={selected}
                aria-label={`${element.name}, ${c4KindLine(item)}${status}${parts}`}
                onClick={() => onSelect(selected ? null : item.id)}
                onDoubleClick={() => drillable && onDrill(item.id)}
                onFocus={() => setFocusId(item.id)}
                onKeyDown={(e) => onCardKeyDown(e, item)}
              >
                <span className="c4-card__name">
                  {icon && <Icon name={icon} size={13} aria-hidden="true" />}
                  <span>{element.name}</span>
                </span>
                <span className="c4-card__kind">[{c4KindLine(item)}]</span>
                {element.description && <span className="c4-card__description">{element.description}</span>}
              </button>
              {mark?.op && (
                <span
                  className="c4-card__status"
                  style={{ borderColor: `rgb(var(${OP_OUTLINE[mark.op].token}))` }}
                  title={words[0]}
                  aria-hidden="true"
                  data-testid="c4-card-status"
                >
                  <span className="c4-card__glyph">{mark.glyph}</span> {words[0]}
                </span>
              )}
              {inside && (
                <span className="c4-card__rollup" aria-hidden="true" data-testid="c4-card-rollup">
                  {inside}
                </span>
              )}
              {drillable && (
                <button
                  type="button"
                  className="c4-card__drill"
                  tabIndex={-1}
                  aria-label={`Open ${element.name}: ${item.childCount} ${item.childCount === 1 ? 'part' : 'parts'}`}
                  title={`Open: ${item.childCount} ${item.childCount === 1 ? 'part' : 'parts'}`}
                  onClick={() => onDrill(item.id)}
                  data-testid="c4-card-drill"
                >
                  <span aria-hidden="true">{item.childCount}</span>
                  <Icon name="chevronRight" size={12} aria-hidden="true" />
                </button>
              )}
            </div>
          );
        })}
      </div>

      {/* The arrows, as text: the SVG above is decorative. */}
      <ul className="heimdall-visually-hidden" aria-label="Relationships on this diagram" data-testid="c4-relationship-list">
        {view.relationships.map((rel) => {
          const words = relationshipStatusWords(overlay?.relationships.get(rel.id));
          return (
            <li key={rel.id}>
              {nameOf.get(rel.sourceId)} {rel.labels.join(', ')} {nameOf.get(rel.targetId)}
              {rel.count > 1 ? ` (${rel.count} links)` : ''}
              {words ? ` — ${words}` : ''}
            </li>
          );
        })}
      </ul>

      <div className="graph-toolbar c4-diagram__toolbar" data-no-drag role="toolbar" aria-label="Diagram zoom">
        <button type="button" className="graph-toolbar__btn" onClick={() => zoomBy(1.3)} aria-label="Zoom in" title="Zoom in">
          <Icon name="zoomIn" size={15} aria-hidden="true" />
        </button>
        <button type="button" className="graph-toolbar__btn" onClick={() => zoomBy(1 / 1.3)} aria-label="Zoom out" title="Zoom out">
          <Icon name="zoomOut" size={15} aria-hidden="true" />
        </button>
        <button type="button" className="graph-toolbar__btn" onClick={fit} aria-label="Fit the diagram" title="Fit the diagram" data-testid="c4-fit">
          <Icon name="maximize" size={15} aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export default C4Diagram;
