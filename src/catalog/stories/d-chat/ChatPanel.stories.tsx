import type { Meta, StoryObj } from '@storybook/react';
import { ChatPanel } from '@/apps/embedded/components/ChatPanel';
import { withEmbeddedAppDecorator } from '@catalog/decorators/EmbeddedAppDecorator';

const meta = {
  title: 'D Chat / ChatPanel',
  component: ChatPanel,
  decorators: [withEmbeddedAppDecorator],
  parameters: {
    layout: 'fullscreen',
  },
} satisfies Meta<typeof ChatPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * ChatPanel Stories
 *
 * The ChatPanel component is the main root UI component for chat functionality.
 * It displays the message list, input form, and streaming indicators.
 * It uses the chat store to manage messages and status.
 */

export const Default: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanel title="DrBot Chat" showCostInfo={true} testId="chat-panel" />
    </div>
  ),
};

export const WithCustomTitle: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanel title="Architecture Assistant" showCostInfo={true} testId="chat-panel" />
    </div>
  ),
};

export const WithoutCostInfo: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanel title="DrBot Chat" showCostInfo={false} testId="chat-panel" />
    </div>
  ),
};

export const WithCustomTestId: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanel title="DrBot Chat" showCostInfo={true} testId="custom-chat-panel" />
    </div>
  ),
};

export const AllCustomProps: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanel
        title="Custom Chat"
        showCostInfo={false}
        testId="all-custom"
      />
    </div>
  ),
};
