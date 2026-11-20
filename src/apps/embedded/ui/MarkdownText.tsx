/**
 * MarkdownText — renders untrusted model prose (a node page's description, a
 * changeset's description in the Changesets canvas, #588) as markdown.
 * `FoldableMarkdownText` folds a long one behind Show more / Show less;
 * `MarkdownExcerpt` renders a card's one-paragraph inline excerpt.
 *
 * Wraps Heimdall's `ChatMarkdownContent` (react-markdown + remark-gfm, already
 * a heimdall-ui dependency): headings, lists, code, tables, emphasis and links
 * render as written. Model text is untrusted, and this is safe for it:
 * react-markdown never injects raw HTML (no rehype-raw — a `<script>` or
 * `<img onerror>` in the text renders as nothing / plain text, never as
 * markup) and its default URL transform strips `javascript:`-style links.
 * Links open in a new tab with `rel="noopener noreferrer"`.
 *
 * `.drv-markdown` (domain-and-nav.css) restyles Heimdall's chat typography
 * for a page: 14px / 1.6 in `--canvas-fg-2`, as the plain paragraph this
 * replaced, so a plain-text description reads exactly as before (single
 * newlines fold into one paragraph, blank lines start a new one). Headings are
 * scaled down so a `# Title` in a description never outranks the page's own
 * header, and links use a canvas-token colour that passes AA on both canvases.
 * Every colour is a token, so the dark-canvas toggle flips it.
 */

import { Fragment, useId, useState, type ReactNode } from 'react';
import { ChatMarkdownContent } from '@tinkermonkey/heimdall-ui';

import { descriptionExcerpt, inlineTokens, type InlineToken } from './markdownExcerpt';

export interface MarkdownTextProps {
  /** The markdown (or plain) text. Empty or whitespace-only renders nothing. */
  text: string | null | undefined;
  className?: string;
  'data-testid'?: string;
}

export function MarkdownText({ text, className, 'data-testid': testId }: MarkdownTextProps) {
  if (!text || !text.trim()) return null;
  return (
    <div className={['drv-markdown', className].filter(Boolean).join(' ')} data-testid={testId}>
      <ChatMarkdownContent content={text} />
    </div>
  );
}

/** A text this long, or with more lines than FOLD_LINES, starts folded. */
export const FOLD_CHARS = 420;
export const FOLD_LINES = 6;

/** Whether a text is long enough to fold (by its source: rendering is not measured). */
export function isLongText(text: string): boolean {
  const trimmed = text.trim();
  return trimmed.length > FOLD_CHARS || trimmed.split(/\r?\n/).filter((l) => l.trim()).length > FOLD_LINES;
}

/**
 * MarkdownText that folds a long text to its first few lines behind a
 * Show more / Show less button (`aria-expanded`, `aria-controls`), so what
 * follows it stays near the top. A short text shows whole, with no button.
 */
export function FoldableMarkdownText({ text, className, 'data-testid': testId }: MarkdownTextProps) {
  const [open, setOpen] = useState(false);
  const bodyId = useId();
  if (!text || !text.trim()) return null;
  if (!isLongText(text)) return <MarkdownText text={text} className={className} data-testid={testId} />;
  return (
    <div className="drv-markdown-fold" data-testid={testId}>
      <div id={bodyId} className={open ? undefined : 'drv-markdown-fold__body--folded'}>
        <MarkdownText text={text} className={className} />
      </div>
      <button
        type="button"
        className="drv-linkbtn drv-markdown-fold__toggle"
        aria-expanded={open}
        aria-controls={bodyId}
        onClick={() => setOpen((o) => !o)}
        data-testid={testId ? `${testId}-toggle` : undefined}
      >
        {open ? 'Show less' : 'Show more'}
      </button>
    </div>
  );
}

function renderTokens(tokens: InlineToken[]): ReactNode[] {
  return tokens.map((t, i) => {
    switch (t.kind) {
      case 'text':
        return <Fragment key={i}>{t.text}</Fragment>;
      case 'code':
        return (
          <code key={i} className="drv-markdown-excerpt__code">
            {t.text}
          </code>
        );
      case 'strong':
        return <strong key={i}>{renderTokens(t.children)}</strong>;
      case 'em':
        return <em key={i}>{renderTokens(t.children)}</em>;
    }
  });
}

/**
 * The first paragraph of a markdown text, rendered inline for a card: code
 * spans, strong and emphasis; links as their text (the card is a click target
 * of its own); never a list, heading or block; raw HTML tags dropped. Clamped
 * to two lines by `.drv-markdown-excerpt`; the canvas shows the whole text.
 */
export function MarkdownExcerpt({ text, className, 'data-testid': testId }: MarkdownTextProps) {
  const excerpt = descriptionExcerpt(text);
  if (!excerpt) return null;
  return (
    <p
      className={['drv-markdown-excerpt', className].filter(Boolean).join(' ')}
      data-testid={testId}
    >
      {renderTokens(inlineTokens(excerpt))}
    </p>
  );
}

export default MarkdownText;
