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
import FieldList, { type FieldItem } from '@/core/nodes/components/FieldList';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Components / FieldList',
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
  render: () => (
    <FieldList
      items={[]}
      itemHeight={28}
      strokeColor="#d1d5db"
      handleColor="#3b82f6"
    />
  ),
};

/**
 * Single field with required indicator
 */
export const SingleFieldRequired: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'f1',
        label: 'Email',
        value: 'string',
        required: true,
      },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Single field with optional indicator
 */
export const SingleFieldOptional: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'f1',
        label: 'Phone',
        value: 'string',
        required: false,
      },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Single field without required indicator
 */
export const SingleFieldNoIndicator: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'f1',
        label: 'Name',
        value: 'string',
      },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Field with tooltip
 */
export const FieldWithTooltip: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'f1',
        label: 'Timestamp',
        value: 'datetime',
        required: true,
        tooltip: 'When the record was created',
      },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Multiple fields with mixed required/optional
 */
export const MultipleFields: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'firstName', value: 'string', required: true },
      { id: 'f3', label: 'lastName', value: 'string', required: true },
      { id: 'f4', label: 'email', value: 'string', required: true },
      { id: 'f5', label: 'phone', value: 'string', required: false },
      { id: 'f6', label: 'address', value: 'string', required: false },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Long field list with scrolling
 */
export const LongFieldList: Story = {
  render: () => {
    const items: FieldItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `f${i + 1}`,
      label: `field_${i + 1}`,
      value: i % 2 === 0 ? 'string' : 'integer',
      required: i % 3 === 0,
    }));
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Fields with long labels (truncation testing)
 */
export const LongLabels: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Fields with long values (truncation testing)
 */
export const LongValues: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Custom itemHeight (larger)
 */
export const LargeItemHeight: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'name', value: 'string', required: true },
      { id: 'f3', label: 'description', value: 'text', required: false },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={40}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Custom itemHeight (smaller)
 */
export const SmallItemHeight: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'name', value: 'string', required: true },
      { id: 'f3', label: 'description', value: 'text', required: false },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={20}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Custom stroke and handle colors
 */
export const CustomColors: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'f1', label: 'id', value: 'UUID', required: true },
      { id: 'f2', label: 'status', value: 'enum', required: true },
      { id: 'f3', label: 'notes', value: 'string', required: false },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#ef4444"
        handleColor="#f97316"
      />
    );
  },
};

/**
 * Fields with special characters
 */
export const SpecialCharacters: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Fields without values (only labels and indicators)
 */
export const LabelsOnly: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'f1', label: 'Field One', required: true },
      { id: 'f2', label: 'Field Two', required: false },
      { id: 'f3', label: 'Field Three' },
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Multiple tooltips (hover over info icons)
 */
export const MultipleTooltips: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#d1d5db"
        handleColor="#3b82f6"
      />
    );
  },
};

/**
 * Database schema example
 */
export const DatabaseSchema: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#6b7280"
        handleColor="#8b5cf6"
      />
    );
  },
};

/**
 * JSON schema field example
 */
export const JSONSchemaFields: Story = {
  render: () => {
    const items: FieldItem[] = [
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
    ];
    return (
      <FieldList
        items={items}
        itemHeight={28}
        strokeColor="#059669"
        handleColor="#10b981"
      />
    );
  },
};
