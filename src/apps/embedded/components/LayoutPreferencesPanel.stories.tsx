import type { StoryDefault, Story } from '@ladle/react';
import { LayoutPreferencesPanel } from './LayoutPreferencesPanel';

export default {
  title: 'Components / LayoutPreferencesPanel',
} satisfies StoryDefault;

export const Default: Story = () => {
  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        onChange={() => {
          console.log('Preferences changed');
        }}
      />
    </div>
  );
};
