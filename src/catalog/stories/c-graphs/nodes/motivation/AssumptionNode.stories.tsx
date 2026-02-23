import type { Meta, StoryObj } from '@storybook/react';
import { AssumptionNode, ASSUMPTION_NODE_WIDTH, ASSUMPTION_NODE_HEIGHT } from '@/core/nodes/motivation/AssumptionNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createAssumptionNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / AssumptionNode',
  decorators: [withReactFlowDecorator({ width: ASSUMPTION_NODE_WIDTH, height: ASSUMPTION_NODE_HEIGHT })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AssumptionNode data={createAssumptionNodeData({ label: 'Cloud Infrastructure Availability' })} id="assumption-1" />
  ),
};

export const Validated: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Vendor Support Available',
          validationStatus: 'validated',
        })}
        id="assumption-2"
      />
  ),
};

export const Unvalidated: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Budget Approval Expected',
          validationStatus: 'unvalidated',
        })}
        id="assumption-3"
      />
  ),
};

export const Invalidated: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Legacy System Support',
          validationStatus: 'invalidated',
        })}
        id="assumption-4"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'New Assumption',
          changesetOperation: 'add',
        })}
        id="assumption-5"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Updated Assumption',
          changesetOperation: 'update',
        })}
        id="assumption-6"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Deleted Assumption',
          changesetOperation: 'delete',
        })}
        id="assumption-7"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <AssumptionNode
        data={createAssumptionNodeData({
          label: 'Dimmed Assumption',
          opacity: 0.5,
        })}
        id="assumption-8"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <AssumptionNode
      data={createAssumptionNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

