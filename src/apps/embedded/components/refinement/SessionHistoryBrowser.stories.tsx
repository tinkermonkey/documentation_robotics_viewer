import type { StoryDefault, Story } from '@ladle/react';
import { SessionHistoryBrowser } from './SessionHistoryBrowser';
import type { RefinementSession } from '../../types/refinement';
import { useState } from 'react';

export default {
  title: 'Refinement / SessionHistoryBrowser',
} satisfies StoryDefault;

function createMockSession(
  id: string,
  diagramType: string,
  startTime: Date,
  iterationCount: number,
  bestScore: number,
  status: 'active' | 'paused' | 'completed' | 'failed'
): RefinementSession {
  const iterations = Array.from({ length: iterationCount }, (_, i) => ({
    iterationNumber: i + 1,
    timestamp: new Date(startTime.getTime() + i * 60000).toISOString(),
    durationMs: 1000 + Math.random() * 2000,
    screenshotUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="120" height="90"><rect fill="%23${i % 2 === 0 ? 'dbeafe' : 'e5e7eb'}" width="120" height="90"/><text x="60" y="50" text-anchor="middle" font-size="10" fill="%236b7280">Iter ${i + 1}</text></svg>`,
    improved: i > 0,
    improvementDelta: i > 0 ? 0.05 : 0,
    qualityScore: {
      combinedScore: 0.6 + (i / iterationCount) * (bestScore - 0.6),
      readabilityScore: 0.65 + (i / iterationCount) * (bestScore - 0.6),
      similarityScore: 0.55 + (i / iterationCount) * (bestScore - 0.55),
      readabilityMetrics: {
        edgeCrossings: 10 - i,
        nodeOcclusion: 3 - Math.floor(i / 2),
        aspectRatioScore: 0.7 + (i / iterationCount) * 0.25,
        edgeLengthVariance: 150 - i * 5,
        density: 0.5,
      },
      similarityMetrics: {
        structuralSimilarity: 0.6 + (i / iterationCount) * (bestScore - 0.6),
        layoutSimilarity: 0.55 + (i / iterationCount) * (bestScore - 0.55),
        perceptualHash: `hash${i}`,
      },
    },
    parameters: {
      spacing: 80 + i * 5,
      direction: 'DOWN',
    },
  }));

  return {
    sessionId: id,
    diagramType: diagramType as any,
    engineType: 'elk',
    algorithm: 'layered',
    startTime: startTime.toISOString(),
    endTime: status === 'completed' ? new Date(startTime.getTime() + iterationCount * 60000).toISOString() : undefined,
    status,
    iterations,
    bestScore,
    bestIteration: iterationCount,
    totalDurationMs: iterationCount * 60000,
    targetScore: 0.90,
    notes: status === 'failed' ? 'Failed to converge' : undefined,
  };
}

export const EmptyState: Story = () => {
  return (
    <div style={{ height: 600, width: 900 }}>
      <SessionHistoryBrowser
        sessions={[]}
        onSessionSelect={(id) => console.log('Selected:', id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const SingleSession: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('session-1');

  const sessions = [
    createMockSession(
      'session-1',
      'motivation',
      new Date(Date.now() - 3600000),
      8,
      0.89,
      'completed'
    ),
  ];

  return (
    <div style={{ height: 600, width: 900 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        selectedSessionId={selectedId}
        onSessionSelect={(id) => setSelectedId(id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const MultipleSessions: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('session-3');

  const sessions = [
    createMockSession(
      'session-1',
      'motivation',
      new Date(Date.now() - 86400000 * 3),
      12,
      0.91,
      'completed'
    ),
    createMockSession(
      'session-2',
      'business',
      new Date(Date.now() - 86400000 * 2),
      6,
      0.75,
      'paused'
    ),
    createMockSession(
      'session-3',
      'c4',
      new Date(Date.now() - 86400000),
      15,
      0.93,
      'completed'
    ),
    createMockSession(
      'session-4',
      'application',
      new Date(Date.now() - 43200000),
      3,
      0.62,
      'failed'
    ),
    createMockSession(
      'session-5',
      'motivation',
      new Date(Date.now() - 3600000),
      8,
      0.87,
      'active'
    ),
  ];

  return (
    <div style={{ height: 700, width: 1000 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        selectedSessionId={selectedId}
        onSessionSelect={(id) => setSelectedId(id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const FilterByStatus: Story = () => {
  const [selectedId, setSelectedId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('completed');

  const allSessions = [
    createMockSession('session-1', 'motivation', new Date(Date.now() - 86400000 * 5), 10, 0.88, 'completed'),
    createMockSession('session-2', 'business', new Date(Date.now() - 86400000 * 4), 5, 0.72, 'paused'),
    createMockSession('session-3', 'c4', new Date(Date.now() - 86400000 * 3), 15, 0.94, 'completed'),
    createMockSession('session-4', 'application', new Date(Date.now() - 86400000 * 2), 3, 0.61, 'failed'),
    createMockSession('session-5', 'motivation', new Date(Date.now() - 86400000), 12, 0.91, 'completed'),
    createMockSession('session-6', 'business', new Date(Date.now() - 43200000), 4, 0.68, 'paused'),
    createMockSession('session-7', 'c4', new Date(Date.now() - 3600000), 7, 0.85, 'active'),
  ];

  const filteredSessions =
    statusFilter === 'all'
      ? allSessions
      : allSessions.filter((s) => s.status === statusFilter);

  return (
    <div style={{ height: 700, width: 1000 }}>
      <div style={{ marginBottom: 16, padding: 16, backgroundColor: '#f3f4f6' }}>
        <label style={{ marginRight: 8 }}>Filter by status:</label>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ padding: 4, borderRadius: 4, border: '1px solid #d1d5db' }}
        >
          <option value="all">All</option>
          <option value="completed">Completed</option>
          <option value="active">Active</option>
          <option value="paused">Paused</option>
          <option value="failed">Failed</option>
        </select>
      </div>
      <SessionHistoryBrowser
        sessions={filteredSessions}
        selectedSessionId={selectedId}
        onSessionSelect={(id) => setSelectedId(id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const ComparisonMode: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('session-2');
  const [comparisonIds, setComparisonIds] = useState<string[]>(['session-1', 'session-3']);

  const sessions = [
    createMockSession('session-1', 'motivation', new Date(Date.now() - 86400000 * 3), 10, 0.85, 'completed'),
    createMockSession('session-2', 'motivation', new Date(Date.now() - 86400000 * 2), 8, 0.78, 'completed'),
    createMockSession('session-3', 'motivation', new Date(Date.now() - 86400000), 12, 0.92, 'completed'),
  ];

  return (
    <div style={{ height: 700, width: 1000 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        selectedSessionId={selectedId}
        onSessionSelect={(id) => setSelectedId(id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => {
          console.log('Compare:', ids);
          setComparisonIds(ids);
        }}
        onSessionDelete={(id) => console.log('Delete:', id)}
        comparisonIds={comparisonIds}
        allowMultiSelect={true}
      />
    </div>
  );
};

export const LongHistory: Story = () => {
  const [selectedId, setSelectedId] = useState<string>('session-20');

  const sessions = Array.from({ length: 20 }, (_, i) => {
    const daysAgo = 20 - i;
    const diagramTypes = ['motivation', 'business', 'c4', 'application', 'security'];
    const statuses: Array<'completed' | 'paused' | 'failed' | 'active'> = ['completed', 'completed', 'completed', 'paused', 'failed'];

    return createMockSession(
      `session-${i + 1}`,
      diagramTypes[i % diagramTypes.length],
      new Date(Date.now() - 86400000 * daysAgo),
      5 + Math.floor(Math.random() * 10),
      0.65 + Math.random() * 0.3,
      statuses[i % statuses.length]
    );
  });

  return (
    <div style={{ height: 800, width: 1100 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        selectedSessionId={selectedId}
        onSessionSelect={(id) => setSelectedId(id)}
        onSessionResume={(id) => console.log('Resume:', id)}
        onSessionCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
        showPagination={true}
        itemsPerPage={5}
      />
    </div>
  );
};
