/**
 * SpecNodeDetailsPanel Component
 * Displays spec-centric information about a selected spec node.
 * Shows properties, relationships, and a context sub-graph visualization.
 * Used in Spec route right sidebar (conditionally rendered when spec node is selected).
 */

import React, { useMemo } from 'react';
import { Info } from 'lucide-react';
import { Badge } from 'flowbite-react';
import type { SpecNodeRelationship } from '../../../core/types/model';
import { SpecContextSubGraph } from './common/SpecContextSubGraph';
import { buildSpecContextSubGraph } from '../services/specContextSubGraphBuilder';

/**
 * JSON Schema object representing a spec node type
 * Contains title, description, properties, and required fields
 */
export interface NodeSchema extends Record<string, unknown> {
  title?: string;
  description?: string;
  type?: string | string[];
  properties?: Record<string, unknown>;
  required?: string[];
  format?: string;
}

export interface SpecNodeDetailsPanelProps {
  selectedSpecNodeId: string | null;
  nodeSchema: NodeSchema | null | undefined;
  relationshipSchemas: SpecNodeRelationship[];
  onNodeClick?: (specNodeId: string) => void;
}

const DIVIDER = 'border-t border-gray-200 dark:border-gray-700 pt-3 mt-3';

/**
 * Extract spec node ID into layer and node type
 */
function parseSpecNodeId(specNodeId: string): { layer: string; nodeType: string } | null {
  const parts = specNodeId.split('.');
  if (parts.length === 2) {
    return { layer: parts[0], nodeType: parts[1] };
  }
  return null;
}

