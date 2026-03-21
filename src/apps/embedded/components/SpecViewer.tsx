/**
 * SpecViewer Component
 * Displays Spec Schema files in a readable format
 * Includes spec context sub-graphs for spec node relationships
 * Shows spec relationships as edges in a graph view
 */

import React, { useMemo } from 'react'
import { ReactFlow, ReactFlowProvider, Background, Controls, MiniMap } from '@xyflow/react'
import type { Node, Edge } from '@xyflow/react'
import { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader'
import { Badge, Table, TableBody, TableCell, TableRow } from 'flowbite-react'

// Import React Flow styles - skip in test/Node.js environment where CSS cannot be parsed
if (typeof document !== 'undefined') {
  import('@xyflow/react/dist/style.css').catch(() => {
    // Silently fail if CSS cannot be loaded
  });
}
import ExpandableSection from './common/ExpandableSection'
import MetadataGrid, { MetadataItem } from './common/MetadataGrid'
import { useModelStore } from '../../../core/stores/modelStore'
import { SpecContextSubGraph } from './common/SpecContextSubGraph'
import { buildSpecContextSubGraph, buildSpecLayerGraph } from '../services/specContextSubGraphBuilder'

interface SpecViewerProps {
  specData: SpecDataResponse
  selectedSchemaId: string | null
}

const SpecViewer: React.FC<SpecViewerProps> = ({ specData, selectedSchemaId }) => {
  const { specSchemas } = useModelStore();
  const [selectedSpecNodeId, setSelectedSpecNodeId] = React.useState<string | null>(null);
  const [activeTab, setActiveTab] = React.useState<'details' | 'graph'>('details');

  const schemas = specData?.schemas || {};

  // Compute graph data at top level (not in renderMergedView to comply with Rules of Hooks)
  const graphData = useMemo(() => {
    if (!selectedSchemaId || !schemas[selectedSchemaId]) {
      return { nodes: [], edges: [] };
    }

    const schema = schemas[selectedSchemaId];
    const layer = schema.layer as { id?: string; name?: string; description?: string } | undefined;
    const nodeSchemas = schema.nodeSchemas as Record<string, any> | undefined;

    // Get layer ID from schema.layer.id or find it from specSchemas by name
    const layerId = layer?.id || Object.keys(specSchemas).find(schemaKey => {
      const schemaData = specSchemas[schemaKey];
      return schemaData?.layer?.name?.toLowerCase() === layer?.name?.toLowerCase();
    });

    try {
      if (!layerId) return { nodes: [], edges: [] };
      if (!nodeSchemas) return { nodes: [], edges: [] };
      return buildSpecLayerGraph(
        layerId,
        nodeSchemas,
        specSchemas[layerId]?.relationshipSchemas ?? []
      );
    } catch (error) {
      console.warn('[SpecViewer] Failed to build spec layer graph:', error);
      return { nodes: [], edges: [] };
    }
  }, [selectedSchemaId, schemas, specSchemas]);

  if (!specData) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No spec data loaded</p>
      </div>
    )
  }

  if (!specData.schemas) {
    return (
      <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
        <p>No schemas found in spec data</p>
      </div>
    )
  }

  // Render spec context sub-graph for a selected spec node
  const renderSpecContextSubGraph = (specNodeId: string, relationshipSchemas: any[]) => {
    try {
      const subGraph = buildSpecContextSubGraph(specNodeId, relationshipSchemas);
      return (
        <div data-testid={`spec-context-subgraph-${specNodeId}`} className="mb-4">
          <SpecContextSubGraph
            focalSpecNodeId={specNodeId}
            nodes={subGraph.nodes}
            edges={subGraph.edges}
            onNodeClick={(nodeId) => setSelectedSpecNodeId(nodeId)}
          />
        </div>
      );
    } catch (error) {
      console.warn('[SpecViewer] Failed to build spec context subgraph:', error);
      return null;
    }
  };

  // Render relationship schemas for a given layer
  const renderRelationshipSchemas = (layerId: string) => {
    const specSchemaData = specSchemas[layerId];
    const relationshipSchemas = specSchemaData?.relationshipSchemas ?? [];

    if (relationshipSchemas.length === 0) {
      return null;
    }

    // Group relationships by sourceSpecNodeId
    const relsBySourceType = relationshipSchemas.reduce(
      (acc: Record<string, typeof relationshipSchemas>, rel) => {
        const sourceKey = rel.sourceSpecNodeId;
        if (!acc[sourceKey]) {
          acc[sourceKey] = [];
        }
        acc[sourceKey].push(rel);
        return acc;
      },
      {}
    );

    return (
      <section className="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8" data-testid="relationship-schemas-section">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
          Valid Relationships
        </h3>

        <div className="space-y-4">
          {Object.entries(relsBySourceType).map(([sourceNodeId, rels]) => {
            // Extract just the node type name from the full ID (e.g., "motivation.Goal" -> "Goal")
            const nodeTypeName = sourceNodeId.includes('.')
              ? sourceNodeId.split('.').pop()
              : sourceNodeId;

            return (
              <div
                key={sourceNodeId}
                className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden"
                data-testid={`relationship-schemas-${sourceNodeId}`}
              >
                <div className="px-4 py-3 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                  <h4 className="text-sm font-semibold text-gray-900 dark:text-white">
                    {nodeTypeName}
                  </h4>
                </div>

                <Table className="text-sm">
                  <TableBody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {rels.map((rel) => {
                      // Extract destination node type name
                      const destNodeTypeName = rel.destinationSpecNodeId.includes('.')
                        ? rel.destinationSpecNodeId.split('.').pop()
                        : rel.destinationSpecNodeId;

                      return (
                        <TableRow
                          key={rel.id}
                          className="bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700/50"
                          data-testid={`relationship-row-${rel.id}`}
                        >
                          <TableCell className="px-4 py-3 text-gray-900 dark:text-white font-medium">
                            {rel.predicate}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-gray-600 dark:text-gray-400">
                            {destNodeTypeName}
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            <Badge color="gray" size="sm">
                              {rel.cardinality}
                            </Badge>
                          </TableCell>
                          <TableCell className="px-4 py-3">
                            {rel.strength && (
                              <Badge color="info" size="sm">
                                {rel.strength}
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="px-4 py-3 text-center">
                            {rel.required && (
                              <Badge color="failure" size="sm">
                                Required
                              </Badge>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            );
          })}
        </div>
      </section>
    );
  };

  // Render schema definitions view
  const renderMergedView = () => {
    if (!selectedSchemaId) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Select a schema to view details</p>
        </div>
      )
    }

    const schema = schemas[selectedSchemaId]
    if (!schema) {
      return (
        <div className="w-full h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
          <p>Schema not found</p>
        </div>
      )
    }

    // Support both DR CLI format (nodeSchemas + layer) and standard Spec Schema (definitions)
    const layer = schema.layer as { id?: string; name?: string; description?: string } | undefined
    const nodeSchemas = schema.nodeSchemas as Record<string, SchemaDefinition> | undefined
    const definitions = nodeSchemas || (schema.definitions as Record<string, SchemaDefinition> | undefined) || {}
    const defNames = Object.keys(definitions)

    const displayTitle = layer?.name || (typeof schema.title === 'string' ? schema.title : null) || selectedSchemaId
    const displayDescription = layer?.description || (typeof schema.description === 'string' ? schema.description : '')

    // Get layer ID from schema.layer.id or find it from specSchemas by name
    const layerId = layer?.id || Object.keys(specSchemas).find(schemaKey => {
      const schemaData = specSchemas[schemaKey];
      return schemaData?.layer?.name?.toLowerCase() === layer?.name?.toLowerCase();
    });

    const schemaMetadata: MetadataItem[] = [
      { label: 'Element Types', value: defNames.length }
    ]

    return (
      <div className="h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden">
        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900" role="tablist">
          <button
            onClick={() => setActiveTab('details')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'details'
                ? 'text-gray-900 dark:text-white border-blue-500'
                : 'text-gray-700 dark:text-gray-300 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            role="tab"
            aria-selected={activeTab === 'details'}
            aria-controls="spec-viewer-details-view"
            data-testid="spec-viewer-details-tab"
          >
            Details
          </button>
          <button
            onClick={() => setActiveTab('graph')}
            className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'graph'
                ? 'text-gray-900 dark:text-white border-blue-500'
                : 'text-gray-700 dark:text-gray-300 border-transparent hover:text-gray-900 dark:hover:text-white hover:border-gray-300 dark:hover:border-gray-600'
            }`}
            role="tab"
            aria-selected={activeTab === 'graph'}
            aria-controls="spec-viewer-graph-view"
            data-testid="spec-viewer-graph-tab"
          >
            Graph
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-hidden">
          {/* Details View */}
          <div
            id="spec-viewer-details-view"
            className={`h-full overflow-y-auto p-6 ${activeTab === 'details' ? '' : 'hidden'}`}
            role="tabpanel"
            aria-labelledby="spec-viewer-details-tab"
            data-testid="spec-viewer-details-view"
          >
            {/* Schema Header */}
            <section className="mb-8" data-testid="schema-definitions-section">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {displayTitle}
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-4">{displayDescription}</p>
          <MetadataGrid items={schemaMetadata} columns={3} />

          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Element Definitions
            </h3>
            <div className="space-y-2">
              {defNames.map(defName => {
                const definition = definitions[defName]
                // For DR CLI nodeSchemas, the user-visible attributes are under properties.attributes.properties
                const attrProperties = (definition.properties?.attributes as SchemaDefinition | undefined)?.properties
                const visibleProperties = attrProperties || definition.properties
                const requiredAttrs = (definition.properties?.attributes as SchemaDefinition | undefined)?.required as string[] | undefined
                  || definition.required

                const specNodeId = layerId ? `${layerId}.${defName}` : null;
                const isSelected = selectedSpecNodeId === specNodeId;

                return (
                  <ExpandableSection
                    key={defName}
                    title={typeof definition.title === 'string' ? definition.title : defName}
                    badge={typeof definition.type === 'string' ? definition.type : 'object'}
                    isExpanded={isSelected}
                    onToggle={() => specNodeId && setSelectedSpecNodeId(isSelected ? null : specNodeId)}
                  >
                    {typeof definition.description === 'string' && definition.description && (
                      <p className="text-gray-700 dark:text-gray-300 mb-4">
                        {definition.description}
                      </p>
                    )}

                    {visibleProperties && Object.keys(visibleProperties).length > 0 && (
                      <div>
                        <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                          Properties:
                        </h5>
                        <ul className="space-y-2 ml-4">
                          {Object.entries(visibleProperties).map(([propName, propSchema]) => {
                            const prop = propSchema as SchemaDefinition
                            return (
                              <li key={propName} className="text-sm">
                                <div className="flex items-start gap-2">
                                  <code className="bg-gray-200 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-900 dark:text-white">
                                    {propName}
                                  </code>
                                  <span className="text-gray-600 dark:text-gray-400">
                                    {typeof prop.type === 'string' ? prop.type : Array.isArray(prop.type) ? prop.type.join(', ') : 'object'}
                                    {typeof prop.format === 'string' && prop.format && ` (${prop.format})`}
                                  </span>
                                  {requiredAttrs?.includes(propName) && (
                                    <Badge color="failure" size="xs">required</Badge>
                                  )}
                                  {typeof prop.description === 'string' && prop.description && (
                                    <p className="text-gray-600 dark:text-gray-400 ml-2">
                                      {prop.description}
                                    </p>
                                  )}
                                </div>
                              </li>
                            )
                          })}
                        </ul>
                      </div>
                    )}

                    {/* Spec Context Sub-Graph when this node is selected */}
                    {isSelected && specNodeId && layerId && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                          Related Node Types
                        </p>
                        {renderSpecContextSubGraph(specNodeId, specSchemas[layerId]?.relationshipSchemas ?? [])}
                      </div>
                    )}
                  </ExpandableSection>
                )
              })}
            </div>
          </div>

              {/* Relationship Schemas Section */}
              {layerId && renderRelationshipSchemas(layerId)}
            </section>
          </div>

          {/* Graph View */}
          <div
            id="spec-viewer-graph-view"
            className={`h-full w-full overflow-hidden ${activeTab === 'graph' ? '' : 'hidden'}`}
            role="tabpanel"
            aria-labelledby="spec-viewer-graph-tab"
            data-testid="spec-viewer-graph-view"
          >
            {graphData.nodes.length > 0 ? (
              <ReactFlowProvider>
                <ReactFlow
                  nodes={graphData.nodes}
                  edges={graphData.edges}
                  nodesDraggable={false}
                  nodesConnectable={false}
                  elementsSelectable={true}
                  onNodeClick={(_, node) => {
                    const specNodeId = (node.data as Record<string, unknown>).specNodeId as string | undefined;
                    if (specNodeId) {
                      setSelectedSpecNodeId(specNodeId);
                      // Switch to details view
                      setActiveTab('details');
                    }
                  }}
                  fitView
                  fitViewOptions={{ padding: 0.2, minZoom: 0.3, maxZoom: 1.5 }}
                  minZoom={0.3}
                  maxZoom={3}
                >
                  <Background />
                  <Controls showInteractive={true} />
                  <MiniMap />
                </ReactFlow>
              </ReactFlowProvider>
            ) : (
              <div className="h-full flex items-center justify-center text-gray-500 dark:text-gray-400">
                <p>No relationship data to display</p>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="w-full h-full flex flex-col bg-white dark:bg-gray-900 overflow-hidden" data-testid="spec-viewer">
      {renderMergedView()}
    </div>
  )
}

export default SpecViewer
