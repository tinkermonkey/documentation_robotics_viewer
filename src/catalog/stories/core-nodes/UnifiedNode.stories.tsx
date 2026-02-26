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
import { nodeConfigLoader } from '@/core/nodes/nodeConfigLoader';

// ============================================================================
// UnifiedNode Stories
// ============================================================================

const meta = {
  title: 'Core Nodes / UnifiedNode',
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic centered layout (Motivation style)
export const CenteredLayout: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.MOTIVATION_GOAL,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Improve Customer Experience',
        detailLevel: 'standard',
      }}
      id="node-1"
    />
  ),
};

// Left-aligned layout (Business style)
export const LeftLayout: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_FUNCTION,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Process Payments',
        detailLevel: 'standard',
      }}
      id="node-2"
    />
  ),
};

// With top-left badge
export const WithTopLeftBadge: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-3"
    />
  ),
};

// With top-right badge
export const WithTopRightBadge: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-4"
    />
  ),
};

// With inline badges
export const WithInlineBadges: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-5"
    />
  ),
};

// With multiple badges
export const WithMultipleBadges: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-6"
    />
  ),
};

// With field list
export const WithFieldList: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-7"
    />
  ),
};

// Semantic zoom - Minimal
export const SemanticZoomMinimal: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.MOTIVATION_GOAL,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Improve Performance',
        detailLevel: 'minimal' as const,
      }}
      id="node-8"
    />
  ),
};

// Semantic zoom - Standard
export const SemanticZoomStandard: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.MOTIVATION_GOAL,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Improve Performance',
        detailLevel: 'standard' as const,
      }}
      id="node-9"
    />
  ),
};

// Semantic zoom - Detailed
export const SemanticZoomDetailed: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-10"
    />
  ),
};

// Changeset - Add operation
export const ChangesetAdd: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'New Payment Service',
        changesetOperation: 'add' as const,
        detailLevel: 'standard',
      }}
      id="node-11"
    />
  ),
};

// Changeset - Update operation
export const ChangesetUpdate: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Payment Service',
        changesetOperation: 'update' as const,
        detailLevel: 'standard',
      }}
      id="node-12"
    />
  ),
};

// Changeset - Delete operation
export const ChangesetDelete: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: NodeType.BUSINESS_SERVICE,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'Legacy Payment Service',
        changesetOperation: 'delete' as const,
        detailLevel: 'standard',
      }}
      id="node-13"
    />
  ),
};

// With RelationshipBadge (focused mode)
export const WithRelationshipBadge: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-14"
    />
  ),
};

// Hidden fields
export const HiddenFields: Story = {
  render: () => (
    <UnifiedNode
      data={{
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
      }}
      id="node-15"
    />
  ),
};

// Error state - invalid nodeType with no config
export const ErrorState: Story = {
  render: () => (
    <UnifiedNode
      data={{
        nodeType: 'INVALID_NODE_TYPE' as unknown as NodeType,
        layerId: 'test-layer',
        elementId: 'test-element-id',
        label: 'This node type does not exist',
        detailLevel: 'standard',
      }}
      id="node-error"
    />
  ),
};

// ============================================================================
// Node Type Configuration Variants
// ============================================================================
// These stories demonstrate how UnifiedNode is configured for each specific
// node type and layer. Each story shows typical usage patterns.

// --- Base Layer (Data Model, JSON Schema) ---

export const DataModelNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.DATA_MODEL);
    const height = config?.dimensions.height || 300;
    const width = config?.dimensions.width || 280;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
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
          }}
          id="data-model-1"
        />
      </div>
    );
  },
};

export const JSONSchemaNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.DATA_JSON_SCHEMA);
    const height = config?.dimensions.height || 300;
    const width = config?.dimensions.width || 280;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
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
          }}
          id="json-schema-1"
        />
      </div>
    );
  },
};

// --- Business Layer ---

export const BusinessCapabilityNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_CAPABILITY);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.BUSINESS_CAPABILITY,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Order Management',
            items: [
              { id: 'priority', label: 'Priority', value: 'High' },
              { id: 'status', label: 'Status', value: 'Active' },
            ],
            detailLevel: 'standard',
          }}
          id="business-capability-1"
        />
      </div>
    );
  },
};

