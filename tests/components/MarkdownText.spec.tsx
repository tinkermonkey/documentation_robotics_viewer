// @vitest-environment happy-dom
/**
 * MarkdownText — the shared renderer for untrusted model prose (#593; #588
 * reuses it for changeset descriptions). Asserts our wrapper's contract, not
 * react-markdown itself: markdown renders as structure, raw HTML never becomes
 * markup, unsafe links are neutralised, plain text stays one paragraph, and
 * empty text renders nothing.
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import {
  FoldableMarkdownText,
  MarkdownExcerpt,
  MarkdownText,
  isLongText,
} from '@/apps/embedded/ui/MarkdownText';

describe('MarkdownText', () => {
  it('renders headings, lists, code and links as written', () => {
    const { container } = render(
      <MarkdownText
        text={[
          '## Responsibilities',
          '',
          '- reads **the model**',
          '- writes `changes.yaml`',
          '',
          'See [the spec](https://example.com/spec).',
          '',
          '```ts',
          'const x = 1;',
          '```',
        ].join('\n')}
      />,
    );
    expect(screen.getByRole('heading', { name: 'Responsibilities' })).toBeTruthy();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(container.querySelector('strong')?.textContent).toBe('the model');
    expect(container.querySelector('code')?.textContent).toBe('changes.yaml');
    expect(container.querySelector('pre code')?.textContent).toContain('const x = 1;');
    const link = screen.getByRole('link', { name: 'the spec' });
    expect(link.getAttribute('href')).toBe('https://example.com/spec');
    expect(link.getAttribute('rel')).toBe('noopener noreferrer');
  });

  it('never turns raw HTML in the text into markup', () => {
    const { container } = render(
      <MarkdownText
        text={'Before <script>window.__pwned = true</script> <img src=x onerror="alert(1)"> <b>bold</b> after'}
      />,
    );
    expect(container.querySelector('script')).toBeNull();
    expect(container.querySelector('img')).toBeNull();
    expect(container.querySelector('b')).toBeNull();
    expect(container.textContent).toContain('Before');
    expect(container.textContent).toContain('after');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();
  });

  it('strips a javascript: link target', () => {
    render(<MarkdownText text={'[click me](javascript:alert(1))'} />);
    const link = screen.getByText('click me').closest('a');
    expect(link?.getAttribute('href') ?? '').not.toMatch(/javascript:/i);
  });

  it('reads plain text as one paragraph, as before', () => {
    const { container } = render(
      <MarkdownText text={'Defines validation rules for JSON object instances\nacross the data model.'} />,
    );
    const paragraphs = container.querySelectorAll('p');
    expect(paragraphs).toHaveLength(1);
    expect(paragraphs[0].textContent).toBe(
      'Defines validation rules for JSON object instances\nacross the data model.',
    );
    expect(container.querySelector('h1, h2, h3, ul, ol, pre')).toBeNull();
  });

  it('renders nothing for empty or whitespace-only text', () => {
    for (const text of ['', '   \n ', null, undefined]) {
      const { container, unmount } = render(<MarkdownText text={text} />);
      expect(container.innerHTML).toBe('');
      unmount();
    }
  });
});

const LONG_DESCRIPTION = [
  "#588: render a changeset's description as markdown.",
  '',
  '**In scope**',
  '- `application.applicationcomponent.markdown-text`',
  '- `application.applicationcomponent.changeset-canvas`',
  '- `application.applicationcomponent.changeset-inbox`',
  '',
  '## Done when',
  '- the canvas renders it',
  '- the inbox shows an excerpt',
].join('\n');

describe('FoldableMarkdownText', () => {
  it('folds a long text behind Show more and toggles it with aria-expanded', async () => {
    const user = userEvent.setup();
    const { container } = render(<FoldableMarkdownText text={LONG_DESCRIPTION} data-testid="desc" />);
    // Rendered as markdown even while folded: list items, code spans, a heading.
    expect(screen.getAllByRole('listitem')).toHaveLength(5);
    expect(screen.getByRole('heading', { name: 'Done when' })).toBeTruthy();
    expect(container.querySelector('code')?.textContent).toBe('application.applicationcomponent.markdown-text');

    const toggle = screen.getByRole('button', { name: 'Show more' });
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    const body = document.getElementById(toggle.getAttribute('aria-controls')!)!;
    expect(body.className).toContain('drv-markdown-fold__body--folded');

    await user.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
    expect(toggle.textContent).toBe('Show less');
    expect(body.className).not.toContain('drv-markdown-fold__body--folded');

    await user.click(screen.getByRole('button', { name: 'Show less' }));
    expect(toggle.getAttribute('aria-expanded')).toBe('false');
  });

  it('shows a short text whole, with no button', () => {
    render(<FoldableMarkdownText text={'Adds **one** element.'} />);
    expect(screen.queryByRole('button')).toBeNull();
    expect(screen.getByText('one').tagName).toBe('STRONG');
    expect(isLongText('Adds **one** element.')).toBe(false);
    expect(isLongText(LONG_DESCRIPTION)).toBe(true);
  });
});

describe('MarkdownExcerpt', () => {
  it('renders the first paragraph inline: code spans and emphasis, links as plain text', () => {
    const { container } = render(
      <MarkdownExcerpt
        text={
          'Adds `markdown-text` with **bold** and *soft* words, see [the issue](https://example.com/588).\n\n- a list item\n- another'
        }
      />,
    );
    const p = container.querySelector('p')!;
    expect(p.textContent).toBe('Adds markdown-text with bold and soft words, see the issue.');
    expect(p.querySelector('code')?.textContent).toBe('markdown-text');
    expect(p.querySelector('strong')?.textContent).toBe('bold');
    expect(p.querySelector('em')?.textContent).toBe('soft');
    expect(container.querySelector('a')).toBeNull();
    expect(container.querySelector('ul, li')).toBeNull();
  });

  it('never renders raw HTML or a list or heading block', () => {
    const { container } = render(
      <MarkdownExcerpt
        text={'## Intent\n\nBefore <script>window.__pwned = true</script> <img src=x onerror="alert(1)"> after'}
      />,
    );
    expect(container.querySelector('script, img, h1, h2, h3, ul, ol, li')).toBeNull();
    expect(container.textContent).toContain('Before');
    expect(container.textContent).toContain('after');
    expect(container.textContent).not.toContain('Intent');
    expect((window as unknown as { __pwned?: boolean }).__pwned).toBeUndefined();

    const list = render(<MarkdownExcerpt text={'- first item\n- second item'} />);
    expect(list.container.textContent).toBe('first item');
    expect(list.container.querySelector('ul, li')).toBeNull();
  });

  it('reads a plain-text description as before and renders nothing for none', () => {
    const { container } = render(<MarkdownExcerpt text={'Brings the model in line with PR 497'} />);
    expect(container.textContent).toBe('Brings the model in line with PR 497');
    const empty = render(<MarkdownExcerpt text={undefined} />);
    expect(empty.container.innerHTML).toBe('');
  });
});
