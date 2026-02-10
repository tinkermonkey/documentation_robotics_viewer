import type { StoryDefault, Story } from '@ladle/react';
import { ErrorState } from '@/apps/embedded/components/shared/ErrorState';

export default {
  title: 'Primitives / State Panels / ErrorState',
} satisfies StoryDefault;

export const PageError: Story = () => (
  <ErrorState
    title="Failed to Load"
    message="An unexpected error occurred while loading the application. Please try again."
    variant="page"
  />
);

export const PageErrorWithRetry: Story = () => (
  <ErrorState
    title="Connection Error"
    message="Could not connect to the server. Please check your connection and try again."
    variant="page"
    onRetry={() => console.log('Retry clicked')}
  />
);

export const PanelError: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <ErrorState
      title="Load Failed"
      message="Failed to load panel data."
      variant="panel"
    />
  </div>
);

export const InlineError: Story = () => (
  <div className="p-4 bg-white border border-gray-200">
    <ErrorState
      message="Something went wrong. Please try again."
      variant="inline"
      onRetry={() => console.log('Retry clicked')}
    />
  </div>
);
