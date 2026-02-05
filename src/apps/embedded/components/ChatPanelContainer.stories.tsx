import { Story } from '@ladle/react';
import { ChatPanelContainer } from './ChatPanelContainer';

export const Default: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanelContainer />
    </div>
  ),
};

export const WithCustomTitle: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanelContainer title="Architecture Assistant" />
    </div>
  ),
};

export const WithoutCostInfo: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanelContainer showCostInfo={false} />
    </div>
  ),
};

export const WithCustomTestId: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanelContainer testId="custom-chat-panel" />
    </div>
  ),
};

export const AllCustomProps: Story = {
  render: () => (
    <div style={{ height: '500px' }}>
      <ChatPanelContainer
        title="Custom Chat"
        showCostInfo={false}
        testId="all-custom"
      />
    </div>
  ),
};
