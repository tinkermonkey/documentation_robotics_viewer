/**
 * ChatInput Component Stories
 * Demonstrates the message composition form
 */
import type { Story } from '@ladle/react';
import { ChatInput } from '@/apps/embedded/components/chat/ChatInput';

export default {
  title: 'Chat / Messages / ChatInput',
};

/**
 * Default empty input
 */
export const Default: Story = () => {
  const handleSendMessage = async (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput
        onSendMessage={handleSendMessage}
        placeholder="Ask about the architecture model..."
      />
    </div>
  );
};

/**
 * Input disabled during streaming
 */
export const Streaming: Story = () => {
  const handleSendMessage = async (message: string) => {
    console.log('Message sent:', message);
  };

  const handleCancel = async () => {
    console.log('Streaming canceled');
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput
        onSendMessage={handleSendMessage}
        onCancel={handleCancel}
        isStreaming={true}
        placeholder="Waiting for response..."
      />
    </div>
  );
};

/**
 * Input disabled
 */
export const Disabled: Story = () => {
  const handleSendMessage = async (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput
        onSendMessage={handleSendMessage}
        disabled={true}
        placeholder="SDK not available..."
      />
    </div>
  );
};

/**
 * Input with custom placeholder
 */
export const CustomPlaceholder: Story = () => {
  const handleSendMessage = async (message: string) => {
    console.log('Message sent:', message);
  };

  return (
    <div className="p-4 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
      <ChatInput
        onSendMessage={handleSendMessage}
        placeholder="Type /dr-model to add architecture elements..."
      />
    </div>
  );
};
