import type { Meta, StoryObj } from '@storybook/react';
import { PrincipleNode, PRINCIPLE_NODE_WIDTH, PRINCIPLE_NODE_HEIGHT } from '@/core/nodes/motivation/PrincipleNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createPrincipleNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / PrincipleNode',
  decorators: [withReactFlowDecorator({ width: PRINCIPLE_NODE_WIDTH, height: PRINCIPLE_NODE_HEIGHT })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <PrincipleNode data={createPrincipleNodeData({ label: 'API-First Architecture' })} id="principle-1" />
  ),
};

export const EnterpriseScope: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Security First',
          scope: 'enterprise',
        })}
        id="principle-2"
      />
  ),
};

export const DomainScope: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Microservices Architecture',
          scope: 'domain',
        })}
        id="principle-3"
      />
  ),
};

export const ApplicationScope: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Component Reusability',
          scope: 'application',
        })}
        id="principle-4"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'New Principle',
          changesetOperation: 'add',
        })}
        id="principle-5"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Updated Principle',
          changesetOperation: 'update',
        })}
        id="principle-6"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Deleted Principle',
          changesetOperation: 'delete',
        })}
        id="principle-7"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <PrincipleNode
        data={createPrincipleNodeData({
          label: 'Dimmed Principle',
          opacity: 0.5,
        })}
        id="principle-8"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <PrincipleNode
      data={createPrincipleNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

