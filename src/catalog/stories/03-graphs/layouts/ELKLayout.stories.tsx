/**
 * ELK Layout Engine Stories
 * Demonstrates advanced layouts using Eclipse Layout Kernel (ELK)
 */
import type { Story } from '@ladle/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

export default {
  title: '03 Graphs / Layouts / ELKLayout',
};

/**
 * Default layered hierarchical layout
 */
export const Hierarchical: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="elk"
          layoutParameters={{
            'elk.algorithm': 'layered',
            'elk.direction': 'DOWN',
            'elk.spacing.nodeNode': '50',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Force-directed layout with spring model
 */
export const ForceDirected: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="elk"
          layoutParameters={{
            'elk.algorithm': 'force',
            'elk.spacing.nodeNode': '60'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Stress layout for minimal edge crossings
 */
export const Stress: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="elk"
          layoutParameters={{
            'elk.algorithm': 'stress',
            'elk.spacing.nodeNode': '50'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Orthogonal edge routing
 */
export const OrthogonalRouting: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="elk"
          layoutParameters={{
            'elk.algorithm': 'layered',
            'elk.direction': 'RIGHT',
            'elk.edgeRouting': 'ORTHOGONAL',
            'elk.spacing.nodeNode': '50',
            'elk.layered.spacing.nodeNodeBetweenLayers': '80'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};
