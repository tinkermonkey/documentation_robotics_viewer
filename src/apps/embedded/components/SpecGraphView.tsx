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
import { SpecDataResponse } from '../services/embeddedDataLoader';
import { LoadingState, ErrorState, EmptyState } from './shared';
import { LayoutEngineType } from '@/core/layout/engines';

export interface SpecGraphViewProps {
  specData: SpecDataResponse;
  selectedSchemaId?: string | null;
  layoutEngine?: LayoutEngineType;
  layoutParameters?: Record<string, any>;
  onNodesEdgesChange?: (nodes: any[], edges: any[]) => void;
}

const SpecGraphView: React.FC<SpecGraphViewProps> = ({
  specData,
  selectedSchemaId,
  layoutEngine,
  layoutParameters,
  onNodesEdgesChange
}) => {
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
          schemaKeys: specData?.schemas ? Object.keys(specData.schemas).slice(0, 3) : []
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

  // Normalize selectedSchemaId to match layer naming (e.g., "01-motivation-layer.schema.json" -> "Motivation")
  const normalizedSchemaId = selectedSchemaId
    ? selectedSchemaId
        .replace(/^\d+-/, '')              // Remove number prefix
        .replace(/-layer.*$/, '')          // Remove "-layer" suffix and extension
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    : null;

  // Render GraphViewer with converted model
  console.log('[SpecGraphView] Rendering GraphViewer with model:', {
    layerCount: Object.keys(model.layers).length,
    elementCount: model.metadata?.elementCount || 0,
    selectedSchemaId,
    normalizedSchemaId,
    layoutEngine,
    hasLayoutParameters: !!layoutParameters
  });
  return (
    <GraphViewer
      model={model}
      selectedLayerId={normalizedSchemaId}
      layoutEngine={layoutEngine}
      layoutParameters={layoutParameters}
      onNodesEdgesChange={onNodesEdgesChange}
    />
  );
};

export default SpecGraphView;
