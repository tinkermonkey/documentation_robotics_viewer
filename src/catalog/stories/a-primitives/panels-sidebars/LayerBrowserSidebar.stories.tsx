import type { Meta, StoryObj } from '@storybook/react';
import { useState } from 'react';
import LayerBrowserSidebar from '@/apps/embedded/components/LayerBrowserSidebar';
import { createLayerBrowserSpecFixture } from '@/catalog/fixtures/specFixtures';

const meta = {
  title: 'A Primitives / Panels and Sidebars / LayerBrowserSidebar',
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

const spec = createLayerBrowserSpecFixture();

export const Default: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>(null);
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={spec}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
        />
      </div>
    );
  },
};

export const WithSelection: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>('01_motivation');
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={spec}
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
      '01_motivation': 12,
      '02_business': 25,
      '03_security': 8,
      '04_application': 18,
      '05_technology': 31,
      '06_api': 6,
    };
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={spec}
          selectedId={selectedId}
          onSelectLayer={setSelectedId}
          getCount={(id) => mockCounts[id] ?? 0}
        />
      </div>
    );
  },
};

export const WithCountsAndSelection: Story = {
  render: () => {
    const [selectedId, setSelectedId] = useState<string | null>('04_application');
    const mockCounts: Record<string, number> = {
      '01_motivation': 12,
      '02_business': 25,
      '03_security': 8,
      '04_application': 18,
      '05_technology': 31,
      '06_api': 6,
    };
    return (
      <div className="w-64 bg-white border border-gray-200">
        <LayerBrowserSidebar
          specData={spec}
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
