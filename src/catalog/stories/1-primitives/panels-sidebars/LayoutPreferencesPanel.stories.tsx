// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import { LayoutPreferencesPanel } from '@/apps/embedded/components/LayoutPreferencesPanel';

export default {
  title: '1 Primitives / Panels and Sidebars / LayoutPreferencesPanel',
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
