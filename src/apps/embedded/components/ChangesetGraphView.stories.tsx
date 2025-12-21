import type { StoryDefault, Story } from '@ladle/react';
import ChangesetGraphView from './ChangesetGraphView';
import { ReactFlowProvider } from '@xyflow/react';
import type { ChangesetDetails } from '../services/embeddedDataLoader';

export default {
  title: 'Graph Views / ChangesetGraphView',
} satisfies StoryDefault;

const mockChangeset: ChangesetDetails = {
  metadata: {
    id: 'changeset-1',
    name: 'Q1 Architecture Update',
    description: 'Updates to business and application layers',
    type: 'feature',
    status: 'active',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    workflow: 'standard',
    summary: {
      elements_added: 1,
      elements_updated: 1,
      elements_deleted: 1,
    },
  },
  changes: {
    version: '1.0',
    changes: [
      {
        timestamp: new Date().toISOString(),
        operation: 'add',
        element_id: 'new-service-1',
        element_type: 'BusinessService',
        layer: 'business',
        data: { name: 'New Order Service' },
      },
      {
        timestamp: new Date().toISOString(),
        operation: 'update',
        element_id: 'service-1',
        element_type: 'BusinessService',
        layer: 'business',
        before: {},
        after: { description: 'Updated description' },
      },
      {
        timestamp: new Date().toISOString(),
        operation: 'delete',
        element_id: 'old-process-1',
        element_type: 'Process',
        layer: 'business',
        before: {},
      },
    ],
  },
};

export const ActiveChangeset: Story = () => {
  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={mockChangeset} />
      </div>
    </ReactFlowProvider>
  );
};

export const AddOperationsOnly: Story = () => {
  const addOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'add'),
    },
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={addOnlyChangeset} />
      </div>
    </ReactFlowProvider>
  );
};

export const UpdateOperationsOnly: Story = () => {
  const updateOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'update'),
    },
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={updateOnlyChangeset} />
      </div>
    </ReactFlowProvider>
  );
};

export const DeleteOperationsOnly: Story = () => {
  const deleteOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'delete'),
    },
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={deleteOnlyChangeset} />
      </div>
    </ReactFlowProvider>
  );
};

export const ManyChanges: Story = () => {
  const manyChangesChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      version: '1.0',
      changes: Array.from({ length: 20 }, (_, i) => ({
        timestamp: new Date().toISOString(),
        operation: ['add', 'update', 'delete'][i % 3] as 'add' | 'update' | 'delete',
        element_id: `element-${i}`,
        element_type: 'BusinessService',
        layer: 'business',
        data: { name: `Element ${i}` },
      })),
    },
  };

  return (
    <ReactFlowProvider>
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={manyChangesChangeset} />
      </div>
    </ReactFlowProvider>
  );
};
