import type { StoryDefault, Story } from '@ladle/react';
import ConnectionStatus from '@/apps/embedded/components/ConnectionStatus';
import { useConnectionStore } from '@/apps/embedded/stores/connectionStore';
import { useEffect } from 'react';

export default {
  title: 'Primitives / Indicators / ConnectionStatus',
} satisfies StoryDefault;

export const Connected: Story = () => {
  useEffect(() => {
    useConnectionStore.setState({ state: 'connected', reconnectAttempt: 0 });
  }, []);

  return (
    <div className="p-4 bg-gray-50">
      <ConnectionStatus />
    </div>
  );
};

export const Connecting: Story = () => {
  useEffect(() => {
    useConnectionStore.setState({ state: 'connecting', reconnectAttempt: 0 });
  }, []);

  return (
    <div className="p-4 bg-gray-50">
      <ConnectionStatus />
    </div>
  );
};

export const Reconnecting: Story = () => {
  useEffect(() => {
    useConnectionStore.setState({ state: 'reconnecting', reconnectAttempt: 3 });
  }, []);

  return (
    <div className="p-4 bg-gray-50">
      <ConnectionStatus />
    </div>
  );
};

export const Disconnected: Story = () => {
  useEffect(() => {
    useConnectionStore.setState({ state: 'disconnected', reconnectAttempt: 0 });
  }, []);

  return (
    <div className="p-4 bg-gray-50">
      <ConnectionStatus />
    </div>
  );
};

export const Error: Story = () => {
  useEffect(() => {
    useConnectionStore.setState({ state: 'error', reconnectAttempt: 0 });
  }, []);

  return (
    <div className="p-4 bg-gray-50">
      <ConnectionStatus />
    </div>
  );
};
