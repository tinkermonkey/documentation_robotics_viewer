import { memo, useState, useMemo } from 'react';
import { Wrench, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Badge } from 'flowbite-react';
import { ToolInvocationStatus } from '../../types/chat';

export interface ToolInvocationCardProps {
  toolName: string;
  toolInput: Record<string, unknown>;
  toolOutput?: string;
  status: ToolInvocationStatus;
  timestamp: string;
  duration?: number;
}

export const ToolInvocationCard = memo(
  ({
    toolName,
    toolInput,
    toolOutput,
    status,
    timestamp,
    duration,
  }: ToolInvocationCardProps) => {
    const [isExpanded, setIsExpanded] = useState(
      status.state === 'completed' || status.state === 'failed'
    );

    // Determine status styling
    const statusConfig = useMemo(() => {
      switch (status.state) {
        case 'executing':
          return {
            icon: Loader2,
            color: 'blue' as const,
            label: 'Executing',
            spinIcon: true,
          };
        case 'completed':
          return {
            icon: CheckCircle,
            color: 'success' as const,
            label: 'Complete',
            spinIcon: false,
          };
        case 'failed':
          return {
            icon: XCircle,
            color: 'failure' as const,
            label: 'Error',
            spinIcon: false,
          };
      }
    }, [status]);

    const StatusIcon = statusConfig.icon;

    const formattedInput = JSON.stringify(toolInput, null, 2);
    const formattedOutput = toolOutput || '';

    return (
      <div
        className="my-4 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 overflow-hidden"
        data-testid="tool-invocation-card"
      >
        {/* Header */}
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full px-4 py-3 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          data-testid="tool-invocation-header"
          aria-expanded={isExpanded}
          aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${toolName} tool invocation (${statusConfig.label})`}
        >
          <div className="flex items-center gap-3">
            <Wrench className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            <code className="font-mono text-sm font-semibold text-gray-900 dark:text-white">
              {toolName}
            </code>
            <Badge color={statusConfig.color} data-testid="tool-status-badge">
              {statusConfig.label}
            </Badge>
            {duration !== undefined && (
              <span
                className="text-xs text-gray-600 dark:text-gray-400 ml-2"
                data-testid="tool-duration"
              >
                {duration}ms
              </span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <StatusIcon
              className={`w-5 h-5 ${
                statusConfig.spinIcon ? 'animate-spin' : ''
              } ${
                status.state === 'completed'
                  ? 'text-green-600 dark:text-green-400'
                  : status.state === 'failed'
                    ? 'text-red-600 dark:text-red-400'
                    : 'text-blue-600 dark:text-blue-400'
              }`}
              data-testid="tool-status-icon"
            />
            <span className="text-gray-600 dark:text-gray-400">
              {isExpanded ? '−' : '+'}
            </span>
          </div>
        </button>

        {/* Content */}
        {isExpanded && (
          <div
            className="border-t border-gray-300 dark:border-gray-600 px-4 py-3 space-y-4"
            data-testid="tool-invocation-content"
          >
            {/* Input Section */}
            <div data-testid="tool-input-section">
              <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Input:
              </h4>
              <pre
                className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono text-gray-900 dark:text-gray-100 overflow-x-auto"
                data-testid="tool-input-code"
              >
                {formattedInput}
              </pre>
            </div>

            {/* Output Section */}
            {toolOutput && (
              <div data-testid="tool-output-section">
                <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                  Output:
                </h4>
                <pre
                  className="bg-gray-100 dark:bg-gray-800 rounded p-3 text-xs font-mono text-gray-900 dark:text-gray-100 overflow-x-auto max-h-60"
                  data-testid="tool-output-code"
                >
                  {formattedOutput}
                </pre>
              </div>
            )}

            {/* Timestamp */}
            <div
              className="text-xs text-gray-600 dark:text-gray-400"
              data-testid="tool-timestamp"
            >
              {timestamp}
            </div>
          </div>
        )}
      </div>
    );
  }
);

ToolInvocationCard.displayName = 'ToolInvocationCard';
