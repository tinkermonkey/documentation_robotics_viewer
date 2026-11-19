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

import { MarkdownText } from '@/apps/embedded/ui/MarkdownText';

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
