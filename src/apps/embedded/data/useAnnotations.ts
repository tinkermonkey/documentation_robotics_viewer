/**
 * useAnnotations — thin React Query hooks over the kept generated API client for
 * the annotations REST surface (list + CRUD + replies) of the checkout the
 * route names: `/api/projects/{project}/checkouts/{checkout}/annotations...`.
 *
 * The generated `useGetapiannotations` hook ignores the `elementId` filter and
 * uses a single fixed query key, so these hooks call the shared `getApiClient()`
 * singleton directly (same base URL + `Authorization: Bearer` header + the global
 * fetch interceptor) while keying the cache by `elementId`. Mutations invalidate
 * the affected element's list (and the annotation's replies) so the inspector
 * section re-fetches without manual refresh.
 *
 * `elementId` is the canonical DOTTED id (`{layer}.{type}.{slug(name)}`) derived
 * via `dottedId(node)` — NOT the node UUID (verified against a live POST). Author
 * defaults to a constant since this build has no user identity (auth is off).
 */

import { useEffect } from 'react';
import {
  useQuery,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query';
import { getApiClient } from '../../../core/services/generatedApiClient';
import { websocketClient } from '../services/websocketClient';
import { isForCheckout, useCheckoutRef, type CheckoutRef } from './checkoutScope';

/** The checkout a write goes to; a write is never sent without one. */
function requireRef(ref: CheckoutRef | null): CheckoutRef {
  if (!ref) throw new Error('No checkout is open.');
  return ref;
}

/** Author used for created annotations/replies (no user identity in this build). */
export const ANNOTATION_AUTHOR = 'You';

export interface AnnotationReply {
  id: string;
  author: string;
  content: string;
  createdAt: string;
}

export interface Annotation {
  id: string;
  elementId: string;
  author: string;
  content: string;
  createdAt: string;
  updatedAt?: string;
  tags: string[];
  resolved: boolean;
  replies?: AnnotationReply[];
}

interface AnnotationsListResponse {
  annotations?: Annotation[];
}

interface RepliesResponse {
  replies?: AnnotationReply[];
}

/** Tag segment validation, mirroring the API contract. */
const TAG_RE = /^[a-z0-9][a-z0-9-]*[a-z0-9]$|^[a-z0-9]$/;

export function isValidTag(tag: string): boolean {
  return TAG_RE.test(tag);
}

/** React Query key for an element's annotation list in one checkout. */
export function annotationsKey(ref: CheckoutRef | null, elementId: string | null | undefined) {
  return ['annotations', ref?.project ?? '', ref?.checkout ?? '', elementId ?? ''] as const;
}

/** React Query key for one annotation's replies in one checkout. */
export function repliesKey(ref: CheckoutRef | null, annotationId: string) {
  return ['annotation-replies', ref?.project ?? '', ref?.checkout ?? '', annotationId] as const;
}

/**
 * Annotations for a single element, filtered server-side by `elementId`. Disabled
 * until `elementId` is set, so entering the inspector with nothing selected (or a
 * SPEC node) issues no request.
 */
export function useAnnotations(elementId: string | null | undefined) {
  const ref = useCheckoutRef();
  return useQuery({
    queryKey: annotationsKey(ref, elementId),
    enabled: Boolean(elementId) && !!ref,
    queryFn: async (): Promise<Annotation[]> => {
      const { project, checkout } = requireRef(ref);
      const data = (await getApiClient().getapiprojectsprojectcheckoutscheckoutannotations(project, checkout, {
        elementId: elementId as string,
      })) as AnnotationsListResponse;
      return data.annotations ?? [];
    },
  });
}

/**
 * Replies for one annotation. The list endpoint does not embed replies, so they
 * are fetched per annotation (enabled by default; the section only mounts a
 * reply query for annotations it renders).
 */
export function useReplies(annotationId: string, enabled = true) {
  const ref = useCheckoutRef();
  return useQuery({
    queryKey: repliesKey(ref, annotationId),
    enabled: enabled && !!ref,
    queryFn: async (): Promise<AnnotationReply[]> => {
      const { project, checkout } = requireRef(ref);
      const data = (await getApiClient().getapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(
        project,
        checkout,
        annotationId,
      )) as RepliesResponse;
      return data.replies ?? [];
    },
  });
}

export interface CreateAnnotationInput {
  elementId: string;
  content: string;
  tags?: string[];
  author?: string;
}

/** POST a new annotation, then invalidate the element's list. */
export function useCreateAnnotation() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  return useMutation({
    mutationFn: (input: CreateAnnotationInput): Promise<Annotation> =>
      getApiClient().postapiprojectsprojectcheckoutscheckoutannotations(requireRef(ref).project, requireRef(ref).checkout, {
        elementId: input.elementId,
        author: input.author ?? ANNOTATION_AUTHOR,
        content: input.content,
        tags: input.tags ?? [],
      }) as Promise<Annotation>,
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(ref, input.elementId) });
    },
  });
}

export interface UpdateAnnotationInput {
  id: string;
  elementId: string;
  content?: string;
  tags?: string[];
  resolved?: boolean;
}

