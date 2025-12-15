/**
 * ChangesetList Component
 * Displays a list of all changesets with filtering and selection
 */

import React, { useMemo } from 'react';
import { useChangesetStore } from '../stores/changesetStore';
import { Card, Badge } from 'flowbite-react';
import { EmptyState } from './shared';

interface ChangesetListProps {
  onChangesetSelect: (changesetId: string) => void;
}

const ChangesetList: React.FC<ChangesetListProps> = ({ onChangesetSelect }) => {
  const { changesets, selectedChangesetId } = useChangesetStore();

  // Sort changesets by created_at (newest first)
  const sortedChangesets = useMemo(() => {
    return [...changesets].sort((a, b) => {
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [changesets]);

  // Group by status
  const activeChangesets = sortedChangesets.filter(cs => cs.status === 'active');
  const appliedChangesets = sortedChangesets.filter(cs => cs.status === 'applied');
  const abandonedChangesets = sortedChangesets.filter(cs => cs.status === 'abandoned');

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'feature': return '✨';
      case 'bugfix': return '🐛';
      case 'exploration': return '🔍';
      default: return '📝';
    }
  };

  const getStatusBadge = (status: string) => {
    const colorMap = {
      active: 'success',
      applied: 'info',
      abandoned: 'gray'
    } as const;
    return <Badge color={colorMap[status as keyof typeof colorMap] || 'gray'}>{status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const renderChangesetItem = (changeset: typeof changesets[0]) => (
    <Card
      key={changeset.id}
      className={`cursor-pointer transition-all ${selectedChangesetId === changeset.id ? 'ring-2 ring-blue-500' : ''}`}
      onClick={() => onChangesetSelect(changeset.id)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{getTypeIcon(changeset.type)}</span>
          <h5 className="text-base font-semibold text-gray-900 dark:text-white">
            {changeset.name}
          </h5>
        </div>
        {getStatusBadge(changeset.status)}
      </div>
      <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
        <code className="bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded">{changeset.id}</code>
        <span>•</span>
        <span>{formatDate(changeset.created_at)}</span>
      </div>
      <div className="text-sm text-gray-600 dark:text-gray-400">
        {changeset.elements_count} changes
      </div>
    </Card>
  );

  if (changesets.length === 0) {
    return (
      <div className="h-full overflow-y-auto flex flex-col p-4">
        <EmptyState variant="changesets" />
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto flex flex-col p-4 space-y-4" data-testid="changeset-list">
      <div className="flex items-center justify-between pb-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Changesets</h3>
        <Badge color="gray">{changesets.length} total</Badge>
      </div>

      {activeChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Active ({activeChangesets.length})
          </h4>
          <div className="space-y-2">
            {activeChangesets.map(renderChangesetItem)}
          </div>
        </div>
      )}

      {appliedChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Applied ({appliedChangesets.length})
          </h4>
          <div className="space-y-2">
            {appliedChangesets.map(renderChangesetItem)}
          </div>
        </div>
      )}

      {abandonedChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
            Abandoned ({abandonedChangesets.length})
          </h4>
          <div className="space-y-2">
            {abandonedChangesets.map(renderChangesetItem)}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChangesetList;
