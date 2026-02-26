import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const assessmentConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_ASSESSMENT);
const storyWidth = assessmentConfig?.dimensions.width || 180;
const storyHeight = assessmentConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / AssessmentNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'assessment-1',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Technology Assessment',
      items: [
        { id: 'rating', label: 'Rating', value: '2' },
      ],
    },
  },
};

export const Rating1: Story = {
  args: {
    id: 'assessment-2',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Current Architecture',
      items: [
        { id: 'rating', label: 'Rating', value: '1' },
      ],
      badges: [
        { position: 'inline' as const, content: '1/5', ariaLabel: 'Rating: 1 out of 5' },
      ],
    },
  },
};

export const Rating3: Story = {
  args: {
    id: 'assessment-3',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Team Capability',
      items: [
        { id: 'rating', label: 'Rating', value: '3' },
      ],
      badges: [
        { position: 'inline' as const, content: '3/5', ariaLabel: 'Rating: 3 out of 5' },
      ],
    },
  },
};

export const Rating5: Story = {
  args: {
    id: 'assessment-4',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Infrastructure Maturity',
      items: [
        { id: 'rating', label: 'Rating', value: '5' },
      ],
      badges: [
        { position: 'inline' as const, content: '5/5', ariaLabel: 'Rating: 5 out of 5' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'assessment-5',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'New Assessment',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'assessment-6',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Updated Assessment',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'assessment-7',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Deleted Assessment',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'assessment-8',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Dimmed Assessment',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'assessment-9',
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};