export const BusinessFunctionNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_FUNCTION);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.BUSINESS_FUNCTION,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Process Payments',
            detailLevel: 'standard',
          }}
          id="business-function-1"
        />
      </div>
    );
  },
};

export const BusinessProcessNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_PROCESS);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.BUSINESS_PROCESS,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Order Fulfillment',
            detailLevel: 'standard',
          }}
          id="business-process-1"
        />
      </div>
    );
  },
};

export const BusinessServiceNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.BUSINESS_SERVICE);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.BUSINESS_SERVICE,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Payment Service',
            detailLevel: 'standard',
          }}
          id="business-service-1"
        />
      </div>
    );
  },
};

// --- Motivation Layer ---

export const GoalNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_GOAL);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_GOAL,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Increase Revenue',
            detailLevel: 'standard',
          }}
          id="goal-1"
        />
      </div>
    );
  },
};

export const StakeholderNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_STAKEHOLDER);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_STAKEHOLDER,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Board Members',
            detailLevel: 'standard',
          }}
          id="stakeholder-1"
        />
      </div>
    );
  },
};

export const RequirementNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_REQUIREMENT);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_REQUIREMENT,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'User Authentication',
            detailLevel: 'standard',
          }}
          id="requirement-1"
        />
      </div>
    );
  },
};

export const ConstraintNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_CONSTRAINT);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_CONSTRAINT,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Compliance Requirements',
            detailLevel: 'standard',
          }}
          id="constraint-1"
        />
      </div>
    );
  },
};

export const PrincipleNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_PRINCIPLE);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_PRINCIPLE,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Security First',
            detailLevel: 'standard',
          }}
          id="principle-1"
        />
      </div>
    );
  },
};

export const DriverNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_DRIVER);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_DRIVER,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Market Competition',
            detailLevel: 'standard',
          }}
          id="driver-1"
        />
      </div>
    );
  },
};

export const OutcomeNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_OUTCOME);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_OUTCOME,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Improved Customer Satisfaction',
            detailLevel: 'standard',
          }}
          id="outcome-1"
        />
      </div>
    );
  },
};

export const AssessmentNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_ASSESSMENT);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_ASSESSMENT,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'System Readiness',
            detailLevel: 'standard',
          }}
          id="assessment-1"
        />
      </div>
    );
  },
};

export const AssumptionNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_ASSUMPTION);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_ASSUMPTION,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Users Will Adopt Platform',
            detailLevel: 'standard',
          }}
          id="assumption-1"
        />
      </div>
    );
  },
};

export const ValueStreamNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.MOTIVATION_VALUE_STREAM);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 180;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.MOTIVATION_VALUE_STREAM,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Order to Cash',
            detailLevel: 'standard',
          }}
          id="value-stream-1"
        />
      </div>
    );
  },
};

// --- C4 Layer (Component, Container, External Actor) ---

export const ComponentNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.C4_COMPONENT);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.C4_COMPONENT,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Payment Processor',
            detailLevel: 'standard',
          }}
          id="component-1"
        />
      </div>
    );
  },
};

export const ContainerNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.C4_CONTAINER);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.C4_CONTAINER,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'Web Application',
            detailLevel: 'standard',
          }}
          id="container-1"
        />
      </div>
    );
  },
};

export const ExternalActorNodeExample: Story = {
  render: () => {
    const config = nodeConfigLoader.getStyleConfig(NodeType.C4_EXTERNAL_ACTOR);
    const height = config?.dimensions.height || 100;
    const width = config?.dimensions.width || 200;
    return (
      <div style={{ width, height }}>
        <UnifiedNode
          data={{
            nodeType: NodeType.C4_EXTERNAL_ACTOR,
            layerId: 'test-layer',
            elementId: 'test-element-id',
            label: 'End User',
            detailLevel: 'standard',
          }}
          id="external-actor-1"
        />
      </div>
    );
  },
};

