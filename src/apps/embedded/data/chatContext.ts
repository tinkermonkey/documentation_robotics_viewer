/**
 * The "viewer context" sent with every DrBot message: what the user has open
 * in the viewer (view, layer, selected element / node type / relationship /
 * changeset), so DrBot can resolve "this element" or "this layer".
 *
 * The `dr visualize` server's `chat.send` only takes `message`, and starts a
 * fresh Claude Code conversation for every send, so the context goes inside
 * the message text, every time. The chat thread still shows only what the
 * user typed (see chatService.sendMessage).
 *
 * Pure: callers resolve names and ids, this only formats them.
 */
import type { ModelNode } from './useModel';
import { dottedId } from './modelGraph';

export interface ChatContextElement {
  name: string;
  /** Canonical dotted id `{layer}.{type}.{slug}`, how model files refer to it. */
  ref: string;
}

export interface ChatContextInput {
  view: 'model' | 'spec' | 'changesets';
  mode: 'graph' | 'page';
  layerId: string | null;
  /** Human label for `layerId`, e.g. "Data Model". */
  layerLabel?: string;
  /** Model view: the selected element. */
  selectedNode?: ModelNode;
  /** Schema view: the selected node type's `spec_node_id`, e.g. `apm.alert`. */
  selectedSpecNodeId?: string;
  /** Model view: the selected relationship. */
  selectedEdge?: { predicate: string; source: ChatContextElement; target: ChatContextElement };
  /** Changesets view: the selected changeset. */
  changeset?: { id: string; name: string };
}

const VIEW_NAMES: Record<ChatContextInput['view'], string> = {
  model: 'Model (architecture element instances)',
  spec: 'Schema (the meta-model: node types and allowed relationships)',
  changesets: 'Changesets',
};

/** The context block, or null when there's nothing more specific than the view. */
export function buildChatContext(input: ChatContextInput): string | null {
  const lines: string[] = [];
  const viewLine =
    input.view === 'changesets' ? VIEW_NAMES.changesets : `${VIEW_NAMES[input.view]}, ${input.mode} view`;
  lines.push(`View: ${viewLine}`);

  if (input.view === 'changesets') {
    if (!input.changeset) return null;
    lines.push(`Selected changeset: "${input.changeset.name}" (id ${input.changeset.id})`);
  } else {
    if (!input.layerId) return null;
    lines.push(`Layer: ${input.layerLabel ? `${input.layerLabel} (${input.layerId})` : input.layerId}`);
    if (input.selectedNode) {
      const n = input.selectedNode;
      lines.push(`Selected element: "${n.name}" (${dottedId(n)}, type ${n.type}, uuid ${n.id})`);
    } else if (input.selectedSpecNodeId) {
      lines.push(`Selected node type: ${input.selectedSpecNodeId}`);
    } else if (input.selectedEdge) {
      const e = input.selectedEdge;
      lines.push(
        `Selected relationship: "${e.source.name}" (${e.source.ref}) --${e.predicate}--> "${e.target.name}" (${e.target.ref})`,
      );
    } else {
      lines.push('Nothing selected within the layer.');
    }
  }

  return [
    '<viewer-context>',
    'The user is asking from the Documentation Robotics viewer. This is what they have open;',
    'use it to resolve "this", "here", "this element" and "this layer".',
    ...lines,
    '</viewer-context>',
  ].join('\n');
}

/** The text actually sent to `chat.send`: the context block, then the question. */
export function withChatContext(message: string, context: string | null): string {
  return context ? `${context}\n\n${message}` : message;
}
