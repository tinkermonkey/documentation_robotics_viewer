/**
 * Canvas — the center pane for the Model and Schema views.
 *
 * Heimdall `PageHeader` (eyebrow = colored layer swatch + ALL-CAPS label, title,
 * id `Chip`, right meta) over either a `GraphCanvas` (mode 'graph') or the
 * `PageView` record scaffold (mode 'page'), toggled by a `SegmentedControl` in
 * the header's action slot (design/node_pages README section 3).
 *
 *   Model view  — eyebrow `INSTANCE MODEL · {standard}`, title = layer label,
 *                 meta = `{n} elements`; nodes/edges are layer instances.
 *   Schema view — eyebrow `META-MODEL · {standard}`, title = `{layer} schema`,
 *                 meta = `{n} node types · {m} relationships`; nodes are
 *                 node-types, edges are intra-layer relationship schemas.
 *
 * In page mode, the header's eyebrow/title/idChip/meta/swatch are overridden
 * by the active `PageData` (layer / spec node / model node), matching the
 * design's `pg ? override : default` header logic.
 *
 * The `GraphCanvas` is keyed by `${view}:${layerId}:${graphLayout}:${nodeMarginPreset}`
 * so switching layer/view/layout/margin remounts it — Heimdall auto-centers ONCE
 * per mount and won't re-center on prop change, so the remount is what recenters
 * the new layer's graph (and what makes toggling Model↔Schema for one layer swap
 * instances for node-types). layout/nodeMargin are in the key because they change
 * the layout's footprint; showClusterBoundaries/showAllRelations don't, so they
 * stay out of it.
 *
 * `GraphControls` floats over the graph itself (top-left, graph mode only) — a
 * card-style panel, same visual language as the built-in `GraphToolbar`'s own
 * floating card — exposing Heimdall 0.6.0's layout engines and display options:
 * Layout (force/galaxy/clustered), Boundaries, Node margin, Relations
 * (structural/all, see data/predicates.ts). Mirrors Heimdall's own
 * docs/src/showcases/GraphLayoutsShowcase.tsx demo controls, just repositioned
 * as an overlay instead of a full-width row so it doesn't cost the canvas any
 * vertical space. The built-in `GraphToolbar` (zoom/lock/fullscreen, + a
 * live-simulation toggle for galaxy) is pinned `toolbarPosition="bottom-right"`,
 * forced into a vertical stack via `.graph-toolbar--bottom-right` in
 * domain-and-nav.css (Heimdall only stacks vertically for left-center/
 * right-center natively).
 *
 * `Inspector` (the selection detail drawer, see Inspector.tsx) renders as a
 * sibling of `GraphCanvas`/`CanvasEmptyState` inside the same graph-mode
 * `position: relative` wrapper — that's the ancestor its Heimdall `DetailDrawer`
 * overlays the right edge of, so it must live here (not in AppShell) to overlay
 * only the graph area, not the whole app row. Page mode has no Inspector — the
 * page-view scaffold carries the same data at greater depth already.
 *
 * `GraphCanvas`'s `onBackgroundClick` reuses `selectLayer(layerId)` (a click on
 * empty canvas is functionally "return to the layer-level selection") rather
 * than a dedicated action — it already sets `selectedId: null, focus: 'layer'`,
 * which is exactly what clears the Inspector's `open` (`!!metadata`) so the
 * drawer auto-hides again.
 *
 * Two heimdall-ui 0.7.0 props, both unconditionally on: `centerOnSelect` pans the
 * viewport to keep `selectedId` centered whenever it changes — the whole point being
 * a NavTree click (or a cross-layer link, or a URL-restored deep link) can select a
 * node that's currently off-screen, unlike a click on the canvas itself; it's a
 * harmless no-op nudge for on-canvas clicks, so there's no need to special-case it by
 * selection origin. `fullscreenContainerRef={canvasAreaRef}` points the built-in
 * toolbar's Fullscreen button at the graph-mode relative wrapper below (not
 * `GraphCanvas`'s own root) so `GraphControls` and `Inspector` — both its siblings,
 * outside what the native Fullscreen API would otherwise render — stay visible while
 * fullscreen.
 */

