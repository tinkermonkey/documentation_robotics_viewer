import { useMemo } from 'react';
import { nodeConfigLoader } from '../nodeConfigLoader';
import type { ChangesetOperation } from '../components';

export interface ChangesetStyling {
  fill: string;
  stroke: string;
  opacity: number;
}

/**
 * Internal pure function that computes changeset styling.
 * This function is extracted to be testable outside of React context.
 * @internal
 */
export function computeChangesetStyling(
  operation: ChangesetOperation | undefined
): ChangesetStyling | null {
  if (!operation) {
    return null;
  }

  const changesetColors = nodeConfigLoader.getChangesetColors(operation);
  return {
    fill: changesetColors.bg,
    stroke: changesetColors.border,
    opacity: changesetColors.opacity ?? 1,
  };
}

/**
 * useChangesetStyling
 *
 * Computes changeset operation styling overrides (color, opacity).
 * Returns null if no changeset operation is active; otherwise returns
 * the color and opacity configuration for the operation type.
 *
 * @param operation - The changeset operation type ('add', 'update', 'delete'), or undefined
 * @returns Object with fill, stroke, and opacity (all required), or null if no operation
 */
export function useChangesetStyling(operation: ChangesetOperation | undefined): ChangesetStyling | null {
  return useMemo(() => computeChangesetStyling(operation), [operation]);
}
