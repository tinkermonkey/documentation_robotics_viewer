/**
 * Inspector — the selection detail drawer for a selected Model element or
 * Schema node-type, floating over the Canvas's graph area (Heimdall
 * `DetailDrawer`) instead of reserving a permanent sidebar column. Rendered by
 * `Canvas.tsx` as a sibling of `GraphCanvas`, inside the same
 * `position: relative` wrapper that `DetailDrawer` overlays the right edge of
 * — same composition Heimdall's own docs/src/showcases/GraphLayoutsShowcase.tsx
 * demo uses (`DetailDrawer` + `GraphInspector` as its content).
 *
 * `open` follows whether there's something to show (`!!metadata`) — auto-hides
 * (animates to width 0) with nothing selected instead of showing an empty
 * sidebar; `GraphInspector`'s own empty state stays mounted underneath (inert,
 * clipped) so it's still there the instant something IS selected. Width is
 * locally resizable (`onWidthChange`) via the drawer's own left-edge handle,
 * translucent/blurred background — all Heimdall's `DetailDrawer` chrome, not
 * reimplemented here.
 *
 * Renders Heimdall `GraphInspector`. In the MODEL view it is fed by an element's
 * `GraphNodeMetadata` (title/kind/domain/description + a curated PROPERTIES grid)
 * and its inbound/outbound `RelationshipLink[]` (including cross-layer links). In
 * the SCHEMA view it is fed by a node-type's `specMetadataForNode` (eyebrow
 * `SPEC NODE`, PROPERTIES = the type's ATTRIBUTES with required flags) and
 * `specRelationshipsForNode` (predicate + cardinality, cross-layer included).
 *
 * `onNodeSelect` navigates: in Model it switches `uiStore.layerId` when the
 * target lives in another layer (keeping `view='model'`); in Schema it switches
 * the layer for cross-layer relationship targets (keeping `view='spec'`).
 *
 * When `uiStore.selectedEdgeId` is set (a Model graph edge click — ADR-6:
 * mutually exclusive with node selection, so `selectedId`/`metadata` are null
 * whenever this is set), the drawer instead renders `EdgeInspector`'s
 * source/edge/destination stack. `open` follows whichever of the two is set.
 *
 * Model view: the selected element's type is shown as its own
 * `graph-inspector__head-eyebrow` row (same classes Heimdall's
 * `GraphInspector` uses for its own head, so it reads as part of the same
 * panel) ABOVE the `GraphInspector`, wrapped in `NodeTypeBadge` so it
 * triggers the rich `NodeTypeTooltip` on hover/focus — `GraphInspector`
 * itself has no slot for customizing its own `kind` badge, so
 * `modelMetadata` omits `kind` to avoid rendering it twice.
 *
 * That same kind badge is a `<button>` (not a static span) — clicking it
 * calls `navigateToSpecNode`, jumping to the element's node type in the
 * Schema view. `EdgeInspector`'s
 * source/destination kind badges and predicate badge get the equivalent
 * treatment (see its own doc comment); both are handed `navigateToSpecNode`/
 * `navigateToElementWithEdge` directly as props rather than a wrapped
 * handler, since neither needs Inspector-level logic beyond what the store
 * action itself already does (unlike `onNodeSelect`/`handleSelect`, which
 * resolves a raw UUID to its layer first).
 */

import { useMemo, useState } from 'react';
import { GraphInspector, DetailDrawer } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { AnnotationsSection } from './AnnotationsSection';
import { EdgeInspector } from './EdgeInspector';
import { NodeTypeBadge } from './NodeTypeBadge';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { buildModelIndex, dottedId, edgeMetadata } from '../data/modelGraph';
import {
  relationshipsForElement,
  metadataForElement,
} from '../data/relationships';
import {
  specMetadataForNode,
  specRelationshipsForNode,
} from '../data/specGraph';

/** Layer slug owning a `spec_node_id` (`data-model.objectschema` -> `data-model`). */
function layerOfSpecNode(specNodeId: string): string {
  const lastDot = specNodeId.lastIndexOf('.');
  return lastDot > 0 ? specNodeId.slice(0, lastDot) : specNodeId;
}

/** Initial drawer width in px — matches the previous fixed sidebar's width;
 *  resizable from there via the drawer's own left-edge handle. */
const DEFAULT_INSPECTOR_WIDTH = 320;

