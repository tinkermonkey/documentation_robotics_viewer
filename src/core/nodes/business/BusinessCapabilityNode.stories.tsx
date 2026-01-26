import type { StoryDefault, Story } from '@ladle/react';
import { BusinessCapabilityNode, BUSINESS_CAPABILITY_NODE_WIDTH, BUSINESS_CAPABILITY_NODE_HEIGHT } from './BusinessCapabilityNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createBusinessCapabilityNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Architecture Nodes / Business / BusinessCapabilityNode',
  decorators: [withReactFlowDecorator({ width: BUSINESS_CAPABILITY_NODE_WIDTH, height: BUSINESS_CAPABILITY_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <BusinessCapabilityNode data={createBusinessCapabilityNodeData({ label: 'Customer Management' })} id="capability-1" />
);

export const HighCriticality: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Order Management',
      criticality: 'high',
    })}
    id="capability-2"
  />
);

export const MediumCriticality: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Marketing',
      criticality: 'medium',
    })}
    id="capability-3"
  />
);

export const LowCriticality: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Training',
      criticality: 'low',
    })}
    id="capability-4"
  />
);

export const ActiveLifecycle: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Sales',
      lifecycle: 'active',
    })}
    id="capability-5"
  />
);

export const DeprecatedLifecycle: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Legacy Support',
      lifecycle: 'deprecated',
    })}
    id="capability-6"
  />
);

export const WithOwner: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Supply Chain',
      owner: 'Supply Chain Director',
    })}
    id="capability-7"
  />
);

export const ChangesetAdd: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'New Capability',
      changesetOperation: 'add',
    })}
    id="capability-8"
  />
);

export const ChangesetUpdate: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Updated Capability',
      changesetOperation: 'update',
    })}
    id="capability-9"
  />
);

export const ChangesetDelete: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Deleted Capability',
      changesetOperation: 'delete',
    })}
    id="capability-10"
  />
);

export const Dimmed: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Dimmed Capability',
      opacity: 0.5,
    })}
    id="capability-11"
  />
);

export const Highlighted: Story = () => (
  <BusinessCapabilityNode
    data={createBusinessCapabilityNodeData({
      label: 'Highlighted Capability',
      strokeWidth: 3,
    })}
    id="capability-12"
  />
);