import { useMemo, useRef, useState } from 'react';
import { PageHeader, GraphCanvas, SegmentedControl, Icon } from '@tinkermonkey/heimdall-ui';
import { useUiStore, type GraphLayout, type NodeMarginPreset } from './uiStore';
import { layerColor, layerLabel, layerStandard } from './domain';
import { PageView, usePageData } from './PageView';
import { Inspector } from './Inspector';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import {
  buildModelIndex,
  nodesForLayer,
  edgesForLayer as modelEdgesForLayer,
} from '../data/modelGraph';
import {
  nodeTypesForLayer,
  edgesForLayer as specEdgesForLayer,
  intraRelCount,
} from '../data/specGraph';
import { isStructuralEdge } from '../data/predicates';

const MODE_OPTIONS = [
  { value: 'graph', label: 'graph' },
  { value: 'page', label: 'page' },
];

const LAYOUT_OPTIONS = [
  { value: 'force', label: 'Force' },
  { value: 'galaxy', label: 'Galaxy' },
  { value: 'force-clustered', label: 'Clustered' },
];

const BOUNDARIES_OPTIONS = [
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
];

const MARGIN_OPTIONS = [
  { value: 'tight', label: 'Tight' },
  { value: 'default', label: 'Default' },
  { value: 'wide', label: 'Wide' },
];

const RELATIONS_OPTIONS = [
  { value: 'structural', label: 'Structural' },
  { value: 'all', label: 'All' },
];

/** nodeMargin px for the 'wide' preset — undefined ('default') leaves each
 *  engine's own default in place; 'tight' goes to 0. */
const WIDE_NODE_MARGIN = 120;

function nodeMarginFor(preset: NodeMarginPreset): number | undefined {
  if (preset === 'tight') return 0;
  if (preset === 'wide') return WIDE_NODE_MARGIN;
  return undefined;
}

/** Layout/display control flyout floating over the graph (top-left) — mirrors
 *  Heimdall's own GraphLayoutsShowcase demo controls (Layout, Boundaries, Node
 *  margin, Relations), collapsed by default to a single transparent icon
 *  button (same `.graph-toolbar__btn` look the built-in GraphToolbar's own
 *  buttons use) so it doesn't sit as a permanent opaque block over the graph.
 *  Hovering or focusing it (mouse OR keyboard) expands a translucent/blurred
 *  panel — same visual language as the Inspector's `DetailDrawer` — with the
 *  actual controls; moving off/blurring the whole flyout collapses it again,
 *  immediately — same `relatedTarget`-based "did it actually leave the whole
 *  flyout, not just move between two elements inside it" check both
 *  onMouseLeave and onBlur use, so a click on one control inside the panel
 *  moving to another (each fires its own enter/leave as the pointer crosses
 *  between them) doesn't spuriously collapse the panel out from under the
 *  very control being interacted with. */
