/**
 * UnifiedNode Component Stories
 *
 * Comprehensive Storybook stories for the UnifiedNode component.
 * Demonstrates all features: layouts, badges, semantic zoom, changesets, field lists, handles,
 * and configuration variants for each node type across all architectural layers.
 *
 * NOTE: Individual node configuration stories are consolidated here as variants to show
 * actual component configuration options rather than non-existent component files.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

// ============================================================================
// UnifiedNode Stories
// ============================================================================

const meta = {
  title: 'Core Nodes / UnifiedNode',
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

// ============================================================================
// Node Type Configuration Variants
// ============================================================================
// These stories demonstrate how UnifiedNode is configured for each specific
// node type and layer. For each node type, stories show: default rendering,
// a changeset operation variant, and detail level variations.

// --- Base Layer (Data Model, JSON Schema) ---

export const DataModelNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
        { id: 'firstName', label: 'firstName', value: 'string', required: false },
        { id: 'lastName', label: 'lastName', value: 'string', required: false },
        { id: 'createdAt', label: 'createdAt', value: 'timestamp', required: false },
      ],
      detailLevel: 'standard',
    },
    id: 'data-model-default',
  },
};

export const DataModelNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
      ],
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'data-model-changeset',
  },
};

export const DataModelNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_MODEL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User',
      items: [
        { id: 'id', label: 'id', value: 'UUID', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'data-model-detailed',
  },
};

export const JSONSchemaNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserProfile',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'username', label: 'username', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
        { id: 'firstName', label: 'firstName', value: 'string', required: false },
        { id: 'lastName', label: 'lastName', value: 'string', required: false },
      ],
      detailLevel: 'standard',
    },
    id: 'json-schema-default',
  },
};

export const JSONSchemaNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserProfile',
      items: [
        { id: 'id', label: 'id', value: 'string', required: true },
        { id: 'email', label: 'email', value: 'string', required: true },
      ],
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'json-schema-changeset',
  },
};

export const JSONSchemaNodeMinimal: Story = {
  args: {
    data: {
      nodeType: NodeType.DATA_JSON_SCHEMA,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'UserProfile',
      detailLevel: 'minimal' as const,
    },
    id: 'json-schema-minimal',
  },
};

// --- Business Layer ---

export const BusinessCapabilityNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      items: [
        { id: 'priority', label: 'Priority', value: 'High' },
        { id: 'status', label: 'Status', value: 'Active' },
      ],
      detailLevel: 'standard',
    },
    id: 'business-capability-default',
  },
};

export const BusinessCapabilityNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'business-capability-changeset',
  },
};

export const BusinessCapabilityNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_CAPABILITY,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Management',
      badges: [
        {
          position: 'top-right' as const,
          content: 'High',
          className: 'px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold',
        },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'business-capability-detailed',
  },
};

export const BusinessFunctionNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      detailLevel: 'standard',
    },
    id: 'business-function-default',
  },
};

export const BusinessFunctionNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'business-function-changeset',
  },
};

export const BusinessFunctionNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_FUNCTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Process Payments',
      detailLevel: 'detailed' as const,
    },
    id: 'business-function-detailed',
  },
};

export const BusinessProcessNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      detailLevel: 'standard',
    },
    id: 'business-process-default',
  },
};

export const BusinessProcessNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'business-process-changeset',
  },
};

export const BusinessProcessNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_PROCESS,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order Fulfillment',
      detailLevel: 'detailed' as const,
    },
    id: 'business-process-detailed',
  },
};

export const BusinessServiceNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      detailLevel: 'standard',
    },
    id: 'business-service-default',
  },
};

export const BusinessServiceNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'business-service-changeset',
  },
};

export const BusinessServiceNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.BUSINESS_SERVICE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Service',
      detailLevel: 'detailed' as const,
    },
    id: 'business-service-detailed',
  },
};

// --- Motivation Layer ---

export const GoalNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Increase Revenue',
      detailLevel: 'standard',
    },
    id: 'goal-default',
  },
};

export const GoalNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Increase Revenue',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'goal-changeset',
  },
};

export const GoalNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_GOAL,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Increase Revenue',
      badges: [
        {
          position: 'top-right' as const,
          content: 'High',
          className: 'px-2 py-1 bg-red-500 text-white rounded text-xs font-semibold',
        },
      ],
      detailLevel: 'detailed' as const,
    },
    id: 'goal-detailed',
  },
};

export const StakeholderNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Board Members',
      detailLevel: 'standard',
    },
    id: 'stakeholder-default',
  },
};

export const StakeholderNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Board Members',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'stakeholder-changeset',
  },
};

export const StakeholderNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_STAKEHOLDER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Board Members',
      detailLevel: 'detailed' as const,
    },
    id: 'stakeholder-detailed',
  },
};

export const RequirementNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Authentication',
      detailLevel: 'standard',
    },
    id: 'requirement-default',
  },
};

export const RequirementNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Authentication',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'requirement-changeset',
  },
};

export const RequirementNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_REQUIREMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'User Authentication',
      detailLevel: 'detailed' as const,
    },
    id: 'requirement-detailed',
  },
};

export const ConstraintNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Compliance Requirements',
      detailLevel: 'standard',
    },
    id: 'constraint-default',
  },
};

export const ConstraintNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Compliance Requirements',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'constraint-changeset',
  },
};

export const ConstraintNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_CONSTRAINT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Compliance Requirements',
      detailLevel: 'detailed' as const,
    },
    id: 'constraint-detailed',
  },
};

export const PrincipleNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security First',
      detailLevel: 'standard',
    },
    id: 'principle-default',
  },
};

export const PrincipleNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security First',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'principle-changeset',
  },
};

export const PrincipleNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_PRINCIPLE,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Security First',
      detailLevel: 'detailed' as const,
    },
    id: 'principle-detailed',
  },
};

export const DriverNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Market Competition',
      detailLevel: 'standard',
    },
    id: 'driver-default',
  },
};

export const DriverNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Market Competition',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'driver-changeset',
  },
};

export const DriverNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Market Competition',
      detailLevel: 'detailed' as const,
    },
    id: 'driver-detailed',
  },
};

export const OutcomeNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improved Customer Satisfaction',
      detailLevel: 'standard',
    },
    id: 'outcome-default',
  },
};

export const OutcomeNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improved Customer Satisfaction',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'outcome-changeset',
  },
};

export const OutcomeNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_OUTCOME,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Improved Customer Satisfaction',
      detailLevel: 'detailed' as const,
    },
    id: 'outcome-detailed',
  },
};

export const AssessmentNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'System Readiness',
      detailLevel: 'standard',
    },
    id: 'assessment-default',
  },
};

export const AssessmentNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'System Readiness',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'assessment-changeset',
  },
};

export const AssessmentNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSESSMENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'System Readiness',
      detailLevel: 'detailed' as const,
    },
    id: 'assessment-detailed',
  },
};

export const AssumptionNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Users Will Adopt Platform',
      detailLevel: 'standard',
    },
    id: 'assumption-default',
  },
};

export const AssumptionNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Users Will Adopt Platform',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'assumption-changeset',
  },
};

export const AssumptionNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_ASSUMPTION,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Users Will Adopt Platform',
      detailLevel: 'detailed' as const,
    },
    id: 'assumption-detailed',
  },
};

export const ValueStreamNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order to Cash',
      detailLevel: 'standard',
    },
    id: 'value-stream-default',
  },
};

export const ValueStreamNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order to Cash',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'value-stream-changeset',
  },
};

export const ValueStreamNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.MOTIVATION_VALUE_STREAM,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Order to Cash',
      detailLevel: 'detailed' as const,
    },
    id: 'value-stream-detailed',
  },
};

// --- C4 Layer (Component, Container, External Actor) ---

export const ComponentNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Processor',
      detailLevel: 'standard',
    },
    id: 'component-default',
  },
};

export const ComponentNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Processor',
      changesetOperation: 'add' as const,
      detailLevel: 'standard',
    },
    id: 'component-changeset',
  },
};

export const ComponentNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_COMPONENT,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Payment Processor',
      detailLevel: 'detailed' as const,
    },
    id: 'component-detailed',
  },
};

export const ContainerNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_CONTAINER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Web Application',
      detailLevel: 'standard',
    },
    id: 'container-default',
  },
};

export const ContainerNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_CONTAINER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Web Application',
      changesetOperation: 'delete' as const,
      detailLevel: 'standard',
    },
    id: 'container-changeset',
  },
};

export const ContainerNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_CONTAINER,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'Web Application',
      detailLevel: 'detailed' as const,
    },
    id: 'container-detailed',
  },
};

export const ExternalActorNodeDefault: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'End User',
      detailLevel: 'standard',
    },
    id: 'external-actor-default',
  },
};

export const ExternalActorNodeChangeset: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'End User',
      changesetOperation: 'update' as const,
      detailLevel: 'standard',
    },
    id: 'external-actor-changeset',
  },
};

export const ExternalActorNodeDetailed: Story = {
  args: {
    data: {
      nodeType: NodeType.C4_EXTERNAL_ACTOR,
      layerId: 'test-layer',
      elementId: 'test-element-id',
      label: 'End User',
      detailLevel: 'detailed' as const,
    },
    id: 'external-actor-detailed',
  },
};
