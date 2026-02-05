import { memo } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ReactNode } from 'react';

export interface ChatTextContentProps {
  content: string;
  isStreaming?: boolean;
}

export const ChatTextContent = memo(
  ({ content, isStreaming = false }: ChatTextContentProps) => {
    const customComponents = {
        // Code blocks with syntax highlighting placeholder
        code: ({ children, className }: { children: ReactNode; className?: string }) => {
          const isInline = !className;

          if (isInline) {
            return (
              <code
                className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-sm font-mono text-gray-900 dark:text-gray-100"
                data-testid="inline-code"
              >
                {children}
              </code>
            );
          }

          return (
            <code
              className="block bg-gray-100 dark:bg-gray-800 rounded-md p-3 text-sm font-mono overflow-x-auto text-gray-900 dark:text-gray-100"
              data-testid="code-block"
            >
              {children}
            </code>
          );
        },

        // Pre wrapper for code blocks
        pre: ({ children }: { children: ReactNode }) => (
          <pre
            className="bg-gray-100 dark:bg-gray-800 rounded-md p-3 overflow-x-auto"
            data-testid="pre-block"
          >
            {children}
          </pre>
        ),

        // Links open in new tab
        a: ({ children, href }: { children: ReactNode; href?: string }) => (
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 dark:text-blue-400 hover:underline"
            data-testid="markdown-link"
          >
            {children}
          </a>
        ),

        // Tables with Flowbite-compatible styling
        table: ({ children }: { children: ReactNode }) => (
          <div
            className="overflow-x-auto my-4"
            data-testid="markdown-table"
          >
            <table className="w-full border-collapse border border-gray-300 dark:border-gray-600">
              {children}
            </table>
          </div>
        ),

        thead: ({ children }: { children: ReactNode }) => (
          <thead className="bg-gray-200 dark:bg-gray-700">
            {children}
          </thead>
        ),

        tbody: ({ children }: { children: ReactNode }) => (
          <tbody>{children}</tbody>
        ),

        tr: ({ children }: { children: ReactNode }) => (
          <tr className="border border-gray-300 dark:border-gray-600">
            {children}
          </tr>
        ),

        th: ({ children }: { children: ReactNode }) => (
          <th className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-left font-semibold text-gray-900 dark:text-gray-100">
            {children}
          </th>
        ),

        td: ({ children }: { children: ReactNode }) => (
          <td className="border border-gray-300 dark:border-gray-600 px-4 py-2 text-gray-700 dark:text-gray-300">
            {children}
          </td>
        ),

        // Block quotes
        blockquote: ({ children }: { children: ReactNode }) => (
          <blockquote
            className="border-l-4 border-gray-400 dark:border-gray-600 pl-4 italic text-gray-600 dark:text-gray-400 my-4"
            data-testid="markdown-blockquote"
          >
            {children}
          </blockquote>
        ),

        // Headings
        h1: ({ children }: { children: ReactNode }) => (
          <h1 className="text-2xl font-bold mt-6 mb-4 text-gray-900 dark:text-white">
            {children}
          </h1>
        ),

        h2: ({ children }: { children: ReactNode }) => (
          <h2 className="text-xl font-bold mt-5 mb-3 text-gray-900 dark:text-white">
            {children}
          </h2>
        ),

        h3: ({ children }: { children: ReactNode }) => (
          <h3 className="text-lg font-bold mt-4 mb-2 text-gray-900 dark:text-white">
            {children}
          </h3>
        ),

        // Emphasis
        em: ({ children }: { children: ReactNode }) => (
          <em className="italic text-gray-900 dark:text-white">
            {children}
          </em>
        ),

        strong: ({ children }: { children: ReactNode }) => (
          <strong className="font-bold text-gray-900 dark:text-white">
            {children}
          </strong>
        ),

        // Lists
        ul: ({ children }: { children: ReactNode }) => (
          <ul
            className="list-disc list-inside my-4 text-gray-700 dark:text-gray-300"
            data-testid="unordered-list"
          >
            {children}
          </ul>
        ),

        ol: ({ children }: { children: ReactNode }) => (
          <ol
            className="list-decimal list-inside my-4 text-gray-700 dark:text-gray-300"
            data-testid="ordered-list"
          >
            {children}
          </ol>
        ),

        li: ({ children }: { children: ReactNode }) => (
          <li className="ml-4">{children}</li>
        ),

        // Paragraphs
        p: ({ children }: { children: ReactNode }) => (
          <p className="text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
            {children}
          </p>
        ),
    } as Components;

    return (
      <div
        className="prose dark:prose-invert prose-sm max-w-none text-gray-700 dark:text-gray-300"
        data-testid="chat-text-content"
      >
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={customComponents}
        >
          {content}
        </ReactMarkdown>

        {isStreaming && (
          <span
            className="inline-block w-2 h-4 bg-gray-400 dark:bg-gray-500 animate-pulse ml-1"
            data-testid="streaming-indicator"
            aria-label="Content is streaming"
          />
        )}
      </div>
    );
  }
);

ChatTextContent.displayName = 'ChatTextContent';