function GraphControls() {
  const [expanded, setExpanded] = useState(false);
  const graphLayout = useUiStore((s) => s.graphLayout);
  const setGraphLayout = useUiStore((s) => s.setGraphLayout);
  const showClusterBoundaries = useUiStore((s) => s.showClusterBoundaries);
  const toggleClusterBoundaries = useUiStore((s) => s.toggleClusterBoundaries);
  const nodeMarginPreset = useUiStore((s) => s.nodeMarginPreset);
  const setNodeMarginPreset = useUiStore((s) => s.setNodeMarginPreset);
  const showAllRelations = useUiStore((s) => s.showAllRelations);
  const toggleShowAllRelations = useUiStore((s) => s.toggleShowAllRelations);

  const collapseIfLeavingFlyout = (
    e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
  ) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
  };

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={collapseIfLeavingFlyout}
      onFocus={() => setExpanded(true)}
      onBlur={collapseIfLeavingFlyout}
      style={{ position: 'absolute', top: 14, left: 14, zIndex: 1 }}
      data-testid="graph-controls"
    >
      <button
        type="button"
        className="graph-toolbar__btn"
        aria-label="Graph display options"
        aria-expanded={expanded}
        aria-controls="graph-controls-panel"
        data-testid="graph-controls-toggle"
        style={{ background: 'transparent' }}
      >
        <Icon name="settings" size={16} />
      </button>
      {expanded && (
        <div
          id="graph-controls-panel"
          style={{
            marginTop: 6,
            display: 'flex',
            flexWrap: 'wrap',
            gap: 14,
            rowGap: 8,
            maxWidth: 'min(420px, calc(100vw - 28px))',
            padding: '10px 14px',
            background: 'rgb(var(--canvas-card) / 0.5)',
            backdropFilter: 'blur(8px)',
            WebkitBackdropFilter: 'blur(8px)',
            border: '1px solid rgb(var(--canvas-border))',
            borderRadius: 'var(--radius-lg)',
            boxShadow: 'var(--shadow-md)',
          }}
          data-testid="graph-controls-panel"
        >
          <GraphControl label="Layout" testId="graph-layout-control">
            <SegmentedControl
              value={graphLayout}
              onChange={(v) => setGraphLayout(v as GraphLayout)}
              options={LAYOUT_OPTIONS}
            />
          </GraphControl>
          {graphLayout !== 'force' && (
            <GraphControl label="Boundaries" testId="graph-boundaries-control">
              <SegmentedControl
                value={showClusterBoundaries ? 'on' : 'off'}
                onChange={(v) => {
                  if ((v === 'on') !== showClusterBoundaries) toggleClusterBoundaries();
                }}
                options={BOUNDARIES_OPTIONS}
              />
            </GraphControl>
          )}
          {graphLayout !== 'galaxy' && (
            <GraphControl label="Node margin" testId="graph-margin-control">
              <SegmentedControl
                value={nodeMarginPreset}
                onChange={(v) => setNodeMarginPreset(v as NodeMarginPreset)}
                options={MARGIN_OPTIONS}
              />
            </GraphControl>
          )}
          <GraphControl label="Relations" testId="graph-relations-control">
            <SegmentedControl
              value={showAllRelations ? 'all' : 'structural'}
              onChange={(v) => {
                if ((v === 'all') !== showAllRelations) toggleShowAllRelations();
              }}
              options={RELATIONS_OPTIONS}
            />
          </GraphControl>
        </div>
      )}
    </div>
  );
}

function GraphControl({
  label,
  testId,
  children,
}: {
  label: string;
  testId: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{ display: 'flex', flexDirection: 'column', gap: 6 }}
      data-testid={testId}
    >
      <span
        style={{
          fontFamily: "'JetBrains Mono',monospace",
          fontSize: 10,
          textTransform: 'uppercase',
          letterSpacing: '0.08em',
          color: 'rgb(var(--canvas-fg-3))',
        }}
      >
        {label}
      </span>
      {children}
    </div>
  );
}

/** Empty state shown when no layer is selected. */
function CanvasEmptyState({ message }: { message: string }) {
  return (
    <div
      style={{
        flex: 1,
        display: 'grid',
        placeItems: 'center',
        color: 'rgb(var(--canvas-fg-3))',
        fontFamily: "'JetBrains Mono',monospace",
        fontSize: 12,
      }}
      data-testid="canvas-empty"
    >
      {message}
    </div>
  );
}

