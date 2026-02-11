import type { Meta, StoryObj } from '@storybook/react';
import { ViewToggle, ViewToggleProps } from '@/apps/embedded/components/shared/ViewToggle';
import { BarChart3, Table, Code } from 'lucide-react';

const meta = {
  title: 'A Primitives / Navigation / ViewToggle',
  component: ViewToggle,
} satisfies Meta<typeof ViewToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default story showing basic view toggle with text labels
 */
export const Default: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Default View Toggle</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph View' },
          { key: 'list', label: 'List View' },
          { key: 'json', label: 'JSON View' },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
      />
    </div>
  ),
};

/**
 * Story showing Graph View selected
 */
export const GraphView: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Graph View Selected</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph View', icon: BarChart3 },
          { key: 'list', label: 'List View', icon: Table },
          { key: 'json', label: 'JSON View', icon: Code },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
      />
    </div>
  ),
};

/**
 * Story showing JSON View selected
 */
export const JSONView: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">JSON View Selected</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph View', icon: BarChart3 },
          { key: 'list', label: 'List View', icon: Table },
          { key: 'json', label: 'JSON View', icon: Code },
        ]}
        activeView="json"
        onViewChange={(view) => console.log('View changed to:', view)}
      />
    </div>
  ),
};

/**
 * Story with icons
 */
export const WithIcons: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">View Toggle with Icons</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph', icon: BarChart3 },
          { key: 'table', label: 'Table', icon: Table },
          { key: 'json', label: 'JSON', icon: Code },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
      />
    </div>
  ),
};

/**
 * Story showing different sizes
 */
export const SizeSmall: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Small Size</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph' },
          { key: 'list', label: 'List' },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
        size="sm"
      />
    </div>
  ),
};

/**
 * Story with medium size
 */
export const SizeMedium: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Medium Size (Default)</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph View' },
          { key: 'list', label: 'List View' },
          { key: 'json', label: 'JSON View' },
        ]}
        activeView="list"
        onViewChange={(view) => console.log('View changed to:', view)}
        size="md"
      />
    </div>
  ),
};

/**
 * Story with large size
 */
export const SizeLarge: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Large Size</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph View', icon: BarChart3 },
          { key: 'list', label: 'List View', icon: Table },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
        size="lg"
      />
    </div>
  ),
};

/**
 * Story showing disabled state
 */
export const Disabled: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Disabled View Toggle</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">All buttons disabled</p>
          <ViewToggle
            views={[
              { key: 'graph', label: 'Graph' },
              { key: 'list', label: 'List' },
              { key: 'json', label: 'JSON' },
            ]}
            activeView="graph"
            onViewChange={(view) => console.log('View changed to:', view)}
            disabled={true}
          />
        </div>
      </div>
    </div>
  ),
};

/**
 * Story showing different active views
 */
export const DifferentActiveViews: Story = {
  render: () => {
    const views = [
      { key: 'overview', label: 'Overview', icon: BarChart3 },
      { key: 'details', label: 'Details', icon: Table },
      { key: 'code', label: 'Code', icon: Code },
    ];

    return (
      <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
        <h2 className="text-lg font-bold mb-6">Different Active Views</h2>

        <div className="space-y-6">
          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active: Overview</p>
            <ViewToggle
              views={views}
              activeView="overview"
              onViewChange={(view) => console.log('View changed to:', view)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active: Details</p>
            <ViewToggle
              views={views}
              activeView="details"
              onViewChange={(view) => console.log('View changed to:', view)}
            />
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Active: Code</p>
            <ViewToggle
              views={views}
              activeView="code"
              onViewChange={(view) => console.log('View changed to:', view)}
            />
          </div>
        </div>
      </div>
    );
  },
};

/**
 * Story with many view options
 */
export const ManyViews: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 800, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Multiple View Options</h2>
      <ViewToggle
        views={[
          { key: 'graph', label: 'Graph', icon: BarChart3 },
          { key: 'table', label: 'Table', icon: Table },
          { key: 'json', label: 'JSON', icon: Code },
          { key: 'export', label: 'Export' },
          { key: 'compare', label: 'Compare' },
        ]}
        activeView="graph"
        onViewChange={(view) => console.log('View changed to:', view)}
      />
    </div>
  ),
};

/**
 * Story showing accessibility features
 */
export const AccessibilityDemo: Story = {
  render: () => (
    <div style={{ width: '100%', maxWidth: 600, padding: '20px', backgroundColor: '#f9fafb' }}>
      <h2 className="text-lg font-bold mb-4">Accessibility Features</h2>
      <div className="space-y-4">
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Features:
          </p>
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 mb-4">
            <li>✓ ARIA role="group" for semantic structure</li>
            <li>✓ aria-label for group description</li>
            <li>✓ aria-label for each button ("Switch to X view")</li>
            <li>✓ aria-pressed attribute for active state</li>
            <li>✓ Keyboard navigation support</li>
          </ul>
        </div>
        <ViewToggle
          views={[
            { key: 'graph', label: 'Graph View' },
            { key: 'list', label: 'List View' },
            { key: 'json', label: 'JSON View' },
          ]}
          activeView="graph"
          onViewChange={(view) => console.log('View changed to:', view)}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-4">
          Try navigating with keyboard: Tab to focus, Space/Enter to activate
        </p>
      </div>
    </div>
  ),
};
