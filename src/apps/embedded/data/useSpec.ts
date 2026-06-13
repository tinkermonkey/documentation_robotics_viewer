/**
 * useSpec — thin wrapper over the kept React Query hook `useGetapispec`.
 *
 * The `/api/spec` payload is `{ version, schemas, ... }` where `schemas` is a
 * dict keyed by filename. Most entries are per-layer schemas carrying
 * `layer.id`, `layer.node_types[]`, and an inspiring standard; a few entries
 * (analyzers, manifest, base) are not layer schemas and are ignored here.
 *
 * Derives per-layer node-type counts + standard label + the spec version the
 * shell footer / status bar need.
 */

import { useMemo } from 'react';
import { useGetapispec } from '../../../core/services/generatedApiClient';
import { layerStandard } from '../ui/domain';

interface SpecLayerBlock {
  id?: string;
  name?: string;
  node_types?: string[];
  inspired_by?: { standard?: string };
}

interface SpecSchemaEntry {
  specVersion?: string;
  layer?: SpecLayerBlock;
  [key: string]: unknown;
}

export interface SpecPayload {
  version?: string;
  schemas?: Record<string, SpecSchemaEntry>;
  schemaCount?: number;
  [key: string]: unknown;
}

export interface SpecLayerInfo {
  /** Number of node-types declared by the layer schema. */
  typeCount: number;
  /** Ordered node-type ids (short, layer-prefix stripped). */
  typeIds: string[];
  /** Inspiring standard label. */
  standard: string;
}

export interface SpecDerived {
  version: string;
  /** Per-layer schema info keyed by layer slug. */
  byLayer: Record<string, SpecLayerInfo>;
}

const EMPTY_DERIVED: SpecDerived = { version: '', byLayer: {} };

/** Strip a `layer.` prefix from a node-type id (e.g. 'motivation.goal' -> 'goal'). */
function shortTypeId(layerId: string, nodeTypeId: string): string {
  const prefix = `${layerId}.`;
  return nodeTypeId.startsWith(prefix)
    ? nodeTypeId.slice(prefix.length)
    : nodeTypeId;
}

export function useSpec() {
  const query = useGetapispec();
  const raw = query.data as SpecPayload | undefined;

  const derived = useMemo<SpecDerived>(() => {
    if (!raw?.schemas) return EMPTY_DERIVED;

    const byLayer: Record<string, SpecLayerInfo> = {};

    for (const entry of Object.values(raw.schemas)) {
      const layer = entry.layer;
      if (!layer?.id) continue;
      const nodeTypes = layer.node_types ?? [];
      byLayer[layer.id] = {
        typeCount: nodeTypes.length,
        typeIds: nodeTypes.map((t) => shortTypeId(layer.id as string, t)),
        standard: layer.inspired_by?.standard ?? layerStandard(layer.id),
      };
    }

    return {
      version: raw.version ?? '',
      byLayer,
    };
  }, [raw]);

  return { ...query, derived };
}
