import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import LayerBrowserSidebar from '@/apps/embedded/components/LayerBrowserSidebar';
import { createCompleteSpecFixture, createMinimalSpecFixture } from '@/catalog/fixtures/specFixtures';

const meta = {
  title: 'A Primitives / Panels and Sidebars / LayerBrowserSidebar',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const completeSpec = createCompleteSpecFixture();
const minimalSpec = createMinimalSpecFixture();

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={completeSpec}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
        />
      </div>
    );
  },
};

export const WithSelection: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>('motivation');
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={completeSpec}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
        />
      </div>
    );
  },
};

export const WithCounts: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    const mockCounts: Record<string, number> = {
      motivation: 12,
      business: 25,
      application: 18,
    };
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={minimalSpec}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
          getCount={(id) => mockCounts[id] ?? 0}
        />
      </div>
    );
  },
};

export const NullSpecData: Story = {
  render: () => (
    <div className="w-64 bg-white border border-gray-200 p-4">
      <LayerBrowserSidebar
        specData={null}
        selectedId={null}
        onSelectLayer={() => {}}
      />
      <span className="text-sm text-gray-500">No content (null specData)</span>
    </div>
  ),
};
