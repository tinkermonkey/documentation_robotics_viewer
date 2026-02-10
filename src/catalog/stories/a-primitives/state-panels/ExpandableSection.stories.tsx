import type { StoryDefault, Story } from '@ladle/react';
import { useState } from 'react';
import ExpandableSection from '@/apps/embedded/components/common/ExpandableSection';

export default {
  title: 'A - Primitives / State Panels / ExpandableSection',
} satisfies StoryDefault;

export const Expanded: Story = () => (
  <div className="w-96">
    <ExpandableSection
      title="Expanded Section"
      defaultExpanded={true}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        This section is expanded by default. It contains detailed information about the selected item.
      </div>
    </ExpandableSection>
  </div>
);

export const Collapsed: Story = () => (
  <div className="w-96">
    <ExpandableSection
      title="Collapsed Section"
      defaultExpanded={false}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        This section is collapsed by default. Click the header to expand it.
      </div>
    </ExpandableSection>
  </div>
);

export const WithCount: Story = () => (
  <div className="w-96">
    <ExpandableSection
      title="Elements"
      count={12}
      defaultExpanded={true}
    >
      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">Item 1</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Item 2</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Item 3</div>
      </div>
    </ExpandableSection>
  </div>
);

export const WithBadge: Story = () => (
  <div className="w-96">
    <ExpandableSection
      title="Active Changesets"
      badge="3 new"
      defaultExpanded={true}
    >
      <div className="space-y-2">
        <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 1: New Goal added</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 2: Requirement updated</div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Changeset 3: Constraint deleted</div>
      </div>
    </ExpandableSection>
  </div>
);

export const WithCountAndBadge: Story = () => (
  <div className="w-96">
    <ExpandableSection
      title="Results"
      count={45}
      badge="filtered"
      defaultExpanded={true}
    >
      <div className="text-sm text-gray-600 dark:text-gray-400">
        Showing 45 filtered results from 120 total items.
      </div>
    </ExpandableSection>
  </div>
);

export const Controlled: Story = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div className="w-96 space-y-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
      >
        External Toggle: {isExpanded ? 'Collapse' : 'Expand'}
      </button>
      <ExpandableSection
        title="Controlled Section"
        isExpanded={isExpanded}
        onToggle={() => setIsExpanded(!isExpanded)}
      >
        <div className="text-sm text-gray-600 dark:text-gray-400">
          This section is controlled by the button above.
        </div>
      </ExpandableSection>
    </div>
  );
};
