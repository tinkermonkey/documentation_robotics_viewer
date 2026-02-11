import type { Meta, StoryObj } from '@storybook/react';
import ChangesetGraphView from '@/apps/embedded/components/ChangesetGraphView';
import type { ChangesetDetails } from '@/apps/embedded/services/embeddedDataLoader';
import { StoryLoadedWrapper } from '@catalog/components/StoryLoadedWrapper';

const meta = {
    title: 'C Graphs / Views / ChangesetGraphView',
} satisfies Meta;

export default meta;
type Story = StoryObj;

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

export const ActiveChangeset: Story = { render: () => (
    
    <StoryLoadedWrapper testId="changeset-graph-active">
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={mockChangeset} />
      </div>
    </StoryLoadedWrapper>
  
  ) };

export const AddOperationsOnly: Story = {
  render: () => {
const addOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'add'),
    },
  };

      return (
      
    <StoryLoadedWrapper testId="changeset-graph-add">
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={addOnlyChangeset} />
      </div>
    </StoryLoadedWrapper>
  
    );
  }
};

export const UpdateOperationsOnly: Story = {
  render: () => {
const updateOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'update'),
    },
  };

      return (
      
    <StoryLoadedWrapper testId="changeset-graph-update">
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={updateOnlyChangeset} />
      </div>
    </StoryLoadedWrapper>
  
    );
  }
};

export const DeleteOperationsOnly: Story = {
  render: () => {
const deleteOnlyChangeset: ChangesetDetails = {
    ...mockChangeset,
    changes: {
      ...mockChangeset.changes,
      changes: mockChangeset.changes.changes.filter((c: typeof mockChangeset.changes.changes[0]) => c.operation === 'delete'),
    },
  };

      return (
      
    <StoryLoadedWrapper testId="changeset-graph-delete">
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={deleteOnlyChangeset} />
      </div>
    </StoryLoadedWrapper>
  
    );
  }
};

export const ManyChanges: Story = {
  render: () => {
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
      
    <StoryLoadedWrapper testId="changeset-graph-many">
      <div style={{ width: '100%', height: 600, border: '1px solid #e5e7eb' }}>
        <ChangesetGraphView changeset={manyChangesChangeset} />
      </div>
    </StoryLoadedWrapper>
  
    );
  }
};