const SpecNodeDetailsPanel: React.FC<SpecNodeDetailsPanelProps> = ({
  selectedSpecNodeId,
  nodeSchema,
  relationshipSchemas,
  onNodeClick,
}) => {
  // Build context subgraph (1-hop neighborhood)
  const contextSubGraph = useMemo(() => {
    if (!selectedSpecNodeId || !relationshipSchemas) {
      return null;
    }
    try {
      return buildSpecContextSubGraph(selectedSpecNodeId, relationshipSchemas);
    } catch (error) {
      console.warn('[SpecNodeDetailsPanel] Failed to build context subgraph:', error);
      return null;
    }
  }, [selectedSpecNodeId, relationshipSchemas]);

  if (!selectedSpecNodeId) {
    return (
      <div data-testid="spec-node-details-panel-empty" className="p-4 text-center text-gray-500 text-sm border-b border-gray-200 dark:border-gray-700">
        <Info className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p>Click on a spec node to view details</p>
      </div>
    );
  }

  if (!nodeSchema) {
    const parsed = parseSpecNodeId(selectedSpecNodeId);
    return (
      <div data-testid="spec-node-details-panel-degraded" className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-2 mb-1">
          <p data-testid="spec-node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
            {parsed?.nodeType ?? selectedSpecNodeId}
          </p>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{parsed?.layer ?? 'Unknown'}</p>
        <p className="text-xs text-gray-400 dark:text-gray-500 italic">No schema found</p>
        <div className={DIVIDER}>
          <p data-testid="spec-node-details-id" className="font-mono text-xs text-gray-400 dark:text-gray-500 break-all">
            {selectedSpecNodeId}
          </p>
        </div>
      </div>
    );
  }

  const parsed = parseSpecNodeId(selectedSpecNodeId);
  const title = typeof nodeSchema.title === 'string' ? nodeSchema.title : parsed?.nodeType ?? selectedSpecNodeId;
  const description = typeof nodeSchema.description === 'string' ? nodeSchema.description : '';

  // Extract properties (handle both nested and flat structures)
  const attributes = nodeSchema.properties?.attributes as (NodeSchema | undefined);
  const attrProperties = attributes?.properties;
  const visibleProperties = attrProperties || nodeSchema.properties;
  const requiredAttrs = (attributes?.required as string[] | undefined)
    || (nodeSchema.required as string[] | undefined);

  const propertyList: Array<[string, unknown]> = visibleProperties
    ? Object.entries(visibleProperties)
    : [];

  // Find relationships involving this spec node
  const incomingRels = relationshipSchemas.filter(
    r => r.destinationSpecNodeId === selectedSpecNodeId
  );
  const outgoingRels = relationshipSchemas.filter(
    r => r.sourceSpecNodeId === selectedSpecNodeId
  );

  return (
    <div data-testid="spec-node-details-panel" className="p-4 border-b border-gray-200 dark:border-gray-700 max-h-full overflow-y-auto">
      {/* Header */}
      <div className="flex items-start gap-2 mb-1">
        <p data-testid="spec-node-details-name" className="text-sm font-semibold text-gray-900 dark:text-white break-words">
          {title}
        </p>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
        {parsed?.layer ?? 'Unknown'} · Spec Node
      </p>

      {/* Description */}
      {description ? (
        <div data-testid="spec-node-details-description" className={DIVIDER}>
          <p className="text-sm text-gray-700 dark:text-gray-300">{description}</p>
        </div>
      ) : null}

      {/* Properties */}
      {propertyList.length > 0 ? (
        <div data-testid="spec-node-details-properties" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Properties</p>
          <div className="space-y-2">
            {propertyList.map(([propName, propSchema]) => {
              const schema = propSchema as NodeSchema | undefined;
              return (
                <div key={propName} className="text-sm">
                  <div className="flex items-start gap-2 mb-1">
                    <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-xs text-gray-900 dark:text-white whitespace-nowrap">
                      {propName}
                    </code>
                    {requiredAttrs?.includes(propName) && (
                      <Badge color="failure" size="xs">required</Badge>
                    )}
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400 ml-0">
                    {typeof schema?.type === 'string'
                      ? schema.type
                      : Array.isArray(schema?.type)
                      ? schema.type.join(', ')
                      : 'object'}
                    {typeof schema?.format === 'string' && schema.format && ` (${schema.format})`}
                  </p>
                  {typeof schema?.description === 'string' && schema.description && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      {schema.description}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ) : null}

      {/* Relationships */}
      {(outgoingRels.length > 0 || incomingRels.length > 0) ? (
        <div data-testid="spec-node-details-relationships" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Relationships</p>
          <div className="space-y-3">
            {outgoingRels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Outgoing</p>
                <div className="space-y-1">
                  {outgoingRels.map((rel) => {
                    const destParsed = parseSpecNodeId(rel.destinationSpecNodeId);
                    return (
                      <div key={rel.id} className="text-xs">
                        <div className="flex items-center gap-1">
                          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-900 dark:text-white font-medium">
                            {rel.predicate}
                          </code>
                          <span className="text-gray-600 dark:text-gray-400">→</span>
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {destParsed?.nodeType ?? rel.destinationSpecNodeId}
                          </span>
                        </div>
                        {rel.cardinality && (
                          <Badge color="gray" size="xs" className="mt-0.5">
                            {rel.cardinality}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {incomingRels.length > 0 && (
              <div>
                <p className="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Incoming</p>
                <div className="space-y-1">
                  {incomingRels.map((rel) => {
                    const srcParsed = parseSpecNodeId(rel.sourceSpecNodeId);
                    return (
                      <div key={rel.id} className="text-xs">
                        <div className="flex items-center gap-1">
                          <span className="text-gray-700 dark:text-gray-300 font-medium">
                            {srcParsed?.nodeType ?? rel.sourceSpecNodeId}
                          </span>
                          <span className="text-gray-600 dark:text-gray-400">→</span>
                          <code className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-900 dark:text-white font-medium">
                            {rel.predicate}
                          </code>
                        </div>
                        {rel.cardinality && (
                          <Badge color="gray" size="xs" className="mt-0.5">
                            {rel.cardinality}
                          </Badge>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* Context Sub-Graph */}
      {contextSubGraph && contextSubGraph.nodes.length > 0 ? (
        <div data-testid="spec-node-details-context-subgraph" className={DIVIDER}>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Related Types</p>
          <SpecContextSubGraph
            focalSpecNodeId={selectedSpecNodeId}
            nodes={contextSubGraph.nodes}
            edges={contextSubGraph.edges}
            onNodeClick={onNodeClick}
          />
        </div>
      ) : null}

      {/* Spec Node ID */}
      <div className={DIVIDER}>
        <p data-testid="spec-node-details-id" className="font-mono text-xs text-gray-400 dark:text-gray-500 break-all">
          {selectedSpecNodeId}
        </p>
      </div>
    </div>
  );
};

export default SpecNodeDetailsPanel;
