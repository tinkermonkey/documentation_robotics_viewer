import type { Meta, StoryObj } from '@storybook/react-vite';
import { AssessmentNode, ASSESSMENT_NODE_WIDTH, ASSESSMENT_NODE_HEIGHT } from '@/core/nodes/motivation/AssessmentNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createAssessmentNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / AssessmentNode',
  decorators: [withReactFlowDecorator({ width: ASSESSMENT_NODE_WIDTH, height: ASSESSMENT_NODE_HEIGHT })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <AssessmentNode data={createAssessmentNodeData({ label: 'Technology Assessment' })} id="assessment-1" />
  ),
};

export const Rating1: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Current Architecture',
          rating: 1,
        })}
        id="assessment-2"
      />
  ),
};

export const Rating3: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Team Capability',
          rating: 3,
        })}
        id="assessment-3"
      />
  ),
};

export const Rating5: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Infrastructure Maturity',
          rating: 5,
        })}
        id="assessment-4"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'New Assessment',
          changesetOperation: 'add',
        })}
        id="assessment-5"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Updated Assessment',
          changesetOperation: 'update',
        })}
        id="assessment-6"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Deleted Assessment',
          changesetOperation: 'delete',
        })}
        id="assessment-7"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <AssessmentNode
        data={createAssessmentNodeData({
          label: 'Dimmed Assessment',
          opacity: 0.5,
        })}
        id="assessment-8"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <AssessmentNode
      data={createAssessmentNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

