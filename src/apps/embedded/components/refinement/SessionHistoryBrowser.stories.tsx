// @ts-nocheck
import type { StoryDefault, Story } from '@ladle/react';
import { SessionHistoryBrowser } from './SessionHistoryBrowser';
import type { RefinementSessionState, RefinementIteration } from '../../../../core/services/refinement/refinementLoop';
import type { DiagramType } from '../../../../core/services/refinement/layoutParameters';
import type { LayoutType } from '../../../../core/services/metrics/graphReadabilityService';
import { useState } from 'react';

export default {
  title: 'Refinement / SessionHistoryBrowser',
} satisfies StoryDefault;

function createMockSession(
  id: string,
  name: string,
  diagramType: DiagramType,
  startTime: Date,
  iterationCount: number,
  bestScore: number,
  paused: boolean
): RefinementSessionState {
  const iterations: RefinementIteration[] = Array.from({ length: iterationCount }, (_, i) => {
    const score = 0.6 + (i / Math.max(iterationCount - 1, 1)) * (bestScore - 0.6);
    return {
      iteration: i + 1,
      parameters: {
        hierarchical: {
          nodeSpacing: 80 + i * 5,
          layerSpacing: 120,
          direction: 'DOWN',
        },
      },
      score,
      breakdown: {
        readabilityScore: 0.65 + (i / Math.max(iterationCount - 1, 1)) * (bestScore - 0.6),
        similarityScore: 0.55 + (i / Math.max(iterationCount - 1, 1)) * (bestScore - 0.55),
      },
      isBest: Math.abs(score - bestScore) < 0.001,
      improvementPercent: i > 0 ? ((score - 0.6) / 0.6) * 100 : 0,
      durationMs: 1000 + Math.random() * 2000,
      timestamp: new Date(startTime.getTime() + i * 60000).toISOString(),
    };
  });

  const bestIteration = iterations.find((it) => it.isBest) || iterations[iterations.length - 1];

  return {
    sessionId: id,
    name,
    diagramType,
    layoutType: 'hierarchical' as LayoutType,
    config: {
      maxIterations: 50,
      targetScore: 0.9,
      plateauThreshold: 5,
      minImprovementPercent: 1.0,
      diagramType,
      layoutType: 'hierarchical' as LayoutType,
      strategyType: 'random',
      verbose: false,
    },
    history: iterations,
    bestResult: bestIteration,
    paused,
    createdAt: startTime.toISOString(),
    updatedAt: new Date(startTime.getTime() + iterationCount * 60000).toISOString(),
  };
}

