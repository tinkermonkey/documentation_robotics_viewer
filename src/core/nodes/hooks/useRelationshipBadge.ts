import { useMemo } from 'react';
import type { RelationshipBadgeData } from '../components';

/**
 * useRelationshipBadge
 *
 * Returns relationship badge data if present in node data.
 * This hook is a simple accessor that extracts the badge data
 * from the node's data object.
 *
 * @param relationshipBadge - The relationship badge data from node.data
 * @returns The relationship badge data, or undefined if not present
 */
export function useRelationshipBadge(relationshipBadge: RelationshipBadgeData | undefined) {
  return useMemo(() => relationshipBadge, [relationshipBadge]);
}
