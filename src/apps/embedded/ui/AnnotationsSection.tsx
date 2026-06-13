/**
 * AnnotationsSection — the inspector's annotations/comments surface for a single
 * Model element, bound to the live `/api/annotations` REST CRUD + replies API.
 *
 * Mounted inside `Inspector.tsx` for the MODEL view only (when an element is
 * selected). The `elementId` prop is the canonical DOTTED id
 * (`{layer}.{type}.{slug(name)}`) from `dottedId(selectedNode)` — the form the
 * API requires (NOT the node UUID).
 *
 * Renders an `ANNOTATIONS` eyebrow header with a count, an add composer
 * (`TextArea` content + optional tags + `Button`), and the list. Each annotation
 * shows author / relative timestamp / content / tag `Chip`s / a resolved
 * indicator, its replies (indented, fetched per annotation), a reply composer,
 * and a `RowMenu` with Edit / Resolve(toggle) / Delete. Edit swaps content into a
 * `TextArea`; Delete opens a `ConfirmDialog`. Success/error surface via `Toast`.
 *
 * Visual language matches the existing inspector: mono ids/eyebrows
 * (JetBrains Mono), `rgb(var(--canvas-*))` tokens (so `.dark-canvas` flips it),
 * and `inspector-panel__eyebrow`-style section labels.
 */

import { useMemo, useState } from 'react';
import {
  Button,
  Chip,
  RowMenu,
  TextArea,
  TextInput,
  ConfirmDialog,
  Toast,
  type ToastVariant,
} from '@tinkermonkey/heimdall-ui';
import {
  useAnnotations,
  useReplies,
  useCreateAnnotation,
  useUpdateAnnotation,
  useDeleteAnnotation,
  useAddReply,
  isValidTag,
  type Annotation,
} from '../data/useAnnotations';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Compact relative timestamp (e.g. "3m ago", "2d ago"); ISO is the title. */
function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  if (Number.isNaN(then)) return iso;
  const diff = Date.now() - then;
  const sec = Math.round(diff / 1000);
  if (sec < 45) return 'just now';
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  if (day < 30) return `${day}d ago`;
  const mo = Math.round(day / 30);
  if (mo < 12) return `${mo}mo ago`;
  return `${Math.round(mo / 12)}y ago`;
}

/** Parse a comma/space-separated tags string into a deduped, trimmed list. */
function parseTags(raw: string): string[] {
  const seen = new Set<string>();
  for (const part of raw.split(/[\s,]+/)) {
    const t = part.trim().toLowerCase();
    if (t) seen.add(t);
  }
  return [...seen];
}

// ─── Shared inline styles (canvas tokens, mono conventions) ───────────────────

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10.5,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'rgb(var(--canvas-fg-3))',
  fontWeight: 500,
};

const monoMeta: React.CSSProperties = {
  fontFamily: "'JetBrains Mono', monospace",
  fontSize: 10.5,
  color: 'rgb(var(--canvas-fg-3))',
};

const cardStyle: React.CSSProperties = {
  background: 'rgb(var(--canvas-card))',
  border: '1px solid rgb(var(--canvas-border))',
  borderRadius: 8,
  padding: '10px 12px',
};

// ─── Add composer ─────────────────────────────────────────────────────────────

interface AddComposerProps {
  elementId: string;
  notify: (variant: ToastVariant, title: string) => void;
}

