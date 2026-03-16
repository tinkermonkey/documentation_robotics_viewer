import type { Meta, StoryObj } from '@storybook/react';
import { LoadingState } from '@/apps/embedded/components/shared/LoadingState';

const meta = {
  title: 'A Primitives / State Panels / LoadingState',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const PageLoading: Story = {
  render: () => (
    <LoadingState message="Loading application..." variant="page" />
  ),
};

export const PanelLoading: Story = {
  render: () => (
    <div className="w-96 bg-white border border-gray-200">
    <LoadingState message="Loading panel data..." variant="panel" />
  </div>
  ),
};

export const InlineLoading: Story = {
  render: () => (
    <div className="p-4 bg-white border border-gray-200">
    <LoadingState message="Processing..." variant="inline" />
  </div>
  ),
};

export const DefaultMessage: Story = {
  render: () => (
    <LoadingState />
  ),
};
