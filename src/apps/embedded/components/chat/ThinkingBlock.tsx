import { memo, useState, useEffect } from 'react';
import { Brain } from 'lucide-react';

export interface ThinkingBlockProps {
  content: string;
  durationMs?: number;
  isStreaming?: boolean;
  defaultExpanded?: boolean;
}

export const ThinkingBlock = memo(
  ({
    content,
    durationMs,
    isStreaming = false,
    defaultExpanded = false,
  }: ThinkingBlockProps) => {
    const [isExpanded, setIsExpanded] = useState(
      defaultExpanded || isStreaming
    );

    // Auto-collapse when streaming completes
    useEffect(() => {
      if (!isStreaming && isExpanded) {
        const timer = setTimeout(() => {
          setIsExpanded(false);
        }, 1000);
        return () => clearTimeout(timer);
      }
    }, [isStreaming, isExpanded]);

    const formatDuration = (ms: number) => {
      const seconds = (ms / 1000).toFixed(1);
      const secondsNum = parseFloat(seconds);
      return secondsNum === 1 ? '1 second' : `${secondsNum} seconds`;
    };

    const previewContent =
      content.length > 100
        ? `${content.substring(0, 100)}...`
        : content;

    return (
      <div
        className="my-4 rounded-lg border border-purple-200 dark:border-purple-800"
        data-testid="thinking-block"
      >
        {/* Header Button */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 px-4 py-3 flex items-center justify-between transition-colors rounded-t-lg"
          data-testid="thinking-block-header"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} thinking block`}
        >
          <div className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            <span className="font-semibold text-purple-900 dark:text-purple-200">
              Thinking
            </span>
            {isStreaming && (
              <div
                className="w-2 h-2 rounded-full bg-purple-600 dark:bg-purple-400 animate-pulse"
                data-testid="thinking-streaming-indicator"
              />
            )}
          </div>
          <div className="flex items-center gap-2">
            {durationMs && (
              <span className="text-xs text-purple-600 dark:text-purple-400">
                {formatDuration(durationMs)}
              </span>
            )}
            <span className="text-purple-600 dark:text-purple-400">
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        </button>

        {/* Content */}
        {isExpanded ? (
          <div
            className="px-4 py-3 bg-white dark:bg-gray-900 rounded-b-lg"
            data-testid="thinking-block-content-expanded"
          >
            <p
              className="whitespace-pre-wrap text-sm text-gray-700 dark:text-gray-300 leading-relaxed"
              data-testid="thinking-block-text"
            >
              {content}
            </p>
          </div>
        ) : (
          <div
            className="px-4 py-3 bg-white dark:bg-gray-900 rounded-b-lg"
            data-testid="thinking-block-content-collapsed"
          >
            <p className="text-sm text-gray-600 dark:text-gray-400 italic">
              {previewContent}
            </p>
          </div>
        )}
      </div>
    );
  }
);

ThinkingBlock.displayName = 'ThinkingBlock';
