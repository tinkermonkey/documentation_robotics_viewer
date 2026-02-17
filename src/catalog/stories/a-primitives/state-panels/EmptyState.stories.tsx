import type { Meta, StoryObj } from '@storybook/react';
import { EmptyState } from '@/apps/embedded/components/shared/EmptyState';

const meta = {
  title: 'A Primitives / State Panels / EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const NoAnnotations: Story = {
  render: () => (
    <EmptyState variant="annotations" />
  ),
};

export const NoChangesets: Story = {
  render: () => (
    <EmptyState variant="changesets" />
  ),
};

export const NoElements: Story = {
  render: () => (
    <EmptyState variant="elements" />
  ),
};

export const NoModel: Story = {
  render: () => (
    <EmptyState variant="model" />
  ),
};

export const ErrorVariant: Story = {
  render: () => (
    <EmptyState variant="error" />
  ),
};

export const WithCustomTitle: Story = {
  render: () => (
    <EmptyState
    variant="annotations"
    title="No annotations found"
    description="This element has no annotations yet. Click the button below to add one."
  />
  ),
};

export const WithAction: Story = {
  render: () => (
    <EmptyState
    variant="changesets"
    action={{
      label: 'Create Changeset',
      onClick: () => console.log('Create changeset clicked'),
    }}
  />
  ),
};
