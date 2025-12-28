/**
 * SpecGraphViewWithLayouts Component
 * Enhanced SpecGraphView with layout engine selection and comparison
 * Supports force-directed vs circuit-style orthogonal layout comparison
 */

import { useState } from 'react';
import { Button, Card, Select, Badge } from 'flowbite-react';
import GraphViewer from '../../../core/components/GraphViewer';
import { DataLoader } from '../../../core/services/dataLoader';
import { GitHubService } from '../../../core/services/githubService';
import { LocalFileLoader } from '../../../core/services/localFileLoader';
import { SpecParser } from '../../../core/services/specParser';
import { MetaModel } from '../../../core/types';
import { SpecDataResponse } from '../services/embeddedDataLoader';
import { LoadingState, ErrorState, EmptyState } from './shared';
import { SideBySideComparison } from './refinement/SideBySideComparison';
import { LayoutEngineType } from '@/core/layout/engines';
import { useMemo, useEffect } from 'react';

export interface SpecGraphViewWithLayoutsProps {
  specData: SpecDataResponse;
  selectedSchemaId?: string | null;
}

const SpecGraphViewWithLayouts: React.FC<SpecGraphViewWithLayoutsProps> = ({
  specData,
  selectedSchemaId
}) => {
  const [model, setModel] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Layout state
  const [layoutEngine, setLayoutEngine] = useState<LayoutEngineType>('d3-force');
  const [comparisonMode, setComparisonMode] = useState(false);
  const [compareLayoutEngine, setCompareLayoutEngine] = useState<LayoutEngineType>('elk');

  // Layout parameters for each engine
  const forceDirectedParams = {
    strength: -300,
    distance: 150,
    iterations: 300,
  };

  const orthogonalParams = {
    algorithm: 'layered',
    direction: 'RIGHT',
    orthogonalRouting: true,
    nodeSpacing: 100,
    layerSpacing: 150,
    edgeSpacing: 30,
  };

  // Create DataLoader instance
  const dataLoader = useMemo(() => {
    return new DataLoader(
      new GitHubService(),
      new LocalFileLoader(),
      new SpecParser()
    );
  }, []);

  /**
   * Convert spec data to MetaModel
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
        const cleanedSchemas: Record<string, any> = {};
        for (const [filename, schema] of Object.entries(specData.schemas)) {
          const layerName = filename
            .replace(/^\d+-/, '')
            .replace(/-layer.*$/, '')
            .split('-')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1))
            .join('');
          cleanedSchemas[layerName] = schema;
        }

        // Use DataLoader.parseSchemaDefinitions()
        const metamodel = dataLoader.parseSchemaDefinitions(
          cleanedSchemas,
          specData.version || '0.1.0'
        );

        // Add cross-layer links if available
        if (specData.linkRegistry) {
          addCrossLayerLinks(metamodel, specData.linkRegistry.linkTypes);
        }

        setModel(metamodel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert spec to model';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    convertSpecToModel();
  }, [specData, dataLoader]);

  /**
   * Add cross-layer links from link registry
   */
  const addCrossLayerLinks = (metamodel: MetaModel, linkTypes: any[]) => {
    const linksBySourceLayer = new Map<string, any[]>();
    for (const linkType of linkTypes) {
      for (const sourceLayer of linkType.sourceLayers) {
        const layerName = normalizeLayerName(sourceLayer);
        if (!linksBySourceLayer.has(layerName)) {
          linksBySourceLayer.set(layerName, []);
        }
        linksBySourceLayer.get(layerName)!.push(linkType);
      }
    }

    for (const [layerName, layer] of Object.entries(metamodel.layers)) {
      const layerLinks = linksBySourceLayer.get(layerName) || [];
      if (!layer.relationships) {
        layer.relationships = [];
      }

      for (const linkType of layerLinks) {
        const targetLayerName = normalizeLayerName(linkType.targetLayer);
        layer.relationships.push({
          id: `link-${linkType.id}`,
          type: linkType.category,
          sourceId: layerName,
          targetId: targetLayerName,
          properties: {
            name: linkType.name,
            description: linkType.description,
            linkTypeId: linkType.id,
          }
        });
      }
    }
  };

  const normalizeLayerName = (layerRef: string): string => {
    return layerRef
      .replace(/^\d+-/, '')
      .split('-')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join('');
  };

  // Loading/error/empty states
  if (loading) {
    return <LoadingState variant="panel" message="Converting schema to graph..." />;
  }

  if (error) {
    return <ErrorState variant="panel" message={error} />;
  }

  if (!model) {
    return <EmptyState variant="model" title="No Schema Data" description="No schema data available to display" />;
  }

  // Normalize selectedSchemaId
  const normalizedSchemaId = selectedSchemaId
    ? selectedSchemaId
        .replace(/^\d+-/, '')
        .replace(/-layer.*$/, '')
        .split('-')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join('')
    : null;

  return (
    <div className="flex flex-col h-full gap-4 p-4">
      {/* Layout Controls */}
      <Card>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-900 dark:text-white">
                Layout Engine
              </label>
              <Select
                value={layoutEngine}
                onChange={(e) => setLayoutEngine(e.target.value as LayoutEngineType)}
                sizing="sm"
              >
                <option value="d3-force">Force-Directed (Organic)</option>
                <option value="elk">ELK Orthogonal (Circuit-Style)</option>
                <option value="graphviz">Graphviz DOT</option>
                <option value="dagre">Dagre Hierarchical</option>
              </Select>
            </div>

            {comparisonMode && (
              <div className="flex flex-col gap-2">
                <label className="text-sm font-medium text-gray-900 dark:text-white">
                  Compare With
                </label>
                <Select
                  value={compareLayoutEngine}
                  onChange={(e) => setCompareLayoutEngine(e.target.value as LayoutEngineType)}
                  sizing="sm"
                >
                  <option value="d3-force">Force-Directed (Organic)</option>
                  <option value="elk">ELK Orthogonal (Circuit-Style)</option>
                  <option value="graphviz">Graphviz DOT</option>
                  <option value="dagre">Dagre Hierarchical</option>
                </Select>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              color={comparisonMode ? 'gray' : 'blue'}
              onClick={() => setComparisonMode(!comparisonMode)}
            >
              {comparisonMode ? 'Single View' : 'Compare Layouts'}
            </Button>

            {layoutEngine === 'd3-force' && (
              <Badge color="success">Force-Directed</Badge>
            )}
            {layoutEngine === 'elk' && (
              <Badge color="info">Circuit-Style</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Graph View */}
      <div className="flex-1 min-h-0">
        {comparisonMode ? (
          <div className="grid grid-cols-2 gap-4 h-full">
            <Card className="h-full">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  {layoutEngine === 'd3-force' ? 'Force-Directed' :
                   layoutEngine === 'elk' ? 'Orthogonal (Circuit)' : layoutEngine.toUpperCase()}
                </h3>
                <div className="flex-1 min-h-0">
                  <GraphViewer
                    model={model}
                    selectedLayerId={normalizedSchemaId}
                    layoutEngine={layoutEngine}
                    layoutParameters={
                      layoutEngine === 'd3-force'
                        ? forceDirectedParams
                        : layoutEngine === 'elk'
                        ? orthogonalParams
                        : undefined
                    }
                  />
                </div>
              </div>
            </Card>

            <Card className="h-full">
              <div className="flex flex-col h-full">
                <h3 className="text-lg font-semibold mb-2 dark:text-white">
                  {compareLayoutEngine === 'd3-force' ? 'Force-Directed' :
                   compareLayoutEngine === 'elk' ? 'Orthogonal (Circuit)' : compareLayoutEngine.toUpperCase()}
                </h3>
                <div className="flex-1 min-h-0">
                  <GraphViewer
                    model={model}
                    selectedLayerId={normalizedSchemaId}
                    layoutEngine={compareLayoutEngine}
                    layoutParameters={
                      compareLayoutEngine === 'd3-force'
                        ? forceDirectedParams
                        : compareLayoutEngine === 'elk'
                        ? orthogonalParams
                        : undefined
                    }
                  />
                </div>
              </div>
            </Card>
          </div>
        ) : (
          <GraphViewer
            model={model}
            selectedLayerId={normalizedSchemaId}
            layoutEngine={layoutEngine}
            layoutParameters={
              layoutEngine === 'd3-force'
                ? forceDirectedParams
                : layoutEngine === 'elk'
                ? orthogonalParams
                : undefined
            }
          />
        )}
      </div>
    </div>
  );
};

export default SpecGraphViewWithLayouts;
