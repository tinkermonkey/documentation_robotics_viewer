import { describe, it, expect } from 'vitest';
import { toHeimdallMessages } from '@/apps/embedded/ui/chatAdapter';
import type {
  ChatMessage,
  ChatContent,
  ToolInvocationStatus,
} from '@/apps/embedded/types/chat';

// ─── Builders (keep the wire shapes terse and explicit) ───────────────────────

const TS = '2026-06-13T12:00:00.000Z';

function msg(
  role: ChatMessage['role'],
  parts: ChatContent[],
  over: Partial<ChatMessage> = {},
): ChatMessage {
  return {
    id: over.id ?? 'm1',
    role,
    conversationId: 'c1',
    timestamp: over.timestamp ?? TS,
    parts,
    ...over,
  };
}

const text = (content: string): ChatContent => ({ type: 'text', content, timestamp: TS });
const thinking = (content: string): ChatContent => ({ type: 'thinking', content, timestamp: TS });
const tool = (
  toolName: string,
  status: ToolInvocationStatus,
  toolInput: Record<string, unknown> = {},
): ChatContent => ({
  type: 'tool_invocation',
  toolUseId: 'tu-1',
  toolName,
  toolInput,
  status,
  timestamp: TS,
});
const errorPart = (message: string): ChatContent => ({
  type: 'error',
  code: 'E_X',
  message,
  timestamp: TS,
});
const usage = (
  inputTokens: number,
  outputTokens: number,
  totalTokens: number,
  totalCostUsd: number,
): ChatContent => ({
  type: 'usage',
  inputTokens,
  outputTokens,
  totalTokens,
  totalCostUsd,
  timestamp: TS,
});

// ─── Role mapping ─────────────────────────────────────────────────────────────

describe('toHeimdallMessages — role mapping', () => {
  it('user → user (sender "You")', () => {
    const [row] = toHeimdallMessages([msg('user', [text('hi')])]);
    expect(row.role).toBe('user');
    expect(row.senderName).toBe('You');
  });

  it('assistant → bot (sender "DrBot")', () => {
    const [row] = toHeimdallMessages([msg('assistant', [text('hi')])]);
    expect(row.role).toBe('bot');
    expect(row.senderName).toBe('DrBot');
  });

  it('system → bot', () => {
    const [row] = toHeimdallMessages([msg('system', [text('note')])]);
    expect(row.role).toBe('bot');
  });
});

// ─── Text coalescing ──────────────────────────────────────────────────────────

describe('toHeimdallMessages — consecutive text parts coalesce', () => {
  it('merges adjacent text parts into one markdown body (one row)', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [text('Hello '), text('world'), text('!')]),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe('Hello world!');
    expect(rows[0].bodyKind).toBe('markdown');
  });
});

// ─── Tool status mapping ──────────────────────────────────────────────────────

describe('toHeimdallMessages — tool status mapping', () => {
  it('executing → running', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [tool('search', { state: 'executing' })]),
    ]);
    expect(rows[0].toolBlock?.status).toBe('running');
  });

  it('completed → success and surfaces the result row', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [
        tool('search', { state: 'completed', result: { hits: 3 } }, { q: 'cats' }),
      ]),
    ]);
    expect(rows[0].toolBlock?.status).toBe('success');
    const out = rows[0].toolBlock?.output ?? [];
    expect(out).toContainEqual({ key: 'q', value: 'cats' }); // input surfaced
    expect(out).toContainEqual({ key: 'result', value: '{"hits":3}' });
  });

  it('failed → error and surfaces the error row', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [tool('search', { state: 'failed', error: 'boom' })]),
    ]);
    expect(rows[0].toolBlock?.status).toBe('error');
    expect(rows[0].toolBlock?.output).toContainEqual({ key: 'error', value: 'boom' });
  });
});

// ─── Ordering of interleaved parts ────────────────────────────────────────────

