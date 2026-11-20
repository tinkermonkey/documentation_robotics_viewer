/**
 * markdownExcerpt — the one-paragraph excerpt of a markdown description that a
 * card shows (#588: the Changesets inbox), as inline tokens.
 *
 * Pure and dependency-free. `descriptionExcerpt` picks the first paragraph (or,
 * when the text opens with a list, its first item) and drops the block markup
 * a card must never show: headings, list markers, block quotes, fenced code
 * and raw HTML tags. `inlineTokens` then splits that line into the inline
 * markdown the card renders: code spans, strong, emphasis; a link or image
 * keeps only its text (the card is a click target of its own, so no nested
 * links). Everything comes back as text for React to escape, so nothing in a
 * description can become markup.
 */

export type InlineToken =
  | { kind: 'text'; text: string }
  | { kind: 'code'; text: string }
  | { kind: 'strong'; children: InlineToken[] }
  | { kind: 'em'; children: InlineToken[] };

const HEADING = /^\s{0,3}#{1,6}(\s+|$)/;
const LIST_ITEM = /^\s{0,3}(?:[-*+]|\d{1,9}[.)])\s+/;
const QUOTE = /^\s{0,3}>\s?/;
const FENCE = /^\s{0,3}(```|~~~)/;
const RULE = /^\s{0,3}([-*_])(\s*\1){2,}\s*$/;
const HTML_TAG = /<\/?[A-Za-z][^<>]*>/g;

/** Strip one line's block markup (heading hashes, list marker, quote marker). */
function stripBlockMarkup(line: string): string {
  let out = line;
  // A quote may hold a list item or a heading: strip the quote first.
  while (QUOTE.test(out)) out = out.replace(QUOTE, '');
  out = out.replace(HEADING, '').replace(/\s+#+\s*$/, '');
  out = out.replace(LIST_ITEM, '');
  return out.trim();
}

/**
 * The first paragraph of a markdown text as one line, block markup dropped.
 * A heading on its own is skipped when a paragraph follows it (a "## Intent"
 * label says less than the intent itself); a list yields its first item.
 * Plain text comes back as written, its single newlines folded into spaces.
 */
export function descriptionExcerpt(text: string | null | undefined): string {
  if (!text) return '';
  const lines = text.replace(/\r\n?/g, '\n').split('\n');
  const blocks: { lines: string[]; heading: boolean }[] = [];
  let current: string[] = [];
  let inFence = false;
  const flush = () => {
    if (current.length) blocks.push({ lines: current, heading: false });
    current = [];
  };
  for (const line of lines) {
    if (FENCE.test(line)) {
      flush();
      inFence = !inFence;
      continue;
    }
    if (inFence) continue;
    if (!line.trim() || RULE.test(line)) {
      flush();
      continue;
    }
    if (HEADING.test(line.replace(QUOTE, ''))) {
      flush();
      blocks.push({ lines: [line], heading: true });
      continue;
    }
    // A list ends the paragraph before it: the excerpt is the paragraph.
    if (LIST_ITEM.test(line) && current.length && !LIST_ITEM.test(current[0])) flush();
    current.push(line);
  }
  flush();

  const block = blocks.find((b) => !b.heading) ?? blocks[0];
  if (!block) return '';
  // A list: its first item only (an item's continuation lines are indented).
  const picked = LIST_ITEM.test(block.lines[0])
    ? [block.lines[0], ...takeWhile(block.lines.slice(1), (l) => !LIST_ITEM.test(l))]
    : block.lines;
  return picked
    .map(stripBlockMarkup)
    .filter(Boolean)
    .join(' ')
    .replace(HTML_TAG, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function takeWhile<T>(items: T[], keep: (item: T) => boolean): T[] {
  const out: T[] = [];
  for (const item of items) {
    if (!keep(item)) break;
    out.push(item);
  }
  return out;
}

/*
 * One alternation, tried left to right at each position: a code span, an image
 * or link (text kept; its destination may hold one level of parentheses), an autolink, strong (** or __), emphasis (* or _). `_`
 * only opens and closes at word boundaries, as in CommonMark, so snake_case
 * ids stay as written.
 */
const INLINE =
  /(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)|!?\[([^\]]*)\]\((?:[^()\s]|\([^()\s]*\))*(?:\s+\"[^\"]*\")?\)|<(https?:\/\/[^\s>]+)>|\*\*(?=\S)([\s\S]*?\S)\*\*|(?<![\w])__(?=\S)([\s\S]*?\S)__(?![\w])|\*(?=[^\s*])([\s\S]*?[^\s*])\*|(?<![\w])_(?=[^\s_])([\s\S]*?[^\s_])_(?![\w])/g;

/** Split one line of inline markdown into tokens; anything unmatched is text. */
export function inlineTokens(line: string): InlineToken[] {
  const out: InlineToken[] = [];
  const pushText = (text: string) => {
    if (!text) return;
    const last = out[out.length - 1];
    if (last?.kind === 'text') last.text += text;
    else out.push({ kind: 'text', text });
  };
  let at = 0;
  for (const m of line.matchAll(INLINE)) {
    const index = m.index ?? 0;
    pushText(line.slice(at, index));
    at = index + m[0].length;
    const [, , code, linkText, autolink, strongA, strongB, emA, emB] = m;
    if (code !== undefined) {
      // CommonMark: one leading and trailing space is stripped when both are there.
      const trimmed = /^ .* $/.test(code) && code.trim() ? code.slice(1, -1) : code;
      out.push({ kind: 'code', text: trimmed });
    } else if (linkText !== undefined) {
      for (const t of inlineTokens(linkText)) {
        if (t.kind === 'text') pushText(t.text);
        else out.push(t);
      }
    } else if (autolink !== undefined) {
      pushText(autolink);
    } else if (strongA !== undefined || strongB !== undefined) {
      out.push({ kind: 'strong', children: inlineTokens(strongA ?? strongB) });
    } else if (emA !== undefined || emB !== undefined) {
      out.push({ kind: 'em', children: inlineTokens(emA ?? emB) });
    }
  }
  pushText(line.slice(at));
  return out;
}
