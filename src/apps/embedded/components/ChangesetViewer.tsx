/**
 * ChangesetViewer Component
 * Displays detailed view of a selected changeset
 */

import React, { useMemo } from 'react';
import { useChangesetStore } from '../stores/changesetStore';
import { ChangesetChange } from '../services/embeddedDataLoader';
import './ChangesetViewer.css';

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
    const operationClass = change.operation;
    const operationIcon = {
      add: '+',
      update: '~',
      delete: '−'
    }[change.operation];

    return (
      <div key={`${change.element_id}-${change.timestamp}`} className={`change-item ${operationClass}`}>
        <div className="change-header">
          <span className="operation-icon">{operationIcon}</span>
          <span className="element-id">{change.element_id}</span>
          <span className="element-type">{change.element_type}</span>
          <span className="timestamp">{formatTimestamp(change.timestamp)}</span>
        </div>

        <div className="change-content">
          {change.operation === 'add' && (
            <div className="change-data added">
              <div className="data-label">Added:</div>
              <pre className="data-display">{JSON.stringify(change.data, null, 2)}</pre>
            </div>
          )}

          {change.operation === 'update' && (
            <div className="change-diff">
              <div className="diff-section before">
                <div className="data-label">Before:</div>
                <pre className="data-display">{JSON.stringify(change.before, null, 2)}</pre>
              </div>
              <div className="diff-arrow">→</div>
              <div className="diff-section after">
                <div className="data-label">After:</div>
                <pre className="data-display">{JSON.stringify(change.after, null, 2)}</pre>
              </div>
            </div>
          )}

          {change.operation === 'delete' && (
            <div className="change-data deleted">
              <div className="data-label">Deleted:</div>
              <pre className="data-display">{JSON.stringify(change.before, null, 2)}</pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="changeset-viewer loading">
        <div className="spinner"></div>
        <p>Loading changeset...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="changeset-viewer error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (!selectedChangeset) {
    return (
      <div className="changeset-viewer empty">
        <div className="empty-state">
          <span className="empty-icon">📝</span>
          <p>Select a changeset to view details</p>
        </div>
      </div>
    );
  }

  const { metadata, changes } = selectedChangeset;
  const totalChanges = changes.changes.length;

  return (
    <div className="changeset-viewer">
      {/* Metadata section */}
      <div className="changeset-metadata">
        <div className="metadata-header">
          <h2>{metadata.name}</h2>
          <div className="metadata-badges">
            <span className={`status-badge ${metadata.status}`}>{metadata.status}</span>
            <span className={`type-badge ${metadata.type}`}>{metadata.type}</span>
          </div>
        </div>

        <p className="changeset-description">{metadata.description}</p>

        <div className="metadata-grid">
          <div className="metadata-item">
            <span className="label">ID:</span>
            <span className="value monospace">{metadata.id}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Created:</span>
            <span className="value">{formatTimestamp(metadata.created_at)}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Updated:</span>
            <span className="value">{formatTimestamp(metadata.updated_at)}</span>
          </div>
          <div className="metadata-item">
            <span className="label">Workflow:</span>
            <span className="value">{metadata.workflow}</span>
          </div>
        </div>

        {/* Summary stats */}
        <div className="summary-stats">
          <div className="stat-item added">
            <span className="stat-icon">+</span>
            <span className="stat-value">{metadata.summary.elements_added}</span>
            <span className="stat-label">Added</span>
          </div>
          <div className="stat-item updated">
            <span className="stat-icon">~</span>
            <span className="stat-value">{metadata.summary.elements_updated}</span>
            <span className="stat-label">Updated</span>
          </div>
          <div className="stat-item deleted">
            <span className="stat-icon">−</span>
            <span className="stat-value">{metadata.summary.elements_deleted}</span>
            <span className="stat-label">Deleted</span>
          </div>
          <div className="stat-item total">
            <span className="stat-icon">=</span>
            <span className="stat-value">{totalChanges}</span>
            <span className="stat-label">Total</span>
          </div>
        </div>
      </div>

      {/* Changes section */}
      <div className="changeset-changes">
        <div className="changes-header">
          <h3>Changes ({totalChanges})</h3>
        </div>

        {/* Group by layer */}
        {Object.entries(changesByLayer).map(([layer, layerChanges]) => (
          <div key={layer} className="layer-group">
            <h4 className="layer-title">
              {layer} ({layerChanges.length})
            </h4>
            {layerChanges.map(renderChangeDetail)}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ChangesetViewer;
