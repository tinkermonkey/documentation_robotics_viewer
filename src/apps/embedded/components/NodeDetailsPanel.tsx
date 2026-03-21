/**
 * NodeDetailsPanel Component
 * Displays model-centric information about a selected node.
 * Used in Graph view right sidebar (conditionally rendered when node is selected).
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Badge } from 'flowbite-react';
import type { Node } from '@xyflow/react';
import type { MetaModel, ModelElement, Relationship, Reference } from '../../../core/types/model';
import type { UnifiedNodeData } from '@/core/nodes';
import { nodeConfigLoader } from '@/core/nodes';
import { useModelStore } from '@/core/stores/modelStore';
import SpecDefinitionCard from './common/SpecDefinitionCard';
import SourceReferenceList from './common/SourceReferenceList';
import RelationshipTable from './common/RelationshipTable';
import { NodeContextSubGraph } from './common/NodeContextSubGraph';
import { buildContextSubGraph } from '../services/contextSubGraphBuilder';

export interface NodeDetailsPanelProps {
  selectedNode: Node | null;
  model: MetaModel;
  onNodeSelect?: (elementId: string) => void;
}

function isUnifiedNodeData(data: unknown): data is UnifiedNodeData {
  return (
    typeof data === 'object' &&
    data !== null &&
    'nodeType' in data &&
    'elementId' in data &&
    'layerId' in data
  );
}

const VISUAL_KEYS = new Set(['fill', 'stroke', 'backgroundColor', 'borderColor', 'icon', 'shape']);

const PROPERTY_LABELS: Record<string, string> = {
  priority: 'Priority',
  status: 'Status',
  owner: 'Owner',
  version: 'Version',
  category: 'Category',
  tags: 'Tags',
  url: 'URL',
  method: 'Method',
  protocol: 'Protocol',
  port: 'Port',
  host: 'Host',
  path: 'Path',
  format: 'Format',
  required: 'Required',
  nullable: 'Nullable',
  deprecated: 'Deprecated',
  summary: 'Summary',
  operationId: 'Operation ID',
};

function toTitleCase(str: string): string {
  return str
    .replace(/([A-Z])/g, ' $1')
    .replace(/[-_]/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase())
    .trim();
}

function formatPropertyValue(value: unknown): string {
  if (Array.isArray(value)) return value.join(', ');
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value === null || value === undefined) return '—';
  return String(value);
}

const DIVIDER = 'border-t border-gray-200 dark:border-gray-700 pt-3 mt-3';

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ selectedNode, model, onNodeSelect }) => {
  // Get store data - must be called before any conditional returns (Rules of Hooks)
  const { specSchemas } = useModelStore();

  // Consolidated helper to resolve element by ID (caches to avoid repeated scans)
  // Must be called before any conditional returns (Rules of Hooks)
  const { resolveEl, resolveElementName } = useMemo(() => {
    const elementCache = new Map<string, ModelElement>();

    const resolveEl = (id: string): ModelElement | undefined => {
      if (elementCache.has(id)) {
        return elementCache.get(id);
      }
      for (const l of Object.values(model.layers)) {
        const el = l.elements?.find(e => e.id === id);
        if (el) {
          elementCache.set(id, el);
          return el;
        }
      }
      return undefined;
    };

    const resolveElementName = (elementId: string): string => {
      const el = resolveEl(elementId);
      return el?.name ?? elementId;
    };

    return { resolveEl, resolveElementName };
  }, [model.layers]);

  // Build context subgraph (1-hop neighborhood) - must be called before conditional returns (Rules of Hooks)
  const contextSubGraph = useMemo(() => {
    if (!selectedNode) {
      return null;
    }
    const nodeData = isUnifiedNodeData(selectedNode.data) ? selectedNode.data : null;
    const elementId = nodeData?.elementId;
    if (!elementId) {
      return null;
    }
    const el = resolveEl(elementId);
    if (!el) {
      return null;
    }
    try {
      return buildContextSubGraph(el.id, model);
    } catch (error) {
      console.warn('[NodeDetailsPanel] Failed to build context subgraph:', error);
      return null;
    }
  }, [selectedNode, model, resolveEl]);

  if (!selectedNode) {
    return (
      <div data-testid="node-details-panel-empty" className="p-4 text-center text-gray-500 text-sm border-b border-gray-200 dark:border-gray-700">
        <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Click on a node to view details</p>
      </div>
    );
  }

  const nodeData = isUnifiedNodeData(selectedNode.data) ? selectedNode.data : null;
  const elementId = nodeData?.elementId;
  const layerId = nodeData?.layerId;

  // Primary lookup by layerId + elementId
  let element: ModelElement | undefined;
  if (elementId && layerId) {
    element = model.layers[layerId]?.elements?.find(e => e.id === elementId);
  }
  // Fallback: search all layers
  if (!element && elementId) {
    for (const layer of Object.values(model.layers)) {
      element = layer.elements?.find(e => e.id === elementId);
      if (element) break;
    }
  }

  const styleConfig = nodeData?.nodeType
    ? nodeConfigLoader.getStyleConfig(nodeData.nodeType)
    : undefined;

  // Degraded state: node selected but no element in model
  if (!element) {
    const displayLabel = nodeData?.label ?? selectedNode.id;
    return (
      <div data-testid="node-details-panel-degraded" className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          {styleConfig?.icon ? (
            <span className="text-base" aria-hidden="true">{styleConfig.icon}</span>
          ) : null}
          <p data-testid="node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
            {displayLabel}
          </p>
        </div>
        {styleConfig?.typeLabel ? (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{styleConfig.typeLabel}</p>
        ) : null}
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No model element found</p>
        <div className={DIVIDER}>
          <p data-testid="node-details-element-id" className="font-mono text-xs text-gray-400 dark:text-gray-500 break-all">
            {elementId ?? selectedNode.id}
          </p>
        </div>
      </div>
    );
  }

  // Relationship derivation - scan ALL layers
  const resolvedLayerId = element.layerId;
  const layer = model.layers[resolvedLayerId];
  const incomingRels: Relationship[] = [];
  const outgoingRels: Relationship[] = [];

  for (const l of Object.values(model.layers)) {
    incomingRels.push(...(l.relationships ?? []).filter(r => r.targetId === element!.id));
    outgoingRels.push(...(l.relationships ?? []).filter(r => r.sourceId === element!.id));
  }

  // Cross-layer references
  const crossRefs: Reference[] = (model.references ?? []).filter(
    ref =>
      ref.source.elementId === element.id ||
      ref.target.elementId === element.id
  );

  // Spec schema access
  const specLayerId = element.specNodeId?.split('.')[0];
  const specType = element.specNodeId?.split('.')[1];
  const nodeSchema = specLayerId && specType && specSchemas[specLayerId]
    ? specSchemas[specLayerId].nodeSchemas?.[specType]
    : undefined;
  const relSchemas = specLayerId && specSchemas[specLayerId]
    ? specSchemas[specLayerId].relationshipSchemas?.filter(
        r => r.sourceSpecNodeId === element.specNodeId || r.destinationSpecNodeId === element.specNodeId
      )
    : undefined;

  // Attributes section - from element.attributes
  const attributesList: Array<[string, string]> = element.attributes
    ? Object.entries(element.attributes)
        .filter(([, v]) => v != null)
        .map(([k, v]): [string, string] => [k, formatPropertyValue(v)])
    : [];

  // Semantic properties (skip visual keys and private keys, and also skip attributes already shown)
  const attributeKeys = new Set(Object.keys(element.attributes ?? {}));
  const semanticProps = Object.entries(element.properties ?? {}).filter(
    ([k, v]) => !k.startsWith('_') && !VISUAL_KEYS.has(k) && !attributeKeys.has(k) && v != null
  );

  // Changeset badge
  const changesetOp = nodeData?.changesetOperation;

  const layerName = layer?.name ?? resolvedLayerId;
  const typeLabel = styleConfig?.typeLabel ?? element.type;

  // Handle context subgraph node click - invoke callback to parent
  const handleContextNodeClick = (elementId: string) => {
    if (onNodeSelect) {
      onNodeSelect(elementId);
    }
  };

  return (
    <div data-testid="node-details-panel" className="p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start gap-2 mb-1">
        {styleConfig?.icon ? (
          <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{styleConfig.icon}</span>
        ) : null}
        <p data-testid="node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
          {element.name}
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {typeLabel ?? 'Unknown'} · {layerName}
      </p>
      {changesetOp ? (
        <div className="mb-2">
          {changesetOp === 'add' && <Badge color="success" className="w-fit">ADD</Badge>}
          {changesetOp === 'update' && <Badge color="warning" className="w-fit">UPDATE</Badge>}
          {changesetOp === 'delete' && <Badge color="failure" className="w-fit">DELETE</Badge>}
        </div>
      ) : null}

      {/* Description */}
      {element.description ? (
        <div data-testid="node-details-description" className={DIVIDER}>
          <p className="text-sm text-gray-700 dark:text-gray-300">{element.description}</p>
        </div>
      ) : null}

      {/* Attributes */}
      {attributesList.length > 0 ? (
        <div data-testid="node-details-attributes" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Attributes</p>
          <table className="w-full text-xs">
            <tbody>
              {attributesList.map(([key, displayValue]) => (
                <tr key={key}>
                  <td className="pr-2 py-0.5 text-gray-500 dark:text-gray-400 align-top whitespace-nowrap">
                    {PROPERTY_LABELS[key] ?? toTitleCase(key)}
                  </td>
                  <td className="py-0.5 text-gray-800 dark:text-gray-200 break-words">
                    {displayValue}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Properties */}
      {semanticProps.length > 0 ? (
        <div data-testid="node-details-properties" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Properties</p>
          <table className="w-full text-xs">
            <tbody>
              {semanticProps.map(([key, value]) => (
                <tr key={key}>
                  <td className="pr-2 py-0.5 text-gray-500 dark:text-gray-400 align-top whitespace-nowrap">
                    {PROPERTY_LABELS[key] ?? toTitleCase(key)}
                  </td>
                  <td className="py-0.5 text-gray-800 dark:text-gray-200 break-words">
                    {formatPropertyValue(value)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {/* Spec Definition */}
      {nodeSchema && specLayerId && specType ? (
        <div data-testid="node-details-spec-definition" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Spec Definition</p>
          <SpecDefinitionCard
            specNodeId={element.specNodeId!}
            nodeSchema={nodeSchema}
            relationshipSchemas={relSchemas}
          />
        </div>
      ) : null}

      {/* Relationships */}
      {(incomingRels.length > 0 || outgoingRels.length > 0 || crossRefs.length > 0) ? (
        <div data-testid="node-details-relationships" className={DIVIDER}>
          <RelationshipTable
            outbound={[
              ...outgoingRels.map(rel => ({
                predicate: rel.predicate ?? rel.type,
                targetId: rel.targetId,
                targetName: resolveElementName(rel.targetId),
                targetLayerId: resolveEl(rel.targetId)?.layerId ?? 'unknown',
                isInterLayer: resolveEl(rel.targetId)?.layerId !== element.layerId,
              })),
              ...crossRefs
                .filter(ref => ref.source.elementId === element!.id)
                .map(ref => ({
                  predicate: ref.predicate ?? ref.type,
                  targetId: ref.target.elementId ?? '',
                  targetName: resolveElementName(ref.target.elementId ?? ''),
                  targetLayerId: ref.target.layerId ?? 'unknown',
                  isInterLayer: true,
                })),
            ]}
            inbound={[
              ...incomingRels.map(rel => ({
                predicate: rel.predicate ?? rel.type,
                sourceId: rel.sourceId,
                sourceName: resolveElementName(rel.sourceId),
                sourceLayerId: resolveEl(rel.sourceId)?.layerId ?? 'unknown',
                isInterLayer: resolveEl(rel.sourceId)?.layerId !== element.layerId,
              })),
              ...crossRefs
                .filter(ref => ref.target.elementId === element!.id)
                .map(ref => ({
                  predicate: ref.predicate ?? ref.type,
                  sourceId: ref.source.elementId ?? '',
                  sourceName: resolveElementName(ref.source.elementId ?? ''),
                  sourceLayerId: ref.source.layerId ?? 'unknown',
                  isInterLayer: true,
                })),
            ]}
          />
        </div>
      ) : null}

      {/* Context Sub-Graph */}
      {contextSubGraph && contextSubGraph.nodes.length > 0 ? (
        <div data-testid="node-details-context-subgraph" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Context</p>
          <NodeContextSubGraph
            focalElementId={element.id}
            nodes={contextSubGraph.nodes}
            edges={contextSubGraph.edges}
            onNodeClick={handleContextNodeClick}
          />
        </div>
      ) : null}

      {/* Source References */}
      {element.sourceReferences && element.sourceReferences.length > 0 ? (
        <div data-testid="node-details-source-references" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Source References</p>
          <SourceReferenceList references={element.sourceReferences} />
        </div>
      ) : null}

      {/* Element ID */}
      <div className={DIVIDER}>
        <p data-testid="node-details-element-id" className="font-mono text-xs text-gray-400 dark:text-gray-500 break-all">
          {element.elementId ?? element.id}
        </p>
      </div>
    </div>
  );
};

export default NodeDetailsPanel;
