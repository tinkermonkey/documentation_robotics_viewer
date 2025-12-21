import type { StoryDefault, Story } from '@ladle/react';
import { SideBySideComparison } from './SideBySideComparison';
import type { ComparisonViewOptions } from '../../types/refinement';
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
