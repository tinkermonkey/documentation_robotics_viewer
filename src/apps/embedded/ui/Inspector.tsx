/**
 * Inspector — the right pane for a selected Model element or Schema node-type.
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
 * the layer for cross-layer relationship targets (keeping `view='spec'`). When
 * nothing is selected, `GraphInspector`'s own empty state shows.
 */

import { useMemo } from 'react';
import { GraphInspector } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { AnnotationsSection } from './AnnotationsSection';
import { useModel } from '../data/useModel';
import { useSpec } from '../data/useSpec';
import { buildModelIndex, dottedId } from '../data/modelGraph';
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

export function Inspector() {
  const view = useUiStore((s) => s.view);
  const layerId = useUiStore((s) => s.layerId);
  const selectedId = useUiStore((s) => s.selectedId);
  const navigateToElement = useUiStore((s) => s.navigateToElement);
  const navigateToSpecNode = useUiStore((s) => s.navigateToSpecNode);

  const { derived: model } = useModel();
  const { raw: specRaw } = useSpec();
  const index = useMemo(() => buildModelIndex(model), [model]);
  const isSpec = view === 'spec';

  // ─── Model element metadata + relationships ────────────────────────────────
  const modelNode =
    !isSpec && selectedId ? index.byUuid.get(selectedId) : undefined;
  const modelMetadata = useMemo(
    () =>
      modelNode
        ? metadataForElement(modelNode, layerLabel(modelNode.layer_id))
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
    <div
      style={{
        width: 320,
        flex: 'none',
        borderLeft: '1px solid rgb(var(--canvas-border))',
        background: 'rgb(var(--canvas-surface))',
        display: 'flex',
        flexDirection: 'column',
        minHeight: 0,
      }}
      data-testid="inspector"
    >
      <div
        className="drv-scroll"
        style={{
          flex: 1,
          minHeight: 0,
          overflowY: 'auto',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <GraphInspector
          node={metadata}
          relationships={relationships}
          onNodeSelect={handleSelect}
          emptyStateText={
            isSpec
              ? 'Select a node type to inspect.'
              : 'Select an element to inspect.'
          }
          style={{ flex: 'none', border: 'none', borderRadius: 0 }}
        />
        {annotationElementId && (
          <AnnotationsSection elementId={annotationElementId} />
        )}
      </div>
    </div>
  );
}

export default Inspector;
