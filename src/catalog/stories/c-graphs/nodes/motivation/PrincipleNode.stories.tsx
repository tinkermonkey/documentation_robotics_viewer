import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const principleConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_PRINCIPLE);
const storyWidth = principleConfig?.dimensions.width || 180;
const storyHeight = principleConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / PrincipleNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    'data.changesetOperation': {
      control: 'select',
      options: [undefined, 'add', 'update', 'delete'],
      description: 'Changeset operation affecting node styling',
    },
    'data.detailLevel': {
      control: 'select',
      options: ['minimal', 'standard', 'detailed'],
      description: 'Detail level for node content display',
    },
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'principle-1',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'API-First Architecture',
    },
  },
};

export const EnterpriseScope: Story = {
  args: {
    id: 'principle-2',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security First',
      items: [
        { id: 'scope', label: 'Scope', value: 'enterprise' },
      ],
      badges: [
        { position: 'inline' as const, content: 'enterprise', ariaLabel: 'Scope: enterprise' },
      ],
    },
  },
};

export const DomainScope: Story = {
  args: {
    id: 'principle-3',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Microservices Architecture',
      items: [
        { id: 'scope', label: 'Scope', value: 'domain' },
      ],
      badges: [
        { position: 'inline' as const, content: 'domain', ariaLabel: 'Scope: domain' },
      ],
    },
  },
};

export const ApplicationScope: Story = {
  args: {
    id: 'principle-4',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Component Reusability',
      items: [
        { id: 'scope', label: 'Scope', value: 'application' },
      ],
      badges: [
        { position: 'inline' as const, content: 'application', ariaLabel: 'Scope: application' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'principle-5',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Principle',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'principle-6',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Principle',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'principle-7',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Principle',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'principle-8',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Principle',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'principle-9',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'principle-minimal',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Minimal Detail Principle',
      items: [
        { id: 'property1', label: 'Property1', value: 'value' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'principle-detailed',
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Detailed Principle',
      items: [
        { id: 'property1', label: 'Property1', value: 'value1' },
        { id: 'property2', label: 'Property2', value: 'value2' },
        { id: 'property3', label: 'Property3', value: 'value3' },
      ],
      detailLevel: 'detailed',
    },
  },
};
