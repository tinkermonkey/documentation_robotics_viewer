import type { StoryDefault, Story } from '@ladle/react';
import { ConstraintNode, CONSTRAINT_NODE_WIDTH, CONSTRAINT_NODE_HEIGHT } from '@/core/nodes/motivation/ConstraintNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createConstraintNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: '3 Graphs / Nodes / Motivation / ConstraintNode',
  decorators: [withReactFlowDecorator({ width: CONSTRAINT_NODE_WIDTH, height: CONSTRAINT_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <ConstraintNode data={createConstraintNodeData({ label: 'GDPR Compliance' })} id="constraint-1" />
);

export const FixedConstraint: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Must use HTTPS',
      negotiability: 'fixed',
    })}
    id="constraint-2"
  />
);

export const NegotiableConstraint: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Budget Limitation',
      negotiability: 'negotiable',
    })}
    id="constraint-3"
  />
);

export const RegulatoryConstraint: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Data Residency Requirements',
    })}
    id="constraint-4"
  />
);

export const BusinessConstraint: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Timeline Constraint',
    })}
    id="constraint-5"
  />
);

export const ChangesetAdd: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'New Constraint',
      changesetOperation: 'add',
    })}
    id="constraint-6"
  />
);

export const ChangesetUpdate: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Updated Constraint',
      changesetOperation: 'update',
    })}
    id="constraint-7"
  />
);

export const ChangesetDelete: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Deleted Constraint',
      changesetOperation: 'delete',
    })}
    id="constraint-8"
  />
);

export const Dimmed: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Dimmed Constraint',
      opacity: 0.5,
    })}
    id="constraint-9"
  />
);

export const Highlighted: Story = () => (
  <ConstraintNode
    data={createConstraintNodeData({
      label: 'Highlighted Constraint',
      strokeWidth: 3,
    })}
    id="constraint-10"
  />
);
