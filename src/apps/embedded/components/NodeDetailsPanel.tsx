/**
 * NodeDetailsPanel Component
 * Displays model-centric information about a selected node.
 * Used in Graph view right sidebar (conditionally rendered when node is selected).
 */

import React from 'react';
import { Info } from 'lucide-react';
import { Badge } from 'flowbite-react';
import type { Node } from '@xyflow/react';
import type { MetaModel, ModelElement, Relationship, Reference } from '../../../core/types/model';
import type { UnifiedNodeData } from '@/core/nodes';
import { nodeConfigLoader } from '@/core/nodes';

export interface NodeDetailsPanelProps {
  selectedNode: Node | null;
  model: MetaModel;
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

const NodeDetailsPanel: React.FC<NodeDetailsPanelProps> = ({ selectedNode, model }) => {
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
          {styleConfig?.icon && (
            <span className="text-base" aria-hidden="true">{styleConfig.icon}</span>
          )}
          <p data-testid="node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
            {displayLabel}
          </p>
        </div>
        {styleConfig?.typeLabel && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{styleConfig.typeLabel}</p>
        )}
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No model element found</p>
        <div className={DIVIDER}>
          <p data-testid="node-details-element-id" className="font-mono text-xs text-gray-400 dark:text-gray-500 break-all">
            {elementId ?? selectedNode.id}
          </p>
        </div>
      </div>
    );
  }

  // Relationship derivation
  const resolvedLayerId = element.layerId;
  const layer = model.layers[resolvedLayerId];
  const allRels: Relationship[] = layer?.relationships ?? [];
  const incomingRels = allRels.filter(r => r.targetId === element!.id);
  const outgoingRels = allRels.filter(r => r.sourceId === element!.id);

  const resolveEl = (id: string): ModelElement | undefined =>
    layer?.elements?.find(e => e.id === id);

  // Semantic properties (skip visual keys and private keys)
  const semanticProps = Object.entries(element.properties ?? {}).filter(
    ([k, v]) => !k.startsWith('_') && !VISUAL_KEYS.has(k) && v != null
  );

  // Cross-layer references
  const crossRefs: Reference[] = element.elementId
    ? (model.references ?? []).filter(
        ref =>
          ref.source.elementId === element!.elementId ||
          ref.target.elementId === element!.elementId
      )
    : [];

  // Changeset badge
  const changesetOp = element.changesetOperation ?? nodeData?.changesetOperation;

  const layerName = layer?.name ?? resolvedLayerId;
  const typeLabel = styleConfig?.typeLabel ?? element.type;

  return (
    <div data-testid="node-details-panel" className="p-4 border-b border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="flex items-start gap-2 mb-1">
        {styleConfig?.icon && (
          <span className="text-base flex-shrink-0 mt-0.5" aria-hidden="true">{styleConfig.icon}</span>
        )}
        <p data-testid="node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
          {element.name}
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {typeLabel} · {layerName}
      </p>
      {changesetOp && (
        <div className="mb-2">
          {changesetOp === 'add' && <Badge color="success" className="w-fit">ADD</Badge>}
          {changesetOp === 'update' && <Badge color="warning" className="w-fit">UPDATE</Badge>}
          {changesetOp === 'delete' && <Badge color="failure" className="w-fit">DELETE</Badge>}
        </div>
      )}

      {/* Description */}
      {element.description && (
        <div data-testid="node-details-description" className={DIVIDER}>
          <p className="text-sm text-gray-700 dark:text-gray-300">{element.description}</p>
        </div>
      )}

      {/* Properties */}
      {semanticProps.length > 0 && (
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
      )}

      {/* Incoming Relationships */}
      {incomingRels.length > 0 && (
        <div data-testid="node-details-incoming-rels" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Incoming Relationships ({incomingRels.length})
          </p>
          <ul className="space-y-0.5">
            {incomingRels.map(rel => {
              const connected = resolveEl(rel.sourceId);
              return (
                <li key={rel.id} className="text-xs text-gray-700 dark:text-gray-300">
                  ← {connected?.name ?? rel.sourceId}
                  {connected?.type && <span className="text-gray-400"> [{connected.type}]</span>}
                  {' '}<span className="text-gray-400">— {rel.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Outgoing Relationships */}
      {outgoingRels.length > 0 && (
        <div data-testid="node-details-outgoing-rels" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Outgoing Relationships ({outgoingRels.length})
          </p>
          <ul className="space-y-0.5">
            {outgoingRels.map(rel => {
              const connected = resolveEl(rel.targetId);
              return (
                <li key={rel.id} className="text-xs text-gray-700 dark:text-gray-300">
                  → {connected?.name ?? rel.targetId}
                  {connected?.type && <span className="text-gray-400"> [{connected.type}]</span>}
                  {' '}<span className="text-gray-400">— {rel.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      {/* Cross-Layer References */}
      {crossRefs.length > 0 && (
        <div data-testid="node-details-cross-refs" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
            Cross-Layer References ({crossRefs.length})
          </p>
          <ul className="space-y-0.5">
            {crossRefs.map(ref => {
              const isSource = ref.source.elementId === element!.elementId;
              const other = isSource ? ref.target : ref.source;
              return (
                <li key={ref.id} className="text-xs text-gray-700 dark:text-gray-300">
                  {isSource ? '→' : '←'}{' '}
                  <span className="font-mono">{other.elementId ?? other.layerId ?? '?'}</span>
                  {' '}<span className="text-gray-400">— {ref.type}</span>
                </li>
              );
            })}
          </ul>
        </div>
      )}

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
