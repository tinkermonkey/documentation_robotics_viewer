/**
 * TableFieldList Component Stories
 *
 * Comprehensive Storybook stories for the TableFieldList component.
 * Demonstrates the table layout mode used by DATA_JSON_SCHEMA and DATA_MODEL node types.
 */

import type { Meta, StoryObj } from '@storybook/react';
import TableFieldList from '@/core/nodes/components/TableFieldList';
import type { FieldItem } from '@/core/nodes/components/FieldList';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

// ============================================================================
// TableFieldList Stories
// ============================================================================

const meta = {
  title: 'Core Nodes / TableFieldList',
  decorators: [withReactFlowDecorator({ width: 400, height: 500 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof TableFieldList>;

export default meta;
type Story = StoryObj<typeof meta>;

// Basic field list with simple fields
export const Default: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'userId',
        value: 'string',
        required: true,
        tooltip: 'Unique identifier for the user',
      },
      {
        id: 'field-2',
        label: 'email',
        value: 'string',
        required: true,
        tooltip: 'Email address for contact',
      },
      {
        id: 'field-3',
        label: 'phone',
        value: 'string',
        required: false,
        tooltip: 'Optional phone number',
      },
      {
        id: 'field-4',
        label: 'created_at',
        value: 'ISO8601',
        required: true,
      },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Empty state
export const EmptyState: Story = {
  render: () => {
    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={[]} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Undefined items (should render empty)
export const UndefinedItems: Story = {
  render: () => {
    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={[] as FieldItem[]} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Many fields (scrollable)
export const ManyFields: Story = {
  render: () => {
    const items: FieldItem[] = Array.from({ length: 20 }, (_, i) => ({
      id: `field-${i}`,
      label: `field_${i}`,
      value: `type_${i}`,
      required: i % 2 === 0,
      tooltip: i % 3 === 0 ? `This is field number ${i}` : undefined,
    }));

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Complex value types
export const ComplexTypes: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'id',
        value: 'UUID',
        required: true,
        tooltip: 'Primary key',
      },
      {
        id: 'field-2',
        label: 'metadata',
        value: 'object<string, unknown>',
        required: false,
        tooltip: 'Additional metadata storage',
      },
      {
        id: 'field-3',
        label: 'tags',
        value: 'string[]',
        required: false,
        tooltip: 'Array of tag strings',
      },
      {
        id: 'field-4',
        label: 'config',
        value: 'Record<string, any>',
        required: true,
        tooltip: 'Configuration object',
      },
      {
        id: 'field-5',
        label: 'timestamp',
        value: 'number (milliseconds)',
        required: true,
      },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Long field names and values
export const LongContent: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'veryLongFieldNameThatExceedsNormalLength',
        value: 'Map<string, Promise<Record<string, unknown>>>',
        required: true,
        tooltip:
          'This is a very long tooltip that contains detailed information about what this field represents in the system',
      },
      {
        id: 'field-2',
        label: 'anotherLongFieldName',
        value: 'AsyncIterator<{ id: string; data: unknown }>',
        required: false,
        tooltip: 'Returns an async iterator of typed objects',
      },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// All required fields
export const AllRequired: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'field-1', label: 'id', value: 'string', required: true },
      { id: 'field-2', label: 'name', value: 'string', required: true },
      { id: 'field-3', label: 'status', value: 'enum', required: true },
      { id: 'field-4', label: 'created', value: 'datetime', required: true },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// All optional fields
export const AllOptional: Story = {
  render: () => {
    const items: FieldItem[] = [
      { id: 'field-1', label: 'nickname', value: 'string', required: false },
      { id: 'field-2', label: 'bio', value: 'text', required: false },
      { id: 'field-3', label: 'avatar', value: 'url', required: false },
      { id: 'field-4', label: 'website', value: 'url', required: false },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Mixed with and without tooltips
export const MixedTooltips: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'id',
        value: 'UUID',
        required: true,
        tooltip: 'Primary identifier',
      },
      {
        id: 'field-2',
        label: 'name',
        value: 'string',
        required: true,
      },
      {
        id: 'field-3',
        label: 'description',
        value: 'string',
        required: false,
        tooltip: 'Optional description text',
      },
      {
        id: 'field-4',
        label: 'status',
        value: 'enum',
        required: true,
      },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={24} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Custom item height
export const CustomItemHeight: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'field1',
        value: 'type1',
        required: true,
        tooltip: 'First field',
      },
      {
        id: 'field-2',
        label: 'field2',
        value: 'type2',
        required: false,
        tooltip: 'Second field with longer content',
      },
      {
        id: 'field-3',
        label: 'field3',
        value: 'type3',
        required: true,
      },
    ];

    return (
      <div className="p-4 border border-gray-300 dark:border-gray-600 rounded">
        <TableFieldList items={items} itemHeight={32} strokeColor="#d1d5db" handleColor="#3b82f6" />
      </div>
    );
  },
};

// Dark mode variant
export const DarkMode: Story = {
  render: () => {
    const items: FieldItem[] = [
      {
        id: 'field-1',
        label: 'userId',
        value: 'string',
        required: true,
        tooltip: 'Unique identifier',
      },
      {
        id: 'field-2',
        label: 'email',
        value: 'string',
        required: true,
      },
      {
        id: 'field-3',
        label: 'preferences',
        value: 'object',
        required: false,
        tooltip: 'User preferences',
      },
    ];

    return (
      <div className="dark bg-gray-900 p-4">
        <div className="p-4 border border-gray-700 rounded">
          <TableFieldList items={items} itemHeight={24} strokeColor="#4b5563" handleColor="#60a5fa" />
        </div>
      </div>
    );
  },
};
