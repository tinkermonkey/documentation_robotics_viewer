/**
 * Session History Browser Component
 *
 * Displays all refinement sessions with metadata, iteration thumbnails,
 * and supports session comparison and replay.
 */

import React, { useState, useMemo, useCallback } from 'react';
import { RefinementSessionState } from '../../../../core/services/refinement/refinementLoop';
import { DiagramType } from '../../../../core/services/refinement/layoutParameters';

export interface SessionHistoryBrowserProps {
  /** All saved sessions */
  sessions: RefinementSessionState[];
  /** Callback when a session is selected for viewing */
  onSessionSelect?: (sessionId: string) => void;
  /** Callback when a session is loaded for resuming */
  onSessionLoad?: (sessionId: string) => void;
  /** Callback when a session is deleted */
  onSessionDelete?: (sessionId: string) => void;
  /** Callback when sessions are compared */
  onSessionsCompare?: (sessionIds: string[]) => void;
  /** Currently active session ID */
  activeSessionId?: string;
}

export const SessionHistoryBrowser: React.FC<SessionHistoryBrowserProps> = ({
  sessions,
  onSessionSelect,
  onSessionLoad,
  onSessionDelete,
  onSessionsCompare,
  activeSessionId,
}) => {
  const [selectedSessionIds, setSelectedSessionIds] = useState<Set<string>>(new Set());
  const [filterDiagramType, setFilterDiagramType] = useState<DiagramType | 'all'>('all');
  const [sortBy, setSortBy] = useState<'date' | 'score'>('date');
  const [expandedSessionId, setExpandedSessionId] = useState<string | null>(null);

  // Filter and sort sessions
  const filteredSessions = useMemo(() => {
    let filtered = sessions;

    // Filter by diagram type
    if (filterDiagramType !== 'all') {
      filtered = filtered.filter((s) => s.diagramType === filterDiagramType);
    }

    // Sort
    return filtered.sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      } else {
        // Sort by best score
        const aScore = a.bestResult?.score ?? 0;
        const bScore = b.bestResult?.score ?? 0;
        return bScore - aScore;
      }
    });
  }, [sessions, filterDiagramType, sortBy]);

  // Get unique diagram types
  const diagramTypes = useMemo(() => {
    const types = new Set<DiagramType>();
    sessions.forEach((s) => types.add(s.diagramType));
    return Array.from(types).sort();
  }, [sessions]);

  // Handle session selection toggle
  const handleSelectionToggle = useCallback((sessionId: string) => {
    setSelectedSessionIds((prev) => {
      const next = new Set(prev);
      if (next.has(sessionId)) {
        next.delete(sessionId);
      } else {
        next.add(sessionId);
      }
      return next;
    });
  }, []);

  // Handle compare button
  const handleCompare = useCallback(() => {
    if (onSessionsCompare && selectedSessionIds.size >= 2) {
      onSessionsCompare(Array.from(selectedSessionIds));
    }
  }, [selectedSessionIds, onSessionsCompare]);

  // Format timestamp
  const formatTimestamp = useCallback((timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString();
  }, []);

  return (
    <div
      className="session-history-browser bg-white dark:bg-gray-800 rounded-lg shadow-md p-4"
      data-testid="session-history-browser"
    >
      {/* Header */}
      <div className="header mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          Session History
        </h3>

        {/* Filters and Controls */}
        <div className="flex items-center gap-3 mb-3">
          {/* Diagram Type Filter */}
          <select
            value={filterDiagramType}
            onChange={(e) => setFilterDiagramType(e.target.value as DiagramType | 'all')}
            className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            aria-label="Filter by diagram type"
          >
            <option value="all">All Types</option>
            {diagramTypes.map((type) => (
              <option key={type} value={type}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </option>
            ))}
          </select>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'date' | 'score')}
            className="text-sm bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-1"
            aria-label="Sort by"
          >
            <option value="date">Recent First</option>
            <option value="score">Best Score</option>
          </select>

          {/* Compare Button */}
          {selectedSessionIds.size >= 2 && (
            <button
              onClick={handleCompare}
              className="ml-auto text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded"
              aria-label={`Compare ${selectedSessionIds.size} sessions`}
            >
              Compare ({selectedSessionIds.size})
            </button>
          )}
        </div>
      </div>

      {/* Session List */}
      <div className="session-list space-y-3 max-h-96 overflow-y-auto">
        {filteredSessions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No sessions found
          </div>
        ) : (
          filteredSessions.map((session) => {
            const isExpanded = expandedSessionId === session.sessionId;
            const isSelected = selectedSessionIds.has(session.sessionId);
            const isActive = activeSessionId === session.sessionId;
            const bestScore = session.bestResult?.score ?? 0;
            const scorePercentage = (bestScore * 100).toFixed(1);

            return (
              <div
                key={session.sessionId}
                className={`session-item border rounded-lg p-3 ${
                  isActive
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                    : isSelected
                      ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20'
                      : 'border-gray-200 dark:border-gray-700'
                }`}
                data-testid={`session-${session.sessionId}`}
              >
                {/* Session Header */}
                <div className="flex items-center gap-3">
                  {/* Selection Checkbox */}
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => handleSelectionToggle(session.sessionId)}
                    className="rounded"
                    aria-label={`Select session ${session.name || session.sessionId}`}
                  />

                  {/* Session Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-gray-900 dark:text-white truncate">
                        {session.name || `Session ${session.sessionId.slice(-8)}`}
                      </span>
                      {isActive && (
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded">
                          Active
                        </span>
                      )}
                      {session.paused && (
                        <span className="text-xs bg-yellow-600 text-white px-2 py-0.5 rounded">
                          Paused
                        </span>
                      )}
                      {session.parentSessionId && (
                        <span className="text-xs bg-purple-600 text-white px-2 py-0.5 rounded">
                          Branch
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{session.diagramType}</span>
                      <span>{session.history.length} iterations</span>
                      <span className="font-semibold text-gray-900 dark:text-white">
                        {scorePercentage}%
                      </span>
                      <span className="text-xs">{formatTimestamp(session.updatedAt)}</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setExpandedSessionId(isExpanded ? null : session.sessionId)}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      aria-label={isExpanded ? 'Collapse' : 'Expand'}
                      title={isExpanded ? 'Collapse' : 'Expand'}
                    >
                      {isExpanded ? '▲' : '▼'}
                    </button>

                    {onSessionSelect && (
                      <button
                        onClick={() => onSessionSelect(session.sessionId)}
                        className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
                        aria-label="View session"
                      >
                        View
                      </button>
                    )}

                    {onSessionLoad && session.paused && (
                      <button
                        onClick={() => onSessionLoad(session.sessionId)}
                        className="text-sm text-green-600 dark:text-green-400 hover:underline"
                        aria-label="Resume session"
                      >
                        Resume
                      </button>
                    )}

                    {onSessionDelete && (
                      <button
                        onClick={() => onSessionDelete(session.sessionId)}
                        className="text-sm text-red-600 dark:text-red-400 hover:underline"
                        aria-label="Delete session"
                      >
                        Delete
                      </button>
                    )}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Created:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(session.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Updated:</span>
                        <span className="text-gray-900 dark:text-white">
                          {new Date(session.updatedAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600 dark:text-gray-400">Layout Type:</span>
                        <span className="text-gray-900 dark:text-white">{session.layoutType}</span>
                      </div>
                      {session.parentSessionId && (
                        <div className="flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">Branch From:</span>
                          <span className="text-gray-900 dark:text-white">
                            Iteration {session.branchPoint || 'N/A'}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Iteration Thumbnails Placeholder */}
                    <div className="mt-3">
                      <div className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                        Iterations:
                      </div>
                      <div className="flex gap-2 overflow-x-auto">
                        {session.history.map((iteration) => (
                          <div
                            key={iteration.iteration}
                            className={`flex-shrink-0 w-16 h-16 rounded border ${
                              iteration.isBest
                                ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                                : 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-700'
                            } flex items-center justify-center`}
                            title={`Iteration ${iteration.iteration}: ${(iteration.score * 100).toFixed(1)}%`}
                          >
                            <div className="text-xs text-center">
                              <div className="font-semibold">{iteration.iteration}</div>
                              <div className="text-xs">{(iteration.score * 100).toFixed(0)}%</div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary */}
      {filteredSessions.length > 0 && (
        <div className="summary mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
          Showing {filteredSessions.length} of {sessions.length} sessions
        </div>
      )}
    </div>
  );
};

export default SessionHistoryBrowser;
