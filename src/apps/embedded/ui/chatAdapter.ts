/**
 * chatAdapter — risk #3: bridges our `parts` discriminated union (chatStore)
 * onto Heimdall's `<ChatMessage>` shape (single `body` + optional `toolBlock`
 * + optional `thinkingBlock`).
 *
 * Our wire model (see `types/chat.ts`) lets one assistant message carry an
 * ordered mix of `text`, `thinking`, `tool_invocation`, `usage`, and `error`
 * parts. Heimdall's `<ChatMessage>` renders exactly one body and at most one
 * tool/thinking block. So we flatten each store message into one-or-more
 * Heimdall message view-models ("rows"), preserving part order:
 *
 *   - consecutive `text` parts coalesce into a markdown body;
 *   - each `thinking` part becomes a row carrying a `thinkingBlock`;
 *   - each `tool_invocation` part becomes a row carrying a `toolBlock`
 *     (status executing -> running, completed -> success, failed -> error);
 *   - `error` parts become an inline error row (rendered red by ChatPanel);
 *   - `usage` parts become a subtle meta row.
 *
 * `body` is returned as a plain string here; ChatPanel renders it through
 * Heimdall's `<ChatMarkdownContent>` (the adapter stays render-prop free so it
 * is trivially unit-testable). The adapter is pure — re-run it on every
 * chatStore change.
 */

import type {
  ChatMessage,
  ChatContent,
  TextContent,
  ThinkingContent,
  ToolInvocationContent,
  UsageContent,
  ErrorContent,
} from '../types/chat';
import type { ToolBlockData, ThinkingBlockData } from '@tinkermonkey/heimdall-ui';

export type HeimdallRole = 'user' | 'bot';

/** Kind of body a row carries, so ChatPanel can pick the right renderer. */
export type RowBodyKind = 'markdown' | 'error' | 'usage';

/**
 * A flattened, render-ready row mapping onto a single Heimdall `<ChatMessage>`.
 * `id` is stable per (message, segment) so React keys stay consistent across
 * streaming updates.
 */
export interface HeimdallChatRow {
  id: string;
  role: HeimdallRole;
  senderName: string;
  timestamp: string;
  /** Concatenated markdown (or the error/usage text); '' when only a block. */
  body: string;
  bodyKind: RowBodyKind;
  /** True while the source message is still streaming (markdown cursor). */
  isStreaming: boolean;
  toolBlock?: ToolBlockData;
  thinkingBlock?: ThinkingBlockData;
}

/** 'user' stays user; 'assistant' and 'system' both render as the bot. */
function toHeimdallRole(role: ChatMessage['role']): HeimdallRole {
  return role === 'user' ? 'user' : 'bot';
}

function senderFor(role: ChatMessage['role']): string {
  return role === 'user' ? 'You' : 'DrBot';
}

/** HH:MM local time from an ISO timestamp (falls back to the raw string). */
function formatTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

/** executing -> running, completed -> success, failed -> error. */
function toToolStatus(
  status: ToolInvocationContent['status'],
): ToolBlockData['status'] {
  switch (status.state) {
    case 'executing':
      return 'running';
    case 'completed':
      return 'success';
    case 'failed':
      return 'error';
    default:
      return 'running';
  }
}

/** Render an arbitrary value compactly for a tool-block output row. */
function valueToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

/**
 * Build the tool-block output rows: the tool input keys, then a result/error
 * row reflecting terminal status.
 */
function toolOutput(part: ToolInvocationContent): ToolBlockData['output'] {
  const rows: NonNullable<ToolBlockData['output']> = [];

  const input = part.toolInput ?? {};
  for (const [key, value] of Object.entries(input)) {
    rows.push({ key, value: valueToString(value) });
  }

  if (part.status.state === 'completed' && part.status.result !== undefined) {
    rows.push({ key: 'result', value: valueToString(part.status.result) });
  } else if (part.status.state === 'failed') {
    rows.push({ key: 'error', value: part.status.error });
  }

  return rows;
}

