/**
 * LayoutPreferencesPanel Component Stories
 *
 * Allows users to configure layout algorithm preferences and parameters.
 * Shows controls for selecting layout engines and adjusting their settings.
 */
import type { Meta, StoryObj } from '@storybook/react';
import { LayoutPreferencesPanel } from '@/apps/embedded/components/LayoutPreferencesPanel';
import { useLayoutPreferencesStore } from '@/apps/embedded/stores/layoutPreferencesStore';

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
      layoutEngine: 'dagre',
      autoLayout: true,
      animateLayout: true,
    });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-preferences-panel" />
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
        layoutEngine: 'dagre',
        autoLayout: true,
        animateLayout: true,
        dagreConfig: {
          rankdir: 'TB',
          nodesep: 50,
          ranksep: 80,
        },
      });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-dagre" />
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
        layoutEngine: 'elk',
        autoLayout: true,
        animateLayout: true,
        elkConfig: {
          'elk.algorithm': 'mrtree',
          'elk.direction': 'DOWN',
        },
      });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-elk" />
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
        layoutEngine: 'd3-force',
        autoLayout: false,
        animateLayout: true,
        d3ForceConfig: {
          strength: -30,
          distance: 100,
          iterations: 200,
        },
      });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-d3force" />
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
        layoutEngine: 'dagre',
        autoLayout: true,
        animateLayout: false,
      });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-no-animation" />
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
        layoutEngine: 'dagre',
        autoLayout: false,
        animateLayout: true,
      });

    return (
      <div className="w-full max-w-md p-4">
        <LayoutPreferencesPanel data-testid="layout-manual" />
      </div>
    );
  },
};
