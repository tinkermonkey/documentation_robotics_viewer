// @ts-expect-error - Storybook types not available in this environment
import type { Meta, StoryObj } from '@storybook/react';
import { GraphViewSidebar } from './GraphViewSidebar';

type MetaType = Meta<typeof GraphViewSidebar>;

const meta = {
  title: 'Embedded/GraphViewSidebar',
  component: GraphViewSidebar,
  parameters: {
    layout: 'fullscreen',
  },
  tags: ['autodocs'],
} satisfies MetaType;

export default meta;
type Story = StoryObj<MetaType>;

// Mock filter content
const MockFilterContent = () => (
  <div className="space-y-4">
    <div className="text-sm text-gray-600 dark:text-gray-400">
      <label className="flex items-center gap-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span>Element Type 1</span>
      </label>
      <label className="flex items-center gap-2 mt-2">
        <input type="checkbox" defaultChecked className="rounded" />
        <span>Element Type 2</span>
      </label>
    </div>
  </div>
);

// Mock control content
const MockControlContent = () => (
  <div className="space-y-4">
    <div>
      <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 block mb-2">
        Layout Algorithm
      </label>
      <select className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded text-sm dark:bg-gray-700 dark:text-white">
        <option>Hierarchical</option>
        <option>Force-Directed</option>
        <option>Circular</option>
      </select>
    </div>
    <button className="w-full px-3 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700">
      Fit to View
    </button>
  </div>
);

// Mock inspector content
const MockInspectorContent = () => (
  <div className="space-y-3">
    <div className="text-sm">
      <h4 className="font-semibold text-gray-700 dark:text-gray-300 mb-2">Selected Node</h4>
      <p className="text-gray-600 dark:text-gray-400">Node ID: motivation.goal.example</p>
      <p className="text-gray-600 dark:text-gray-400">Type: Goal</p>
    </div>
    <button className="w-full px-3 py-2 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm rounded hover:bg-gray-200 dark:hover:bg-gray-600">
      Trace Upstream
    </button>
  </div>
);

/**
 * Default state: without inspector section
 */
export const Default: Story = {
  args: {
    filterContent: <MockFilterContent />,
    controlContent: <MockControlContent />,
    showInspectorSection: false,
    testId: 'graph-view-sidebar-demo',
  },
  decorators: [
    (StoryComponent: any) => (
      <div className="w-80 h-screen bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
        <StoryComponent />
      </div>
    ),
  ],
};

/**
 * With inspector section visible
 */
export const WithInspector: Story = {
  args: {
    filterContent: <MockFilterContent />,
    controlContent: <MockControlContent />,
    inspectorContent: <MockInspectorContent />,
    showInspectorSection: true,
    testId: 'graph-view-sidebar-with-inspector',
  },
  decorators: [
    (StoryComponent: any) => (
      <div className="w-80 h-screen bg-gray-50 dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 overflow-y-auto">
        <StoryComponent />
      </div>
    ),
  ],
};

/**
 * Dark mode variant
 */
export const DarkMode: Story = {
  args: {
    filterContent: <MockFilterContent />,
    controlContent: <MockControlContent />,
    showInspectorSection: false,
    testId: 'graph-view-sidebar-dark',
  },
  decorators: [
    (StoryComponent: any) => (
      <div className="w-80 h-screen bg-gray-900 dark:bg-gray-950 border-l border-gray-700 dark:border-gray-800 overflow-y-auto dark">
        <StoryComponent />
      </div>
    ),
  ],
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
