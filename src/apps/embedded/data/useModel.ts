/**
 * useModel — thin wrapper over the kept React Query hook `useGetapimodel`.
 *
 * Derives the per-layer element counts and the total relationship count the
 * shell needs (nav tree counts, status bar, footer) from the raw `/api/model`
 * payload (`{ nodes, links }`).
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetapimodel } from '../../../core/services/generatedApiClient';
import { websocketClient } from '../services/websocketClient';

export interface ModelNode {
  id: string;
  spec_node_id?: string;
  type: string;
  layer_id: string;
  name: string;
  description?: string;
  attributes?: Record<string, unknown>;
  [key: string]: unknown;
}

export interface ModelLink {
  id: string;
  source: string;
  target: string;
  type: string;
  layer_id?: string;
  [key: string]: unknown;
}

export interface ModelPayload {
  nodes: ModelNode[];
  links: ModelLink[];
}

export interface ModelDerived {
  nodes: ModelNode[];
  links: ModelLink[];
  /** Element count per layer slug. */
  countsByLayer: Record<string, number>;
  /** Elements grouped by layer slug, in payload order. */
  nodesByLayer: Record<string, ModelNode[]>;
  /** Total relationship (link) count across the model. */
  relCount: number;
}

const EMPTY_DERIVED: ModelDerived = {
  nodes: [],
  links: [],
  countsByLayer: {},
  nodesByLayer: {},
  relCount: 0,
};

export function useModel() {
  const query = useGetapimodel();
  const raw = query.data as ModelPayload | undefined;

  const derived = useMemo<ModelDerived>(() => {
    if (!raw?.nodes) return EMPTY_DERIVED;

    const countsByLayer: Record<string, number> = {};
    const nodesByLayer: Record<string, ModelNode[]> = {};

    for (const node of raw.nodes) {
      const layer = node.layer_id;
      if (!layer) continue;
      countsByLayer[layer] = (countsByLayer[layer] ?? 0) + 1;
      (nodesByLayer[layer] ??= []).push(node);
    }

    return {
      nodes: raw.nodes,
      links: raw.links ?? [],
      countsByLayer,
      nodesByLayer,
      relCount: raw.links?.length ?? 0,
    };
  }, [raw]);

  return { ...query, derived };
}

/**
 * Refetch the model (and changesets) when the `dr visualize` server announces a
 * model change: it broadcasts `{ type: 'model.updated' }` after any write to
 * the model files — a CLI edit, a DrBot change, or a changeset applied from
 * the viewer — and otherwise the 5-minute `staleTime` would keep showing the
 * old model. Mount once (AppShell).
 */
export function useLiveModelUpdates() {
  const queryClient = useQueryClient();
  useEffect(() => {
    const refetch = () => {
      queryClient.invalidateQueries({ queryKey: ['getapimodel'] });
      queryClient.invalidateQueries({ queryKey: ['getapilayerslayerName'] });
      queryClient.invalidateQueries({ queryKey: ['getapichangesets'] });
      queryClient.invalidateQueries({ queryKey: ['getapichangesetschangesetId'] });
    };
    websocketClient.on(MODEL_UPDATED_EVENT, refetch);
    return () => websocketClient.off(MODEL_UPDATED_EVENT, refetch);
  }, [queryClient]);
}

/** The server's model-change broadcast (see the CLI's `reloadAndBroadcast`). */
export const MODEL_UPDATED_EVENT = 'model.updated';
