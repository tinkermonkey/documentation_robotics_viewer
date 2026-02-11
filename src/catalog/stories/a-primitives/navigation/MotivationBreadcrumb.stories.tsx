import type { Meta, StoryObj } from '@storybook/react';
import { MotivationBreadcrumb, BreadcrumbItem } from '@/apps/embedded/components/MotivationBreadcrumb';

const meta = {
  title: 'A Primitives / Navigation / MotivationBreadcrumb',
  component: MotivationBreadcrumb,
} satisfies Meta<typeof MotivationBreadcrumb>;

export default meta;
type Story = StoryObj<typeof meta>;

const shortPath: BreadcrumbItem[] = [
  { id: '1', name: 'Improve Customer Satisfaction', type: 'Goal' },
];

const mediumPath: BreadcrumbItem[] = [
  { id: '1', name: 'Business Growth', type: 'Goal' },
  { id: '2', name: 'Improve Customer Satisfaction', type: 'Goal' },
  { id: '3', name: 'Reduce Response Time', type: 'Requirement' },
];

const longPath: BreadcrumbItem[] = [
  { id: '1', name: 'Strategic Excellence', type: 'Stakeholder' },
  { id: '2', name: 'Business Growth', type: 'Goal' },
  { id: '3', name: 'Improve Customer Satisfaction', type: 'Goal' },
  { id: '4', name: 'Reduce Response Time', type: 'Requirement' },
  { id: '5', name: 'Optimize API Performance', type: 'Requirement' },
];

export const ShortPath: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <MotivationBreadcrumb
      path={shortPath}
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClearFocus={() => console.log('Clear focus')}
    />
  </div>
) };

export const MediumPath: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <MotivationBreadcrumb
      path={mediumPath}
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClearFocus={() => console.log('Clear focus')}
    />
  </div>
) };

export const LongPath: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <MotivationBreadcrumb
      path={longPath}
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClearFocus={() => console.log('Clear focus')}
    />
  </div>
) };

export const EmptyPath: Story = { render: () => (
  <div className="p-4 bg-white border border-gray-200">
    <MotivationBreadcrumb
      path={[]}
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClearFocus={() => console.log('Clear focus')}
    />
    <div className="mt-2 text-sm text-gray-500">Breadcrumb is hidden when path is empty</div>
  </div>
) };