function AddComposer({ elementId, notify }: AddComposerProps) {
  const [content, setContent] = useState('');
  const [tagsRaw, setTagsRaw] = useState('');
  const create = useCreateAnnotation();

  const trimmed = content.trim();
  const tags = useMemo(() => parseTags(tagsRaw), [tagsRaw]);
  const badTags = tags.filter((t) => !isValidTag(t));
  const canSubmit =
    trimmed.length >= 1 &&
    trimmed.length <= 5000 &&
    badTags.length === 0 &&
    !create.isPending;

  const submit = () => {
    if (!canSubmit) return;
    create.mutate(
      { elementId, content: trimmed, tags },
      {
        onSuccess: () => {
          setContent('');
          setTagsRaw('');
          notify('success', 'Annotation added');
        },
        onError: () => notify('error', 'Failed to add annotation'),
      },
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <TextArea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Add an annotation…"
        rows={3}
        aria-label="New annotation content"
        data-testid="annotation-add-content"
      />
      <TextInput
        mono
        value={tagsRaw}
        onChange={(e) => setTagsRaw(e.target.value)}
        placeholder="tags (space or comma separated)"
        error={badTags.length > 0}
        aria-label="New annotation tags"
        data-testid="annotation-add-tags"
      />
      {badTags.length > 0 && (
        <span style={{ ...monoMeta, color: 'rgb(var(--status-rose))' }}>
          invalid tag{badTags.length > 1 ? 's' : ''}: {badTags.join(', ')}
        </span>
      )}
      <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          variant="accent"
          size="sm"
          disabled={!canSubmit}
          onClick={submit}
          data-testid="annotation-add-submit"
        >
          {create.isPending ? 'Adding…' : 'Add'}
        </Button>
      </div>
    </div>
  );
}

// ─── Replies ──────────────────────────────────────────────────────────────────

interface RepliesProps {
  annotationId: string;
  /** Replies are fetched only once the disclosure is expanded (lazy). */
  expanded: boolean;
  notify: (variant: ToastVariant, title: string) => void;
}

function Replies({ annotationId, expanded, notify }: RepliesProps) {
  const { data: replies = [], isLoading } = useReplies(annotationId, expanded);
  const addReply = useAddReply();
  const [draft, setDraft] = useState('');

  const trimmed = draft.trim();
  const canSubmit =
    trimmed.length >= 1 && trimmed.length <= 5000 && !addReply.isPending;

  const submit = () => {
    if (!canSubmit) return;
    addReply.mutate(
      { annotationId, content: trimmed },
      {
        onSuccess: () => {
          setDraft('');
          notify('success', 'Reply added');
        },
        onError: () => notify('error', 'Failed to add reply'),
      },
    );
  };

  return (
    <div
      style={{
        marginTop: 8,
        paddingLeft: 12,
        borderLeft: '2px solid rgb(var(--canvas-border))',
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
      data-testid="annotation-replies"
    >
      {isLoading && replies.length === 0 ? (
        <span style={monoMeta}>loading replies…</span>
      ) : (
        replies.map((reply) => (
          <div key={reply.id} style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 600,
                  color: 'rgb(var(--canvas-fg-1))',
                }}
              >
                {reply.author}
              </span>
              <span style={monoMeta} title={reply.createdAt}>
                {relativeTime(reply.createdAt)}
              </span>
            </div>
            <p
              style={{
                margin: 0,
                fontSize: 12.5,
                lineHeight: 1.5,
                color: 'rgb(var(--canvas-fg-2))',
                whiteSpace: 'pre-wrap',
                overflowWrap: 'anywhere',
              }}
            >
              {reply.content}
            </p>
          </div>
        ))
      )}
      <div style={{ display: 'flex', gap: 6, alignItems: 'flex-start' }}>
        <TextInput
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="Reply…"
          aria-label="Reply content"
          data-testid="annotation-reply-input"
          style={{ flex: 1 }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
        />
        <Button
          variant="secondary"
          size="sm"
          disabled={!canSubmit}
          onClick={submit}
          data-testid="annotation-reply-submit"
        >
          Reply
        </Button>
      </div>
    </div>
  );
}

// ─── Single annotation ────────────────────────────────────────────────────────

interface AnnotationItemProps {
  annotation: Annotation;
  elementId: string;
  notify: (variant: ToastVariant, title: string) => void;
}

function AnnotationItem({ annotation, elementId, notify }: AnnotationItemProps) {
  const update = useUpdateAnnotation();
  const del = useDeleteAnnotation();

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(annotation.content);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [repliesOpen, setRepliesOpen] = useState(false);

  const trimmed = draft.trim();
  const canSave =
    trimmed.length >= 1 &&
    trimmed.length <= 5000 &&
    trimmed !== annotation.content &&
    !update.isPending;

  const saveEdit = () => {
    if (!canSave) return;
    update.mutate(
      { id: annotation.id, elementId, content: trimmed },
      {
        onSuccess: () => {
          setEditing(false);
          notify('success', 'Annotation updated');
        },
        onError: () => notify('error', 'Failed to update annotation'),
      },
    );
  };

  const toggleResolve = () => {
    update.mutate(
      { id: annotation.id, elementId, resolved: !annotation.resolved },
      {
        onSuccess: () =>
          notify('success', annotation.resolved ? 'Reopened' : 'Resolved'),
        onError: () => notify('error', 'Failed to update annotation'),
      },
    );
  };

  const confirmDelete = () => {
    del.mutate(
      { id: annotation.id, elementId },
      {
        onSuccess: () => {
          setConfirmOpen(false);
          notify('success', 'Annotation deleted');
        },
        onError: () => {
          setConfirmOpen(false);
          notify('error', 'Failed to delete annotation');
        },
      },
    );
  };

  const handleAction = (actionId: string) => {
    if (actionId === 'edit') {
      setDraft(annotation.content);
      setEditing(true);
    } else if (actionId === 'resolve') {
      toggleResolve();
    } else if (actionId === 'delete') {
      setConfirmOpen(true);
    }
  };

  return (
    <div style={cardStyle} data-testid="annotation-item" data-resolved={annotation.resolved}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 6,
        }}
      >
        <span
          style={{ fontSize: 12.5, fontWeight: 600, color: 'rgb(var(--canvas-fg-1))' }}
        >
          {annotation.author}
        </span>
        <span style={monoMeta} title={annotation.createdAt}>
          {relativeTime(annotation.createdAt)}
        </span>
        {annotation.resolved && (
          <Chip variant="emerald" data-testid="annotation-resolved-chip">
            resolved
          </Chip>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <RowMenu
            placement="bottom-end"
            triggerLabel="Annotation actions"
            actions={[
              { id: 'edit', label: 'Edit', icon: 'edit' },
              {
                id: 'resolve',
                label: annotation.resolved ? 'Reopen' : 'Resolve',
                icon: 'check',
              },
              { type: 'separator' },
              { id: 'delete', label: 'Delete', icon: 'trash', danger: true },
            ]}
            onAction={handleAction}
          />
        </div>
      </div>

      {editing ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <TextArea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            rows={3}
            aria-label="Edit annotation content"
            data-testid="annotation-edit-content"
            autoFocus
          />
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 6 }}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setEditing(false)}
              data-testid="annotation-edit-cancel"
            >
              Cancel
            </Button>
            <Button
              variant="accent"
              size="sm"
              disabled={!canSave}
              onClick={saveEdit}
              data-testid="annotation-edit-save"
            >
              {update.isPending ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </div>
      ) : (
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.55,
            color: 'rgb(var(--canvas-fg-2))',
            whiteSpace: 'pre-wrap',
            overflowWrap: 'anywhere',
          }}
        >
          {annotation.content}
        </p>
      )}

      {annotation.tags.length > 0 && (
        <div
          style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 8 }}
          data-testid="annotation-tags"
        >
          {annotation.tags.map((tag) => (
            <Chip key={tag} form="id-tag">
              {tag}
            </Chip>
          ))}
        </div>
      )}

      <div style={{ marginTop: 8 }}>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setRepliesOpen((o) => !o)}
          aria-expanded={repliesOpen}
          data-testid="annotation-replies-toggle"
        >
          {repliesOpen ? 'Hide replies' : 'Replies'}
        </Button>
      </div>

      {repliesOpen && (
        <Replies annotationId={annotation.id} expanded={repliesOpen} notify={notify} />
      )}

      <ConfirmDialog
        isOpen={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={confirmDelete}
        title="Delete annotation"
        message="This permanently removes the annotation and its replies. Continue?"
        confirmLabel={del.isPending ? 'Deleting…' : 'Delete'}
        variant="danger"
      />
    </div>
  );
}

