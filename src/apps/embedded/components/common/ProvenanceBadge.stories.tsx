import type { Meta, StoryObj } from '@storybook/react';
import ProvenanceBadge from './ProvenanceBadge';

const meta = {
  title: 'A Primitives / Data Viewers / ProvenanceBadge',
  component: ProvenanceBadge,
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof ProvenanceBadge>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Extracted: Story = {
  args: {
    provenance: 'extracted',
  },
};

export const Manual: Story = {
  args: {
    provenance: 'manual',
  },
};

export const Inferred: Story = {
  args: {
    provenance: 'inferred',
  },
};

export const Generated: Story = {
  args: {
    provenance: 'generated',
  },
};

export const AllVariants: Story = {
  args: {
    provenance: 'extracted',
  },
  render: () => (
    <div className="flex gap-3">
      <ProvenanceBadge provenance="extracted" />
      <ProvenanceBadge provenance="manual" />
      <ProvenanceBadge provenance="inferred" />
      <ProvenanceBadge provenance="generated" />
    </div>
  ),
};

export const AllVariantsDarkMode: Story = {
  args: {
    provenance: 'extracted',
  },
  render: () => (
    <div className="dark w-full bg-gray-900 p-8">
      <div className="flex gap-3">
        <ProvenanceBadge provenance="extracted" />
        <ProvenanceBadge provenance="manual" />
        <ProvenanceBadge provenance="inferred" />
        <ProvenanceBadge provenance="generated" />
      </div>
    </div>
  ),
  parameters: {
    backgrounds: { default: 'dark' },
  },
};
