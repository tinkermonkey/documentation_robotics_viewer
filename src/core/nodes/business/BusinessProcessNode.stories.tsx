import React from 'react';
import type { StoryDefault, Story } from '@ladle/react';
import { BusinessProcessNode } from './BusinessProcessNode';
import { withReactFlowDecorator } from '@/catalog/decorators/withReactFlowDecorator';
import { createBusinessProcessNodeData } from '@/catalog/fixtures/nodeDataFixtures';
import type { BusinessProcessNodeData } from '@/core/types';

export default {
  title: 'Architecture Nodes / Business / BusinessProcessNode',
  decorators: [withReactFlowDecorator()],
} satisfies StoryDefault;

const defaultData = createBusinessProcessNodeData();

export const Default: Story = () => (
  <BusinessProcessNode data={defaultData} id="bp-1" expandedNodes={new Set()} />
);

export const WithDescription: Story = () => {
  const data = createBusinessProcessNodeData({
    label: 'Customer Onboarding',
    owner: 'Customer Success Team',
    criticality: 'high'
  });
  return <BusinessProcessNode data={data} id="bp-2" expandedNodes={new Set()} />;
};

export const ChangesetAdd: Story = () => {
  const data = createBusinessProcessNodeData({
    changesetOperation: 'add',
    label: 'New Process - Invoice Generation'
  });
  return <BusinessProcessNode data={data} id="bp-3" expandedNodes={new Set()} />;
};

export const ChangesetUpdate: Story = () => {
  const data = createBusinessProcessNodeData({
    changesetOperation: 'update',
    label: 'Order Processing (Updated)',
    criticality: 'medium'
  });
  return <BusinessProcessNode data={data} id="bp-4" expandedNodes={new Set()} />;
};

export const ChangesetDelete: Story = () => {
  const data = createBusinessProcessNodeData({
    changesetOperation: 'delete',
    label: 'Legacy Process - To Be Removed',
    opacity: 0.6,
    strokeWidth: 1
  });
  return <BusinessProcessNode data={data} id="bp-5" expandedNodes={new Set()} />;
};

export const Highlighted: Story = () => {
  const data = createBusinessProcessNodeData({
    label: 'Order Processing',
    strokeWidth: 3,
    opacity: 1
  });
  return <BusinessProcessNode data={data} id="bp-6" expandedNodes={new Set()} />;
};

export const WithSubprocesses: Story = () => {
  const data = createBusinessProcessNodeData({
    label: 'Payment Processing',
    subprocessCount: 4,
    subprocesses: [
      { id: 'sp-1', name: 'Validate Payment Method', description: 'Check payment details' },
      { id: 'sp-2', name: 'Authorize Transaction', description: 'Request authorization' },
      { id: 'sp-3', name: 'Capture Funds', description: 'Complete payment' },
      { id: 'sp-4', name: 'Generate Receipt', description: 'Create receipt' }
    ]
  });

  const expandedNodes = new Set(['bp-7']);

  const [expanded, setExpanded] = React.useState(expandedNodes);

  return (
    <BusinessProcessNode
      data={data}
      id="bp-7"
      expandedNodes={expanded}
      onToggleExpanded={(nodeId) => {
        const next = new Set(expanded);
        next.has(nodeId) ? next.delete(nodeId) : next.add(nodeId);
        setExpanded(next);
      }}
    />
  );
};
