import type { StoryDefault, Story } from '@ladle/react';
import ChangesetViewer from '@/apps/embedded/components/ChangesetViewer';
import { useChangesetStore } from '@/apps/embedded/stores/changesetStore';
import { useEffect } from 'react';

export default {
  title: 'A Primitives / Panels and Sidebars / ChangesetViewer',
} satisfies StoryDefault;

const mockChangeset = {
  id: 'cs-1',
  name: 'Add User Authentication',
  type: 'feature',
  status: 'active',
  created_at: '2024-12-20T10:00:00Z',
  created_by: 'Alice',
  description: 'Implement OAuth2 authentication flow with token refresh',
  metadata: {
    id: 'cs-1',
    name: 'Add User Authentication',
    description: 'Implement OAuth2 authentication flow with token refresh',
    type: 'feature',
    status: 'active',
    created_at: '2024-12-20T10:00:00Z',
    updated_at: '2024-12-20T15:30:00Z',
    workflow: 'feature-workflow',
    summary: {
      elements_added: 5,
      elements_updated: 3,
      elements_deleted: 1,
    },
    version: '1.0',
    branch: 'feature/auth',
  },
  changes: {
    version: '1.0',
    changes: [
      {
        id: 'ch-1',
        operation: 'add' as const,
        timestamp: '2024-12-20T10:15:00Z',
        element_id: 'auth-service',
        layer: 'application-layer',
        elementId: 'auth-service',
        elementType: 'ApplicationComponent',
        element_type: 'ApplicationComponent',
        elementName: 'Authentication Service',
        properties: { technology: 'Node.js', version: '1.0.0' },
      },
      {
        id: 'ch-2',
        operation: 'update' as const,
        timestamp: '2024-12-20T10:30:00Z',
        element_id: 'api-gateway',
        layer: 'application-layer',
        elementId: 'api-gateway',
        elementType: 'ApplicationComponent',
        element_type: 'ApplicationComponent',
        elementName: 'API Gateway',
        properties: { security: 'OAuth2' },
      },
      {
        id: 'ch-3',
        operation: 'delete' as const,
        timestamp: '2024-12-20T10:45:00Z',
        element_id: 'old-auth',
        layer: 'application-layer',
        elementId: 'old-auth',
        elementType: 'ApplicationComponent',
        element_type: 'ApplicationComponent',
        elementName: 'Legacy Auth System',
      },
    ],
  },
};

export const WithChangeset: Story = () => {
  useEffect(() => {
    useChangesetStore.setState({ 
      selectedChangeset: mockChangeset,
      loading: false,
      error: null
    });
  }, []);

  return (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ChangesetViewer />
    </div>
  );
};

export const Loading: Story = () => {
  useEffect(() => {
    useChangesetStore.setState({ 
      selectedChangeset: null,
      loading: true,
      error: null
    });
  }, []);

  return (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ChangesetViewer />
    </div>
  );
};

export const NoSelection: Story = () => {
  useEffect(() => {
    useChangesetStore.setState({ 
      selectedChangeset: null,
      loading: false,
      error: null
    });
  }, []);

  return (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ChangesetViewer />
    </div>
  );
};

export const WithError: Story = () => {
  useEffect(() => {
    useChangesetStore.setState({ 
      selectedChangeset: null,
      loading: false,
      error: 'Failed to load changeset details'
    });
  }, []);

  return (
    <div className="w-full max-w-4xl p-4 bg-gray-50">
      <ChangesetViewer />
    </div>
  );
};
