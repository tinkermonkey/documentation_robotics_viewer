/**
 * useAnnotations — thin React Query hooks over the kept generated API client for
 * the `/api/annotations` REST surface (list + CRUD + replies).
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

/** React Query key for an element's annotation list. */
export function annotationsKey(elementId: string | null | undefined) {
  return ['annotations', elementId ?? ''] as const;
}

/** React Query key for one annotation's replies. */
export function repliesKey(annotationId: string) {
  return ['annotation-replies', annotationId] as const;
}

/**
 * Annotations for a single element, filtered server-side by `elementId`. Disabled
 * until `elementId` is set, so entering the inspector with nothing selected (or a
 * SPEC node) issues no request.
 */
export function useAnnotations(elementId: string | null | undefined) {
  return useQuery({
    queryKey: annotationsKey(elementId),
    enabled: Boolean(elementId),
    queryFn: async (): Promise<Annotation[]> => {
      const data = (await getApiClient().getapiannotations({
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
  return useQuery({
    queryKey: repliesKey(annotationId),
    enabled,
    queryFn: async (): Promise<AnnotationReply[]> => {
      const data = (await getApiClient().getapiannotationsannotationIdreplies(
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
  return useMutation({
    mutationFn: (input: CreateAnnotationInput): Promise<Annotation> =>
      getApiClient().postapiannotations({
        elementId: input.elementId,
        author: input.author ?? ANNOTATION_AUTHOR,
        content: input.content,
        tags: input.tags ?? [],
      }) as Promise<Annotation>,
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(input.elementId) });
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
  return useMutation({
    mutationFn: (input: UpdateAnnotationInput): Promise<Annotation> => {
      const body: Record<string, unknown> = {};
      if (input.content !== undefined) body.content = input.content;
      if (input.tags !== undefined) body.tags = input.tags;
      if (input.resolved !== undefined) body.resolved = input.resolved;
      return getApiClient().patchapiannotationsannotationId(
        input.id,
        body,
      ) as Promise<Annotation>;
    },
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(input.elementId) });
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
  return useMutation({
    mutationFn: (input: DeleteAnnotationInput): Promise<unknown> =>
      getApiClient().deleteapiannotationsannotationId(input.id),
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: annotationsKey(input.elementId) });
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
  return useMutation({
    mutationFn: (input: AddReplyInput): Promise<AnnotationReply> =>
      getApiClient().postapiannotationsannotationIdreplies(input.annotationId, {
        author: input.author ?? ANNOTATION_AUTHOR,
        content: input.content,
      }) as Promise<AnnotationReply>,
    onSuccess: (_data, input) => {
      queryClient.invalidateQueries({ queryKey: repliesKey(input.annotationId) });
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
  useEffect(() => {
    const refetchAllLists = () =>
      queryClient.invalidateQueries({ queryKey: ['annotations'] });

    const onAdded = (data: unknown) => {
      const { elementId } = (data ?? {}) as AnnotationBroadcast;
      if (elementId) {
        queryClient.invalidateQueries({ queryKey: annotationsKey(elementId) });
      } else {
        refetchAllLists();
      }
    };
    const onUpdated = () => {
      refetchAllLists();
    };
    const onReplyAdded = (data: unknown) => {
      const { annotationId } = (data ?? {}) as AnnotationBroadcast;
      if (annotationId) {
        queryClient.invalidateQueries({ queryKey: repliesKey(annotationId) });
      }
    };
    const onDeleted = (data: unknown) => {
      const { annotationId } = (data ?? {}) as AnnotationBroadcast;
      // Refetch the lists first, then drop the replies only if nothing shows
      // them any more: removing a query that a mounted thread still observes
      // makes it refetch, and the deleted annotation's replies are a 404.
      void refetchAllLists().then(() => {
        if (annotationId) {
          queryClient.removeQueries({ queryKey: repliesKey(annotationId), type: 'inactive' });
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
  }, [queryClient]);
}
