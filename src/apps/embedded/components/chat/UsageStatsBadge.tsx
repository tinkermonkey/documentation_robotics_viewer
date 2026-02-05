import { memo, useMemo } from 'react';
import { Zap } from 'lucide-react';

export interface UsageStatsBadgeProps {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
}

export const UsageStatsBadge = memo(
  ({
    inputTokens,
    outputTokens,
    totalTokens,
  }: UsageStatsBadgeProps) => {
    // Format large numbers as "N.Nk" for 1000+
    const formatTokens = (tokens: number): string => {
      if (tokens >= 1000) {
        return `${(tokens / 1000).toFixed(1)}k`;
      }
      return tokens.toString();
    };

    const tooltipText = useMemo(
      () =>
        `Input: ${inputTokens.toLocaleString()} | Output: ${outputTokens.toLocaleString()} | Total: ${totalTokens.toLocaleString()}`,
      [inputTokens, outputTokens, totalTokens]
    );

    const displayTokens = formatTokens(totalTokens);

    return (
      <div
        className="inline-flex items-center gap-1.5 bg-gray-100 dark:bg-gray-800 px-2.5 py-1.5 rounded text-xs font-mono text-gray-700 dark:text-gray-300"
        data-testid="usage-stats-badge"
        title={tooltipText}
      >
        <Zap className="w-3.5 h-3.5 text-yellow-600 dark:text-yellow-400" />
        <span>{displayTokens} tokens</span>
      </div>
    );
  }
);

UsageStatsBadge.displayName = 'UsageStatsBadge';
