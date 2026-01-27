import type { StoryDefault, Story } from '@ladle/react';
import { CoverageSummaryPanel } from './CoverageSummaryPanel';
import type { CoverageSummary } from '../services/coverageAnalyzer';

export default {
  title: 'Panels & Inspectors / Statistics / CoverageSummaryPanel',
} satisfies StoryDefault;

const mockSummaryComplete: CoverageSummary = {
  totalGoals: 10,
  completeCount: 10,
  partialCount: 0,
  noneCount: 0,
  overallCoverage: 1.0,
  uncoveredGoals: [],
  partiallyCoveredGoals: [],
  goalCoverages: [],
};

const mockSummaryMixed: CoverageSummary = {
  totalGoals: 15,
  completeCount: 8,
  partialCount: 5,
  noneCount: 2,
  overallCoverage: 0.7,
  uncoveredGoals: [
    { goalId: 'goal-1', goalName: 'Improve system performance', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
    { goalId: 'goal-2', goalName: 'Enhance user experience', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
  ],
  partiallyCoveredGoals: [
    { goalId: 'goal-3', goalName: 'Reduce operational costs', status: 'partial', requirementCount: 2, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 40 },
    { goalId: 'goal-4', goalName: 'Increase scalability', status: 'partial', requirementCount: 3, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 60 },
    { goalId: 'goal-5', goalName: 'Improve security', status: 'partial', requirementCount: 1, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 20 },
  ],
  goalCoverages: [],
};

const mockSummaryPoor: CoverageSummary = {
  totalGoals: 20,
  completeCount: 3,
  partialCount: 5,
  noneCount: 12,
  overallCoverage: 0.275,
  uncoveredGoals: [
    { goalId: 'goal-1', goalName: 'Improve system performance', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
    { goalId: 'goal-2', goalName: 'Enhance user experience', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
    { goalId: 'goal-3', goalName: 'Reduce costs', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
    { goalId: 'goal-4', goalName: 'Increase reliability', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
    { goalId: 'goal-5', goalName: 'Modernize technology', status: 'none', requirementCount: 0, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 0 },
  ],
  partiallyCoveredGoals: [
    { goalId: 'goal-6', goalName: 'Improve security', status: 'partial', requirementCount: 1, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 20 },
    { goalId: 'goal-7', goalName: 'Enhance monitoring', status: 'partial', requirementCount: 2, requirementIds: [], constraintCount: 0, constraintIds: [], coveragePercentage: 40 },
  ],
  goalCoverages: [],
};

export const CompleteCoverage: Story = () => (
  <div className="p-4 bg-gray-50">
    <CoverageSummaryPanel summary={mockSummaryComplete} />
  </div>
);

export const MixedCoverage: Story = () => (
  <div className="p-4 bg-gray-50">
    <CoverageSummaryPanel
      summary={mockSummaryMixed}
      onGoalClick={(goalId) => console.log('Goal clicked:', goalId)}
    />
  </div>
);

export const PoorCoverage: Story = () => (
  <div className="p-4 bg-gray-50">
    <CoverageSummaryPanel
      summary={mockSummaryPoor}
      onGoalClick={(goalId) => console.log('Goal clicked:', goalId)}
    />
  </div>
);

export const Collapsed: Story = () => (
  <div className="p-4 bg-gray-50">
    <CoverageSummaryPanel
      summary={mockSummaryMixed}
      collapsed={true}
      onToggleCollapse={() => console.log('Toggle clicked')}
    />
  </div>
);
