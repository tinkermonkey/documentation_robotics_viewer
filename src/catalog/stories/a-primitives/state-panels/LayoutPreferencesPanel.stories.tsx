/**
 * LayoutPreferencesPanel Component Stories
 *
 * Allows users to configure layout algorithm preferences and parameters.
 * Shows controls for selecting layout engines and adjusting their settings.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutPreferencesPanel } from '@/apps/embedded/components/LayoutPreferencesPanel';
import { useLayoutPreferencesStore } from '@/core/stores/layoutPreferencesStore';

const meta = {
  title: 'A Primitives / State Panels / LayoutPreferencesPanel',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Default layout preferences
 * Shows the panel with default settings
 */
export const Default: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'dagre', business: 'dagre' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * With Dagre layout selected
 * Shows Dagre-specific configuration options
 */
export const DagreLayout: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'dagre', business: 'dagre', application: 'dagre' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * With ELK layout selected
 * Shows ELK-specific configuration options
 */
export const ELKLayout: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'elk', business: 'elk', application: 'elk' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * With D3Force layout selected
 * Shows force-directed simulation options
 */
export const D3ForceLayout: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'd3-force', business: 'd3-force', application: 'd3-force' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * Animation disabled
 * Shows preferences with animation turned off
 */
export const NoAnimation: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'dagre', business: 'dagre' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * Manual layout mode
 * Shows preferences with auto-layout disabled
 */
export const ManualLayout: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'dagre', business: 'dagre' },
      activePreset: null,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};
