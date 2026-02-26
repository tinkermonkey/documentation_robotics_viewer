/**
 * Storybook Stories for FieldList Component
 *
 * Tests the FieldList component which renders a list of fields with:
 * - Per-field connection handles
 * - Required/optional indicators
 * - Tooltips
 * - Alternating row backgrounds
 * - Accessibility support
 */

import type { Meta, StoryObj } from '@storybook/react';
import FieldList from '@/core/nodes/components/FieldList';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / UnifiedNode / Components / FieldList',
  component: FieldList,
  decorators: [withReactFlowDecorator({ width: 400, height: 500 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof FieldList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * Empty state - no fields defined
 */
export const EmptyState: Story = {
  args: {
    items: [],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => (
    <FieldList {...args} />
  ),
};

/**
 * Single field with required indicator
 */
export const SingleFieldRequired: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'Email',
        value: 'string',
        required: true,
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Single field with optional indicator
 */
export const SingleFieldOptional: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'Phone',
        value: 'string',
        required: false,
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Single field without required indicator
 */
export const SingleFieldNoIndicator: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'Name',
        value: 'string',
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Field with tooltip
 */
export const FieldWithTooltip: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'Timestamp',
        value: 'datetime',
        required: true,
        tooltip: 'When the record was created',
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Multiple fields with mixed required/optional
 */
export const MultipleFields: Story = {
  args: {
    items: [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'firstName', value: 'string', required: true },
      { id: 'f3', label: 'lastName', value: 'string', required: true },
      { id: 'f4', label: 'email', value: 'string', required: true },
      { id: 'f5', label: 'phone', value: 'string', required: false },
      { id: 'f6', label: 'address', value: 'string', required: false },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Long field list with scrolling
 */
export const LongFieldList: Story = {
  args: {
    items: Array.from({ length: 20 }, (_, i) => ({
      id: `f${i + 1}`,
      label: `field_${i + 1}`,
      value: i % 2 === 0 ? 'string' : 'integer',
      required: i % 3 === 0,
    })),
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Fields with long labels (truncation testing)
 */
export const LongLabels: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'VeryLongFieldNameThatShouldBeTruncatedWithEllipsis',
        value: 'string',
        required: true,
      },
      {
        id: 'f2',
        label: 'AnotherExtremelyLongFieldNameForTruncationTesting',
        value: 'integer',
        required: false,
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Fields with long values (truncation testing)
 */
export const LongValues: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'description',
        value: 'VeryLongValueThatContainsALotOfTextAndShouldBeTruncatedWithEllipsisAtTheEnd',
        required: true,
      },
      {
        id: 'f2',
        label: 'type',
        value: 'ComplexTypeNameWithQualifiersLikeNamespace.ClassName.InnerClassName',
        required: false,
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Custom itemHeight (larger)
 */
export const LargeItemHeight: Story = {
  args: {
    items: [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'name', value: 'string', required: true },
      { id: 'f3', label: 'description', value: 'text', required: false },
    ],
    itemHeight: 40,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Custom itemHeight (smaller)
 */
export const SmallItemHeight: Story = {
  args: {
    items: [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'name', value: 'string', required: true },
      { id: 'f3', label: 'description', value: 'text', required: false },
    ],
    itemHeight: 20,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Custom stroke and handle colors
 */
export const CustomColors: Story = {
  args: {
    items: [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'status', value: 'enum', required: true },
      { id: 'f3', label: 'notes', value: 'string', required: false },
    ],
    itemHeight: 28,
    strokeColor: '#ef4444',
    handleColor: '#f97316',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Fields with special characters
 */
export const SpecialCharacters: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'email@domain',
        value: 'string<nullable>',
        required: true,
      },
      {
        id: 'f2',
        label: 'price_$',
        value: 'decimal(10,2)',
        required: true,
      },
      {
        id: 'f3',
        label: 'user_&_role',
        value: 'string | null',
        required: false,
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Fields without values (only labels and indicators)
 */
export const LabelsOnly: Story = {
  args: {
    items: [
      { id: 'f1', label: 'Field One', required: true },
      { id: 'f2', label: 'Field Two', required: false },
      { id: 'f3', label: 'Field Three' },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Multiple tooltips (hover over info icons)
 */
export const MultipleTooltips: Story = {
  args: {
    items: [
      {
        id: 'f1',
        label: 'userId',
        value: 'UUID',
        required: true,
        tooltip: 'Unique identifier for the user',
      },
      {
        id: 'f2',
        label: 'createdAt',
        value: 'timestamp',
        required: true,
        tooltip: 'When the record was first created',
      },
      {
        id: 'f3',
        label: 'updatedAt',
        value: 'timestamp',
        required: false,
        tooltip: 'When the record was last modified',
      },
    ],
    itemHeight: 28,
    strokeColor: '#d1d5db',
    handleColor: '#3b82f6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * Database schema example
 */
export const DatabaseSchema: Story = {
  args: {
    items: [
      {
        id: 'user_id',
        label: 'user_id',
        value: 'BIGINT',
        required: true,
        tooltip: 'Primary key',
      },
      {
        id: 'email',
        label: 'email',
        value: 'VARCHAR(255)',
        required: true,
        tooltip: 'User email address (unique)',
      },
      {
        id: 'password_hash',
        label: 'password_hash',
        value: 'VARCHAR(256)',
        required: true,
        tooltip: 'Bcrypt password hash',
      },
      {
        id: 'created_at',
        label: 'created_at',
        value: 'TIMESTAMP',
        required: false,
        tooltip: 'Account creation time',
      },
      {
        id: 'last_login',
        label: 'last_login',
        value: 'TIMESTAMP',
        required: false,
        tooltip: 'Last login timestamp',
      },
    ],
    itemHeight: 28,
    strokeColor: '#6b7280',
    handleColor: '#8b5cf6',
  },
  render: (args) => <FieldList {...args} />,
};

/**
 * JSON schema field example
 */
export const JSONSchemaFields: Story = {
  args: {
    items: [
      {
        id: 'properties',
        label: 'properties',
        value: 'object',
        required: true,
      },
      {
        id: 'required',
        label: 'required',
        value: 'array[string]',
        required: false,
      },
      {
        id: 'type',
        label: 'type',
        value: 'string',
        required: true,
      },
      {
        id: 'title',
        label: 'title',
        value: 'string',
        required: false,
      },
      {
        id: 'description',
        label: 'description',
        value: 'string',
        required: false,
      },
    ],
    itemHeight: 28,
    strokeColor: '#059669',
    handleColor: '#10b981',
  },
  render: (args) => <FieldList {...args} />,
};
