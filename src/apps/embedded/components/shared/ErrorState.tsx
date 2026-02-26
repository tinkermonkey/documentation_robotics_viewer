import React, { memo } from 'react';
import { Card, Button, Alert } from 'flowbite-react';
import { HiExclamation, HiRefresh } from 'react-icons/hi';

interface ErrorStateProps {
  title?: string;
  message: string;
  variant?: 'page' | 'panel' | 'inline';
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = memo(
  ({ title = 'Error', message, variant = 'page', onRetry }: ErrorStateProps) => {
    if (variant === 'inline') {
      return (
        <Alert color="failure" icon={HiExclamation} data-testid="error-inline">
          <span className="font-medium">{title}:</span> {message}
          {onRetry && (
            <Button size="xs" color="failure" className="ml-2" onClick={onRetry}>
              Retry
            </Button>
          )}
        </Alert>
      );
    }

    if (variant === 'panel') {
      return (
        <div className="p-4" data-testid="error-panel">
          <Alert color="failure" icon={HiExclamation}>
            <h3 className="font-medium">{title}</h3>
            <p className="mt-1 text-sm">{message}</p>
            {onRetry && (
              <Button size="sm" color="failure" className="mt-2" onClick={onRetry}>
                <HiRefresh className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
          </Alert>
        </div>
      );
    }

    // Page variant
    return (
      <div
        className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-900"
        data-testid="error-page"
      >
        <Card className="max-w-md border-red-200 dark:border-red-800">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-red-100 dark:bg-red-900 rounded-full">
              <HiExclamation className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-medium text-red-800 dark:text-red-200">{title}</h3>
              <p className="mt-1 text-red-600 dark:text-red-400">{message}</p>
              {onRetry && (
                <Button size="sm" color="failure" className="mt-4" onClick={onRetry}>
                  <HiRefresh className="mr-2 h-4 w-4" />
                  Try Again
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }
);

ErrorState.displayName = 'ErrorState';
