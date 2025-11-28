/**
 * ChangesetList Component
 * Displays a list of all changesets with filtering and selection
 */

import React, { useMemo } from 'react';
import { useChangesetStore } from '../stores/changesetStore';
import './ChangesetList.css';

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
    switch (status) {
      case 'active': return <span className="status-badge active">Active</span>;
      case 'applied': return <span className="status-badge applied">Applied</span>;
      case 'abandoned': return <span className="status-badge abandoned">Abandoned</span>;
      default: return null;
    }
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
    <div
      key={changeset.id}
      className={`changeset-item ${selectedChangesetId === changeset.id ? 'selected' : ''}`}
      onClick={() => onChangesetSelect(changeset.id)}
    >
      <div className="changeset-header">
        <span className="changeset-icon">{getTypeIcon(changeset.type)}</span>
        <span className="changeset-name">{changeset.name}</span>
        {getStatusBadge(changeset.status)}
      </div>
      <div className="changeset-meta">
        <span className="changeset-id">{changeset.id}</span>
        <span className="changeset-date">{formatDate(changeset.created_at)}</span>
      </div>
      <div className="changeset-stats">
        <span className="stat">{changeset.elements_count} changes</span>
      </div>
    </div>
  );

  if (changesets.length === 0) {
    return (
      <div className="changeset-list empty">
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>No changesets found</p>
        </div>
      </div>
    );
  }

  return (
    <div className="changeset-list">
      <div className="changeset-list-header">
        <h3>Changesets</h3>
        <span className="changeset-count">{changesets.length} total</span>
      </div>

      {activeChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="section-title">Active ({activeChangesets.length})</h4>
          {activeChangesets.map(renderChangesetItem)}
        </div>
      )}

      {appliedChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="section-title">Applied ({appliedChangesets.length})</h4>
          {appliedChangesets.map(renderChangesetItem)}
        </div>
      )}

      {abandonedChangesets.length > 0 && (
        <div className="changeset-section">
          <h4 className="section-title">Abandoned ({abandonedChangesets.length})</h4>
          {abandonedChangesets.map(renderChangesetItem)}
        </div>
      )}
    </div>
  );
};

export default ChangesetList;