// ─── Section ──────────────────────────────────────────────────────────────────

interface ToastState {
  open: boolean;
  variant: ToastVariant;
  title: string;
}

export interface AnnotationsSectionProps {
  /** Canonical DOTTED element id (`dottedId(selectedNode)`). */
  elementId: string;
}

export function AnnotationsSection({ elementId }: AnnotationsSectionProps) {
  const { data: annotations = [], isLoading, isError } = useAnnotations(elementId);
  const [toast, setToast] = useState<ToastState>({
    open: false,
    variant: 'success',
    title: '',
  });

  const notify = (variant: ToastVariant, title: string) =>
    setToast({ open: true, variant, title });

  return (
    <section
      style={{
        padding: '16px',
        borderTop: '1px solid rgb(var(--canvas-border))',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
      }}
      data-testid="annotations-section"
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={labelStyle}>Annotations</span>
        <span style={monoMeta} data-testid="annotations-count">
          · {annotations.length}
        </span>
      </div>

      <AddComposer elementId={elementId} notify={notify} />

      {isLoading ? (
        <span style={monoMeta}>loading…</span>
      ) : isError ? (
        <span style={{ ...monoMeta, color: 'rgb(var(--status-rose))' }}>
          failed to load annotations
        </span>
      ) : annotations.length === 0 ? (
        <span
          style={{ fontSize: 12.5, color: 'rgb(var(--canvas-fg-3))' }}
          data-testid="annotations-empty"
        >
          No annotations yet
        </span>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {annotations.map((annotation) => (
            <AnnotationItem
              key={annotation.id}
              annotation={annotation}
              elementId={elementId}
              notify={notify}
            />
          ))}
        </div>
      )}

      <Toast
        isOpen={toast.open}
        onClose={() => setToast((t) => ({ ...t, open: false }))}
        variant={toast.variant}
        title={toast.title}
      />
    </section>
  );
}

export default AnnotationsSection;
