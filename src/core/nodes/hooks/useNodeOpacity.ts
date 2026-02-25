import { useMemo } from 'react';
import type { ChangesetOperation } from '../components';
import { nodeConfigLoader } from '../nodeConfigLoader';

interface UseNodeOpacityOptions {
  changesetOperation?: ChangesetOperation;
}

/**
 * useNodeOpacity
 *
 * Computes node opacity based on changeset operation styling.
 * The changeset operation determines the final opacity value.
 * If no changeset operation is active, returns 1 (fully opaque).
 *
 * @param options - Configuration object with optional changesetOperation
 * @returns Opacity value (0-1)
 */
export function useNodeOpacity(options: UseNodeOpacityOptions): number {
  const { changesetOperation } = options;

  return useMemo(() => {
    if (!changesetOperation) {
      return 1;
    }

    const changesetColors = nodeConfigLoader.getChangesetColors(changesetOperation);
    return changesetColors.opacity ?? 1;
  }, [changesetOperation]);
}
