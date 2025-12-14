/**
 * ChangesetViewer Component
 * Displays detailed view of a selected changeset
 */

import React, { useMemo } from 'react';
import { useChangesetStore } from '../stores/changesetStore';
import { ChangesetChange } from '../services/embeddedDataLoader';
import { Card, Badge, Spinner } from 'flowbite-react';

const ChangesetViewer: React.FC = () => {
  const { selectedChangeset, loading, error } = useChangesetStore();

  // Group changes by operation


  // Group changes by layer
  const changesByLayer = useMemo(() => {
    if (!selectedChangeset) return {};

    const changes = selectedChangeset.changes.changes;
    const grouped: Record<string, ChangesetChange[]> = {};

    changes.forEach(change => {
      if (!grouped[change.layer]) {
        grouped[change.layer] = [];
      }
      grouped[change.layer].push(change);
    });

    return grouped;
  }, [selectedChangeset]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderChangeDetail = (change: ChangesetChange) => {
    const operationColor = {
      add: 'success',
      update: 'warning',
      delete: 'failure'
    }[change.operation] as 'success' | 'warning' | 'failure';

    const operationIcon = {
      add: '+',
      update: '~',
      delete: '−'
    }[change.operation];

    return (
      <div key={`${change.element_id}-${change.timestamp}`} className="mb-3 last:mb-0">
        <div className="flex items-center gap-2 mb-2">
          <Badge color={operationColor} size="sm">
            {operationIcon} {change.operation}
          </Badge>
          <code className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
            {change.element_id}
          </code>
          <Badge color="gray" size="sm">{change.element_type}</Badge>
          <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">
            {formatTimestamp(change.timestamp)}
          </span>
        </div>

        <div className="pl-4 border-l-2 border-gray-200 dark:border-gray-700">
          {change.operation === 'add' && (
            <div>
              <div className="text-xs font-medium text-green-600 dark:text-green-400 mb-1">Added:</div>
              <pre className="text-xs bg-green-50 dark:bg-green-900/20 p-2 rounded overflow-x-auto">
                {JSON.stringify(change.data, null, 2)}
              </pre>
            </div>
          )}

          {change.operation === 'update' && (
            <div className="grid grid-cols-2 gap-3">
              <div>
                <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">Before:</div>
                <pre className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded overflow-x-auto">
                  {JSON.stringify(change.before, null, 2)}
                </pre>
              </div>
              <div>
                <div className="text-xs font-medium text-yellow-600 dark:text-yellow-400 mb-1">After:</div>
                <pre className="text-xs bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded overflow-x-auto">
                  {JSON.stringify(change.after, null, 2)}
                </pre>
              </div>
            </div>
          )}

          {change.operation === 'delete' && (
            <div>
              <div className="text-xs font-medium text-red-600 dark:text-red-400 mb-1">Deleted:</div>
              <pre className="text-xs bg-red-50 dark:bg-red-900/20 p-2 rounded overflow-x-auto">
                {JSON.stringify(change.before, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col gap-4 p-4">
        <div className="flex flex-col items-center justify-center py-12 gap-4">
          <Spinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400">Loading changeset...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col gap-4 p-4">
        <Card>
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Error</h3>
          <p className="text-gray-600 dark:text-gray-400">{error}</p>
        </Card>
      </div>
    );
  }

  if (!selectedChangeset) {
    return (
      <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col gap-4 p-4">
        <Card>
          <div className="text-center py-8">
            <span className="text-4xl">📝</span>
            <p className="mt-2 text-gray-500 dark:text-gray-400">Select a changeset to view details</p>
          </div>
        </Card>
      </div>
    );
  }

  const { metadata, changes } = selectedChangeset;
  const totalChanges = changes.changes.length;

  return (
    <div className="flex-1 h-full overflow-y-auto bg-gray-50 dark:bg-gray-800 flex flex-col gap-4 p-4">
      {/* Metadata section */}
      <Card>
        <div className="flex items-start justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">{metadata.name}</h2>
          <div className="flex gap-2">
            <Badge color={
              metadata.status === 'active' ? 'success' :
              metadata.status === 'applied' ? 'info' : 'gray'
            }>
              {metadata.status}
            </Badge>
            <Badge color="purple">{metadata.type}</Badge>
          </div>
        </div>

        <p className="text-gray-700 dark:text-gray-300 mb-4">{metadata.description}</p>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">ID:</span>
            <code className="ml-2 text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded">
              {metadata.id}
            </code>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Created:</span>
            <span className="ml-2 text-sm">{formatTimestamp(metadata.created_at)}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Updated:</span>
            <span className="ml-2 text-sm">{formatTimestamp(metadata.updated_at)}</span>
          </div>
          <div>
            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">Workflow:</span>
            <span className="ml-2 text-sm">{metadata.workflow}</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-4 gap-2">
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {metadata.summary.elements_added}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Added</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {metadata.summary.elements_updated}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Updated</div>
          </div>
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {metadata.summary.elements_deleted}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Deleted</div>
          </div>
          <div className="text-center p-3 bg-blue-50 dark:bg-blue-900/20 rounded">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {totalChanges}
            </div>
            <div className="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
        </div>
      </Card>

      {/* Changes section */}
      <div className="changeset-changes">
        <h3 className="text-lg font-semibold mb-3">Changes ({totalChanges})</h3>

        {/* Group by layer */}
        {Object.entries(changesByLayer).map(([layer, layerChanges]) => (
          <Card key={layer} className="mb-4">
            <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 mb-3">
              {layer} ({layerChanges.length})
            </h4>
            <div className="space-y-3">
              {layerChanges.map(renderChangeDetail)}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ChangesetViewer;
