/**
 * AnnotationPanel Component
 * Displays annotations (comments) for the current view
 * Enhanced with create/edit UI and @mention support
 */

import React, { useMemo, useState } from 'react';
import { Badge, Avatar, Button, Modal, Textarea, Label } from 'flowbite-react';
import { Plus } from 'lucide-react';
import { useAnnotationStore } from '../stores/annotationStore';
import { useModelStore } from '../../../core/stores/modelStore';
import { Annotation } from '../types/annotations';
import { parseMentions, resolveElementName } from '../utils/mentionParser';
import { EmptyState, LoadingState, ErrorState } from './shared';

const AnnotationPanel: React.FC = () => {
  const { annotations, selectedElementId, loading, error, createAnnotation, setHighlightedElementId } = useAnnotationStore();
  const { model } = useModelStore();

  // Modal state for create/edit
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [commentContent, setCommentContent] = useState('');
  const [commentAuthor, setCommentAuthor] = useState('');

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

  const handleOpenModal = () => {
    setIsModalOpen(true);
    setCommentContent('');
    setCommentAuthor('');
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setCommentContent('');
    setCommentAuthor('');
  };

  const handleCreateComment = async () => {
    if (!commentContent.trim() || !commentAuthor.trim()) {
      return;
    }

    try {
      await createAnnotation(
        selectedElementId || 'global',
        commentContent,
        commentAuthor
      );
      handleCloseModal();
    } catch (err) {
      // Error is already set in store, modal will stay open
      console.error('Failed to create annotation:', err);
    }
  };

  /**
   * Handle mention click - highlight element in graph view
   */
  const handleMentionClick = (elementId: string) => {
    console.log('[AnnotationPanel] Highlighting element:', elementId);

    // Set highlighted element
    setHighlightedElementId(elementId);

    // Auto-clear highlight after 3 seconds
    setTimeout(() => {
      setHighlightedElementId(null);
    }, 3000);
  };

  /**
   * Get initials from author name for avatar
   */
  const getInitials = (name: string): string => {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  /**
   * Render annotation content with @mentions as clickable badges
   */
  const renderContentWithMentions = (content: string) => {
    const tokens = parseMentions(content);

    return (
      <span className="text-sm text-gray-700 dark:text-gray-300">
        {tokens.map((token, index) => {
          if (token.type === 'mention' && token.elementId) {
            const elementName = resolveElementName(token.elementId, model);
            return (
              <Badge
                key={index}
                color="info"
                size="sm"
                className="inline-flex items-center mx-0.5 cursor-pointer hover:bg-blue-700 dark:hover:bg-blue-600 transition-colors"
                title={`Click to highlight: ${token.elementId}`}
                onClick={() => handleMentionClick(token.elementId!)}
              >
                {elementName}
              </Badge>
            );
          }
          return <span key={index}>{token.content}</span>;
        })}
      </span>
    );
  };

  const renderAnnotation = (annotation: Annotation) => (
    <div key={annotation.id} className="mb-3" data-testid={`annotation-${annotation.id}`}>
      <div className="flex gap-3">
        {/* Avatar */}
        <Avatar placeholderInitials={getInitials(annotation.author)} rounded size="sm" />

        {/* Content */}
        <div className="flex-1 min-w-0">
          {/* Author and timestamp */}
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-medium text-gray-900 dark:text-white">
              {annotation.author}
            </span>
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {formatTimestamp(annotation.createdAt)}
            </span>
            {annotation.resolved && (
              <Badge color="success" size="xs">
                ✓ Resolved
              </Badge>
            )}
          </div>

          {/* Comment text with @mentions */}
          <div className="mb-2">{renderContentWithMentions(annotation.content)}</div>

          {/* Replies */}
          {annotation.replies && annotation.replies.length > 0 && (
            <div className="mt-3 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-3">
              {annotation.replies.map((reply) => (
                <div key={reply.id} className="flex gap-2">
                  <Avatar placeholderInitials={getInitials(reply.author)} rounded size="xs" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {reply.author}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        {formatTimestamp(reply.createdAt)}
                      </span>
                    </div>
                    <div>{renderContentWithMentions(reply.content)}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <LoadingState variant="panel" message="Loading annotations..." />;
  }

  if (error) {
    return <ErrorState variant="panel" message={error} />;
  }

  if (annotations.length === 0) {
    return (
      <div className="p-4">
        <EmptyState
          variant="annotations"
          action={{ label: 'Add Comment', onClick: handleOpenModal }}
        />
      </div>
    );
  }

  return (
    <div className="p-4" data-testid="annotation-panel">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-gray-900 dark:text-white">
          {selectedElementId ? 'Element Annotations' : 'Comments'} ({displayedAnnotations.length})
        </h3>
      </div>

      {/* Add Comment Button */}
      <Button
        color="light"
        size="sm"
        className="w-full mb-4"
        onClick={handleOpenModal}
        data-testid="add-comment-btn"
      >
        <Plus className="mr-2 h-4 w-4" />
        Add Comment
      </Button>

      {/* Create Comment Modal */}
      <Modal show={isModalOpen} onClose={handleCloseModal} size="md">
        <div className="p-4">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-4">Add New Comment</h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="author">Your name</Label>
              <input
                id="author"
                type="text"
                placeholder="Enter your name"
                value={commentAuthor}
                onChange={(e) => setCommentAuthor(e.target.value)}
                className="block w-full mt-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 p-2.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-blue-500"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <Label htmlFor="comment">Comment</Label>
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {commentContent.length} / 500
                </span>
              </div>
              <Textarea
                id="comment"
                placeholder="Write your comment here... Use @element.id to mention elements"
                rows={4}
                maxLength={500}
                value={commentContent}
                onChange={(e) => setCommentContent(e.target.value)}
              />
              <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                Tip: Use @element.id to reference specific elements
              </p>
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <Button onClick={handleCreateComment} disabled={!commentContent.trim() || !commentAuthor.trim()}>
              Add Comment
            </Button>
            <Button color="gray" onClick={handleCloseModal}>
              Cancel
            </Button>
          </div>
        </div>
      </Modal>

      <div className="space-y-3">
        {selectedElementId ? (
          // Show annotations for selected element
          displayedAnnotations.map(renderAnnotation)
        ) : (
          // Show all annotations grouped by element
          annotationsByElement && Object.entries(annotationsByElement).map(([elementId, anns]) => (
            <div key={elementId}>
              <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                {elementId}
              </h4>
              {anns.map(renderAnnotation)}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default AnnotationPanel;
