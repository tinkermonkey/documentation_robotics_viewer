/**
 * useSpec — thin wrapper over the kept React Query hook `useGetapispec`.
 *
 * The `/api/spec` payload is `{ version, schemas, ... }` where `schemas` is a
 * dict keyed by filename. Most entries are per-layer schemas carrying `layer`,
 * `nodeSchemas` (keyed by short type name), and `relationshipSchemas`; a few
 * entries (analyzers, manifest, base) are not layer schemas and are ignored.
 *
 * Derives per-layer node-type counts + node-type titles + standard label + the
 * spec version the shell footer / status bar need. Counts come from
 * `Object.keys(nodeSchemas)` — `layer.node_types` can be empty even when the
 * layer has node-types (e.g. data-model), so it must NOT be used for counts.
 *
 * `raw` exposes the unmodified `/api/spec` payload for the Schema-view
 * transforms in `specGraph.ts` (the React Query cache is shared, so this is the
 * same single fetch the nav tree / status bar already consume).
 */

import { useMemo } from 'react';
import { useGetapispec } from '../../../core/services/generatedApiClient';
import { layerStandard } from '../ui/domain';
import type { SpecPayload } from './specGraph';

interface SpecLayerBlock {
  id?: string;
  name?: string;
  node_types?: string[];
  inspired_by?: { standard?: string };
}

interface SpecNodeSchema {
  title?: string;
  [key: string]: unknown;
}

interface SpecSchemaEntry {
  specVersion?: string;
  layer?: SpecLayerBlock;
  nodeSchemas?: Record<string, SpecNodeSchema>;
  [key: string]: unknown;
}

export type { SpecPayload };

export interface SpecLayerInfo {
  /** Number of node-types declared by the layer schema (`nodeSchemas` keys). */
  typeCount: number;
  /** Ordered node-type ids (short type names, e.g. 'objectschema'). */
  typeIds: string[];
  /** Ordered node-type titles (e.g. 'ObjectSchema'), aligned with typeIds. */
  typeTitles: string[];
  /** Inspiring standard label. */
  standard: string;
}

export interface SpecDerived {
  version: string;
  /** Per-layer schema info keyed by layer slug. */
  byLayer: Record<string, SpecLayerInfo>;
}

const EMPTY_DERIVED: SpecDerived = { version: '', byLayer: {} };

export function useSpec() {
  const query = useGetapispec();
  const raw = query.data as SpecPayload | undefined;

  const derived = useMemo<SpecDerived>(() => {
    if (!raw?.schemas) return EMPTY_DERIVED;

    const byLayer: Record<string, SpecLayerInfo> = {};

    for (const value of Object.values(raw.schemas)) {
      const entry = value as SpecSchemaEntry;
      const layer = entry.layer;
      if (!layer?.id) continue;
      // CAUTION: `layer.node_types` can be empty even when node-types exist —
      // derive the canonical list from `nodeSchemas` keys instead.
      const nodeSchemas = entry.nodeSchemas ?? {};
      const typeIds = Object.keys(nodeSchemas);
      byLayer[layer.id] = {
        typeCount: typeIds.length,
        typeIds,
        typeTitles: typeIds.map((id) => nodeSchemas[id]?.title ?? id),
        standard: layer.inspired_by?.standard ?? layerStandard(layer.id),
      };
    }

    return {
      version: raw.version ?? '',
      byLayer,
    };
  }, [raw]);

  return { ...query, derived, raw };
}