function toToolBlock(part: ToolInvocationContent): ToolBlockData {
  return {
    name: part.toolName,
    status: toToolStatus(part.status),
    output: toolOutput(part),
  };
}

function usageText(part: UsageContent): string {
  const cost =
    typeof part.totalCostUsd === 'number' && part.totalCostUsd > 0
      ? ` · $${part.totalCostUsd.toFixed(4)}`
      : '';
  return `${part.totalTokens} tokens (${part.inputTokens} in / ${part.outputTokens} out)${cost}`;
}

/**
 * Flatten one store message into one-or-more Heimdall rows, preserving part
 * order. A `text` run accumulates into `body`; the first thinking/tool part
 * after a text run rides along on that same row, and any further block parts
 * each start a fresh row so order and count are preserved.
 */
function flattenMessage(message: ChatMessage): HeimdallChatRow[] {
  const role = toHeimdallRole(message.role);
  const senderName = senderFor(message.role);
  const timestamp = formatTime(message.timestamp);
  const isStreaming = Boolean(message.isStreaming);

  const rows: HeimdallChatRow[] = [];
  let seq = 0;

  // The row currently being assembled (a markdown body that can adopt the
  // next single block), or null when the previous row is already "sealed".
  let pending: HeimdallChatRow | null = null;

  const newRow = (over: Partial<HeimdallChatRow> = {}): HeimdallChatRow => ({
    id: `${message.id}:${seq++}`,
    role,
    senderName,
    timestamp,
    body: '',
    bodyKind: 'markdown',
    isStreaming,
    ...over,
  });

  const seal = () => {
    if (pending) {
      rows.push(pending);
      pending = null;
    }
  };

  for (const part of message.parts as ChatContent[]) {
    switch (part.type) {
      case 'text': {
        const text = (part as TextContent).content ?? '';
        if (
          pending &&
          pending.bodyKind === 'markdown' &&
          !pending.toolBlock &&
          !pending.thinkingBlock
        ) {
          pending.body += text;
        } else {
          seal();
          pending = newRow({ body: text });
        }
        break;
      }
      case 'thinking': {
        const block: ThinkingBlockData = {
          content: (part as ThinkingContent).content ?? '',
        };
        if (pending && pending.bodyKind === 'markdown' && !pending.thinkingBlock && !pending.toolBlock) {
          pending.thinkingBlock = block;
          seal();
        } else {
          seal();
          rows.push(newRow({ thinkingBlock: block }));
        }
        break;
      }
      case 'tool_invocation': {
        const block = toToolBlock(part as ToolInvocationContent);
        if (pending && pending.bodyKind === 'markdown' && !pending.toolBlock) {
          pending.toolBlock = block;
          seal();
        } else {
          seal();
          rows.push(newRow({ toolBlock: block }));
        }
        break;
      }
      case 'error': {
        seal();
        rows.push(
          newRow({
            body: (part as ErrorContent).message,
            bodyKind: 'error',
            isStreaming: false,
          }),
        );
        break;
      }
      case 'usage': {
        seal();
        rows.push(
          newRow({
            body: usageText(part as UsageContent),
            bodyKind: 'usage',
            isStreaming: false,
          }),
        );
        break;
      }
      default:
        break;
    }
  }

  seal();

  // A streaming assistant message with no parts yet still gets an empty body
  // row so the bot bubble (and its typing affordance) shows immediately.
  if (rows.length === 0) {
    rows.push(newRow({}));
  }

  return rows;
}

/**
 * Map our chatStore messages onto Heimdall row view-models. Pure: derive on
 * every store change.
 */
export function toHeimdallMessages(messages: ChatMessage[]): HeimdallChatRow[] {
  const rows: HeimdallChatRow[] = [];
  for (const message of messages) {
    rows.push(...flattenMessage(message));
  }
  return rows;
}