export const EmptyState: Story = () => {
  return (
    <div style={{ height: 600, width: 900 }}>
      <SessionHistoryBrowser
        sessions={[]}
        onSessionSelect={(id) => console.log('Selected:', id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const SingleSession: Story = () => {
  const [activeId, setActiveId] = useState<string>('session-1');

  const sessions = [
    createMockSession(
      'session-1',
      'Motivation Layout Optimization',
      'motivation',
      new Date(Date.now() - 3600000),
      8,
      0.89,
      false
    ),
  ];

  return (
    <div style={{ height: 600, width: 900 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        activeSessionId={activeId}
        onSessionSelect={(id) => setActiveId(id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const MultipleSessions: Story = () => {
  const [activeId, setActiveId] = useState<string>('session-3');

  const sessions = [
    createMockSession(
      'session-1',
      'Motivation Refinement',
      'motivation',
      new Date(Date.now() - 86400000 * 3),
      12,
      0.91,
      false
    ),
    createMockSession(
      'session-2',
      'Business Layer Optimization',
      'business',
      new Date(Date.now() - 86400000 * 2),
      6,
      0.75,
      true
    ),
    createMockSession(
      'session-3',
      'C4 Context View',
      'c4',
      new Date(Date.now() - 86400000),
      15,
      0.93,
      false
    ),
    createMockSession(
      'session-4',
      'Application Layer',
      'application',
      new Date(Date.now() - 43200000),
      3,
      0.62,
      false
    ),
    createMockSession(
      'session-5',
      'Current Session',
      'motivation',
      new Date(Date.now() - 3600000),
      8,
      0.87,
      false
    ),
  ];

  return (
    <div style={{ height: 700, width: 1000 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        activeSessionId={activeId}
        onSessionSelect={(id) => setActiveId(id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const FilterByStatus: Story = () => {
  const [activeId, setActiveId] = useState<string | undefined>();
  const [statusFilter, setStatusFilter] = useState<string>('active');

  const allSessions = [
    createMockSession('session-1', 'Motivation Session 1', 'motivation', new Date(Date.now() - 86400000 * 5), 10, 0.88, false),
    createMockSession('session-2', 'Business Paused', 'business', new Date(Date.now() - 86400000 * 4), 5, 0.72, true),
    createMockSession('session-3', 'C4 Complete', 'c4', new Date(Date.now() - 86400000 * 3), 15, 0.94, false),
    createMockSession('session-4', 'Application Session', 'application', new Date(Date.now() - 86400000 * 2), 3, 0.61, false),
    createMockSession('session-5', 'Motivation Complete', 'motivation', new Date(Date.now() - 86400000), 12, 0.91, false),
    createMockSession('session-6', 'Business Paused 2', 'business', new Date(Date.now() - 43200000), 4, 0.68, true),
    createMockSession('session-7', 'C4 Active', 'c4', new Date(Date.now() - 3600000), 7, 0.85, false),
  ];

  const filteredSessions =
    statusFilter === 'all'
      ? allSessions
      : statusFilter === 'paused'
        ? allSessions.filter((s) => s.paused)
        : allSessions.filter((s) => !s.paused);

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
          <option value="active">Active</option>
          <option value="paused">Paused</option>
        </select>
      </div>
      <SessionHistoryBrowser
        sessions={filteredSessions}
        activeSessionId={activeId}
        onSessionSelect={(id) => setActiveId(id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const ComparisonMode: Story = () => {
  const [activeId, setActiveId] = useState<string>('session-2');

  const sessions = [
    createMockSession('session-1', 'First Attempt', 'motivation', new Date(Date.now() - 86400000 * 3), 10, 0.85, false),
    createMockSession('session-2', 'Second Attempt', 'motivation', new Date(Date.now() - 86400000 * 2), 8, 0.78, false),
    createMockSession('session-3', 'Best Result', 'motivation', new Date(Date.now() - 86400000), 12, 0.92, false),
  ];

  return (
    <div style={{ height: 700, width: 1000 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        activeSessionId={activeId}
        onSessionSelect={(id) => setActiveId(id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};

export const LongHistory: Story = () => {
  const [activeId, setActiveId] = useState<string>('session-20');

  const sessions = Array.from({ length: 20 }, (_, i) => {
    const daysAgo = 20 - i;
    const diagramTypes: DiagramType[] = ['motivation', 'business', 'c4', 'application', 'security'];
    const paused = i % 5 === 3; // Every 4th session is paused

    return createMockSession(
      `session-${i + 1}`,
      `Session ${i + 1}`,
      diagramTypes[i % diagramTypes.length],
      new Date(Date.now() - 86400000 * daysAgo),
      5 + Math.floor(Math.random() * 10),
      0.65 + Math.random() * 0.3,
      paused
    );
  });

  return (
    <div style={{ height: 800, width: 1100 }}>
      <SessionHistoryBrowser
        sessions={sessions}
        activeSessionId={activeId}
        onSessionSelect={(id) => setActiveId(id)}
        onSessionLoad={(id) => console.log('Load:', id)}
        onSessionsCompare={(ids) => console.log('Compare:', ids)}
        onSessionDelete={(id) => console.log('Delete:', id)}
      />
    </div>
  );
};
