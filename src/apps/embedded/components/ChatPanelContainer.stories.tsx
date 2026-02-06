import { Story } from '@ladle/react';
import { ChatPanelContainer } from './ChatPanelContainer';

export const Default: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanelContainer />
  </div>
);

export const WithCustomTitle: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanelContainer title="Architecture Assistant" />
  </div>
);

export const WithoutCostInfo: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanelContainer showCostInfo={false} />
  </div>
);

export const WithCustomTestId: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanelContainer testId="custom-chat-panel" />
  </div>
);

export const AllCustomProps: Story = () => (
  <div style={{ height: '500px' }}>
    <ChatPanelContainer
      title="Custom Chat"
      showCostInfo={false}
      testId="all-custom"
    />
  </div>
);
