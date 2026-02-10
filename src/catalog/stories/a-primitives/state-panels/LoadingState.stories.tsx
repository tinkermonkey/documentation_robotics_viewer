import type { StoryDefault, Story } from '@ladle/react';
import { LoadingState } from '@/apps/embedded/components/shared/LoadingState';

export default {
  title: 'A Primitives / State Panels / LoadingState',
} satisfies StoryDefault;

export const PageLoading: Story = () => (
  <LoadingState message="Loading application..." variant="page" />
);

export const PanelLoading: Story = () => (
  <div className="w-96 bg-white border border-gray-200">
    <LoadingState message="Loading panel data..." variant="panel" />
  </div>
);

export const InlineLoading: Story = () => (
  <div className="p-4 bg-white border border-gray-200">
    <LoadingState message="Processing..." variant="inline" />
  </div>
);

export const DefaultMessage: Story = () => (
  <LoadingState />
);
