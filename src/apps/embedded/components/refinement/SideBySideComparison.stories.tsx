import type { StoryDefault, Story } from '@ladle/react';
import { SideBySideComparison } from './SideBySideComparison';
import type { ComparisonViewOptions, LayoutSnapshot } from '../../types/refinement';
import { useState } from 'react';

export default {
  title: 'Refinement / SideBySideComparison',
} satisfies StoryDefault;

const SAMPLE_IMAGE = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23e5e7eb" width="400" height="300"/><text x="200" y="150" text-anchor="middle" font-size="18" fill="%236b7280">Sample Image</text></svg>';

function SideBySideStory() {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'side-by-side',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        generatedScreenshotUrl={SAMPLE_IMAGE}
        heatmapUrl={SAMPLE_IMAGE}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
      />
    </div>
  );
}

export const SideBySideMode: Story = () => <SideBySideStory />;

export const OverlayMode: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'overlay',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        generatedScreenshotUrl={SAMPLE_IMAGE}
        heatmapUrl={SAMPLE_IMAGE}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
      />
    </div>
  );
};

export const HeatmapMode: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'heatmap',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        generatedScreenshotUrl={SAMPLE_IMAGE}
        heatmapUrl={SAMPLE_IMAGE}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
      />
    </div>
  );
};

export const DifferenceMode: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'difference',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        generatedScreenshotUrl={SAMPLE_IMAGE}
        heatmapUrl={SAMPLE_IMAGE}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
      />
    </div>
  );
};

export const ZoomedIn: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'side-by-side',
    zoom: 2,
    panOffset: { x: 50, y: 50 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  return (
    <div style={{ height: 500, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        generatedScreenshotUrl={SAMPLE_IMAGE}
        heatmapUrl={SAMPLE_IMAGE}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
      />
    </div>
  );
};

// Helper function to create mock layout snapshots
function createMockLayouts(count: number): LayoutSnapshot[] {
  const layouts: LayoutSnapshot[] = [];
  const engines = ['Dagre', 'ELK Layered', 'Graphviz Dot', 'D3 Force', 'ELK Force', 'Graphviz Neato'];

  for (let i = 0; i < count; i++) {
    layouts.push({
      id: `layout-${i + 1}`,
      label: engines[i % engines.length],
      screenshotUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="300"><rect fill="%23${i % 2 === 0 ? 'e5e7eb' : 'dbeafe'}" width="400" height="300"/><text x="200" y="140" text-anchor="middle" font-size="18" fill="%236b7280">${engines[i % engines.length]}</text><text x="200" y="170" text-anchor="middle" font-size="14" fill="%239ca3af">Score: ${(0.65 + i * 0.05).toFixed(2)}</text></svg>`,
      qualityScore: {
        combinedScore: 0.65 + i * 0.05,
        readabilityScore: 0.7 + i * 0.04,
        similarityScore: 0.6 + i * 0.06,
        readabilityMetrics: {
          edgeCrossings: 5 - i,
          nodeOcclusion: 2 - (i % 2),
          aspectRatioScore: 0.8 + i * 0.02,
          edgeLengthVariance: 120 - i * 10,
          density: 0.5 + i * 0.03,
        },
        similarityMetrics: {
          structuralSimilarity: 0.65 + i * 0.05,
          layoutSimilarity: 0.6 + i * 0.05,
          perceptualHash: `hash${i}`,
        },
      },
      isBest: i === 3, // Mark the 4th layout as best
    });
  }

  return layouts;
}

export const MultiLayoutGrid3: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'side-by-side',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const layouts = createMockLayouts(3);

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  const handleLayoutSelect = (layoutId: string) => {
    console.log('Selected layout:', layoutId);
  };

  return (
    <div style={{ height: 600, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        layouts={layouts}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
        onLayoutSelect={handleLayoutSelect}
      />
    </div>
  );
};

export const MultiLayoutGrid4: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'side-by-side',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const layouts = createMockLayouts(4);

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  const handleLayoutSelect = (layoutId: string) => {
    console.log('Selected layout:', layoutId);
  };

  return (
    <div style={{ height: 700, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        layouts={layouts}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
        onLayoutSelect={handleLayoutSelect}
      />
    </div>
  );
};

export const MultiLayoutGrid6: Story = () => {
  const [viewOptions, setViewOptions] = useState<ComparisonViewOptions>({
    mode: 'side-by-side',
    zoom: 1,
    panOffset: { x: 0, y: 0 },
    overlayOpacity: 0.5,
    syncZoom: true,
  });

  const layouts = createMockLayouts(6);

  const handleViewOptionsChange = (options: ComparisonViewOptions) => {
    setViewOptions(options);
  };

  const handleLayoutSelect = (layoutId: string) => {
    console.log('Selected layout:', layoutId);
  };

  return (
    <div style={{ height: 800, width: '100%' }}>
      <SideBySideComparison
        referenceImageUrl={SAMPLE_IMAGE}
        layouts={layouts}
        viewOptions={viewOptions}
        onViewOptionsChange={handleViewOptionsChange}
        onLayoutSelect={handleLayoutSelect}
      />
    </div>
  );
};
