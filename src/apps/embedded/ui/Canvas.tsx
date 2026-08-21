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
 * The `GraphCanvas` is keyed by
 * `${view}:${layerId}:${graphLayout}:${nodeMarginPreset}:${nodeDisplay}`
 * so switching layer/view/layout/margin/display remounts it — Heimdall auto-centers
 * ONCE per mount and won't re-center on prop change, so the remount is what
 * recenters the new layer's graph (and what makes toggling Model↔Schema for one
 * layer swap instances for node-types). layout/nodeMargin/nodeDisplay are in the
 * key because they change the layout's footprint (a card is much larger than a
 * pill); showClusterBoundaries/showAllRelations don't, so they stay out of it.
 *
 * Model view nodes render as cards by default (`nodeDisplay: 'card'`): a
 * `renderNode` override (`renderCardNode` below) renders `ModelCardNode` fed by a
 * `CardData` side-channel map — `data/modelGraph.ts`'s `nodesWithCardData` —
 * keyed by node id, since `renderNode`'s own signature only carries
 * `GraphNodeData`. Cards show the node's type plus intra-layer connection count
 * and up to 5 enumerated inter-layer connections (a literal "…" overflow
 * indicator beyond that); the full untruncated list is one click away via the
 * existing Inspector, whose `relationshipsForElement` was never capped. Schema
 * view node-types have no `CardData` and always render as a pill regardless of
 * the `nodeDisplay` preference (that control is hidden outside Model view —
 * see `GraphControls` below), same as Model view in pill mode: both go through
 * `renderPillNode` (below) rather than leaving `renderNode` `undefined`, so
 * hovering a node's `kind` label — the node TYPE itself, in Schema view —
 * always shows the same `NodeTypeBadge` tooltip card mode wires, unqualified
 * by presentation mode or view (the BA requirement this closes gaps in).
 *
 * `GraphControls` floats over the graph itself (top-left, graph mode only) — a
 * card-style panel, same visual language as the built-in `GraphToolbar`'s own
 * floating card — exposing Heimdall 0.6.0's layout engines and display options:
 * Layout (force/galaxy/clustered), Display (card/pill, Model view only), Boundaries,
 * Node margin, Relations (structural/all, see data/predicates.ts). Mirrors
 * Heimdall's own docs/src/showcases/GraphLayoutsShowcase.tsx demo controls, just
 * repositioned as an overlay instead of a full-width row so it doesn't cost the
 * canvas any vertical space. The built-in `GraphToolbar` (zoom/lock/fullscreen, + a
 * live-simulation toggle for galaxy) is pinned `toolbarPosition="bottom-left"`
 * — not bottom-right, which collided with Inspector's `DetailDrawer` floating
 * over the graph's right edge whenever a node was selected — forced into a
 * vertical stack via `.graph-toolbar--bottom-left` in domain-and-nav.css
 * (Heimdall only stacks vertically for left-center/right-center natively).
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
 *
 * Model-view-only edge interaction (edges only carry model edge metadata there):
 * `useEdgeInteraction` wraps click-to-select, a native `GraphCanvas` prop pair
 * (`edgeSelectionProps` bag = `selectedEdgeId`/`onEdgeSelect`: accent-color
 * `.selected` + keyboard/aria) — `Canvas.tsx` never touches
 * `uiStore.selectedEdgeId`/`selectEdge` directly, only through the hook, so if
 * Heimdall's edge-selection surface changes again, only the hook changes.
 * There's deliberately no hover half of that hook (see its own doc comment) —
 * hover doesn't touch `uiStore.highlightedEdgeId`/`edges`' `variant: 'hot'` at
 * all; that field is reserved for the rare, deliberate highlight
 * `navigateToElementWithEdge` sets on cross-navigation, not a per-pointer-move
 * preview (wiring hover into it was a real perf bug — see PR #537's follow-up
 * fix — since it re-triggers `GraphCanvas`'s force-layout effect on every
 * pointer pass over an edge). The predicate hover tooltip is unaffected:
 * `GraphCanvas`'s native `edgeTooltip` render-prop (`renderEdgeTooltip` below)
 * gets the hovered edge directly from `GraphCanvas` (heimdall-ui 0.8.0+) — no
 * external hover-state plumbing needed — and is positioned at the edge's
 * midpoint, shown/hidden by `GraphCanvas` internally (no portal or manual
 * placement math on our side).
 */

