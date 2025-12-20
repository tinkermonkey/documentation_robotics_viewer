/**
 * ModelJSONViewer Component
 * Displays model instance data in a readable JSON format
 * Shows cross-layer links for each element
 */

import React, { useState, useMemo, useEffect } from 'react';
import { MetaModel } from '../../../core/types';
import { LinkType } from '../services/embeddedDataLoader';
import { Badge } from 'flowbite-react';
import ExpandableSection from './common/ExpandableSection';
import AttributesTable, { AttributeRow } from './common/AttributesTable';
import MetadataGrid, { MetadataItem } from './common/MetadataGrid';
import { useAnnotationStore } from '../stores/annotationStore';

interface ModelJSONViewerProps {
  model: MetaModel;
  linkRegistry?: {
    linkTypes: LinkType[];
    categories: Record<string, any>;
  };
  specData?: {
    schemas: Record<string, any>;
  };
  onPathHighlight?: (path: string | null) => void;
  selectedLayer: string | null;
}

const ModelJSONViewer: React.FC<ModelJSONViewerProps> = ({
  model,
  linkRegistry,
  specData,
  onPathHighlight,
  selectedLayer
}) => {
  const [expandedTypes, setExpandedTypes] = useState<Set<string>>(new Set());
  const { highlightedElementId } = useAnnotationStore();

  // Watch for highlighted elements and compute their JSON path
  useEffect(() => {
    if (!highlightedElementId || !onPathHighlight) return;

    // Find the element in the model
    let foundPath: string | null = null;

    for (const [layerName, layer] of Object.entries(model.layers)) {
      const elements = layer.elements || [];
      const elementIndex = elements.findIndex((el: any) => el.id === highlightedElementId);

      if (elementIndex !== -1) {
        const element = elements[elementIndex];
        foundPath = `layers.${layerName}.elements[${elementIndex}] (${element.name || element.id})`;
        break;
      }
    }

    if (foundPath) {
      onPathHighlight(foundPath);
    }
  }, [highlightedElementId, model, onPathHighlight]);

  // Helper function to normalize layer names
  const normalizeLayerName = (layerRef: string): string => {
    return layerRef
      .replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Build index of links by layer
  const linksByLayer = useMemo(() => {
    if (!linkRegistry) return new Map<string, { outgoing: LinkType[]; incoming: LinkType[] }>();

    const index = new Map<string, { outgoing: LinkType[]; incoming: LinkType[] }>();

    for (const linkType of linkRegistry.linkTypes) {
      // Add to source layers (outgoing)
      for (const sourceLayer of linkType.sourceLayers) {
        const layerName = normalizeLayerName(sourceLayer);
        if (!index.has(layerName)) {
          index.set(layerName, { outgoing: [], incoming: [] });
        }
        index.get(layerName)!.outgoing.push(linkType);
      }

      // Add to target layer (incoming)
      const targetLayerName = normalizeLayerName(linkType.targetLayer);
      if (!index.has(targetLayerName)) {
        index.set(targetLayerName, { outgoing: [], incoming: [] });
      }
      index.get(targetLayerName)!.incoming.push(linkType);
    }

    return index;
  }, [linkRegistry]);

  if (!model) {
    return (
      <div className="w-full h-full flex items-center justify-center flex-col text-gray-500 dark:text-gray-400">
        <p>No model data loaded</p>
      </div>
    );
  }

  const layers = model.layers || {};
  const layerNames = Object.keys(layers).sort((a, b) => {
    const orderA = layers[a].order || 999;
    const orderB = layers[b].order || 999;
    return orderA - orderB;
  });

  const toggleType = (typeKey: string) => {
    const newExpanded = new Set(expandedTypes);
    if (newExpanded.has(typeKey)) {
      newExpanded.delete(typeKey);
    } else {
      newExpanded.add(typeKey);
    }
    setExpandedTypes(newExpanded);
  };

  // Helper to find schema definition for an element type
  const getSchemaForType = (layerId: string, elementType: string) => {
    if (!specData?.schemas) return null;

    // Find the layer schema
    const layerSchemaKey = Object.keys(specData.schemas).find(key => 
      key.toLowerCase().includes(layerId.toLowerCase()) && key.includes('schema.json')
    );

    if (!layerSchemaKey) return null;

    const layerSchema = specData.schemas[layerSchemaKey];
    
    // Look for the element type in definitions
    if (layerSchema?.definitions) {
      // Try exact match first
      if (layerSchema.definitions[elementType]) {
        return layerSchema.definitions[elementType];
      }
      
      // Try case-insensitive match
      const typeKey = Object.keys(layerSchema.definitions).find(
        key => key.toLowerCase() === elementType.toLowerCase()
      );
      
      if (typeKey) {
        return layerSchema.definitions[typeKey];
      }
    }

    return null;
  };

  const renderElementLinks = (layerName: string) => {
    // Try to find the layer in linksByLayer with case-insensitive matching
    let links = linksByLayer.get(layerName);
    
    if (!links) {
      // Try to find with different case variations
      for (const [key, value] of linksByLayer) {
        if (key.toLowerCase() === layerName.toLowerCase()) {
          links = value;
          break;
        }
      }
    }
    
    if (!links || (links.outgoing.length === 0 && links.incoming.length === 0)) {
      return (
        <p className="text-sm text-gray-500 dark:text-gray-400">
          No cross-layer links for this layer
        </p>
      );
    }

    return (
      <div className="space-y-4">
        {links.outgoing.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Outgoing Links ({links.outgoing.length})
            </h5>
            <div className="space-y-2">
              {links.outgoing.map(link => {
                const category = linkRegistry?.categories[link.category];
                return (
                  <div
                    key={link.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: category?.color || '#9ca3af' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        → {link.targetLayer} ({link.targetElementTypes.join(', ')})
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {link.fieldPaths.join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {links.incoming.length > 0 && (
          <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
            <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
              Incoming Links ({links.incoming.length})
            </h5>
            <div className="space-y-2">
              {links.incoming.map(link => {
                const category = linkRegistry?.categories[link.category];
                return (
                  <div
                    key={link.id}
                    className="flex items-start gap-3 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg"
                  >
                    <div
                      className="w-2 h-2 rounded-full flex-shrink-0 mt-1.5"
                      style={{ backgroundColor: category?.color || '#9ca3af' }}
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium text-gray-900 dark:text-white">
                        {link.name}
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">
                        ← {link.sourceLayers.join(', ')}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                        {link.fieldPaths.join(', ')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderLayerDetails = () => {
    if (!selectedLayer) {
      const metadataItems: MetadataItem[] = [
        { label: 'Version', value: model.version },
        { label: 'Total Elements', value: model.metadata?.elementCount || 0 },
        { label: 'Total Layers', value: layerNames.length },
        ...(model.metadata?.loadedAt
          ? [{ label: 'Loaded', value: new Date(model.metadata.loadedAt).toLocaleString() }]
          : [])
      ];

      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="flex items-center justify-center flex-col text-gray-400 dark:text-gray-500 mb-6">
            <p className="text-gray-500 dark:text-gray-400 mb-6">Select a layer from the sidebar to view elements</p>
            <MetadataGrid title="Model Metadata" items={metadataItems} columns={2} />
          </div>
        </div>
      );
    }

    const layer = layers[selectedLayer];
    
    // If layer not found, try with lowercase key (API uses lowercase IDs)
    const layerKey = layer ? selectedLayer : Object.keys(layers).find(
      key => key.toLowerCase() === selectedLayer.toLowerCase()
    );
    
    const actualLayer = layers[layerKey || selectedLayer];
    
    // Guard against undefined layer
    if (!actualLayer) {
      return (
        <div className="h-full overflow-y-auto p-6">
          <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
            <p className="text-gray-500 dark:text-gray-400">Layer not found: {selectedLayer}</p>
          </div>
        </div>
      );
    }
    
    const elements = actualLayer.elements || [];

    // Group elements by type
    const elementsByType = elements.reduce((acc: Record<string, any[]>, element: any) => {
      const type = element.type || 'unknown';
      if (!acc[type]) {
        acc[type] = [];
      }
      acc[type].push(element);
      return acc;
    }, {});

    const sortedTypes = Object.keys(elementsByType).sort();

    const layerMetadata: MetadataItem[] = [
      { label: 'Layer ID', value: actualLayer.id || (layerKey || selectedLayer) },
      { label: 'Elements', value: elements.length },
      { label: 'Order', value: actualLayer.order }
    ];

    return (
      <div className="h-full overflow-y-auto p-6">
        <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            {actualLayer.name || (layerKey || selectedLayer)}
          </h2>
          {actualLayer.description && (
            <p className="text-gray-600 dark:text-gray-400 mb-4">{actualLayer.description}</p>
          )}
          <MetadataGrid items={layerMetadata} columns={3} />
        </div>

        {elements.length === 0 ? (
          <div className="mt-6">
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900">
              <p className="text-gray-500 dark:text-gray-400">No elements in this layer</p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-2">
                Elements will appear here when you add them to your model
              </p>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Elements ({elements.length})
            </h3>

            {sortedTypes.map((elementType) => {
              const typeElements = elementsByType[elementType];
              const typeKey = `${selectedLayer}-${elementType}`;
              const isTypeExpanded = expandedTypes.has(typeKey);
              const typeSchema = getSchemaForType(selectedLayer, elementType);

              return (
                <section key={typeKey} className="border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                  <div
                    className="cursor-pointer flex items-center gap-2"
                    onClick={() => toggleType(typeKey)}
                  >
                    <span className="text-lg">{isTypeExpanded ? '▼' : '▶'}</span>
                    <h4 className="font-semibold text-gray-900 dark:text-white">{elementType}</h4>
                    <Badge color="gray" className="ml-auto">{typeElements.length}</Badge>
                  </div>

                  {isTypeExpanded && (
                    <div className="mt-4 space-y-4">
                      {/* Schema Definition */}
                      {typeSchema && (
                        <div className="ml-4 pl-4 border-l-2 border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800 rounded p-3">
                          <h5 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                            Type Definition:
                          </h5>
                          {typeSchema.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {typeSchema.description}
                            </p>
                          )}
                          {typeSchema.properties && (
                            <div className="text-sm">
                              <strong className="text-gray-900 dark:text-white">Properties:</strong>
                              <ul className="mt-2 space-y-1 ml-4">
                                {Object.entries(typeSchema.properties).map(([propName, propDef]: [string, any]) => (
                                  <li key={propName} className="text-gray-700 dark:text-gray-300">
                                    <code className="bg-gray-200 dark:bg-gray-700 px-1 rounded">{propName}</code>
                                    {propDef.type && <span className="text-gray-500"> ({propDef.type})</span>}
                                    {propDef.description && <span> - {propDef.description}</span>}
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}

                      {/* Elements of this type */}
                      {typeElements.map((element: any) => {
                        // Build attributes array
                        const attributes: AttributeRow[] = [];

                        // Core attributes
                        if (element.id) attributes.push({ name: 'ID', value: element.id });
                        if (element.name) attributes.push({ name: 'Name', value: element.name });
                        if (element.type) attributes.push({ name: 'Type', value: element.type });
                        if (element.description || element.properties?.description) {
                          attributes.push({
                            name: 'Description',
                            value: element.description || element.properties?.description
                          });
                        }

                        // Properties (excluding core fields)
                        if (element.properties) {
                          Object.entries(element.properties)
                            .filter(([key]) => !['id', 'name', 'type', 'description'].includes(key))
                            .forEach(([key, value]) => {
                              attributes.push({
                                name: key,
                                value: value as any,
                                isObject: typeof value === 'object' && value !== null
                              });
                            });
                        }

                        // Other top-level attributes
                        Object.entries(element)
                          .filter(([key]) =>
                            !['id', 'name', 'type', 'description', 'properties', 'visual', 'layerId'].includes(key)
                          )
                          .forEach(([key, value]) => {
                            attributes.push({
                              name: key,
                              value: value as any,
                              isObject: typeof value === 'object' && value !== null
                            });
                          });

                        return (
                          <ExpandableSection
                            key={element.id}
                            title={element.name || element.id}
                          >
                            <div className="space-y-4">
                              <AttributesTable attributes={attributes} title="Attributes" />

                              {/* Show related cross-layer links */}
                              {linkRegistry && selectedLayer && linksByLayer.has(selectedLayer) && (
                                <div className="mt-4">
                                  {renderElementLinks(selectedLayer)}
                                </div>
                              )}
                            </div>
                          </ExpandableSection>
                        );
                      })}
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="h-full overflow-hidden">
      {renderLayerDetails()}
    </div>
  );
};

export default ModelJSONViewer;
