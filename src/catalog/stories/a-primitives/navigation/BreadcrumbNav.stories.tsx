import type { Meta, StoryObj } from '@storybook/react';
import { BreadcrumbNav, type BreadcrumbSegment } from '@/apps/embedded/components/shared/BreadcrumbNav';
import { HiOutlineCubeTransparent, HiOutlineRectangleStack } from 'react-icons/hi2';

const meta = {
  title: 'A Primitives / Navigation / BreadcrumbNav',
  component: BreadcrumbNav,
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    { id: 'goal-1', label: 'Increase Revenue', type: 'Goal' },
    { id: 'req-1', label: 'Customer Satisfaction', type: 'Requirement' },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      onNavigate={(id) => console.log('Navigate to:', id)}
    />
  );
} };

export const SingleLevel: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    { id: 'goal-1', label: 'Increase Revenue', type: 'Goal' },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      onNavigate={(id) => console.log('Navigate to:', id)}
    />
  );
} };

export const MultiLevel: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    { id: 'stakeholder-1', label: 'Board of Directors', type: 'Stakeholder', icon: <HiOutlineCubeTransparent className="w-4 h-4" /> },
    { id: 'driver-1', label: 'Digital Transformation', type: 'Driver', icon: <HiOutlineRectangleStack className="w-4 h-4" /> },
    { id: 'goal-1', label: 'Cloud Migration', type: 'Goal' },
    { id: 'req-1', label: 'Reduce TCO by 30%', type: 'Requirement' },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      currentLevel="Business"
      onNavigate={(id) => console.log('Navigate to:', id)}
    />
  );
} };

export const WithClearButton: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    { id: 'goal-1', label: 'Increase Revenue', type: 'Goal' },
    { id: 'req-1', label: 'Customer Satisfaction', type: 'Requirement' },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      currentLevel="Motivation"
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClear={() => console.log('Cleared breadcrumb')}
      showLevelBadge={true}
    />
  );
} };

export const WithoutLevelBadge: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    { id: 'goal-1', label: 'Increase Revenue', type: 'Goal' },
    { id: 'req-1', label: 'Customer Satisfaction', type: 'Requirement' },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      currentLevel="Business"
      onNavigate={(id) => console.log('Navigate to:', id)}
      showLevelBadge={false}
    />
  );
} };

export const WithIcons: Story = { render: () => {
  const segments: BreadcrumbSegment[] = [
    {
      id: 'stakeholder-1',
      label: 'Executive Team',
      type: 'Stakeholder',
      icon: <HiOutlineCubeTransparent className="w-4 h-4 text-purple-600" />,
    },
    {
      id: 'driver-1',
      label: 'Market Expansion',
      type: 'Driver',
      icon: <HiOutlineRectangleStack className="w-4 h-4 text-blue-600" />,
    },
    {
      id: 'goal-1',
      label: 'Enter New Markets',
      type: 'Goal',
    },
  ];

  return (
    <BreadcrumbNav
      segments={segments}
      currentLevel="Motivation"
      onNavigate={(id) => console.log('Navigate to:', id)}
      onClear={() => console.log('Cleared')}
      showLevelBadge={true}
    />
  );
} };

export const Empty: Story = { render: () => {
  return (
    <div className="p-4 text-gray-500 text-sm">
      <BreadcrumbNav
        segments={[]}
        onNavigate={(id) => console.log('Navigate to:', id)}
      />
      <p className="mt-4">No breadcrumbs to display (component returns null)</p>
    </div>
  );
} };
