import type { StoryDefault, Story } from '@ladle/react';
import { PrincipleNode, PRINCIPLE_NODE_WIDTH, PRINCIPLE_NODE_HEIGHT } from '@/core/nodes/motivation/PrincipleNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createPrincipleNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'C - Graphs / Nodes / Motivation / PrincipleNode',
  decorators: [withReactFlowDecorator({ width: PRINCIPLE_NODE_WIDTH, height: PRINCIPLE_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <PrincipleNode data={createPrincipleNodeData({ label: 'API-First Architecture' })} id="principle-1" />
);

export const EnterpriseScope: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Security First',
      scope: 'enterprise',
    })}
    id="principle-2"
  />
);

export const DomainScope: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Microservices Architecture',
      scope: 'domain',
    })}
    id="principle-3"
  />
);

export const ApplicationScope: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Component Reusability',
      scope: 'application',
    })}
    id="principle-4"
  />
);

export const ChangesetAdd: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'New Principle',
      changesetOperation: 'add',
    })}
    id="principle-5"
  />
);

export const ChangesetUpdate: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Updated Principle',
      changesetOperation: 'update',
    })}
    id="principle-6"
  />
);

export const ChangesetDelete: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Deleted Principle',
      changesetOperation: 'delete',
    })}
    id="principle-7"
  />
);

export const Dimmed: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Dimmed Principle',
      opacity: 0.5,
    })}
    id="principle-8"
  />
);

export const Highlighted: Story = () => (
  <PrincipleNode
    data={createPrincipleNodeData({
      label: 'Highlighted Principle',
      strokeWidth: 3,
    })}
    id="principle-9"
  />
);
