/**
 * UnifiedNode Component Stories
 *
 * Comprehensive Storybook stories for the UnifiedNode component and its sub-components.
 * Demonstrates all features: layouts, badges, semantic zoom, changesets, field lists, and handles.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import FieldList from '@/core/nodes/components/FieldList';
import FieldTooltip from '@/core/nodes/components/FieldTooltip';
import { RelationshipBadge } from '@/core/nodes/components/RelationshipBadge';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

// ============================================================================
// UnifiedNode Stories
// ============================================================================

const unifiedNodeMeta = {
  title: 'Core Nodes / UnifiedNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof UnifiedNode>;

export default unifiedNodeMeta;
type UnifiedNodeStory = StoryObj<typeof unifiedNodeMeta>;

// Basic centered layout (Motivation style)
export const CenteredLayout: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      label: 'Improve Customer Experience',
      detailLevel: 'standard',
    },
    id: 'node-1',
    isConnectable: true,
    selected: false,
  },
};

// Left-aligned layout (Business style)
export const LeftLayout: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      label: 'Process Payments',
      detailLevel: 'standard',
    },
    id: 'node-2',
    isConnectable: true,
    selected: false,
  },
};

// With top-left badge
export const WithTopLeftBadge: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
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
    isConnectable: true,
    selected: false,
  },
};

// With top-right badge
export const WithTopRightBadge: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
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
    isConnectable: true,
    selected: false,
  },
};

// With inline badges
export const WithInlineBadges: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
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
    isConnectable: true,
    selected: false,
  },
};

// With multiple badges
export const WithMultipleBadges: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
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
    isConnectable: true,
    selected: false,
  },
};

// With field list
export const WithFieldList: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
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
    isConnectable: true,
    selected: false,
  },
};

// Semantic zoom - Minimal
export const SemanticZoomMinimal: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      label: 'Improve Performance',
      detailLevel: 'minimal' as const,
    },
    id: 'node-8',
    isConnectable: true,
    selected: false,
  },
};

// Semantic zoom - Standard
export const SemanticZoomStandard: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      label: 'Improve Performance',
      detailLevel: 'standard' as const,
    },
    id: 'node-9',
    isConnectable: true,
    selected: false,
  },
};

// Semantic zoom - Detailed
export const SemanticZoomDetailed: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
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
    isConnectable: true,
    selected: false,
  },
};

// Changeset - Add operation
export const ChangesetAdd: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      label: 'New Payment Service',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'node-11',
    isConnectable: true,
    selected: false,
  },
};

// Changeset - Update operation
export const ChangesetUpdate: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      label: 'Payment Service',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'node-12',
    isConnectable: true,
    selected: false,
  },
};

// Changeset - Delete operation
export const ChangesetDelete: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      label: 'Legacy Payment Service',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'node-13',
    isConnectable: true,
    selected: false,
  },
};

// With RelationshipBadge (focused mode)
export const WithRelationshipBadge: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
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
    isConnectable: true,
    selected: false,
  },
};

// Hidden fields
export const HiddenFields: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
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
    isConnectable: true,
    selected: false,
  },
};

// Error state - Invalid NodeType
export const ErrorInvalidNodeType: UnifiedNodeStory = {
  args: {
    data: {
      nodeType: 'INVALID_TYPE' as any,
      label: 'This should show error',
      detailLevel: 'standard',
    },
    id: 'node-error-1',
    isConnectable: true,
    selected: false,
  },
};

// ============================================================================
// FieldList Stories
// ============================================================================

const fieldListMeta = {
  title: 'Core Nodes / FieldList',
  component: FieldList,
  decorators: [],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FieldList>;

export const FieldListBasic: StoryObj<typeof fieldListMeta> = {
  args: {
    items: [
      {
        id: 'field-1',
        label: 'id',
        value: 'UUID',
        required: true,
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
      },
      {
        id: 'field-4',
        label: 'phone',
        value: 'string',
        required: false,
      },
    ],
    itemHeight: 24,
    strokeColor: '#059669',
    handleColor: '#059669',
  },
};

export const FieldListEmpty: StoryObj<typeof fieldListMeta> = {
  args: {
    items: [],
    itemHeight: 24,
    strokeColor: '#059669',
    handleColor: '#059669',
  },
};

export const FieldListWithTooltips: StoryObj<typeof fieldListMeta> = {
  args: {
    items: [
      {
        id: 'field-1',
        label: 'id',
        value: 'UUID',
        required: true,
        tooltip: 'Unique identifier for the resource',
      },
      {
        id: 'field-2',
        label: 'createdAt',
        value: 'ISO8601',
        required: true,
        tooltip: 'RFC 3339 formatted timestamp',
      },
    ],
    itemHeight: 24,
    strokeColor: '#2563eb',
    handleColor: '#2563eb',
  },
};

// ============================================================================
// FieldTooltip Stories
// ============================================================================

const fieldTooltipMeta = {
  title: 'Core Nodes / FieldTooltip',
  component: FieldTooltip,
  decorators: [],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof FieldTooltip>;

export const FieldTooltipBasic: StoryObj<typeof fieldTooltipMeta> = {
  args: {
    content: 'This is a helpful tooltip explaining the field',
  },
};

export const FieldTooltipLongContent: StoryObj<typeof fieldTooltipMeta> = {
  args: {
    content: 'This is a longer tooltip with more detailed information about what this field represents in the system',
  },
};

// ============================================================================
// RelationshipBadge Stories
// ============================================================================

const relationshipBadgeMeta = {
  title: 'Core Nodes / RelationshipBadge',
  component: RelationshipBadge,
  decorators: [],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta<typeof RelationshipBadge>;

export const RelationshipBadgeVisible: StoryObj<typeof relationshipBadgeMeta> = {
  args: {
    badge: {
      count: 12,
      incoming: 5,
      outgoing: 7,
    },
    isDimmed: true,
  },
};

export const RelationshipBadgeHidden: StoryObj<typeof relationshipBadgeMeta> = {
  args: {
    badge: {
      count: 12,
      incoming: 5,
      outgoing: 7,
    },
    isDimmed: false,
  },
};

export const RelationshipBadgeZeroCount: StoryObj<typeof relationshipBadgeMeta> = {
  args: {
    badge: {
      count: 0,
      incoming: 0,
      outgoing: 0,
    },
    isDimmed: true,
  },
};

export const RelationshipBadgeHighCount: StoryObj<typeof relationshipBadgeMeta> = {
  args: {
    badge: {
      count: 42,
      incoming: 20,
      outgoing: 22,
    },
    isDimmed: true,
  },
};
