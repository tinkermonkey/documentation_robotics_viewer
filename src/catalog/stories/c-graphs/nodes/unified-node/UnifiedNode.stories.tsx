/**
 * UnifiedNode Component Stories — Features & Layouts
 *
 * Generic feature stories for the UnifiedNode component.
 * Demonstrates: layouts, badges, semantic zoom, changesets, field lists, handles.
 *
 * Layer-specific variants are in sibling files:
 *   - UnifiedNode.Motivation.stories.tsx
 *   - UnifiedNode.Business.stories.tsx
 *   - UnifiedNode.DataModel.stories.tsx
 *   - UnifiedNode.C4.stories.tsx
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'Graphs / Nodes / UnifiedNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic centered layout (Motivation style)
export const CenteredLayout: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improve Customer Experience',
      detailLevel: 'standard',
    },
    id: 'node-1',
  },
};

// Left-aligned layout (Business style)
export const LeftLayout: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      detailLevel: 'standard',
    },
    id: 'node-2',
  },
};

// With top-left badge
export const WithTopLeftBadge: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Authentication',
      badges: [
        {
          position: 'top-left' as const,
          content: '✓',
          className: 'w-6 h-6 bg-green-500 text-white rounded-full flex items-center justify-center text-xs',
          ariaLabel: 'Requirement satisfied',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'node-3',
  },
};

// With top-right badge
export const WithTopRightBadge: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security First',
      badges: [
        {
          position: 'top-right' as const,
          content: 'Enterprise',
          className: 'px-2 py-1 bg-purple-500 text-white rounded text-xs font-semibold',
          ariaLabel: 'Scope: Enterprise',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'node-4',
  },
};

// With inline badges
export const WithInlineBadges: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      badges: [
        {
          position: 'inline' as const,
          content: 'High',
          className: 'px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold',
          ariaLabel: 'Criticality: High',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'node-5',
  },
};

// With multiple badges
export const WithMultipleBadges: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'System Reliability',
      badges: [
        {
          position: 'top-left' as const,
          content: '📊',
          ariaLabel: 'Coverage indicator',
        },
        {
          position: 'top-right' as const,
          content: 'High',
          className: 'px-2 py-1 bg-orange-500 text-white rounded text-xs font-semibold',
          ariaLabel: 'Priority: High',
        },
        {
          position: 'inline' as const,
          content: 'Active',
          className: 'px-2 py-1 bg-blue-500 text-white rounded text-xs font-semibold',
          ariaLabel: 'Status: Active',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'node-6',
  },
};

// With field list
export const WithFieldList: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Schema',
      items: [
        {
          id: 'field-1',
          label: 'id',
          value: 'UUID',
          required: true,
          tooltip: 'Unique identifier for the user',
        },
        {
          id: 'field-2',
          label: 'name',
          value: 'string',
          required: true,
        },
        {
          id: 'field-3',
          label: 'email',
          value: 'string',
          required: true,
          tooltip: 'Must be a valid email address',
        },
        {
          id: 'field-4',
          label: 'phone',
          value: 'string',
          required: false,
          tooltip: 'Optional phone number',
        },
      ],
      detailLevel: 'standard',
    },
    id: 'node-7',
  },
};

// Semantic zoom - Minimal
export const SemanticZoomMinimal: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improve Performance',
      detailLevel: 'minimal' as const,
    },
    id: 'node-8',
  },
};

// Semantic zoom - Standard
export const SemanticZoomStandard: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improve Performance',
      detailLevel: 'standard' as const,
    },
    id: 'node-9',
  },
};

// Semantic zoom - Detailed
export const SemanticZoomDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improve Performance',
      badges: [
        {
          position: 'top-right' as const,
          content: 'High',
          className: 'px-2 py-1 bg-orange-500 text-white rounded text-xs font-semibold',
        },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'node-10',
  },
};

// Changeset - Add operation
export const ChangesetAdd: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'New Payment Service',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'node-11',
  },
};

// Changeset - Update operation
export const ChangesetUpdate: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'node-12',
  },
};

// Changeset - Delete operation
export const ChangesetDelete: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Legacy Payment Service',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'node-13',
  },
};

// With RelationshipBadge (focused mode)
export const WithRelationshipBadge: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Core Business Objective',
      relationshipBadge: {
        count: 12,
        incoming: 5,
        outgoing: 7,
      },
      changesetOperation: 'add',
      detailLevel: 'standard',
    },
    id: 'node-14',
  },
};

// Hidden fields
export const HiddenFields: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Hidden Fields',
      items: [
        {
          id: 'field-1',
          label: 'id',
          value: 'UUID',
          required: true,
        },
        {
          id: 'field-2',
          label: 'data',
          value: 'object',
          required: true,
        },
      ],
      hideFields: true,
      detailLevel: 'standard',
    },
    id: 'node-15',
  },
};

// Error state - invalid nodeType with no config
export const ErrorState: Story = {
  args: {
    data: {
      nodeType: 'INVALID_NODE_TYPE' as unknown as NodeType,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'This node type does not exist',
      detailLevel: 'standard',
    },
    id: 'node-error',
  },
};
