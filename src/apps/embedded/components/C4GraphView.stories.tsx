import type { StoryDefault, Story } from '@ladle/react';
import C4GraphView from './C4GraphView';
import { ReactFlowProvider } from '@xyflow/react';
import { createCompleteModelFixture } from '@catalog/fixtures/modelFixtures';
import { ContainerType } from '../types/c4Graph';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

export default {
  title: 'Views & Layouts / Graph Views / C4GraphView',
} satisfies StoryDefault;

export const Default: Story = () => {
  const model = createCompleteModelFixture();
  const allContainerTypes = new Set(Object.values(ContainerType));

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="c4-graph-default">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <C4GraphView
            model={model}
            selectedContainerTypes={allContainerTypes}
            selectedTechnologyStacks={new Set()}
            layout="hierarchical"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const ContainerView: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="c4-graph-container">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <C4GraphView
            model={model}
            selectedContainerTypes={new Set([ContainerType.Api, ContainerType.WebApp, ContainerType.Database])}
            selectedTechnologyStacks={new Set()}
            layout="orthogonal"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const FilteredByTechnology: Story = () => {
  const model = createCompleteModelFixture();
  const allContainerTypes = new Set(Object.values(ContainerType));

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="c4-graph-filtered-tech">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <C4GraphView
            model={model}
            selectedContainerTypes={allContainerTypes}
            selectedTechnologyStacks={new Set(['TypeScript', 'React', 'Node.js'])}
            layout="force"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};

export const MultiFilter: Story = () => {
  const model = createCompleteModelFixture();

  return (
    <ReactFlowProvider>
      <StoryLoadedWrapper testId="c4-graph-multi-filter">
        <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
          <C4GraphView
            model={model}
            selectedContainerTypes={new Set([ContainerType.WebApp])}
            selectedTechnologyStacks={new Set(['React', 'TypeScript'])}
            layout="manual"
          />
        </div>
      </StoryLoadedWrapper>
    </ReactFlowProvider>
  );
};