/** PATCH an annotation (content/tags/resolved), then invalidate its element list. */
export function useUpdateAnnotation() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  return useMutation({
    mutationFn: (input: UpdateAnnotationInput): Promise<Annotation> => {
      const { project, checkout } = requireRef(ref);
      const body: Record<string, unknown> = {};
      if (input.content !== undefined) body.content = input.content;
      if (input.tags !== undefined) body.tags = input.tags;
      if (input.resolved !== undefined) body.resolved = input.resolved;
      return getApiClient().patchapiprojectsprojectcheckoutscheckoutannotationsannotationId(
        project,
        checkout,
        input.id,
        body,
      ) as Promise<Annotation>;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(ref, input.elementId) });
    },
  });
}

export interface DeleteAnnotationInput {
  id: string;
  elementId: string;
}

/** DELETE an annotation, then invalidate its element list. */
export function useDeleteAnnotation() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  return useMutation({
    mutationFn: (input: DeleteAnnotationInput): Promise<unknown> =>
      getApiClient().deleteapiprojectsprojectcheckoutscheckoutannotationsannotationId(
        requireRef(ref).project,
        requireRef(ref).checkout,
        input.id,
      ),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(ref, input.elementId) });
    },
  });
}

export interface AddReplyInput {
  annotationId: string;
  content: string;
  author?: string;
}

/** POST a reply, then invalidate that annotation's replies. */
export function useAddReply() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  return useMutation({
    mutationFn: (input: AddReplyInput): Promise<AnnotationReply> =>
      getApiClient().postapiprojectsprojectcheckoutscheckoutannotationsannotationIdreplies(
        requireRef(ref).project,
        requireRef(ref).checkout,
        input.annotationId,
        {
        author: input.author ?? ANNOTATION_AUTHOR,
          content: input.content,
        },
      ) as Promise<AnnotationReply>,
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: repliesKey(ref, input.annotationId) });
    },
  });
}

// ─── Live updates ─────────────────────────────────────────────────────────────

/** The server's annotation broadcasts (see the CLI's `diffAnnotation` / `syncAnnotations`). */
export const ANNOTATION_ADDED_EVENT = 'annotation.added';
export const ANNOTATION_UPDATED_EVENT = 'annotation.updated';
export const ANNOTATION_REPLY_ADDED_EVENT = 'annotation.reply.added';
export const ANNOTATION_DELETED_EVENT = 'annotation.deleted';

interface AnnotationBroadcast {
  annotationId?: string;
  elementId?: string;
  replyId?: string;
  timestamp?: string;
}

/**
 * Refetch annotations when the `dr visualize` server announces a change to
 * them. The REST routes and its file watcher broadcast `annotation.added`,
 * `annotation.updated`, `annotation.reply.added` and `annotation.deleted`, so
 * comments an agent writes through the MCP tools (or another tab, or the CLI)
 * show up without a reload. Every handler only invalidates, so the echo of the
 * viewer's own writes just refetches — nothing is inserted twice.
 * `annotation.updated` and `annotation.deleted` carry no `elementId`, so they
 * refetch every element's list. Mount once (AppShell).
 */
export function useLiveAnnotationUpdates() {
  const queryClient = useQueryClient();
  const ref = useCheckoutRef();
  useEffect(() => {
    if (!ref) return;
    const refetchAllLists = () =>
      queryClient.invalidateQueries({ queryKey: ['annotations', ref.project, ref.checkout] });

    const onAdded = (data: unknown) => {
      if (!isForCheckout(data, ref)) return;
      const { elementId } = (data ?? {}) as AnnotationBroadcast;
      if (elementId) {
        queryClient.invalidateQueries({ queryKey: annotationsKey(ref, elementId) });
      } else {
        refetchAllLists();
      }
    };
    const onUpdated = (data: unknown) => {
      if (!isForCheckout(data, ref)) return;
      refetchAllLists();
    };
    const onReplyAdded = (data: unknown) => {
      if (!isForCheckout(data, ref)) return;
      const { annotationId } = (data ?? {}) as AnnotationBroadcast;
      if (annotationId) {
        queryClient.invalidateQueries({ queryKey: repliesKey(ref, annotationId) });
      }
    };
    const onDeleted = (data: unknown) => {
      if (!isForCheckout(data, ref)) return;
      const { annotationId } = (data ?? {}) as AnnotationBroadcast;
      // Refetch the lists first, then drop the replies only if nothing shows
      // them any more: removing a query that a mounted thread still observes
      // makes it refetch, and the deleted annotation's replies are a 404.
      void refetchAllLists().then(() => {
        if (annotationId) {
          queryClient.removeQueries({ queryKey: repliesKey(ref, annotationId), type: 'inactive' });
        }
      });
    };

    websocketClient.on(ANNOTATION_ADDED_EVENT, onAdded);
    websocketClient.on(ANNOTATION_UPDATED_EVENT, onUpdated);
    websocketClient.on(ANNOTATION_REPLY_ADDED_EVENT, onReplyAdded);
    websocketClient.on(ANNOTATION_DELETED_EVENT, onDeleted);
    return () => {
      websocketClient.off(ANNOTATION_ADDED_EVENT, onAdded);
      websocketClient.off(ANNOTATION_UPDATED_EVENT, onUpdated);
      websocketClient.off(ANNOTATION_REPLY_ADDED_EVENT, onReplyAdded);
      websocketClient.off(ANNOTATION_DELETED_EVENT, onDeleted);
    };
  }, [queryClient, ref]);
}
