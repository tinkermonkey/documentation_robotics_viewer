import type { Meta, StoryObj } from '@storybook/react';
import ChangesetList from '@/apps/embedded/components/ChangesetList';
import { useChangesetStore } from '@/apps/embedded/stores/changesetStore';
import { useEffect } from 'react';
import type { ChangesetSummary } from '@/apps/embedded/services/embeddedDataLoader';

const meta = {
  title: 'A Primitives / Data Viewers / ChangesetList',
} satisfies Meta;

export default meta;
type Story = StoryObj;

const mockChangesets: Array<ChangesetSummary & { id: string }> = [
  {
    id: 'cs-1',
    name: 'Add User Authentication',
    type: 'feature',
    status: 'active',
    created_at: '2024-12-20T10:00:00Z',
    elements_count: 5,
  },
  {
    id: 'cs-2',
    name: 'Fix Data Validation',
    type: 'bugfix',
    status: 'applied',
    created_at: '2024-12-19T14:30:00Z',
    elements_count: 3,
  },
  {
    id: 'cs-3',
    name: 'Explore ML Integration',
    type: 'exploration',
    status: 'active',
    created_at: '2024-12-18T09:15:00Z',
    elements_count: 8,
  },
  {
    id: 'cs-4',
    name: 'Old Feature Attempt',
    type: 'feature',
    status: 'abandoned',
    created_at: '2024-12-10T11:00:00Z',
    elements_count: 2,
  },
];

export const WithMultipleChangesets: Story = {
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: mockChangesets,
        selectedChangesetId: null
      });
    }, []);

    return (
      <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={(id) => console.log('Selected:', id)} />
      </div>
    );
  }
};

export const WithSelection: Story = {
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: mockChangesets,
        selectedChangesetId: 'cs-1'
      });
    }, []);

    return (
      <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={(id) => console.log('Selected:', id)} />
      </div>
    );
  }
};

export const EmptyList: Story = {
  render: () => {
    useEffect(() => {
      useChangesetStore.setState({
        changesets: [],
        selectedChangesetId: null
      });
    }, []);

    return (
      <div className="w-96 bg-gray-50 p-4">
        <ChangesetList onChangesetSelect={(id) => console.log('Selected:', id)} />
      </div>
    );
  }
};
