import type { StoryDefault, Story } from '@ladle/react';
import { LayoutHistory } from './LayoutHistory';
import type { LayoutHistoryEntry } from '../../types/refinement';
import { useState } from 'react';

export default {
  title: 'Refinement / LayoutHistory',
} satisfies StoryDefault;

function createHistoryEntry(
  id: number,
  timestamp: Date,
  score: number,
  engine: string
): LayoutHistoryEntry {
  return {
    id: `layout-${id}`,
    timestamp: timestamp.toISOString(),
    engineType: engine,
    parameters: {
      spacing: 80,
      direction: 'DOWN',
    },
    qualityScore: {
      combinedScore: score,
      readabilityScore: score,
      similarityScore: score,
      readabilityMetrics: {
        edgeCrossings: Math.floor((1 - score) * 10),
        nodeOcclusion: Math.floor((1 - score) * 3),
        aspectRatioScore: 0.8 + score * 0.2,
        edgeLengthVariance: 100,
        density: 0.5,
      },
      similarityMetrics: {
        structuralSimilarity: score,
        layoutSimilarity: score,
        perceptualHash: `hash${id}`,
      },
    },
    thumbnailUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect fill="%23${id % 2 === 0 ? 'dbeafe' : 'e5e7eb'}" width="160" height="120"/><text x="80" y="60" text-anchor="middle" font-size="12" fill="%236b7280">${engine}</text><text x="80" y="80" text-anchor="middle" font-size="10" fill="%239ca3af">Score: ${score.toFixed(2)}</text></svg>`,
  };
}

export const SingleEntry: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('layout-1');

  const history: LayoutHistoryEntry[] = [
    createHistoryEntry(1, new Date(Date.now() - 5000), 0.75, 'ELK'),
  ];

  return (
    <div style={{ height: 400, width: 400 }}>
      <LayoutHistory
        history={history}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onRevert={(id) => console.log('Revert to:', id)}
        onCompare={(ids) => console.log('Compare:', ids)}
      />
    </div>
  );
};

export const MultipleEntries: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('layout-5');

  const history: LayoutHistoryEntry[] = [
    createHistoryEntry(1, new Date(Date.now() - 25000), 0.65, 'Dagre'),
    createHistoryEntry(2, new Date(Date.now() - 20000), 0.72, 'ELK Layered'),
    createHistoryEntry(3, new Date(Date.now() - 15000), 0.68, 'Graphviz Dot'),
    createHistoryEntry(4, new Date(Date.now() - 10000), 0.81, 'ELK Force'),
    createHistoryEntry(5, new Date(Date.now() - 5000), 0.88, 'ELK Layered'),
  ];

  return (
    <div style={{ height: 600, width: 500 }}>
      <LayoutHistory
        history={history}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onRevert={(id) => console.log('Revert to:', id)}
        onCompare={(ids) => console.log('Compare:', ids)}
      />
    </div>
  );
};

export const LongHistory: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('layout-15');

  const engines = ['Dagre', 'ELK Layered', 'ELK Force', 'Graphviz Dot', 'Graphviz Neato'];

  const history: LayoutHistoryEntry[] = Array.from({ length: 15 }, (_, i) => {
    const timestamp = new Date(Date.now() - (15 - i) * 10000);
    const score = 0.6 + (i / 14) * 0.35;
    const engine = engines[i % engines.length];
    return createHistoryEntry(i + 1, timestamp, score, engine);
  });

  return (
    <div style={{ height: 700, width: 500 }}>
      <LayoutHistory
        history={history}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onRevert={(id) => console.log('Revert to:', id)}
        onCompare={(ids) => console.log('Compare:', ids)}
        maxEntries={10}
      />
    </div>
  );
};

export const WithQualityTrend: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('layout-8');

  const history: LayoutHistoryEntry[] = [
    createHistoryEntry(1, new Date(Date.now() - 40000), 0.60, 'Dagre'),
    createHistoryEntry(2, new Date(Date.now() - 35000), 0.62, 'Dagre'), // Slight improvement
    createHistoryEntry(3, new Date(Date.now() - 30000), 0.58, 'ELK Layered'), // Regression
    createHistoryEntry(4, new Date(Date.now() - 25000), 0.75, 'ELK Layered'), // Big jump
    createHistoryEntry(5, new Date(Date.now() - 20000), 0.73, 'Graphviz'), // Slight regression
    createHistoryEntry(6, new Date(Date.now() - 15000), 0.82, 'ELK Force'),
    createHistoryEntry(7, new Date(Date.now() - 10000), 0.88, 'ELK Force'),
    createHistoryEntry(8, new Date(Date.now() - 5000), 0.91, 'ELK Force'),
  ];

  return (
    <div style={{ height: 700, width: 600 }}>
      <LayoutHistory
        history={history}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onRevert={(id) => console.log('Revert to:', id)}
        onCompare={(ids) => console.log('Compare:', ids)}
        showTrend={true}
      />
    </div>
  );
};

export const ComparisonMode: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('layout-3');
  const [comparisonIds, setComparisonIds] = useState<string[]>(['layout-1', 'layout-3']);

  const history: LayoutHistoryEntry[] = [
    createHistoryEntry(1, new Date(Date.now() - 20000), 0.68, 'Dagre'),
    createHistoryEntry(2, new Date(Date.now() - 15000), 0.75, 'ELK Layered'),
    createHistoryEntry(3, new Date(Date.now() - 10000), 0.82, 'ELK Force'),
    createHistoryEntry(4, new Date(Date.now() - 5000), 0.79, 'Graphviz'),
  ];

  return (
    <div style={{ height: 600, width: 600 }}>
      <LayoutHistory
        history={history}
        selectedId={selectedId}
        onSelect={(id) => setSelectedId(id)}
        onRevert={(id) => console.log('Revert to:', id)}
        onCompare={(ids) => {
          console.log('Compare:', ids);
          setComparisonIds(ids);
        }}
        comparisonIds={comparisonIds}
        allowMultiSelect={true}
      />
    </div>
  );
};

export const EmptyState: Story = () => {
  return (
    <div style={{ height: 400, width: 400 }}>
      <LayoutHistory
        history={[]}
        selectedId={undefined}
        onSelect={(id) => console.log('Select:', id)}
        onRevert={(id) => console.log('Revert:', id)}
        onCompare={(ids) => console.log('Compare:', ids)}
      />
    </div>
  );
};
