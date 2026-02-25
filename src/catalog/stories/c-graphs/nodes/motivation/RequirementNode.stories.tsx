import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, NodeType } from '@/core/nodes';
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Support Payment Processing',
    },
  },
};

export const Functional: Story = {
  args: {
    id: 'requirement-2',
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
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
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

