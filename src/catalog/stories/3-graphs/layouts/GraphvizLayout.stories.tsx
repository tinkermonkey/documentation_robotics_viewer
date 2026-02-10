/**
 * Graphviz Layout Engine Stories
 * Demonstrates classic Graphviz layout algorithms
 */
import type { Story } from '@ladle/react';
import GraphViewer from '@/core/components/GraphViewer';
import { StoryProviderWrapper } from '@/catalog';
import { createCompleteModelFixture } from '@/catalog/fixtures/modelFixtures';

export default {
  title: '3 Graphs / Layouts / GraphvizLayout',
};

/**
 * Dot algorithm - hierarchical directed graphs
 */
export const Dot: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'dot',
            rankdir: 'TB',
            nodesep: 0.5,
            ranksep: 1.0
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Neato algorithm - spring model layout
 */
export const Neato: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'neato',
            overlap: 'scale'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * FDP algorithm - force-directed placement
 */
export const FDP: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'fdp',
            K: 0.3
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Circo algorithm - circular layout
 */
export const Circo: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'circo'
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};

/**
 * Twopi algorithm - radial layout
 */
export const Twopi: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <StoryProviderWrapper model={model}>
      <div className="h-screen w-screen bg-gray-50 dark:bg-gray-900">
        <GraphViewer
          model={model}
          layoutEngine="graphviz"
          layoutParameters={{
            engine: 'twopi',
            ranksep: 1.5
          }}
        />
      </div>
    </StoryProviderWrapper>
  );
};
