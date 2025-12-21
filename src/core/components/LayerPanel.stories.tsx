import type { StoryDefault, Story } from '@ladle/react';
import { LayerPanel } from './LayerPanel';
import { useLayerStore } from '../stores/layerStore';
import { useEffect } from 'react';

export default {
  title: 'Core Components / LayerPanel',
} satisfies StoryDefault;

export const Default: Story = () => {
  useEffect(() => {
    useLayerStore.setState({
      layers: {
        motivation: { visible: true, opacity: 1, locked: false },
        business: { visible: true, opacity: 1, locked: false },
        application: { visible: true, opacity: 1, locked: false },
        technology: { visible: true, opacity: 1, locked: false },
      },
      focusedLayer: null,
    });
  }, []);

  return (
    <div style={{ width: 320, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <LayerPanel />
    </div>
  );
};

export const AllLayersVisible: Story = () => {
  useEffect(() => {
    useLayerStore.setState({
      layers: {
        motivation: { visible: true, opacity: 1, locked: false },
        business: { visible: true, opacity: 1, locked: false },
        security: { visible: true, opacity: 1, locked: false },
        application: { visible: true, opacity: 1, locked: false },
        technology: { visible: true, opacity: 1, locked: false },
        api: { visible: true, opacity: 1, locked: false },
        datamodel: { visible: true, opacity: 1, locked: false },
        ux: { visible: true, opacity: 1, locked: false },
        navigation: { visible: true, opacity: 1, locked: false },
        apm: { visible: true, opacity: 1, locked: false },
      },
      focusedLayer: null,
    });
  }, []);

  return (
    <div style={{ width: 320, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <LayerPanel />
    </div>
  );
};

export const SomeLayersHidden: Story = () => {
  useEffect(() => {
    useLayerStore.setState({
      layers: {
        motivation: { visible: true, opacity: 1, locked: false },
        business: { visible: true, opacity: 0.5, locked: false },
        security: { visible: false, opacity: 1, locked: false },
        application: { visible: false, opacity: 1, locked: false },
        technology: { visible: false, opacity: 1, locked: false },
      },
      focusedLayer: null,
    });
  }, []);

  return (
    <div style={{ width: 320, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <LayerPanel />
    </div>
  );
};

export const AllLayersHidden: Story = () => {
  useEffect(() => {
    useLayerStore.setState({
      layers: {
        motivation: { visible: false, opacity: 1, locked: false },
        business: { visible: false, opacity: 1, locked: false },
        security: { visible: false, opacity: 1, locked: false },
        application: { visible: false, opacity: 1, locked: false },
        technology: { visible: false, opacity: 1, locked: false },
      },
      focusedLayer: null,
    });
  }, []);

  return (
    <div style={{ width: 320, border: '1px solid #e5e7eb', borderRadius: 8 }}>
      <LayerPanel />
    </div>
  );
};
