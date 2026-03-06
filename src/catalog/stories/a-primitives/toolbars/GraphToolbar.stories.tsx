import type { Meta, StoryObj } from '@storybook/react';
import { GraphToolbar } from '@/apps/embedded/components/GraphToolbar';

const noop = () => {};

const meta = {
  title: 'Primitives / Toolbars / GraphToolbar',
  parameters: { layout: 'fullscreen' },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

/** Search bar only — no zoom or export */
export const SearchOnly: Story = {
  render: () => (
    <GraphToolbar
      searchQuery=""
      onSearchChange={noop}
      searchPlaceholder="Search nodes..."
    />
  ),
};

/** Zoom controls only — no search or export */
export const ZoomOnly: Story = {
  render: () => (
    <GraphToolbar
      showZoomControls
      onZoomIn={noop}
      onZoomOut={noop}
      onFitView={noop}
    />
  ),
};

/** Full toolbar: search, filters, zoom, and export */
export const Full: Story = {
  render: () => (
    <GraphToolbar
      searchQuery=""
      onSearchChange={noop}
      searchPlaceholder="Search architecture elements..."
      showFilters
      onFiltersClick={noop}
      showZoomControls
      onZoomIn={noop}
      onZoomOut={noop}
      onFitView={noop}
      exportOptions={[
        { label: 'Export as PNG', onClick: noop },
        { label: 'Export as SVG', onClick: noop },
        { label: 'Export as JSON', onClick: noop },
      ]}
    />
  ),
};

/** Search pre-filled with a query value */
export const WithActiveSearch: Story = {
  render: () => (
    <GraphToolbar
      searchQuery="payment"
      onSearchChange={noop}
      searchPlaceholder="Search architecture elements..."
      showFilters
      onFiltersClick={noop}
      showZoomControls
      onZoomIn={noop}
      onZoomOut={noop}
      onFitView={noop}
    />
  ),
};
