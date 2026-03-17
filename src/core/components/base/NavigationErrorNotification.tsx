/**
 * Navigation Error Notification Component
 *
 * Displays inline error notifications for cross-layer navigation failures.
 * Uses the crossLayerStore to access and clear error state.
 * Auto-dismisses after 6 seconds or when user clicks dismiss button.
 */

import { memo, useEffect, useState } from 'react';
import { Alert, Button } from 'flowbite-react';
import { HiExclamation, HiX } from 'react-icons/hi';
import { useCrossLayerStore } from '../../stores/crossLayerStore';

interface NavigationErrorNotificationProps {
  /** Custom dismiss button label (defaults to "Dismiss") */
  dismissLabel?: string;
  /** Auto-dismiss timeout in milliseconds (defaults to 6000) */
  autoDismissMs?: number;
  /** CSS class for customization */
  className?: string;
}

/**
 * Displays the last navigation error from the crossLayerStore
 * Auto-dismisses after 6 seconds unless user interacts with the notification
 */
export const NavigationErrorNotification = memo(
  ({
    dismissLabel = 'Dismiss',
    autoDismissMs = 6000,
    className = '',
  }: NavigationErrorNotificationProps) => {
    const lastError = useCrossLayerStore((state) => state.lastError);
    const clearLastError = useCrossLayerStore((state) => state.clearLastError);
    const [isVisible, setIsVisible] = useState(false);

    // Show notification when error occurs
    useEffect(() => {
      if (lastError) {
        setIsVisible(true);

        // Auto-dismiss after timeout
        const timer = setTimeout(() => {
          setIsVisible(false);
          clearLastError();
        }, autoDismissMs);

        return () => clearTimeout(timer);
      } else {
        setIsVisible(false);
      }
    }, [lastError, autoDismissMs, clearLastError]);

    if (!lastError || !isVisible) {
      return null;
    }

    const handleDismiss = () => {
      setIsVisible(false);
      clearLastError();
    };

    return (
      <Alert
        color="failure"
        icon={HiExclamation}
        className={`flex items-start justify-between gap-4 ${className}`}
        data-testid="navigation-error-notification"
      >
        <div className="flex-1">
          <div className="font-medium">Navigation Error</div>
          <div className="text-sm mt-1">{lastError.message}</div>
        </div>
        <Button
          size="xs"
          color="failure"
          pill
          onClick={handleDismiss}
          title={dismissLabel}
          aria-label={dismissLabel}
          data-testid="dismiss-error-notification"
        >
          <HiX className="h-4 w-4" />
        </Button>
      </Alert>
    );
  }
);

NavigationErrorNotification.displayName = 'NavigationErrorNotification';
