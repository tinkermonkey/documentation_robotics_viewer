/**
 * ChangesetGraphView Component
 * Displays changeset changes as an interactive graph using GraphViewer
 * Converts changeset data to MetaModel using ChangesetGraphBuilder
 */

import { useState, useEffect, useMemo } from 'react';
import GraphViewer from '../../../core/components/GraphViewer';
import { ChangesetGraphBuilder, ChangesetDetails } from '../services/changesetGraphBuilder';
import { MetaModel } from '../../../core/types';


export interface ChangesetGraphViewProps {
  changeset: ChangesetDetails | null;
}

const ChangesetGraphView: React.FC<ChangesetGraphViewProps> = ({ changeset }) => {
  const [model, setModel] = useState<MetaModel | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Create builder instance
  const builder = useMemo(() => new ChangesetGraphBuilder(), []);

  /**
   * Convert changeset to MetaModel for GraphViewer
   */
  useEffect(() => {
    const convertChangesetToModel = () => {
      try {
        setLoading(true);
        setError('');

        if (!changeset) {
          setModel(null);
          return;
        }

        console.log('[ChangesetGraphView] Converting changeset to MetaModel...');

        if (!changeset.changes || !changeset.changes.changes || changeset.changes.changes.length === 0) {
          throw new Error('No changes in changeset');
        }

        // Use ChangesetGraphBuilder to convert changes to MetaModel
        const metamodel = builder.buildChangesetModel(changeset);

        console.log('[ChangesetGraphView] Conversion complete:', {
          layers: Object.keys(metamodel.layers).length,
          elements: metamodel.metadata?.elementCount || 0
        });

        setModel(metamodel);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Failed to convert changeset to model';
        console.error('[ChangesetGraphView] Error converting changeset:', err);
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    };

    convertChangesetToModel();
  }, [changeset, builder]);

  // Loading state
  if (loading) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
            <p className="text-gray-700 dark:text-gray-300 font-medium">Converting changeset to graph...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-3 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-red-200 dark:border-red-700 bg-red-50/50 dark:bg-red-900/20">
            <h3 className="text-lg font-semibold text-red-700 dark:text-red-400">Error</h3>
            <p className="text-red-600 dark:text-red-300 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!changeset) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">Select a changeset to view its graph</p>
          </div>
        </div>
      </div>
    );
  }

  // No changes state
  if (!model) {
    return (
      <div className="relative w-full h-full">
        <div className="absolute inset-0 bg-white/80 dark:bg-gray-900/80 flex items-center justify-center z-50">
          <div className="flex flex-col items-center gap-4 bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 border border-gray-200 dark:border-gray-700">
            <p className="text-gray-600 dark:text-gray-400">No changes to display</p>
          </div>
        </div>
      </div>
    );
  }

  // Render GraphViewer with operation legend
  return (
    <div className="relative w-full h-full">
      <div className="absolute top-4 right-4 bg-white/95 dark:bg-gray-800/95 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-lg z-10 flex items-center gap-4 text-sm">
        <div className="font-semibold text-gray-700 dark:text-gray-300 mr-1">Operations:</div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 bg-green-100 border-green-500"></span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Added</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 bg-amber-100 border-amber-500"></span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Updated</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-4 h-4 rounded border-2 bg-red-100 border-red-500"></span>
          <span className="text-gray-600 dark:text-gray-400 font-medium">Deleted</span>
        </div>
      </div>
      <GraphViewer model={model} />
    </div>
  );
};

export default ChangesetGraphView;
