import { memo } from 'react';
import { Spinner, Card } from 'flowbite-react';

interface LoadingStateProps {
  message?: string;
  variant?: 'page' | 'panel' | 'inline';
}

export const LoadingState = memo(
  ({ message = 'Loading...', variant = 'page' }: LoadingStateProps) => {
    if (variant === 'inline') {
      return (
        <div className="flex items-center gap-2 py-2" data-testid="loading-inline">
          <Spinner size="sm" />
          <span className="text-sm text-gray-600 dark:text-gray-400">{message}</span>
        </div>
      );
    }

    if (variant === 'panel') {
      return (
        <div
          className="flex flex-col items-center justify-center py-8 gap-4"
          data-testid="loading-panel"
        >
          <Spinner size="lg" />
          <p className="text-gray-600 dark:text-gray-400">{message}</p>
        </div>
      );
    }

    // Page variant
    return (
      <div
        className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900"
        data-testid="loading-page"
      >
        <Card className="max-w-sm text-center">
          <div className="flex flex-col items-center gap-4">
            <Spinner size="xl" color="blue" />
            <p className="text-gray-700 dark:text-gray-300">{message}</p>
          </div>
        </Card>
      </div>
    );
  }
);

LoadingState.displayName = 'LoadingState';
