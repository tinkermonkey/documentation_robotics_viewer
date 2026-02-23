import { addons } from 'storybook/manager-api';
import { create } from 'storybook/theming';

/**
 * Storybook Manager customization
 *
 * Configures Storybook UI theme and branding
 */
const theme = create({
  base: 'light',
  brandTitle: 'Documentation Robotics',
  brandUrl: 'https://github.com/tinkermonkey/documentation_robotics_viewer',
  colorPrimary: '#3b82f6',
  colorSecondary: '#1e40af',
  appBg: '#ffffff',
  appContentBg: '#f3f4f6',
  appBorderColor: '#e5e7eb',
  appBorderRadius: 8,
  textColor: '#1f2937',
  textInverseColor: '#ffffff',
  barBg: '#ffffff',
  barSelectedColor: '#3b82f6',
  barHoverColor: '#1e40af',
});

addons.setConfig({
  theme,
  isFullscreen: false,
  showNav: true,
  showPanel: true,
  panelPosition: 'right',
});
