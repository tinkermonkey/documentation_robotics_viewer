/**
 * NavigationErrorNotification Component Stories
 *
 * Displays inline error notifications for cross-layer navigation failures.
 * Shows alerts with auto-dismiss functionality and manual dismiss button.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { useEffect } from 'react';
import { NavigationErrorNotification } from '@/core/components/base/NavigationErrorNotification';
import { useCrossLayerStore } from '@/core/stores/crossLayerStore';

const meta = {
  title: 'Core Components / NavigationErrorNotification',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * No error state - notification is hidden
 */
export const NoError: Story = {
  render: () => {
    // Clear any existing error
    useCrossLayerStore.getState().clearLastError();

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification />
        <div className="mt-8 p-4 bg-gray-50 rounded text-sm text-gray-600">
          <p>No error is displayed because no error has been set.</p>
        </div>
      </div>
    );
  },
};

/**
 * Showing an error notification
 * Displays an error message with a dismiss button
 */
export const WithError: Story = {
  render: () => {
    // Set an error for display
    useEffect(() => {
      useCrossLayerStore.getState().setLastError({
        message: 'Failed to load cross-layer relationships. The layer may be unavailable.',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      return () => {
        useCrossLayerStore.getState().clearLastError();
      };
    }, []);

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification />
      </div>
    );
  },
};

/**
 * Auto-dismissing error
 * Error automatically disappears after 3 seconds
 */
export const AutoDismiss: Story = {
  render: () => {
    useEffect(() => {
      useCrossLayerStore.getState().setLastError({
        message: 'Connection timeout while fetching data.',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      return () => {
        useCrossLayerStore.getState().clearLastError();
      };
    }, []);

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification autoDismissMs={3000} />
        <div className="mt-8 p-4 bg-blue-50 rounded text-sm text-blue-600">
          <p>This notification will auto-dismiss after 3 seconds.</p>
        </div>
      </div>
    );
  },
};

/**
 * Custom dismiss label
 * Shows customized button text
 */
export const CustomDismissLabel: Story = {
  render: () => {
    useEffect(() => {
      useCrossLayerStore.getState().setLastError({
        message: 'Unable to navigate to the specified layer.',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      return () => {
        useCrossLayerStore.getState().clearLastError();
      };
    }, []);

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification dismissLabel="Close" autoDismissMs={0} />
      </div>
    );
  },
};

/**
 * With custom styling
 * Demonstrates applying custom CSS classes
 */
export const WithCustomStyling: Story = {
  render: () => {
    useEffect(() => {
      useCrossLayerStore.getState().setLastError({
        message: 'Critical error: Unable to process cross-layer relationships.',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      return () => {
        useCrossLayerStore.getState().clearLastError();
      };
    }, []);

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification
          className="rounded-lg shadow-lg border-l-4 border-red-500"
          autoDismissMs={0}
        />
      </div>
    );
  },
};

/**
 * Multiple errors (manual reset)
 * Shows error handling flow without auto-dismiss
 */
export const ManualDismiss: Story = {
  render: () => {
    useEffect(() => {
      useCrossLayerStore.getState().setLastError({
        message: 'Navigation failed: Invalid layer reference.',
        timestamp: Date.now(),
        type: 'extraction_error',
      });

      return () => {
        useCrossLayerStore.getState().clearLastError();
      };
    }, []);

    return (
      <div className="w-96 p-8">
        <NavigationErrorNotification
          dismissLabel="Got it"
          autoDismissMs={0}
        />
        <div className="mt-8 p-4 bg-yellow-50 rounded text-sm text-yellow-700">
          <p>This notification requires manual dismissal. Click the button to close it.</p>
        </div>
      </div>
    );
  },
};
