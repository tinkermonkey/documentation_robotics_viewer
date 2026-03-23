/**
 * ModelParseErrorBanner Component
 * Displays a dismissible error banner when model parsing fails or is incomplete
 */
import { useState } from 'react';

export interface ModelParseErrorBannerProps {
  /** Array of parse error messages */
  errors: string[];
  /** Callback when user dismisses the banner */
  onDismiss?: () => void;
}

export function ModelParseErrorBanner({
  errors,
  onDismiss,
}: ModelParseErrorBannerProps) {
  const [isDismissed, setIsDismissed] = useState(false);

  if (isDismissed || errors.length === 0) {
    return null;
  }

  const handleDismiss = () => {
    setIsDismissed(true);
    onDismiss?.();
  };

  const errorCount = errors.length;
  const firstError = errors[0];

  return (
    <div
      role="alert"
      aria-live="assertive"
      data-testid="model-parse-error-banner"
      className="flex items-start gap-3 px-4 py-3 bg-red-50 border-b border-red-200 dark:bg-red-900/20 dark:border-red-800 text-red-800 dark:text-red-200 text-sm"
    >
      <div className="flex-1">
        <div className="font-medium mb-1">
          Model loading encountered {errorCount} error{errorCount !== 1 ? 's' : ''}
        </div>
        <div className="text-red-700 dark:text-red-300 text-xs">
          {firstError}
          {errorCount > 1 && (
            <div className="mt-1 text-red-600 dark:text-red-400">
              +{errorCount - 1} more error{errorCount > 2 ? 's' : ''}
            </div>
          )}
        </div>
        <details className="mt-2 cursor-pointer">
          <summary className="text-xs underline text-red-700 dark:text-red-300 hover:text-red-900 dark:hover:text-red-100">
            View all errors
          </summary>
          <ul className="mt-2 space-y-1 text-xs text-red-700 dark:text-red-300 list-disc list-inside">
            {errors.map((error, idx) => (
              <li key={idx}>{error}</li>
            ))}
          </ul>
        </details>
      </div>
      <button
        onClick={handleDismiss}
        aria-label="Dismiss model parse errors"
        className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300 flex-shrink-0 text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}
