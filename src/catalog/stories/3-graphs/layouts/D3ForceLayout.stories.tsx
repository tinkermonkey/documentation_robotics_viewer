/**
 * D3 Force Layout Engine Stories
 * Demonstrates physics-based force-directed layouts using D3
 */
import type { Story } from '@ladle/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

export default {
  title: '3 Graphs / Layouts / D3ForceLayout',
};

/**
 * Default force-directed simulation
 */
export const Default: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="d3-force"
          layoutParameters={{
            iterations: 300,
            linkDistance: 100,
            chargeStrength: -300,
            collisionRadius: 40
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * High repulsion for spread-out layout
 */
export const HighRepulsion: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="d3-force"
          layoutParameters={{
            iterations: 300,
            linkDistance: 150,
            chargeStrength: -800,
            collisionRadius: 60
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Tight clustering for compact layout
 */
export const TightClustering: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="d3-force"
          layoutParameters={{
            iterations: 300,
            linkDistance: 60,
            chargeStrength: -150,
            collisionRadius: 30
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Extended simulation for stable layout
 */
export const ExtendedSimulation: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="d3-force"
          layoutParameters={{
            iterations: 1000,
            linkDistance: 100,
            chargeStrength: -300,
            collisionRadius: 40
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};
