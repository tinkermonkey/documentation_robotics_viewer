import type { Meta, StoryObj } from '@storybook/react-vite';
import SubTabNavigation, { type SubTab } from '@/apps/embedded/components/SubTabNavigation';

const meta = {
  title: 'A Primitives / Navigation / SubTabNavigation',
} satisfies Meta;

export default meta;
type Story = StoryObj;

export const Default: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'graph', label: 'Graph', path: '/view/graph' },
    { id: 'json', label: 'JSON', path: '/view/json' },
  ];

  return <SubTabNavigation tabs={tabs} activePath="/view/graph" />;
} };

export const TwoTabs: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'graph', label: 'Graph View', path: '/model/graph' },
    { id: 'list', label: 'List View', path: '/model/list' },
  ];

  return <SubTabNavigation tabs={tabs} activePath="/model/list" />;
} };

export const FiveTabs: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'overview', label: 'Overview', path: '/dashboard/overview' },
    { id: 'motivation', label: 'Motivation', path: '/dashboard/motivation' },
    { id: 'business', label: 'Business', path: '/dashboard/business' },
    { id: 'technology', label: 'Technology', path: '/dashboard/technology' },
    { id: 'analytics', label: 'Analytics', path: '/dashboard/analytics' },
  ];

  return <SubTabNavigation tabs={tabs} activePath="/dashboard/business" />;
} };

export const FirstTabActive: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'graph', label: 'Graph', path: '/view/graph' },
    { id: 'json', label: 'JSON', path: '/view/json' },
    { id: 'diff', label: 'Diff', path: '/view/diff' },
  ];

  return <SubTabNavigation tabs={tabs} activePath="/view/graph" />;
} };

export const LastTabActive: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'graph', label: 'Graph', path: '/view/graph' },
    { id: 'json', label: 'JSON', path: '/view/json' },
    { id: 'diff', label: 'Diff', path: '/view/diff' },
  ];

  return <SubTabNavigation tabs={tabs} activePath="/view/diff" />;
} };

export const NoTabs: Story = { render: () => {
  return (
    <div className="p-4 text-gray-500 text-sm">
      <SubTabNavigation tabs={[]} activePath="/view" />
      <p className="mt-4">No sub-tabs to display (component returns null)</p>
    </div>
  );
} };

export const PathNotExactMatch: Story = { render: () => {
  const tabs: SubTab[] = [
    { id: 'graph', label: 'Graph', path: '/model/graph' },
    { id: 'json', label: 'JSON', path: '/model/json' },
  ];

  return (
    <div className="space-y-4">
      <div>
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
          Active path: /model/graph/detailed (uses startsWith matching)
        </p>
        <SubTabNavigation tabs={tabs} activePath="/model/graph/detailed" />
      </div>
    </div>
  );
} };
