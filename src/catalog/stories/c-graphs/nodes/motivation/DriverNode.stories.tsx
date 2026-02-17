import type { Meta, StoryObj } from '@storybook/react';
import { DriverNode, DRIVER_NODE_WIDTH, DRIVER_NODE_HEIGHT } from '@/core/nodes/motivation/DriverNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createDriverNodeData } from '@catalog/fixtures/nodeDataFixtures';

const meta = {
  title: 'C Graphs / Nodes / Motivation / DriverNode',
  decorators: [withReactFlowDecorator({ width: DRIVER_NODE_WIDTH, height: DRIVER_NODE_HEIGHT })],
  parameters: {
    layout: 'centered',
  },
} satisfies Meta;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: () => (
    <DriverNode data={createDriverNodeData({ label: 'Market Competition' })} id="driver-1" />
  ),
};

export const BusinessDriver: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Revenue Growth Target',
          category: 'business',
        })}
        id="driver-2"
      />
  ),
};

export const TechnicalDriver: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Technology Modernization',
          category: 'technical',
        })}
        id="driver-3"
      />
  ),
};

export const RegulatoryDriver: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Compliance Requirements',
          category: 'regulatory',
        })}
        id="driver-4"
      />
  ),
};

export const MarketDriver: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Customer Demand',
          category: 'market',
        })}
        id="driver-5"
      />
  ),
};

export const ChangesetAdd: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'New Driver',
          changesetOperation: 'add',
        })}
        id="driver-6"
      />
  ),
};

export const ChangesetUpdate: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Updated Driver',
          changesetOperation: 'update',
        })}
        id="driver-7"
      />
  ),
};

export const ChangesetDelete: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Deleted Driver',
          changesetOperation: 'delete',
        })}
        id="driver-8"
      />
  ),
};

export const Dimmed: Story = {
  render: () => (
    <DriverNode
        data={createDriverNodeData({
          label: 'Dimmed Driver',
          opacity: 0.5,
        })}
        id="driver-9"
      />
  ),
};

export const Highlighted: Story = {
  render: () => (
    <DriverNode
      data={createDriverNodeData({
        label: 'Highlighted Node',
        strokeWidth: 3
      })}
      id="1"
    />
  ),
};

