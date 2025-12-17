/**
 * SpecGraphView Component
 * Displays JSON Schema specifications as an interactive graph using GraphViewer
 * Converts spec data to MetaModel using DataLoader.parseSchemaDefinitions()
 * Includes cross-layer links from link registry
 */

import { useState, useEffect, useMemo } from 'react';
import GraphViewer from '../../../core/components/GraphViewer';
import { DataLoader } from '../../../core/services/dataLoader';
import { GitHubService } from '../../../core/services/githubService';
import { LocalFileLoader } from '../../../core/services/localFileLoader';
import { SpecParser } from '../../../core/services/specParser';
import { MetaModel, Relationship } from '../../../core/types';
import { SpecDataResponse, LinkType } from '../services/embeddedDataLoader';
import { LoadingState, ErrorState, EmptyState } from './shared';

export interface SpecGraphViewProps {
  specData: SpecDataResponse;
  selectedSchemaId?: string | null;
}

const SpecGraphView: React.FC<SpecGraphViewProps> = ({ specData, selectedSchemaId: _selectedSchemaId }) => {
  const [model, setModel] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Create DataLoader instance
  const dataLoader = useMemo(() => {
    return new DataLoader(
      new GitHubService(),
      new LocalFileLoader(),
      new SpecParser()
    );
  }, []);

  /**
   * Convert spec data to MetaModel for GraphViewer
   */
  useEffect(() => {
    const convertSpecToModel = () => {
      try {
        setLoading(true);
        setError('');

        console.log('[SpecGraphView] Starting conversion with input:', {
          hasSpecData: !!specData,
          specDataKeys: specData ? Object.keys(specData) : [],
          hasSchemas: !!(specData?.schemas),
          schemaCount: specData?.schemas ? Object.keys(specData.schemas).length : 0,
          schemaKeys: specData?.schemas ? Object.keys(specData.schemas).slice(0, 3) : [],
          hasLinkRegistry: !!(specData?.linkRegistry),
          linkTypesCount: specData?.linkRegistry?.linkTypes?.length || 0
        });

        if (!specData || !specData.schemas) {
          console.error('[SpecGraphView] Invalid spec data:', { hasSpecData: !!specData, hasSchemas: !!(specData?.schemas) });
          throw new Error('Invalid spec data: missing schemas');
        }

        // Clean up schema keys (remove file extensions and prefixes)
        const cleanedSchemas: Record<string, any> = {};
        for (const [filename, schema] of Object.entries(specData.schemas)) {
          // Extract layer name from filename (e.g., "01-motivation-layer.schema.json" -> "Motivation")
          const layerName = filename
            .replace(/^\d+-/, '')              // Remove number prefix
            .replace(/-layer.*$/, '')          // Remove "-layer" suffix and extension
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

          console.log(`[SpecGraphView] Mapping "${filename}" -> "${layerName}"`);
          cleanedSchemas[layerName] = schema;
        }

        console.log('[SpecGraphView] Cleaned schemas:', {
          count: Object.keys(cleanedSchemas).length,
          layerNames: Object.keys(cleanedSchemas)
        });

        // Use DataLoader.parseSchemaDefinitions() to convert schemas to MetaModel
        const metamodel = dataLoader.parseSchemaDefinitions(
          cleanedSchemas,
          specData.version || '0.1.0'
        );

        // Add cross-layer links from link registry
        if (specData.linkRegistry) {
          addCrossLayerLinks(metamodel, specData.linkRegistry.linkTypes);
        }

        console.log('[SpecGraphView] Conversion complete:', {
          layerCount: Object.keys(metamodel.layers).length,
          layerNames: Object.keys(metamodel.layers),
          elementCount: metamodel.metadata?.elementCount || 0,
          relationshipCount: Object.values(metamodel.layers).reduce((acc, layer) => acc + (layer.relationships?.length || 0), 0)
        });

        setModel(metamodel);
        console.log('[SpecGraphView] Model state updated successfully');
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert spec to model';
        console.error('[SpecGraphView] Error converting spec:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    convertSpecToModel();
  }, [specData, dataLoader]);

  /**
   * Add cross-layer links from link registry to the MetaModel
   */
  const addCrossLayerLinks = (metamodel: MetaModel, linkTypes: LinkType[]) => {
    console.log('[SpecGraphView] Adding cross-layer links:', linkTypes.length);

    // Group link types by source layer
    const linksBySourceLayer = new Map<string, LinkType[]>();
    for (const linkType of linkTypes) {
      for (const sourceLayer of linkType.sourceLayers) {
        const layerName = normalizeLayerName(sourceLayer);
        if (!linksBySourceLayer.has(layerName)) {
          linksBySourceLayer.set(layerName, []);
        }
        linksBySourceLayer.get(layerName)!.push(linkType);
      }
    }

    // Add relationships to each layer
    let totalLinksAdded = 0;
    for (const [layerName, layer] of Object.entries(metamodel.layers)) {
      const layerLinks = linksBySourceLayer.get(layerName) || [];

      if (!layer.relationships) {
        layer.relationships = [];
      }

      // Create virtual relationships for each link type
      for (const linkType of layerLinks) {
        const targetLayerName = normalizeLayerName(linkType.targetLayer);

        // Add a relationship representing this cross-layer link
        const relationship: Relationship = {
          id: `link-${linkType.id}`,
          type: linkType.category,
          sourceId: layerName,
          targetId: targetLayerName,
          properties: {
            name: linkType.name,
            description: linkType.description,
            linkTypeId: linkType.id,
            fieldPaths: linkType.fieldPaths,
            cardinality: linkType.cardinality,
            format: linkType.format,
            targetElementTypes: linkType.targetElementTypes
          }
        };

        layer.relationships.push(relationship);
        totalLinksAdded++;
      }
    }

    console.log('[SpecGraphView] Added cross-layer links:', totalLinksAdded);
  };

  /**
   * Normalize layer name from link registry format (e.g., "01-motivation" -> "Motivation")
   */
  const normalizeLayerName = (layerRef: string): string => {
    return layerRef
      .replace(/^\d+-/, '')              // Remove number prefix
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Loading state
  if (loading) {
    return <LoadingState variant="panel" message="Converting schema to graph..." />;
  }

  // Error state
  if (error) {
    return <ErrorState variant="panel" message={error} />;
  }

  // Empty state
  if (!model) {
    console.warn('[SpecGraphView] Rendering empty state - no model');
    return <EmptyState variant="model" title="No Schema Data" description="No schema data available to display" />;
  }

  // Render GraphViewer with converted model
  console.log('[SpecGraphView] Rendering GraphViewer with model:', {
    layerCount: Object.keys(model.layers).length,
    elementCount: model.metadata?.elementCount || 0
  });
  return <GraphViewer model={model} />;
};

export default SpecGraphView;
