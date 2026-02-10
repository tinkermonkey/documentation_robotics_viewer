import type { StoryDefault, Story } from '@ladle/react';
import { EmptyState } from '@/apps/embedded/components/shared/EmptyState';

export default {
  title: '1 Primitives / State Panels / EmptyState',
} satisfies StoryDefault;

export const NoAnnotations: Story = () => (
  <EmptyState variant="annotations" />
);

export const NoChangesets: Story = () => (
  <EmptyState variant="changesets" />
);

export const NoElements: Story = () => (
  <EmptyState variant="elements" />
);

export const NoModel: Story = () => (
  <EmptyState variant="model" />
);

export const ErrorVariant: Story = () => (
  <EmptyState variant="error" />
);

export const WithCustomTitle: Story = () => (
  <EmptyState
    variant="annotations"
    title="No annotations found"
    description="This element has no annotations yet. Click the button below to add one."
  />
);

export const WithAction: Story = () => (
  <EmptyState
    variant="changesets"
    action={{
      label: 'Create Changeset',
      onClick: () => console.log('Create changeset clicked'),
    }}
  />
);
