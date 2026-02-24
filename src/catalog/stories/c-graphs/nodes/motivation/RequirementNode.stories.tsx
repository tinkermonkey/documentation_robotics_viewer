import type { Meta, StoryObj } from '@storybook/react';
import UnifiedNode from '@/core/nodes/UnifiedNode';
import { NodeType } from '@/core/nodes/NodeType';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Motivation / RequirementNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 180, height: 110 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'requirement-1',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Support Payment Processing',
    },
  },
};

export const Functional: Story = {
  args: {
    id: 'requirement-2',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Real-time Notifications',
      items: [
        { id: 'requirementType', label: 'Type', value: 'functional' },
      ],
    },
  },
};

export const NonFunctional: Story = {
  args: {
    id: 'requirement-3',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'System Performance',
      items: [
        { id: 'requirementType', label: 'Type', value: 'non-functional' },
      ],
    },
  },
};

export const HighPriority: Story = {
  args: {
    id: 'requirement-4',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Security Requirement',
      items: [
        { id: 'priority', label: 'Priority', value: 'high' },
      ],
    },
  },
};

export const LowPriority: Story = {
  args: {
    id: 'requirement-5',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Nice to Have Feature',
      items: [
        { id: 'priority', label: 'Priority', value: 'low' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'requirement-6',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'New Requirement',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'requirement-7',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Updated Requirement',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'requirement-8',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Deleted Requirement',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'requirement-9',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Dimmed Requirement',
      relationshipBadge: { count: 2, incoming: 1, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'requirement-10',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      label: 'Highlighted Node',
    },
  },
};

