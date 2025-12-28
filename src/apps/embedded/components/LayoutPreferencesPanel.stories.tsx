import type { StoryDefault, Story } from '@ladle/react';
import { LayoutPreferencesPanel } from './LayoutPreferencesPanel';
import { useState } from 'react';
import type { LayoutPreferences, LayoutPreset } from '../types/refinement';

export default {
  title: 'Components / LayoutPreferencesPanel',
} satisfies StoryDefault;

const defaultPreferences: LayoutPreferences = {
  defaultEngines: {
    motivation: 'elk',
    business: 'graphviz',
    c4: 'elk',
    security: 'dagre',
    application: 'elk',
    technology: 'dagre',
    api: 'elk',
    dataModel: 'graphviz',
    datastore: 'dagre',
    ux: 'dagre',
    navigation: 'dagre',
    apm: 'elk',
  },
  presets: [],
  version: '1.0.0',
};

const samplePresets: LayoutPreset[] = [
  {
    id: 'preset-1',
    name: 'High Quality C4',
    description: 'Optimized for large C4 architecture diagrams',
    diagramType: 'c4',
    engineType: 'elk',
    parameters: {
      algorithm: 'layered',
      spacing: 120,
      direction: 'DOWN',
      layering: 'NETWORK_SIMPLEX',
    },
    created: new Date(Date.now() - 86400000).toISOString(),
  },
  {
    id: 'preset-2',
    name: 'Compact Motivation',
    description: 'Space-efficient for small motivation diagrams',
    diagramType: 'motivation',
    engineType: 'dagre',
    parameters: {
      rankdir: 'TB',
      nodesep: 40,
      ranksep: 60,
    },
    created: new Date(Date.now() - 43200000).toISOString(),
  },
  {
    id: 'preset-3',
    name: 'Business Process Flow',
    description: 'Left-to-right orthogonal for BPMN diagrams',
    diagramType: 'business',
    engineType: 'graphviz',
    parameters: {
      algorithm: 'dot',
      rankdir: 'LR',
      splines: 'ortho',
      nodesep: 1.0,
      ranksep: 2.0,
    },
    created: new Date(Date.now() - 21600000).toISOString(),
  },
];

export const DefaultState: Story = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>(defaultPreferences);

  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
      />
    </div>
  );
};

export const WithPresets: Story = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>({
    ...defaultPreferences,
    presets: samplePresets,
  });

  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
      />
    </div>
  );
};

export const EditingPreset: Story = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>({
    ...defaultPreferences,
    presets: samplePresets,
  });
  const [editingPresetId, setEditingPresetId] = useState<string>('preset-1');

  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
        editingPresetId={editingPresetId}
        onEditPreset={(id) => setEditingPresetId(id)}
      />
    </div>
  );
};

export const ManyPresets: Story = () => {
  const manyPresets: LayoutPreset[] = Array.from({ length: 10 }, (_, i) => ({
    id: `preset-${i + 1}`,
    name: `Preset ${i + 1}`,
    description: `Custom layout preset #${i + 1}`,
    diagramType: ['motivation', 'business', 'c4', 'application'][i % 4] as any,
    engineType: ['elk', 'dagre', 'graphviz'][i % 3] as any,
    parameters: {
      spacing: 80 + i * 10,
      direction: 'DOWN',
    },
    created: new Date(Date.now() - i * 86400000).toISOString(),
  }));

  const [preferences, setPreferences] = useState<LayoutPreferences>({
    ...defaultPreferences,
    presets: manyPresets,
  });

  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
      />
    </div>
  );
};

export const CustomEngineDefaults: Story = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>({
    ...defaultPreferences,
    defaultEngines: {
      motivation: 'graphviz',
      business: 'elk',
      c4: 'graphviz',
      security: 'elk',
      application: 'graphviz',
      technology: 'elk',
      api: 'graphviz',
      dataModel: 'elk',
      datastore: 'elk',
      ux: 'elk',
      navigation: 'elk',
      apm: 'graphviz',
    },
    presets: samplePresets.slice(0, 2),
  });

  return (
    <div style={{ width: 800, height: 700 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
      />
    </div>
  );
};

export const CompactView: Story = () => {
  const [preferences, setPreferences] = useState<LayoutPreferences>({
    ...defaultPreferences,
    presets: samplePresets.slice(0, 1),
  });

  return (
    <div style={{ width: 600, height: 500 }}>
      <LayoutPreferencesPanel
        preferences={preferences}
        onPreferencesChange={(prefs) => {
          console.log('Preferences updated:', prefs);
          setPreferences(prefs);
        }}
        onExport={() => console.log('Export preferences')}
        onImport={() => console.log('Import preferences')}
        compact={true}
      />
    </div>
  );
};