export function Canvas() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const selectGraphNode = useUiStore((s) => s.selectGraphNode);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);
  const graphLayout = useUiStore((s) => s.graphLayout);
  const showClusterBoundaries = useUiStore((s) => s.showClusterBoundaries);
  const showAllRelations = useUiStore((s) => s.showAllRelations);
  const nodeMarginPreset = useUiStore((s) => s.nodeMarginPreset);
  const pg = usePageData();
  const isPage = mode === 'page';
  const nodeMargin = nodeMarginFor(nodeMarginPreset);

  // Fullscreen target for GraphCanvas's built-in toolbar button (heimdall-ui 0.7.0's
  // fullscreenContainerRef): must be an ancestor of GraphCanvas's own root that ALSO contains
  // GraphControls and Inspector, since GraphCanvas doesn't accept children and the native
  // Fullscreen API only renders the fullscreened element's own subtree — without this, both
  // siblings would vanish the instant Fullscreen was used. The graph-mode relative wrapper below
  // is exactly that ancestor (it wraps all three), so this ref is attached there.
  const canvasAreaRef = useRef<HTMLDivElement>(null);

  const { derived: model } = useModel();
  const { derived: spec, raw: specRaw } = useSpec();
  const isSpec = view === 'spec';

  const index = useMemo(() => buildModelIndex(model), [model]);

  const nodes = useMemo(() => {
    if (!layerId) return [];
    return isSpec
      ? nodeTypesForLayer(specRaw, layerId)
      : nodesForLayer(model, layerId);
  }, [isSpec, specRaw, model, layerId]);

  const edges = useMemo(() => {
    if (!layerId) return [];
    return isSpec
      ? specEdgesForLayer(specRaw, layerId)
      : modelEdgesForLayer(model, layerId, index);
  }, [isSpec, specRaw, model, layerId, index]);

  const slug = layerId ?? '';
  const standard = spec.byLayer[slug]?.standard || layerStandard(slug);

  const eyebrowText = isSpec
    ? `META-MODEL${standard ? ` · ${standard}` : ''}`
    : `INSTANCE MODEL${standard ? ` · ${standard}` : ''}`;

  const title = layerId
    ? isSpec
      ? `${layerLabel(slug)} schema`
      : layerLabel(slug)
    : isSpec
      ? 'Schema'
      : 'Model';

  const metaText = useMemo(() => {
    if (!layerId) return '';
    if (isSpec) {
      const typeCount = spec.byLayer[slug]?.typeCount ?? 0;
      const relCount = intraRelCount(specRaw, slug);
      return `${typeCount} node types · ${relCount} relationships`;
    }
    return `${model.countsByLayer[slug] ?? 0} elements`;
  }, [isSpec, layerId, slug, spec, specRaw, model]);

  const emptyMessage = isSpec
    ? 'select a layer to view its schema'
    : 'select a layer to view its instance model';
  const noContentMessage = isSpec
    ? 'no node types in this layer'
    : 'no elements in this layer';

  // Page mode overrides the header with the active record's own eyebrow /
  // title / id chip / meta / swatch color (design's `pg ? override : default`).
  const headerColor = isPage && pg ? pg.color : layerColor(slug);
  const headerEyebrow = isPage && pg ? pg.eyebrow : eyebrowText;
  const headerTitle = isPage && pg ? pg.title : title;
  const headerIdChip = isPage && pg ? pg.idChip : (layerId ?? view);
  const headerMeta = isPage && pg ? pg.meta : metaText;

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
        style={{ flex: 'none', padding: '16px 22px 14px' }}
        eyebrow={
          <>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                flex: 'none',
                background: headerColor,
                display: 'inline-block',
              }}
            />
            <span>{headerEyebrow}</span>
          </>
        }
        title={headerTitle}
        idChip={headerIdChip}
        actions={
          <>
            <span
              style={{
                fontFamily: "'JetBrains Mono',monospace",
                fontSize: 11,
                color: 'rgb(var(--canvas-fg-3))',
              }}
            >
              {headerMeta}
            </span>
            <SegmentedControl
              value={mode}
              onChange={(v) => setMode(v as 'graph' | 'page')}
              options={MODE_OPTIONS}
              data-testid="canvas-mode-toggle"
            />
          </>
        }
      />

      <div ref={canvasAreaRef} style={{ flex: 1, position: 'relative', minHeight: 0 }}>
        {isPage ? (
          !layerId ? (
            <CanvasEmptyState message={emptyMessage} />
          ) : !pg ? (
            <CanvasEmptyState message="select a node to view its page" />
          ) : (
            <PageView pg={pg} />
          )
        ) : (
          <>
            {!layerId ? (
              <CanvasEmptyState message={emptyMessage} />
            ) : nodes.length === 0 ? (
              <CanvasEmptyState message={noContentMessage} />
            ) : (
              <>
                <GraphCanvas
                  key={`${view}:${layerId}:${graphLayout}:${nodeMarginPreset}`}
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedId ?? undefined}
                  onNodeSelect={(id) => selectGraphNode(id)}
                  onBackgroundClick={() => selectLayer(layerId)}
                  centerOnSelect
                  fullscreenContainerRef={canvasAreaRef}
                  layout={graphLayout}
                  nodeMargin={nodeMargin}
                  showClusterBoundaries={showClusterBoundaries}
                  isStructuralEdge={isStructuralEdge}
                  showAllRelations={showAllRelations}
                  toolbarPosition="bottom-right"
                  fitView={graphLayout !== 'force'}
                  fitPadding={40}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    width: '100%',
                    height: '100%',
                  }}
                />
                {/* Floats over the graph itself (top-left) — same card
                    language as the built-in bottom-right GraphToolbar. */}
                <GraphControls />
              </>
            )}
            {/* Floats over this relative wrapper's right edge (Heimdall
                DetailDrawer) — auto-hides when nothing's selected, same
                whether the graph or an empty state is showing underneath. */}
            <Inspector />
          </>
        )}
      </div>
    </div>
  );
}

export default Canvas;
