import { useMemo } from 'react';
import BadgeRenderer from '../components/BadgeRenderer';
import type { NodeBadge } from '../components';

/**
 * useBadgeRenderer
 *
 * Returns memoized BadgeRenderer components for each position (top-left, top-right, inline).
 * This hook encapsulates the badge rendering logic, returning pre-configured
 * BadgeRenderer elements ready for insertion in the node layout.
 *
 * @param badges - Array of badge configurations
 * @returns Object with top-left, top-right, and inline BadgeRenderer elements
 */
export function useBadgeRenderer(badges: NodeBadge[]) {
  return useMemo(() => {
    return {
      topLeft: <BadgeRenderer badges={badges} position="top-left" />,
      topRight: <BadgeRenderer badges={badges} position="top-right" />,
      inline: <BadgeRenderer badges={badges} position="inline" />,
    };
  }, [badges]);
}
