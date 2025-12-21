import type { StoryDefault, Story } from '@ladle/react';
import { BusinessServiceNode, BUSINESS_SERVICE_NODE_WIDTH, BUSINESS_SERVICE_NODE_HEIGHT } from './BusinessServiceNode';
import { withReactFlowDecorator } from '@catalog/decorators/ReactFlowDecorator';
import { createBusinessServiceNodeData } from '@catalog/fixtures/nodeDataFixtures';

export default {
  title: 'Nodes / Business / BusinessServiceNode',
  decorators: [withReactFlowDecorator({ width: BUSINESS_SERVICE_NODE_WIDTH, height: BUSINESS_SERVICE_NODE_HEIGHT })],
} satisfies StoryDefault;

export const Default: Story = () => (
  <BusinessServiceNode data={createBusinessServiceNodeData({ label: 'Payment Service' })} id="service-1" />
);

export const HighCriticality: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Authentication Service',
      criticality: 'high',
    })}
    id="service-2"
  />
);

export const MediumCriticality: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Analytics Service',
      criticality: 'medium',
    })}
    id="service-3"
  />
);

export const LowCriticality: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Notification Service',
      criticality: 'low',
    })}
    id="service-4"
  />
);

export const ActiveLifecycle: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Customer Portal',
      lifecycle: 'active',
    })}
    id="service-5"
  />
);

export const DeprecatedLifecycle: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Legacy API',
      lifecycle: 'deprecated',
    })}
    id="service-6"
  />
);

export const WithOwner: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Billing Service',
      owner: 'Finance Team',
    })}
    id="service-7"
  />
);

export const ChangesetAdd: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'New Service',
      changesetOperation: 'add',
    })}
    id="service-8"
  />
);

export const ChangesetUpdate: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Updated Service',
      changesetOperation: 'update',
    })}
    id="service-9"
  />
);

export const ChangesetDelete: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Deleted Service',
      changesetOperation: 'delete',
    })}
    id="service-10"
  />
);

export const Dimmed: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Dimmed Service',
      opacity: 0.5,
    })}
    id="service-11"
  />
);

export const Highlighted: Story = () => (
  <BusinessServiceNode
    data={createBusinessServiceNodeData({
      label: 'Highlighted Service',
      strokeWidth: 3,
    })}
    id="service-12"
  />
);
