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
      defaultEngines: { motivation: 'elk', business: 'elk' },
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};

/**
 * With ELK layout selected for all layers
 * Shows ELK configuration options
 */
export const AllELKLayout: Story = {
  render: () => {
    useLayoutPreferencesStore.setState({
      defaultEngines: { motivation: 'elk', business: 'elk', application: 'elk' },
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
      defaultEngines: { motivation: 'elk', business: 'elk' },
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
      defaultEngines: { motivation: 'elk', business: 'elk' },
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel />
      </div>
    );
  },
};