describe('toHeimdallMessages — interleaved text/thinking/tool ordering', () => {
  it('splits into correctly ordered bot rows preserving part order', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [
        text('Let me think.'),
        thinking('considering options'),
        text('Now I will search.'),
        tool('search', { state: 'completed', result: 'ok' }),
        text('Done.'),
      ]),
    ]);

    // Row 0: "Let me think." body that ADOPTS the following thinking block.
    expect(rows[0].body).toBe('Let me think.');
    expect(rows[0].thinkingBlock?.content).toBe('considering options');
    expect(rows[0].toolBlock).toBeUndefined();

    // Row 1: "Now I will search." that ADOPTS the following tool block.
    expect(rows[1].body).toBe('Now I will search.');
    expect(rows[1].toolBlock?.name).toBe('search');
    expect(rows[1].toolBlock?.status).toBe('success');

    // Row 2: trailing text after the sealed tool row.
    expect(rows[2].body).toBe('Done.');
    expect(rows[2].toolBlock).toBeUndefined();
    expect(rows[2].thinkingBlock).toBeUndefined();

    expect(rows).toHaveLength(3);
    // Rows carry stable, distinct ids derived from the message id.
    expect(new Set(rows.map((r) => r.id)).size).toBe(3);
    expect(rows.every((r) => r.id.startsWith('m1:'))).toBe(true);
  });

  it('two consecutive tool parts each get their OWN row (count preserved)', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [
        tool('a', { state: 'completed', result: 1 }),
        tool('b', { state: 'completed', result: 2 }),
      ]),
    ]);
    expect(rows).toHaveLength(2);
    expect(rows[0].toolBlock?.name).toBe('a');
    expect(rows[1].toolBlock?.name).toBe('b');
  });

  it('a standalone thinking part (no preceding text) is its own row', () => {
    const rows = toHeimdallMessages([msg('assistant', [thinking('hmm')])]);
    expect(rows).toHaveLength(1);
    expect(rows[0].thinkingBlock?.content).toBe('hmm');
    expect(rows[0].body).toBe('');
  });
});

// ─── error / usage parts ──────────────────────────────────────────────────────

describe('toHeimdallMessages — error and usage parts', () => {
  it('error part → inline error row (bodyKind error, not streaming)', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [text('before'), errorPart('it failed')], { isStreaming: true }),
    ]);
    const errRow = rows.find((r) => r.bodyKind === 'error')!;
    expect(errRow.body).toBe('it failed');
    expect(errRow.isStreaming).toBe(false);
  });

  it('usage part → meta row with tokens + cost', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [usage(10, 20, 30, 0.1234)]),
    ]);
    const meta = rows.find((r) => r.bodyKind === 'usage')!;
    expect(meta.body).toBe('30 tokens (10 in / 20 out) · $0.1234');
  });

  it('usage with zero cost omits the cost suffix', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [usage(5, 5, 10, 0)]),
    ]);
    expect(rows.find((r) => r.bodyKind === 'usage')!.body).toBe('10 tokens (5 in / 5 out)');
  });
});

// ─── Robustness ───────────────────────────────────────────────────────────────

describe('toHeimdallMessages — robustness', () => {
  it('an empty/streaming message yields one empty bot row (does not throw)', () => {
    const rows = toHeimdallMessages([
      msg('assistant', [], { isStreaming: true }),
    ]);
    expect(rows).toHaveLength(1);
    expect(rows[0].body).toBe('');
    expect(rows[0].role).toBe('bot');
    expect(rows[0].isStreaming).toBe(true);
  });

  it('an invalid timestamp falls back to the raw string (no throw)', () => {
    const rows = toHeimdallMessages([
      msg('user', [text('hi')], { timestamp: 'not-a-date' }),
    ]);
    expect(rows[0].timestamp).toBe('not-a-date');
  });

  it('maps many messages preserving message order', () => {
    const rows = toHeimdallMessages([
      msg('user', [text('q')], { id: 'a' }),
      msg('assistant', [text('a1'), text('a2')], { id: 'b' }),
    ]);
    expect(rows.map((r) => r.role)).toEqual(['user', 'bot']);
    expect(rows[1].body).toBe('a1a2');
    expect(rows[0].id.startsWith('a:')).toBe(true);
    expect(rows[1].id.startsWith('b:')).toBe(true);
  });
});
