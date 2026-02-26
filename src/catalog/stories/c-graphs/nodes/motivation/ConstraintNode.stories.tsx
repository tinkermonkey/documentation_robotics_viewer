import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode, type UnifiedNodeData, NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createConstraintNodeData } from '@catalog/fixtures/nodeDataFixtures';

import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// Get dimensions from node configuration for consistency
const constraintConfig = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_CONSTRAINT);
const storyWidth = constraintConfig?.dimensions.width || 180;
const storyHeight = constraintConfig?.dimensions.height || 100;

const meta = {
  title: 'C Graphs / Nodes / Motivation / ConstraintNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: storyWidth, height: storyHeight })],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {},
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'constraint-1',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'GDPR Compliance',
    },
  },
};

export const FixedConstraint: Story = {
  args: {
    id: 'constraint-2',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Must use HTTPS',
      items: [
        { id: 'negotiability', label: 'Negotiability', value: 'fixed' },
      ],
      badges: [
        { position: 'inline' as const, content: 'fixed', ariaLabel: 'Negotiability: fixed' },
      ],
    },
  },
};

export const NegotiableConstraint: Story = {
  args: {
    id: 'constraint-3',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Budget Limitation',
      items: [
        { id: 'negotiability', label: 'Negotiability', value: 'negotiable' },
      ],
      badges: [
        { position: 'inline' as const, content: 'negotiable', ariaLabel: 'Negotiability: negotiable' },
      ],
    },
  },
};

export const RegulatoryConstraint: Story = {
  args: {
    id: 'constraint-4',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Data Residency Requirements',
      items: [
        { id: 'type', label: 'Type', value: 'regulatory' },
      ],
      badges: [
        { position: 'inline' as const, content: 'regulatory', ariaLabel: 'Type: regulatory' },
      ],
    },
  },
};

export const BusinessConstraint: Story = {
  args: {
    id: 'constraint-5',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Timeline Constraint',
      items: [
        { id: 'type', label: 'Type', value: 'business' },
      ],
      badges: [
        { position: 'inline' as const, content: 'business', ariaLabel: 'Type: business' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'constraint-6',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Constraint',
      changesetOperation: 'add',
    } as UnifiedNodeData,
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'constraint-7',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Updated Constraint',
      changesetOperation: 'update',
    } as UnifiedNodeData,
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'constraint-8',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Deleted Constraint',
      changesetOperation: 'delete',
    } as UnifiedNodeData,
  },
};

export const Dimmed: Story = {
  args: {
    id: 'constraint-9',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Dimmed Constraint',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'constraint-10',
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};

export const MinimalDetail: Story = {
  args: {
    id: 'constraint-minimal',
    data: {
      ...createConstraintNodeData({ label: 'Minimal Detail Constraint' }),
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      items: [
        { id: 'negotiability', label: 'Negotiability', value: 'fixed' },
      ],
      detailLevel: 'minimal',
    },
  },
};

export const StandardDetail: Story = {
  args: {
    id: 'constraint-standard',
    data: {
      ...createConstraintNodeData({ label: 'Standard Detail Constraint' }),
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      items: [
        { id: 'negotiability', label: 'Negotiability', value: 'fixed' },
        { id: 'domain', label: 'Domain', value: 'compliance' },
      ],
      detailLevel: 'standard',
    },
  },
};

export const DetailedDetail: Story = {
  args: {
    id: 'constraint-detailed',
    data: {
      ...createConstraintNodeData({ label: 'Detailed Constraint' }),
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      items: [
        { id: 'negotiability', label: 'Negotiability', value: 'fixed' },
        { id: 'domain', label: 'Domain', value: 'compliance' },
        { id: 'owner', label: 'Owner', value: 'Legal' },
      ],
      detailLevel: 'detailed',
    },
  },
};
