import { useMemo } from 'react';
import { nodeConfigLoader } from '../nodeConfigLoader';
import type { ChangesetOperation } from '../components';

/**
 * useChangesetStyling
 *
 * Computes changeset operation styling overrides (color, opacity).
 * Returns null if no changeset operation is active; otherwise returns
 * the color and opacity configuration for the operation type.
 *
 * @param operation - The changeset operation type ('add', 'update', 'delete'), or undefined
 * @returns Object with fill, stroke, and optional opacity, or null if no operation
 */
export function useChangesetStyling(operation: ChangesetOperation | undefined) {
  return useMemo(() => {
    if (!operation) {
      return null;
    }

    const changesetColors = nodeConfigLoader.getChangesetColors(operation);
    return {
      fill: changesetColors.bg,
      stroke: changesetColors.border,
      opacity: changesetColors.opacity ?? 1,
    };
  }, [operation]);
}
