import type { Meta, StoryObj } from '@storybook/react-vite';
import { ConstraintNode, CONSTRAINT_NODE_WIDTH, CONSTRAINT_NODE_HEIGHT } from '@/core/nodes/motivation/ConstraintNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createConstraintNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / ConstraintNode',
  decorators: [withReactFlowDecorator({ width: CONSTRAINT_NODE_WIDTH, height: CONSTRAINT_NODE_HEIGHT })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <ConstraintNode data={createConstraintNodeData({ label: 'GDPR Compliance' })} id="constraint-1" />
  ),
};

export const FixedConstraint: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Must use HTTPS',
          negotiability: 'fixed',
        })}
        id="constraint-2"
      />
  ),
};

export const NegotiableConstraint: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Budget Limitation',
          negotiability: 'negotiable',
        })}
        id="constraint-3"
      />
  ),
};

export const RegulatoryConstraint: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Data Residency Requirements',
        })}
        id="constraint-4"
      />
  ),
};

export const BusinessConstraint: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Timeline Constraint',
        })}
        id="constraint-5"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'New Constraint',
          changesetOperation: 'add',
        })}
        id="constraint-6"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Updated Constraint',
          changesetOperation: 'update',
        })}
        id="constraint-7"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Deleted Constraint',
          changesetOperation: 'delete',
        })}
        id="constraint-8"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <ConstraintNode
        data={createConstraintNodeData({
          label: 'Dimmed Constraint',
          opacity: 0.5,
        })}
        id="constraint-9"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <ConstraintNode
      data={createConstraintNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