import { useCallback, useMemo, useRef, useState } from 'react';
import {
  PageHeader,
  GraphCanvas,
  SegmentedControl,
  Icon,
  type GraphNodeData,
  type GraphNodeHierarchyMeta,
  type GraphEdgeData,
} from '@tinkermonkey/heimdall-ui';
import { useUiStore, type GraphLayout, type NodeMarginPreset, type NodeDisplay } from './uiStore';
import { layerColor, layerLabel, layerStandard } from './domain';
import { PageView, usePageData } from './PageView';
import { Inspector } from './Inspector';
import { ModelCardNode } from './ModelCardNode';
import { PillNode } from './PillNode';
import { PredicateTooltipContent } from './PredicateTooltip';
import { useEdgeInteraction } from './useEdgeInteraction';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import {
  buildModelIndex,
  nodesWithCardData,
  edgesForLayer as modelEdgesForLayer,
  edgeMetadata,
  interLayerNodesAndEdges,
  type CardData,
} from '../data/modelGraph';
import {
  nodeTypesForLayer,
  edgesForLayer as specEdgesForLayer,
  intraRelCount,
  shortName,
} from '../data/specGraph';
import { isStructuralEdge, isStructuralPredicate } from '../data/predicates';

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

const DISPLAY_OPTIONS = [
  { value: 'card', label: 'Card' },
  { value: 'pill', label: 'Pill' },
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
 *  very control being interacted with. The toggle button ALSO has a plain
 *  onClick too — hover/focus alone would leave the button's own
 *  `aria-expanded`/`aria-controls` an unhonored disclosure contract on a
 *  device with no hover: touch has none at all, so without it the whole
 *  control set would be unreachable there. It OPENS rather than toggles —
 *  on desktop, a mouse click is always preceded by the same pointer's
 *  mouseEnter already opening the panel via hover, so a toggle would
 *  immediately re-close what hover just opened, one click after another
 *  looking like it does nothing (confirmed live: this was the first, wrong,
 *  version). Closing stays owned by mouseLeave/blur/Escape, same as before.
 *  Escape closes it and returns focus to the toggle, matching CLAUDE.md's
 *  accessibility standards ("Escape closes overlays") the same way every
 *  other floating panel in this app already does. */
function GraphControls() {
  const [expanded, setExpanded] = useState(false);
  const toggleRef = useRef<HTMLButtonElement>(null);
  // Escape closes the panel, then refocuses the toggle for a11y — but
  // that .focus() call itself bubbles a focus event back up to this same
  // wrapper's onFocus, which would otherwise immediately re-expand the
  // panel it was just told to close. Set right before the refocus call,
  // consumed (and cleared) by the very next onFocus it causes.
  const suppressNextFocusExpandRef = useRef(false);
  const graphLayout = useUiStore((s) => s.graphLayout);
  const setGraphLayout = useUiStore((s) => s.setGraphLayout);
  const showClusterBoundaries = useUiStore((s) => s.showClusterBoundaries);
  const toggleClusterBoundaries = useUiStore((s) => s.toggleClusterBoundaries);
  const nodeMarginPreset = useUiStore((s) => s.nodeMarginPreset);
  const setNodeMarginPreset = useUiStore((s) => s.setNodeMarginPreset);
  const showAllRelations = useUiStore((s) => s.showAllRelations);
  const toggleShowAllRelations = useUiStore((s) => s.toggleShowAllRelations);
  const nodeDisplay = useUiStore((s) => s.nodeDisplay);
  const setNodeDisplay = useUiStore((s) => s.setNodeDisplay);
  const showInterLayerNodes = useUiStore((s) => s.showInterLayerNodes);
  const toggleShowInterLayerNodes = useUiStore((s) => s.toggleShowInterLayerNodes);
  const view = useUiStore((s) => s.view);

  const collapseIfLeavingFlyout = (
    e: React.MouseEvent<HTMLDivElement> | React.FocusEvent<HTMLDivElement>,
  ) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setExpanded(false);
  };

  return (
    <div
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={collapseIfLeavingFlyout}
      onFocus={() => {
        if (suppressNextFocusExpandRef.current) {
          suppressNextFocusExpandRef.current = false;
          return;
        }
        setExpanded(true);
      }}
      onBlur={collapseIfLeavingFlyout}
      onKeyDown={(e) => {
        if (e.key === 'Escape') {
          setExpanded(false);
          suppressNextFocusExpandRef.current = true;
          toggleRef.current?.focus();
        }
      }}
      style={{ position: 'absolute', top: 14, left: 14, zIndex: 1 }}
      data-testid="graph-controls"
    >
      <button
        ref={toggleRef}
        type="button"
        className="graph-toolbar__btn"
        aria-label="Graph display options"
        aria-expanded={expanded}
        aria-controls="graph-controls-panel"
        data-testid="graph-controls-toggle"
        onClick={() => setExpanded(true)}
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
          {/* Card presentation only applies to Model graph nodes (see
              data/modelGraph.ts's nodesWithCardData) — the Schema view's
              node-type graph always uses the pill, so the control has no
              effect there and is hidden rather than shown inert. */}
          {view === 'model' && (
            <GraphControl label="Display" testId="graph-display-control">
              <SegmentedControl
                value={nodeDisplay}
                onChange={(v) => setNodeDisplay(v as NodeDisplay)}
                options={DISPLAY_OPTIONS}
              />
            </GraphControl>
          )}
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
          {view === 'model' && (
            <GraphControl label="Inter-layer" testId="graph-inter-layer-control">
              <SegmentedControl
                value={showInterLayerNodes ? 'on' : 'off'}
                onChange={(v) => {
                  if ((v === 'on') !== showInterLayerNodes) toggleShowInterLayerNodes();
                }}
                options={BOUNDARIES_OPTIONS}
              />
            </GraphControl>
          )}
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
  const highlightedEdgeId = useUiStore((s) => s.highlightedEdgeId);
  const selectGraphNode = useUiStore((s) => s.selectGraphNode);
  const selectLayer = useUiStore((s) => s.selectLayer);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const mode = useUiStore((s) => s.mode);
  const setMode = useUiStore((s) => s.setMode);
  const graphLayout = useUiStore((s) => s.graphLayout);
  const showClusterBoundaries = useUiStore((s) => s.showClusterBoundaries);
  const showAllRelations = useUiStore((s) => s.showAllRelations);
  const nodeMarginPreset = useUiStore((s) => s.nodeMarginPreset);
  const nodeDisplay = useUiStore((s) => s.nodeDisplay);
  const showInterLayerNodes = useUiStore((s) => s.showInterLayerNodes);
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

  // Compute inter-layer data once upstream when enabled in Model view.
  // Returns foreignNodes, crossEdges, and foreignNodeIds (for render/click dispatch).
  // This single computation is reused by both nodes and edges memos below,
  // eliminating the duplicate O(links) scan that was running twice per render.
  const interLayerData = useMemo(() => {
    if (!layerId || isSpec || !showInterLayerNodes) {
      return { foreignNodes: [], crossEdges: [], foreignNodeIds: new Set<string>() };
    }

    const perimeterLayout = graphLayout === 'force-clustered';
    const { foreignNodes, crossEdges, foreignNodeIds } = interLayerNodesAndEdges(
      model,
      layerId,
      index,
      perimeterLayout,
    );

    // Filter orphan foreign nodes when structural-only view is active
    if (!showAllRelations) {
      const structuralCrossEdges = new Set<string>();

      for (const link of model.links) {
        const src = index.byEndpoint.get(link.source);
        const tgt = index.byEndpoint.get(link.target);
        if (!src || !tgt) continue;

        const srcInLayer = src.layer_id === layerId;
        const tgtInLayer = tgt.layer_id === layerId;
        if ((srcInLayer && !tgtInLayer) || (!srcInLayer && tgtInLayer)) {
          if (isStructuralPredicate(link.type)) {
            const foreignNodeId = srcInLayer ? tgt.id : src.id;
            structuralCrossEdges.add(foreignNodeId);
          }
        }
      }

      const filteredForeignNodes = foreignNodes.filter((node) =>
        structuralCrossEdges.has(node.id),
      );
      const filteredForeignNodeIds = new Set(filteredForeignNodes.map((n) => n.id));
      const filteredCrossEdges = crossEdges.filter((edge) =>
        filteredForeignNodeIds.has(edge.sourceId) || filteredForeignNodeIds.has(edge.targetId),
      );

      return { foreignNodes: filteredForeignNodes, crossEdges: filteredCrossEdges, foreignNodeIds: filteredForeignNodeIds };
    }

    return { foreignNodes, crossEdges, foreignNodeIds };
  }, [layerId, isSpec, showInterLayerNodes, graphLayout, model, index, showAllRelations]);

  // Model view nodes carry a CardData side-channel (intra/inter-layer connection
  // counts, see data/modelGraph.ts's nodesWithCardData) that ModelCardNode reads
  // via renderNode below; Schema view node-types have no such data and always
  // render as the default pill.
  // When showInterLayerNodes is on, merge foreign nodes alongside native nodes.
  const { nodes, cardData } = useMemo((): {
    nodes: GraphNodeData[];
    cardData: Map<string, CardData>;
  } => {
    if (!layerId) return { nodes: [], cardData: new Map() };
    if (isSpec) return { nodes: nodeTypesForLayer(specRaw, layerId), cardData: new Map() };

    const { nodes: nativeNodes, cardData: cardDataMap } = nodesWithCardData(model, layerId, index);
    const allNodes = [...nativeNodes, ...interLayerData.foreignNodes];
    return { nodes: allNodes, cardData: cardDataMap };
  }, [isSpec, specRaw, model, layerId, index, interLayerData.foreignNodes]);

  const renderCardNode = useCallback(
    (node: GraphNodeData, selected: boolean, hierarchy?: GraphNodeHierarchyMeta) => {
      // Foreign nodes always render as pills at 60% opacity, regardless of
      // nodeDisplay setting — provides clear visual subordination.
      const isForeignNode = interLayerData.foreignNodeIds.has(node.id);
      if (isForeignNode) {
        const handleForeignNodeClick = () => navigateToElement(node.id, node.domainColor ?? '');

        return (
          <div
            style={{ opacity: 0.6 }}
            data-testid={`foreign-node-wrapper-${node.id}`}
          >
            <PillNode
              id={node.id}
              label={node.label}
              kind={node.kind}
              domainColor={node.domainColor}
              selected={selected}
              onSelect={handleForeignNodeClick}
              spec={specRaw}
              typeId={undefined}
              hasChildren={hierarchy?.hasChildren}
              collapsed={hierarchy?.collapsed}
              hiddenDescendantCount={hierarchy?.hiddenDescendantCount}
              onToggleCollapse={hierarchy?.onToggleCollapse}
            />
          </div>
        );
      }

      return (
        <ModelCardNode
          id={node.id}
          label={node.label}
          kind={node.kind}
          domainColor={node.domainColor}
          selected={selected}
          onSelect={selectGraphNode}
          cardData={cardData.get(node.id)}
          spec={specRaw}
          hasChildren={hierarchy?.hasChildren}
          collapsed={hierarchy?.collapsed}
          hiddenDescendantCount={hierarchy?.hiddenDescendantCount}
          onToggleCollapse={hierarchy?.onToggleCollapse}
        />
      );
    },
    [selectGraphNode, navigateToElement, cardData, specRaw, interLayerData.foreignNodeIds],
  );

  // Pill-mode render (Model pill display + always in Schema view, see the
  // module doc comment) — wires the same NodeTypeBadge hover tooltip
  // renderCardNode wires for card mode. Schema-view nodes ARE node types, so
  // their tooltip lookup uses the node's own id (already `<slug>.<short>`)
  // rather than `kind` (the generic 'spec node' label nodeTypesForLayer sets).
  // Foreign nodes (inter-layer) render at reduced opacity and navigate to their
  // home layer on click rather than selecting within the current layer.
  const renderPillNode = useCallback(
    (node: GraphNodeData, selected: boolean, hierarchy?: GraphNodeHierarchyMeta) => {
      const isForeignNode = interLayerData.foreignNodeIds.has(node.id);
      const handleForeignNodeClick = isForeignNode
        ? () => navigateToElement(node.id, node.domainColor ?? '')
        : undefined;
      const handleNodeClick = handleForeignNodeClick || selectGraphNode;

      const content = (
        <PillNode
          id={node.id}
          label={node.label}
          kind={node.kind}
          domainColor={node.domainColor}
          selected={selected}
          onSelect={handleNodeClick}
          spec={specRaw}
          typeId={isSpec ? shortName(node.domainColor ?? '', node.id) : undefined}
          hasChildren={hierarchy?.hasChildren}
          collapsed={hierarchy?.collapsed}
          hiddenDescendantCount={hierarchy?.hiddenDescendantCount}
          onToggleCollapse={hierarchy?.onToggleCollapse}
        />
      );

      if (!isForeignNode) return content;

      return (
        <div
          style={{ opacity: 0.6 }}
          data-testid={`foreign-node-wrapper-${node.id}`}
        >
          {content}
        </div>
      );
    },
    [selectGraphNode, navigateToElement, specRaw, isSpec, interLayerData.foreignNodeIds],
  );

  // Model-only click-to-select — see useEdgeInteraction's doc comment for
  // why there's no hover half here. Spread directly onto GraphCanvas below.
  const { selectedEdgeId, edgeSelectionProps } = useEdgeInteraction();

  const edges = useMemo((): GraphEdgeData[] => {
    if (!layerId) return [];
    if (isSpec) return specEdgesForLayer(specRaw, layerId);

    const intraLayerEdges = modelEdgesForLayer(model, layerId, index);
    const allEdges = [...intraLayerEdges, ...interLayerData.crossEdges];

    return allEdges.map((edge) =>
      edge.id === selectedEdgeId || edge.id === highlightedEdgeId
        ? { ...edge, variant: 'hot' }
        : edge,
    );
  }, [isSpec, specRaw, model, layerId, index, selectedEdgeId, highlightedEdgeId, interLayerData.crossEdges]);

  // GraphCanvas's native edgeTooltip render-prop — called with whichever edge
  // is currently hovered; only meaningful in the Model view (edges only carry
  // model edge metadata there). Positioning/portaling/show-hide are all
  // GraphCanvas's own concern now (heimdall-ui 0.8.0+).
  //
  // KNOWN A11Y GAP: heimdall-ui renders this content inside its own
  // `.graph-tooltip-layer`, which is `aria-hidden="true"` (its `Tooltip`'s
  // `aria-describedby` lands on an empty decorative span inside that same
  // hidden layer, not on the edge's own `role="button"` element) — so this
  // predicate-definition prose is unreachable to a screen reader. The edge's
  // own `aria-label` ("{predicate}: {source} to {target}") still carries the
  // predicate + endpoints, so that much stays accessible; only the longer
  // definition text (from predicateDefinitions.ts) is lost. This is a
  // heimdall-ui-owned tooltip-layer choice, not fixable purely here without
  // re-forking the tooltip mechanism this migration exists to avoid — see
  // https://github.com/tinkermonkey/documentation_robotics_viewer/issues/538
  // for surfacing the definition via the already-accessible EdgeInspector
  // instead.
  const renderEdgeTooltip = useCallback(
    (edge: GraphEdgeData) => {
      const meta = edgeMetadata(model, edge.id, index, specRaw);
      if (!meta) return null;
      return (
        <PredicateTooltipContent
          predicate={meta.predicate}
          sourceTypeLabel={meta.sourceNode.type}
          destinationTypeLabel={meta.targetNode.type}
          data-testid="edge-predicate-tooltip"
        />
      );
    },
    [model, index, specRaw],
  );

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

      <div
        ref={canvasAreaRef}
        style={{ flex: 1, position: 'relative', minHeight: 0 }}
      >
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
                  key={`${view}:${layerId}:${graphLayout}:${nodeMarginPreset}:${nodeDisplay}:${showInterLayerNodes}`}
                  nodes={nodes}
                  edges={edges}
                  selectedNodeId={selectedId ?? undefined}
                  onNodeSelect={(id) => {
                    if (interLayerData.foreignNodeIds.has(id)) {
                      const target = index.byUuid.get(id);
                      if (target) navigateToElement(target.id, target.layer_id);
                    } else {
                      selectGraphNode(id);
                    }
                  }}
                  {...(!isSpec ? edgeSelectionProps : {})}
                  edgeTooltip={!isSpec ? renderEdgeTooltip : undefined}
                  onBackgroundClick={() => selectLayer(layerId)}
                  renderNode={!isSpec && nodeDisplay === 'card' ? renderCardNode : renderPillNode}
                  centerOnSelect
                  fullscreenContainerRef={canvasAreaRef}
                  layout={graphLayout}
                  nodeMargin={nodeMargin}
                  showClusterBoundaries={showClusterBoundaries}
                  isStructuralEdge={isStructuralEdge}
                  showAllRelations={showAllRelations}
                  toolbarPosition="bottom-left"
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
                    language as the built-in bottom-left GraphToolbar. */}
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
