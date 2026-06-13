/**
 * Inspector — the right pane for a selected Model element.
 *
 * Renders Heimdall `GraphInspector` fed by the element's `GraphNodeMetadata`
 * (title/kind/domain/description + a curated PROPERTIES key-value grid built
 * from type, layer, provenance and scalar attributes) and the element's
 * inbound/outbound `RelationshipLink[]` (including cross-layer links).
 *
 * `onNodeSelect` navigates: it always updates the selection, and when the
 * target lives in another layer it switches `uiStore.layerId` (keeping
 * `view='model'`) so cross-layer relationship navigation works. When nothing is
 * selected, `GraphInspector`'s own empty state shows.
 */

import { useMemo } from 'react';
import { GraphInspector } from '@tinkermonkey/heimdall-ui';
import { useUiStore } from './uiStore';
import { layerLabel } from './domain';
import { useModel } from '../data/useModel';
import { buildModelIndex } from '../data/modelGraph';
import {
  relationshipsForElement,
  metadataForElement,
} from '../data/relationships';

export function Inspector() {
  const selectedId = useUiStore((s) => s.selectedId);
  const navigateToElement = useUiStore((s) => s.navigateToElement);

  const { derived: model } = useModel();
  const index = useMemo(() => buildModelIndex(model), [model]);

  const node = selectedId ? index.byUuid.get(selectedId) : undefined;

  const metadata = useMemo(
    () => (node ? metadataForElement(node, layerLabel(node.layer_id)) : null),
    [node],
  );
  const relationships = useMemo(
    () =>
      node ? relationshipsForElement(model, node.id, index) : [],
    [model, node, index],
  );

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
      <GraphInspector
        node={metadata}
        relationships={relationships}
        onNodeSelect={(targetId) => {
          const target = index.byUuid.get(targetId);
          if (!target) return;
          navigateToElement(target.id, target.layer_id);
        }}
        emptyStateText="Select an element to inspect."
        style={{ flex: 1, minHeight: 0, border: 'none', borderRadius: 0 }}
      />
    </div>
  );
}

export default Inspector;
