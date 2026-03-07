/**
 * UnifiedNode — Motivation Layer Nodes
 *
 * Stories for all Motivation layer node types:
 * Goal, Stakeholder, Requirement, Constraint, Principle, Driver, Outcome, Assessment,
 * Assumption, ValueStream.
 *
 * Each node type has: Default, Changeset, and Detailed variants.
 */

import type { Meta, StoryObj } from '@storybook/react';
import { NodeType } from '@/core/nodes/NodeType';
import UnifiedNode from '@/core/nodes/components/UnifiedNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'Graphs / Nodes / UnifiedNode / Motivation Nodes',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator()],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

// --- Goal ---

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

// --- Stakeholder ---

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

// --- Requirement ---

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

// --- Constraint ---

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

// --- Principle ---

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

// --- Driver ---

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

// --- Outcome ---

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

// --- Assessment ---

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

// --- Assumption ---

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

// --- Value Stream ---

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
