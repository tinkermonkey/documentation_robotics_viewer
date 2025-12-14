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
        <div className="message-overlay">
          <div className="message-box">
            <div className="spinner"></div>
            <p>Converting changeset to graph...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box error">
            <h3>Error</h3>
            <p>{error}</p>
          </div>
        </div>
      </div>
    );
  }

  // Empty state
  if (!changeset) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box">
            <p>Select a changeset to view its graph</p>
          </div>
        </div>
      </div>
    );
  }

  // No changes state
  if (!model) {
    return (
      <div className="relative w-full h-full">
        <div className="message-overlay">
          <div className="message-box">
            <p>No changes to display</p>
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
