/**
 * A node type's singular display name, from the live spec (#605): the hook
 * form of `specTypeLabel` for views that name one type at a time beside its
 * layer ("application · Application Component"). Before the spec loads, the
 * type id stands in for the title.
 */

import { useMemo } from 'react';
import { useSpec } from './useSpec';
import { specTypeLabel } from './typeLabel';
import type { TypeNameOf } from './changesetReview';

export function useTypeName(): TypeNameOf {
  const { derived: spec } = useSpec();
  return useMemo(
    () => (layerId: string, type: string) => specTypeLabel(spec.byLayer[layerId], layerId, type).singular,
    [spec],
  );
}