export function Inspector() {
  const [width, setWidth] = useState(DEFAULT_INSPECTOR_WIDTH);
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const selectedEdgeId = useUiStore((s) => s.selectedEdgeId);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);
  const navigateToElementWithEdge = useUiStore((s) => s.navigateToElementWithEdge);

  const { derived: model } = useModel();
  const { raw: specRaw } = useSpec();
  const index = useMemo(() => buildModelIndex(model), [model]);
  const isSpec = view === 'spec';

  // ─── Selected edge (Model view only — edges only exist in the Model graph) ─
  const edge = useMemo(
    () =>
      !isSpec && selectedEdgeId
        ? edgeMetadata(model, selectedEdgeId, index, specRaw)
        : undefined,
    [isSpec, model, selectedEdgeId, index, specRaw],
  );

  // ─── Model element metadata + relationships ────────────────────────────────
  const modelNode =
    !isSpec && selectedId ? index.byUuid.get(selectedId) : undefined;
  const modelMetadata = useMemo(
    () =>
      modelNode
        ? // `kind` is rendered separately, above, as an interactive
          // `NodeTypeBadge` — omitted here so GraphInspector's own (plain,
          // non-interactive) badge doesn't duplicate it.
          { ...metadataForElement(modelNode, layerLabel(modelNode.layer_id)), kind: undefined }
        : null,
    [modelNode],
  );
  const modelRelationships = useMemo(
    () => (modelNode ? relationshipsForElement(model, modelNode.id, index) : []),
    [model, modelNode, index],
  );

  // ─── Spec node-type metadata + relationships ───────────────────────────────
  const specMetadata = useMemo(
    () =>
      isSpec && layerId && selectedId
        ? specMetadataForNode(specRaw, layerId, selectedId)
        : null,
    [isSpec, specRaw, layerId, selectedId],
  );
  const specRelationships = useMemo(
    () =>
      isSpec && layerId && selectedId
        ? specRelationshipsForNode(specRaw, layerId, selectedId)
        : [],
    [isSpec, specRaw, layerId, selectedId],
  );

  const metadata = isSpec ? specMetadata : modelMetadata;
  const relationships = isSpec ? specRelationships : modelRelationships;

  const handleSelect = (targetId: string) => {
    if (isSpec) {
      // targetId is a spec_node_id (`<slug>.<shortname>`); its prefix carries
      // the target layer, so cross-layer rels navigate across layers.
      navigateToSpecNode(targetId, layerOfSpecNode(targetId));
      return;
    }
    const target = index.byUuid.get(targetId);
    if (!target) return;
    navigateToElement(target.id, target.layer_id);
  };

  // Annotations apply only to real Model elements (not SPEC node-types). The
  // API keys them by the canonical dotted id, not the node UUID.
  const annotationElementId = modelNode ? dottedId(modelNode) : null;

  return (
    <DetailDrawer
      open={!!metadata || !!edge}
      width={width}
      onWidthChange={setWidth}
      data-testid="inspector"
    >
      {edge && selectedEdgeId ? (
        <EdgeInspector
          edgeId={selectedEdgeId}
          edge={edge}
          model={model}
          index={index}
          spec={specRaw}
          onNodeSelect={handleSelect}
          navigateToSpecNode={navigateToSpecNode}
          navigateToElementWithEdge={navigateToElementWithEdge}
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {!isSpec && modelNode && (
            <div className="graph-inspector__head-eyebrow" data-testid="inspector-kind-tooltip-row">
              <NodeTypeBadge
                spec={specRaw}
                layerId={modelNode.layer_id}
                typeId={modelNode.type}
                data-testid="inspector-kind-tooltip"
              >
                <button
                  type="button"
                  className="graph-inspector__badge"
                  style={{ border: 'none', cursor: 'pointer' }}
                  onClick={() =>
                    navigateToSpecNode(`${modelNode.layer_id}.${modelNode.type}`, modelNode.layer_id)
                  }
                >
                  {modelNode.type}
                </button>
              </NodeTypeBadge>
            </div>
          )}
          <GraphInspector
            node={metadata}
            relationships={relationships}
            onNodeSelect={handleSelect}
            emptyStateText={
              isSpec
                ? 'Select a node type to inspect.'
                : 'Select an element to inspect.'
            }
          />
          {annotationElementId && (
            <AnnotationsSection elementId={annotationElementId} />
          )}
        </div>
      )}
    </DetailDrawer>
  );
}

export default Inspector;
