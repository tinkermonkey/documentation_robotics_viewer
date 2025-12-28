import type { StoryDefault, Story } from '@ladle/react';
import { LayoutSlider } from './LayoutSlider';
import { useState } from 'react';

export default {
  title: 'Refinement / LayoutSlider',
} satisfies StoryDefault;

const BEFORE_IMAGE = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23dbeafe" width="800" height="600"/><text x="400" y="280" text-anchor="middle" font-size="24" fill="%232563eb" font-weight="bold">Before Layout</text><text x="400" y="320" text-anchor="middle" font-size="16" fill="%233b82f6">Dagre - Score: 0.68</text><circle cx="200" cy="150" r="40" fill="%2393c5fd"/><circle cx="600" cy="150" r="40" fill="%2393c5fd"/><circle cx="400" cy="450" r="40" fill="%2393c5fd"/><line x1="200" y1="150" x2="400" y2="450" stroke="%232563eb" stroke-width="2"/><line x1="600" y1="150" x2="400" y2="450" stroke="%232563eb" stroke-width="2"/></svg>`;

const AFTER_IMAGE = `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600"><rect fill="%23d1fae5" width="800" height="600"/><text x="400" y="280" text-anchor="middle" font-size="24" fill="%23059669" font-weight="bold">After Layout</text><text x="400" y="320" text-anchor="middle" font-size="16" fill="%2310b981">ELK Force - Score: 0.89</text><circle cx="400" cy="150" r="40" fill="%2334d399"/><circle cx="250" cy="400" r="40" fill="%2334d399"/><circle cx="550" cy="400" r="40" fill="%2334d399"/><line x1="400" y1="150" x2="250" y2="400" stroke="%23059669" stroke-width="2"/><line x1="400" y1="150" x2="550" y2="400" stroke="%23059669" stroke-width="2"/></svg>`;

export const BasicSlider: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  return (
    <div style={{ height: 600, width: '100%', maxWidth: 1000 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Dagre Layout"
        afterLabel="ELK Force Layout"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
      />
    </div>
  );
};

export const StartingAtBefore: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(0);

  return (
    <div style={{ height: 600, width: '100%', maxWidth: 1000 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Before Optimization"
        afterLabel="After Optimization"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
      />
    </div>
  );
};

export const StartingAtAfter: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(100);

  return (
    <div style={{ height: 600, width: '100%', maxWidth: 1000 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Original Layout"
        afterLabel="Optimized Layout"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
      />
    </div>
  );
};

export const WithQualityScores: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  return (
    <div style={{ height: 600, width: '100%', maxWidth: 1000 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Dagre (Score: 0.68)"
        afterLabel="ELK Force (Score: 0.89)"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
        showMetrics={true}
        beforeMetrics={{
          readabilityScore: 0.68,
          edgeCrossings: 5,
          nodeOcclusion: 2,
        }}
        afterMetrics={{
          readabilityScore: 0.89,
          edgeCrossings: 1,
          nodeOcclusion: 0,
        }}
      />
    </div>
  );
};

export const CompactView: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  return (
    <div style={{ height: 400, width: 600 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Before"
        afterLabel="After"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
        compact={true}
      />
    </div>
  );
};

export const VerticalOrientation: Story = () => {
  const [sliderPosition, setSliderPosition] = useState<number>(50);

  return (
    <div style={{ height: 800, width: 500 }}>
      <LayoutSlider
        beforeImageUrl={BEFORE_IMAGE}
        afterImageUrl={AFTER_IMAGE}
        beforeLabel="Top: Original"
        afterLabel="Bottom: Optimized"
        sliderPosition={sliderPosition}
        onSliderChange={(pos) => setSliderPosition(pos)}
        orientation="vertical"
      />
    </div>
  );
};
