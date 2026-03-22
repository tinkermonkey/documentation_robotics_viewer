/**
 * SpecVersionWarning Component
 * Displays a dismissible warning banner when spec version mismatches occur
 */

export interface SpecVersionWarningProps {
  /** The model's declared spec version */
  modelVersion: string;
  /** The loaded spec version */
  specVersion: string;
  /** Callback when user dismisses the warning */
  onDismiss: () => void;
}

export function SpecVersionWarning({
  modelVersion,
  specVersion,
  onDismiss,
}: SpecVersionWarningProps) {
  return (
    <div
      role="alert"
      aria-live="polite"
      data-testid="spec-version-warning"
      className="flex items-center gap-2 px-4 py-2 bg-yellow-50 border-b border-yellow-200 dark:bg-yellow-900/20 dark:border-yellow-800 text-yellow-800 dark:text-yellow-200 text-sm"
    >
      <span className="flex-1">
        Spec version mismatch: model declares <code className="font-mono">{modelVersion}</code>,
        loaded spec is <code className="font-mono">{specVersion}</code>.
        Some data may not be correctly interpreted.
      </span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss spec version warning"
        className="text-yellow-600 hover:text-yellow-900 dark:text-yellow-400 dark:hover:text-yellow-300 flex-shrink-0 text-xl leading-none"
      >
        ×
      </button>
    </div>
  );
}
