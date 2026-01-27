import type { StoryDefault, Story } from '@ladle/react';
import { BaseFieldListNode, FieldItem } from './BaseFieldListNode';
import { createBaseFieldListNodeConfig } from '@/catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Architecture Nodes / Generic / BaseFieldListNode',
} satisfies StoryDefault;

export const Default: Story = () => {
  const config = createBaseFieldListNodeConfig();
  return <BaseFieldListNode {...config} />;
};

export const ShortList: Story = () => {
  const shortItems: FieldItem[] = [
    { id: 'f1', name: 'id', type: 'UUID', required: true },
    { id: 'f2', name: 'status', type: 'enum', required: true }
  ];

  const config = createBaseFieldListNodeConfig({
    label: 'Order Status',
    typeLabel: 'ENUM',
    items: shortItems
  });
  return <BaseFieldListNode {...config} />;
};

export const LongList: Story = () => {
  const longItems: FieldItem[] = [
    { id: 'f1', name: 'id', type: 'UUID', required: true },
    { id: 'f2', name: 'firstName', type: 'string', required: true },
    { id: 'f3', name: 'lastName', type: 'string', required: true },
    { id: 'f4', name: 'email', type: 'string', required: true },
    { id: 'f5', name: 'phone', type: 'string', required: false },
    { id: 'f6', name: 'address', type: 'string', required: false },
    { id: 'f7', name: 'city', type: 'string', required: false },
    { id: 'f8', name: 'state', type: 'string', required: false },
    { id: 'f9', name: 'postalCode', type: 'string', required: false },
    { id: 'f10', name: 'country', type: 'string', required: false },
    { id: 'f11', name: 'createdAt', type: 'timestamp', required: false },
    { id: 'f12', name: 'updatedAt', type: 'timestamp', required: false }
  ];

  const config = createBaseFieldListNodeConfig({
    label: 'Customer',
    typeLabel: 'CLASS',
    items: longItems
  });
  return <BaseFieldListNode {...config} />;
};

export const WithIcons: Story = () => {
  const itemsWithTypes: FieldItem[] = [
    { id: 'f1', name: 'identifier', type: 'UUID', required: true },
    { id: 'f2', name: 'name', type: 'string', required: true },
    { id: 'f3', name: 'quantity', type: 'integer', required: true },
    { id: 'f4', name: 'price', type: 'decimal', required: true },
    { id: 'f5', name: 'active', type: 'boolean', required: false }
  ];

  const config = createBaseFieldListNodeConfig({
    label: 'Product',
    typeLabel: 'CLASS',
    items: itemsWithTypes
  });
  return <BaseFieldListNode {...config} />;
};

export const ChangesetUpdate: Story = () => {
  const config = createBaseFieldListNodeConfig({
    label: 'User (Updated)',
    typeLabel: 'CLASS',
    items: [
      { id: 'f1', name: 'id', type: 'UUID', required: true },
      { id: 'f2', name: 'username', type: 'string', required: true },
      { id: 'f3', name: 'email', type: 'string', required: true },
      { id: 'f4', name: 'role', type: 'enum', required: true }
    ],
    colors: {
      border: '#ff9800',
      background: '#fff3e0',
      header: '#f57c00',
      handle: '#e65100'
    }
  });
  return <BaseFieldListNode {...config} />;
};

export const EmptyFields: Story = () => {
  const config = createBaseFieldListNodeConfig({
    label: 'Empty Entity',
    typeLabel: 'CLASS',
    items: []
  });
  return <BaseFieldListNode {...config} />;
};

export const DatabaseSchema: Story = () => {
  const schemaItems: FieldItem[] = [
    { id: 'col1', name: 'user_id', type: 'BIGINT', required: true },
    { id: 'col2', name: 'email', type: 'VARCHAR(255)', required: true },
    { id: 'col3', name: 'password_hash', type: 'VARCHAR(256)', required: true },
    { id: 'col4', name: 'created_at', type: 'TIMESTAMP', required: false },
    { id: 'col5', name: 'last_login', type: 'TIMESTAMP', required: false }
  ];

  const config = createBaseFieldListNodeConfig({
    label: 'users',
    typeLabel: 'TABLE',
    items: schemaItems,
    colors: {
      border: '#2196f3',
      background: '#e3f2fd',
      header: '#1976d2',
      handle: '#0d47a1'
    }
  });
  return <BaseFieldListNode {...config} />;
};
