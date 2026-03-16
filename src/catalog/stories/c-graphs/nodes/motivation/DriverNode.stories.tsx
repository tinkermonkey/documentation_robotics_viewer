import type { Meta, StoryObj } from '@storybook/react';
import { UnifiedNode } from '@/core/nodes';
import { NodeType } from '@/core/nodes';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';

const meta = {
  title: 'C Graphs / Nodes / Motivation / DriverNode',
  component: UnifiedNode,
  decorators: [withReactFlowDecorator({ width: 180, height: 110 })],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof UnifiedNode>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    id: 'driver-1',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Market Competition',
    },
  },
};

export const BusinessDriver: Story = {
  args: {
    id: 'driver-2',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Revenue Growth Target',
      items: [
        { id: 'category', label: 'Category', value: 'business' },
      ],
      badges: [
        { position: 'inline' as const, content: 'business', ariaLabel: 'Category: business' },
      ],
    },
  },
};

export const TechnicalDriver: Story = {
  args: {
    id: 'driver-3',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Technology Modernization',
      items: [
        { id: 'category', label: 'Category', value: 'technical' },
      ],
      badges: [
        { position: 'inline' as const, content: 'technical', ariaLabel: 'Category: technical' },
      ],
    },
  },
};

export const RegulatoryDriver: Story = {
  args: {
    id: 'driver-4',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Compliance Requirements',
      items: [
        { id: 'category', label: 'Category', value: 'regulatory' },
      ],
      badges: [
        { position: 'inline' as const, content: 'regulatory', ariaLabel: 'Category: regulatory' },
      ],
    },
  },
};

export const MarketDriver: Story = {
  args: {
    id: 'driver-5',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Customer Demand',
      items: [
        { id: 'category', label: 'Category', value: 'market' },
      ],
      badges: [
        { position: 'inline' as const, content: 'market', ariaLabel: 'Category: market' },
      ],
    },
  },
};

export const ChangesetAdd: Story = {
  args: {
    id: 'driver-6',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'New Driver',
      changesetOperation: 'add',
    },
  },
};

export const ChangesetUpdate: Story = {
  args: {
    id: 'driver-7',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Updated Driver',
      changesetOperation: 'update',
    },
  },
};

export const ChangesetDelete: Story = {
  args: {
    id: 'driver-8',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Deleted Driver',
      changesetOperation: 'delete',
    },
  },
};

export const Dimmed: Story = {
  args: {
    id: 'driver-9',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Dimmed Driver',
      relationshipBadge: { count: 3, incoming: 2, outgoing: 1 },
    },
  },
};

export const Highlighted: Story = {
  args: {
    id: 'driver-10',
    data: {
      nodeType: NodeType.MOTIVATION_DRIVER,
        layerId: 'test-layer',
        elementId: 'test-element-id',
      label: 'Highlighted Node',
    },
  },
};
