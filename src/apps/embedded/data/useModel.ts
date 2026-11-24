/**
 * useModel — thin wrapper over the generated scoped model hook
 * (`GET /api/projects/{project}/checkouts/{checkout}/model`), for the checkout
 * the route names (see checkoutScope.ts).
 *
 * Derives the per-layer element counts and the total relationship count the
 * shell needs (nav tree counts, status bar, footer) from the raw `/api/model`
 * payload (`{ nodes, links }`).
 */

import { useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useGetapiprojectsprojectcheckoutscheckoutmodel } from '../../../core/services/generatedApiClient';
import { SCOPED_QUERY, invalidateCheckout, isCheckoutNotFound, isForCheckout, useCheckoutRef } from './checkoutScope';
import { websocketClient } from '../services/websocketClient';
import { PLAN_VERIFICATION_KEY } from './planVerification';

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
  const ref = useCheckoutRef();
  const query = useGetapiprojectsprojectcheckoutscheckoutmodel(ref?.project ?? '', ref?.checkout ?? '', {
    enabled: !!ref,
    // A 404 is the checkout itself missing: asking again won't bring it back.
    retry: (failures: number, error: unknown) => !isCheckoutNotFound(error) && failures < 3,
  });
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
 * Refetch this checkout's model (and changesets) when the server announces a
 * model change: it broadcasts `{ type: 'model.updated' }` after any write to
 * the model files — a CLI edit, a DrBot change, or a changeset applied from
 * the viewer — and otherwise the 5-minute `staleTime` would keep showing the
 * old model. Mount once (AppShell).
 */
export function useLiveModelUpdates() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  useEffect(() => {
    if (!ref) return;
    const refetch = (message: unknown) => {
      // The websocket client already drops events stamped for another
      // checkout; an unstamped one (an older server) is taken as this one's.
      if (!isForCheckout(message, ref)) return;
      invalidateCheckout(queryClient, ref, [
        SCOPED_QUERY.model,
        SCOPED_QUERY.layer,
        SCOPED_QUERY.changesets,
        SCOPED_QUERY.changeset,
      ]);
      queryClient.invalidateQueries({ queryKey: [PLAN_VERIFICATION_KEY, ref.project, ref.checkout] });
    };
    websocketClient.on(MODEL_UPDATED_EVENT, refetch);
    return () => websocketClient.off(MODEL_UPDATED_EVENT, refetch);
  }, [queryClient, ref]);
}

/** The server's model-change broadcast (see the CLI's `reloadAndBroadcast`). */
export const MODEL_UPDATED_EVENT = 'model.updated';
