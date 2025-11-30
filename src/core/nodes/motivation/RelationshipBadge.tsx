/**
 * RelationshipBadge Component
 *
 * Displays relationship count badge on dimmed motivation nodes during focus mode.
 * Shows total connections and directional breakdown.
 */

import React from 'react';

export interface RelationshipBadgeData {
  /** Total relationship count */
  count: number;

  /** Incoming relationship count */
  incoming: number;

  /** Outgoing relationship count */
  outgoing: number;
}

export interface RelationshipBadgeProps {
  /** Badge data */
  badge: RelationshipBadgeData;

  /** Whether the node is currently dimmed */
  isDimmed: boolean;
}

/**
 * Relationship Badge Component
 * Only displays when the node is dimmed (opacity < 1)
 */
export const RelationshipBadge: React.FC<RelationshipBadgeProps> = ({ badge, isDimmed }) => {
  if (!isDimmed || badge.count === 0) {
    return null;
  }

  return (
    <div
      role="status"
      aria-label={`${badge.count} total relationships: ${badge.incoming} incoming, ${badge.outgoing} outgoing`}
      style={{
        position: 'absolute',
        top: -8,
        right: -8,
        minWidth: 24,
        height: 24,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#3b82f6',
        color: 'white',
        borderRadius: '50%',
        fontSize: 11,
        fontWeight: 'bold',
        padding: '0 6px',
        border: '2px solid white',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        zIndex: 10,
        cursor: 'help',
      }}
      title={`${badge.count} relationships (${badge.incoming} in, ${badge.outgoing} out)`}
    >
      {badge.count}
    </div>
  );
};
