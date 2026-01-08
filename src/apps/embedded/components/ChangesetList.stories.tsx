import type { StoryDefault, Story } from '@ladle/react';
import ChangesetList from './ChangesetList';
import { useChangesetStore } from '../stores/changesetStore';
import { useEffect } from 'react';

export default {
  title: 'Components / ChangesetList',
} satisfies StoryDefault;

const mockChangesets: any[] = [
  {
    id: 'cs-1',
    name: 'Add User Authentication',
    type: 'feature',
    status: 'active' as const,
    created_at: '2024-12-20T10:00:00Z',
    created_by: 'Alice',
    description: 'Implement OAuth2 authentication',
    changes: { changes: [] },
    elements_count: 5,
  },
  {
    id: 'cs-2',
    name: 'Fix Data Validation',
    type: 'bugfix',
    status: 'applied' as const,
    created_at: '2024-12-19T14:30:00Z',
    created_by: 'Bob',
    description: 'Correct validation logic',
    changes: { changes: [] },
    elements_count: 3,
  },
  {
    id: 'cs-3',
    name: 'Explore ML Integration',
    type: 'exploration',
    status: 'active' as const,
    created_at: '2024-12-18T09:15:00Z',
    created_by: 'Charlie',
    description: 'Research ML model integration',
    changes: { changes: [] },
    elements_count: 8,
  },
  {
    id: 'cs-4',
    name: 'Old Feature Attempt',
    type: 'feature',
    status: 'abandoned' as const,
    created_at: '2024-12-10T11:00:00Z',
    created_by: 'Alice',
    description: 'Abandoned due to requirements change',
    changes: { changes: [] },
    elements_count: 2,
  },
];

export const WithMultipleChangesets: Story = () => {
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
};

export const WithSelection: Story = () => {
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
};

export const EmptyList: Story = () => {
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
};
