/**
 * BadgeRenderer Component
 *
 * Handles rendering of badges at different positions within UnifiedNode.
 * Supports three positions: top-left, top-right, and inline (within header).
 *
 * Badges are positioned using absolute positioning for top-left/top-right
 * and flex layout for inline badges (which push right within the header).
 */

import React, { memo } from 'react';
import { NodeBadge } from './UnifiedNode';

export interface BadgeRendererProps {
  badges: NodeBadge[];
  position: 'top-left' | 'top-right' | 'inline';
}

function BadgeRendererComponent({ badges, position }: BadgeRendererProps): React.ReactElement | null {
  const filteredBadges = badges.filter((b: NodeBadge) => b.position === position);

  if (filteredBadges.length === 0) {
    return null;
  }

  // Top-left and top-right positioned badges use absolute positioning
  if (position === 'top-left' || position === 'top-right') {
    return (
      <div
        style={{
          position: 'absolute',
          top: 4,
          [position === 'top-left' ? 'left' : 'right']: 4,
          display: 'flex',
          gap: 4,
        }}
      >
        {filteredBadges.map((badge: NodeBadge, idx: number) => (
          <span
            key={idx}
            className={badge.className}
            aria-label={badge.ariaLabel}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2px 6px',
              borderRadius: 4,
              fontSize: 11,
              fontWeight: 600,
            }}
          >
            {badge.content}
          </span>
        ))}
      </div>
    );
  }

  // Inline badges (in header) use flex layout with marginLeft: auto to push right
  return (
    <>
      {filteredBadges.map((badge: NodeBadge, idx: number) => (
        <span
          key={idx}
          className={badge.className}
          aria-label={badge.ariaLabel}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginLeft: 'auto',
            padding: '2px 6px',
            borderRadius: 4,
            fontSize: 11,
            fontWeight: 600,
            whiteSpace: 'nowrap',
          }}
        >
          {badge.content}
        </span>
      ))}
    </>
  );
}

const BadgeRenderer = memo(BadgeRendererComponent);
BadgeRenderer.displayName = 'BadgeRenderer';

export default BadgeRenderer;
