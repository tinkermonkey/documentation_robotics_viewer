/**
 * AnnotationPanel Component
 * Displays annotations (comments) for the current view
 */

import React, { useMemo } from 'react';
import { useAnnotationStore } from '../stores/annotationStore';
import { Annotation } from '../types/annotations';
import './AnnotationPanel.css';

const AnnotationPanel: React.FC = () => {
  const { annotations, selectedElementId, loading, error } = useAnnotationStore();

  // Filter annotations based on selection
  const displayedAnnotations = useMemo(() => {
    if (selectedElementId) {
      return annotations.filter(ann => ann.elementId === selectedElementId);
    }
    return annotations;
  }, [annotations, selectedElementId]);

  // Group annotations by element if showing all
  const annotationsByElement = useMemo(() => {
    if (selectedElementId) return null;

    const grouped: Record<string, Annotation[]> = {};
    annotations.forEach(ann => {
      if (!grouped[ann.elementId]) {
        grouped[ann.elementId] = [];
      }
      grouped[ann.elementId].push(ann);
    });
    return grouped;
  }, [annotations, selectedElementId]);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
    });
  };

  const renderAnnotation = (annotation: Annotation) => (
    <div key={annotation.id} className={`annotation-item ${annotation.resolved ? 'resolved' : ''}`}>
      <div className="annotation-header">
        <span className="annotation-author">{annotation.author}</span>
        <span className="annotation-time">{formatTimestamp(annotation.createdAt)}</span>
        {annotation.resolved && (
          <span className="resolved-badge">✓ Resolved</span>
        )}
      </div>
      <div className="annotation-content">
        {annotation.content}
      </div>
      {annotation.replies && annotation.replies.length > 0 && (
        <div className="annotation-replies">
          {annotation.replies.map(reply => (
            <div key={reply.id} className="annotation-reply">
              <div className="reply-header">
                <span className="reply-author">{reply.author}</span>
                <span className="reply-time">{formatTimestamp(reply.createdAt)}</span>
              </div>
              <div className="reply-content">{reply.content}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  if (loading) {
    return (
      <div className="annotation-panel loading">
        <div className="spinner"></div>
        <p>Loading annotations...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="annotation-panel error">
        <h3>Error</h3>
        <p>{error}</p>
      </div>
    );
  }

  if (annotations.length === 0) {
    return (
      <div className="annotation-panel empty">
        <div className="empty-state">
          <span className="empty-icon">💬</span>
          <p>No annotations yet</p>
          <p className="empty-hint">Annotations will appear here as they are added</p>
        </div>
      </div>
    );
  }

  return (
    <div className="annotation-panel">
      <div className="annotation-panel-header">
        <h3>
          {selectedElementId ? 'Element Annotations' : 'All Annotations'}
        </h3>
        <span className="annotation-count">
          {displayedAnnotations.length} annotation{displayedAnnotations.length !== 1 ? 's' : ''}
        </span>
      </div>

      <div className="annotation-list">
        {selectedElementId ? (
          // Show annotations for selected element
          displayedAnnotations.map(renderAnnotation)
        ) : (
          // Show all annotations grouped by element
          annotationsByElement && Object.entries(annotationsByElement).map(([elementId, anns]) => (
            <div key={elementId} className="annotation-group">
              <h4 className="element-title">{elementId}</h4>
              {anns.map(renderAnnotation)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;
