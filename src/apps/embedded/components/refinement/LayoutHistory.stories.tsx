import type { StoryDefault, Story } from '@ladle/react';
import { LayoutHistory } from './LayoutHistory';
import type { RefinementIteration } from '../../types/refinement';
import { useState } from 'react';

export default {
  title: 'Refinement / LayoutHistory',
} satisfies StoryDefault;

function createIteration(
  iterationNumber: number,
  timestamp: Date,
  score: number,
  improved: boolean
): RefinementIteration {
  return {
    iterationNumber,
    timestamp: timestamp.toISOString(),
    durationMs: 1500 + Math.random() * 1000,
    screenshotUrl: `data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="160" height="120"><rect fill="%23${iterationNumber % 2 === 0 ? 'dbeafe' : 'e5e7eb'}" width="160" height="120"/><text x="80" y="60" text-anchor="middle" font-size="12" fill="%236b7280">Iteration ${iterationNumber}</text><text x="80" y="80" text-anchor="middle" font-size="10" fill="%239ca3af">Score: ${score.toFixed(2)}</text></svg>`,
    improved,
    improvementDelta: improved ? 0.05 : -0.02,
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
        perceptualHash: `hash${iterationNumber}`,
      },
    },
    parameters: {
      hierarchical: {
        nodeSpacing: 80,
        layerSpacing: 120,
        direction: 'DOWN',
      },
    },
  };
}

export const SingleEntry: Story = () => {
  const [currentIterationNumber, setCurrentIterationNumber] = useState<number>(1);

  const iterations = [
    createIteration(1, new Date(Date.now() - 5000), 0.75, true),
  ];

  return (
    <div style={{ height: 400, width: 400 }}>
      <LayoutHistory
        iterations={iterations}
        currentIterationNumber={currentIterationNumber}
        onPreview={(num) => setCurrentIterationNumber(num)}
        onRevert={(num) => console.log('Revert to:', num)}
      />
    </div>
  );
};

export const MultipleEntries: Story = () => {
  const [currentIterationNumber, setCurrentIterationNumber] = useState<number>(5);

  const iterations = [
    createIteration(1, new Date(Date.now() - 25000), 0.65, false),
    createIteration(2, new Date(Date.now() - 20000), 0.72, true),
    createIteration(3, new Date(Date.now() - 15000), 0.68, false),
    createIteration(4, new Date(Date.now() - 10000), 0.81, true),
    createIteration(5, new Date(Date.now() - 5000), 0.88, true),
  ];

  return (
    <div style={{ height: 600, width: 500 }}>
      <LayoutHistory
        iterations={iterations}
        currentIterationNumber={currentIterationNumber}
        onPreview={(num) => setCurrentIterationNumber(num)}
        onRevert={(num) => console.log('Revert to:', num)}
      />
    </div>
  );
};

export const LongHistory: Story = () => {
  const [currentIterationNumber, setCurrentIterationNumber] = useState<number>(15);

  const iterations = Array.from({ length: 15 }, (_, i) => {
    const timestamp = new Date(Date.now() - (15 - i) * 10000);
    const score = 0.6 + (i / 14) * 0.35;
    const improved = i > 0 && score > (0.6 + ((i - 1) / 14) * 0.35);
    return createIteration(i + 1, timestamp, score, improved);
  });

  return (
    <div style={{ height: 700, width: 500 }}>
      <LayoutHistory
        iterations={iterations}
        currentIterationNumber={currentIterationNumber}
        onPreview={(num) => setCurrentIterationNumber(num)}
        onRevert={(num) => console.log('Revert to:', num)}
      />
    </div>
  );
};

export const WithQualityTrend: Story = () => {
  const [currentIterationNumber, setCurrentIterationNumber] = useState<number>(8);

  const iterations = [
    createIteration(1, new Date(Date.now() - 40000), 0.60, false),
    createIteration(2, new Date(Date.now() - 35000), 0.62, true), // Slight improvement
    createIteration(3, new Date(Date.now() - 30000), 0.58, false), // Regression
    createIteration(4, new Date(Date.now() - 25000), 0.75, true), // Big jump
    createIteration(5, new Date(Date.now() - 20000), 0.73, false), // Slight regression
    createIteration(6, new Date(Date.now() - 15000), 0.82, true),
    createIteration(7, new Date(Date.now() - 10000), 0.88, true),
    createIteration(8, new Date(Date.now() - 5000), 0.91, true),
  ];

  return (
    <div style={{ height: 700, width: 600 }}>
      <LayoutHistory
        iterations={iterations}
        currentIterationNumber={currentIterationNumber}
        onPreview={(num) => setCurrentIterationNumber(num)}
        onRevert={(num) => console.log('Revert to:', num)}
      />
    </div>
  );
};

export const ComparisonMode: Story = () => {
  const [currentIterationNumber, setCurrentIterationNumber] = useState<number>(3);

  const iterations = [
    createIteration(1, new Date(Date.now() - 20000), 0.68, false),
    createIteration(2, new Date(Date.now() - 15000), 0.75, true),
    createIteration(3, new Date(Date.now() - 10000), 0.82, true),
    createIteration(4, new Date(Date.now() - 5000), 0.79, false),
  ];

  return (
    <div style={{ height: 600, width: 600 }}>
      <LayoutHistory
        iterations={iterations}
        currentIterationNumber={currentIterationNumber}
        onPreview={(num) => setCurrentIterationNumber(num)}
        onRevert={(num) => console.log('Revert to:', num)}
      />
    </div>
  );
};

export const EmptyState: Story = () => {
  return (
    <div style={{ height: 400, width: 400 }}>
      <LayoutHistory
        iterations={[]}
        currentIterationNumber={0}
        onPreview={(num) => console.log('Preview:', num)}
        onRevert={(num) => console.log('Revert:', num)}
      />
    </div>
  );
};
