/**
 * SpecGraphView Component
 * Displays JSON Schema specifications as an interactive graph using GraphViewer
 * Converts spec data to MetaModel using DataLoader.parseSchemaDefinitions()
 */

import { useState, useEffect, useMemo } from 'react';
import { type Node, type Edge } from '@xyflow/react';
import GraphViewer from '../../../core/components/GraphViewer';
import { DataLoader } from '../../../core/services/dataLoader';
import { GitHubService } from '../../../core/services/githubService';
import { LocalFileLoader } from '../../../core/services/localFileLoader';
import { SpecParser } from '../../../core/services/specParser';
import { MetaModel } from '../../../core/types';
import { SpecDataResponse, SchemaDefinition } from '../services/embeddedDataLoader';
import { LoadingState, ErrorState, EmptyState } from './shared';
import { LayoutEngineType } from '@/core/layout/engines';
import { logError } from '../services/errorTracker';
import { ERROR_IDS } from '@/constants/errorIds';

export interface SpecGraphViewProps {
  specData: SpecDataResponse;
  selectedSchemaId?: string | null;
  layoutEngine?: LayoutEngineType;
  layoutParameters?: Record<string, unknown>;
  onNodesEdgesChange?: (nodes: Node[], edges: Edge[]) => void;
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

        if (!specData || !specData.schemas) {
          throw new Error('Invalid spec data: missing schemas');
        }

        // Clean up schema keys (remove file extensions and prefixes)
        const cleanedSchemas: Record<string, SchemaDefinition> = {};
        for (const [filename, schema] of Object.entries(specData.schemas)) {
          // Extract layer name from filename (e.g., "01-motivation-layer.schema.json" -> "Motivation")
          const layerName = filename
            .replace(/^\d+-/, '')              // Remove number prefix
            .replace(/-layer.*$/, '')          // Remove "-layer" suffix and extension
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');

          cleanedSchemas[layerName] = schema;
        }

        // Use DataLoader.parseSchemaDefinitions() to convert schemas to MetaModel
        const metamodel = dataLoader.parseSchemaDefinitions(
          cleanedSchemas,
          specData.version || '0.1.0'
        );

        setModel(metamodel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert spec to model';
        const error = err instanceof Error ? err : new Error(errorMessage);
        logError(
          ERROR_IDS.SPEC_CONVERSION_FAILED,
          'Failed to convert specification to graph model',
          { specDataKeys: specData ? Object.keys(specData) : [] },
          error
        );
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
