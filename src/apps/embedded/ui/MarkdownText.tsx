/**
 * MarkdownText — renders untrusted model prose (a node page's description;
 * next, a changeset's description, #588) as markdown.
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

import { ChatMarkdownContent } from '@tinkermonkey/heimdall-ui';

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

export default MarkdownText;
