import type { StoryDefault, Story } from '@ladle/react';
import { MetricsDashboard } from './MetricsDashboard';
import type { RefinementIteration } from '../../types/refinement';

export default {
  title: 'Refinement / MetricsDashboard',
} satisfies StoryDefault;

function createIteration(num: number, score: number): RefinementIteration {
  return {
    iterationNumber: num,
    timestamp: new Date(Date.now() - (10 - num) * 3600000).toISOString(),
    durationMs: 1200,
    screenshotUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="200" height="150"><rect fill="%23e5e7eb" width="200" height="150"/><text x="100" y="75" text-anchor="middle" font-size="12" fill="%236b7280">Iteration ' + num + '</text></svg>',
    improved: num > 1,
    improvementDelta: num === 1 ? 0 : 0.05,
    qualityScore: {
      readabilityScore: 0.6 + score * 0.4,
      similarityScore: 0.55 + score * 0.45,
      combinedScore: score,
      qualityClass: score > 0.85 ? 'excellent' : score > 0.7 ? 'good' : score > 0.55 ? 'acceptable' : 'poor',
      meetsThreshold: score > 0.75,
      weights: {
        readability: 0.5,
        similarity: 0.5,
      },
      timestamp: new Date().toISOString(),
      computationTimeMs: 250,
      breakdown: {
        graphMetrics: {
          overallScore: 0.6 + score * 0.4,
          timestamp: new Date().toISOString(),
          layoutType: 'hierarchical',
          diagramType: 'motivation',
          nodeCount: 10,
          edgeCount: 15,
          computationTimeMs: 125,
          metrics: {
            crossingNumber: 1 - score,
            crossingAngle: 0.7 + score * 0.3,
            angularResolutionMin: 0.6 + score * 0.4,
            angularResolutionDev: 0.65 + score * 0.35,
          },
          extendedMetrics: {
            crossingNumber: 1 - score,
            crossingAngle: 0.7 + score * 0.3,
            angularResolutionMin: 0.6 + score * 0.4,
            angularResolutionDev: 0.65 + score * 0.35,
            edgeLength: {
              min: 50,
              max: 300,
              mean: 150,
              stdDev: 75,
            },
            nodeNodeOcclusion: (1 - score) * 5,
            aspectRatio: 1.5,
            density: 0.3 + score * 0.2,
          },
        },
      },
    },
    parameters: {
      generic: { padding: 40, minSeparation: 100 },
    },
    feedback: num > 5 ? {
      aspect: 'spacing',
      direction: 'increase',
      intensity: 'slight',
      timestamp: new Date().toISOString(),
    } : undefined,
  };
}

export const SingleIteration: Story = () => {
  const iterations: RefinementIteration[] = [createIteration(1, 0.65)];

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.95}
      baselineScore={0.45}
      selectedIteration={1}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};

export const MultipleIterations: Story = () => {
  const iterations: RefinementIteration[] = [
    createIteration(1, 0.65),
    createIteration(2, 0.72),
    createIteration(3, 0.78),
    createIteration(4, 0.85),
    createIteration(5, 0.91),
  ];

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.95}
      baselineScore={0.45}
      selectedIteration={5}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};

export const ManyIterations: Story = () => {
  const iterations: RefinementIteration[] = Array.from({ length: 15 }, (_, i) => {
    const progress = i / 14;
    return createIteration(i + 1, 0.4 + progress * 0.55);
  });

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.95}
      baselineScore={0.40}
      selectedIteration={15}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};

export const BelowTarget: Story = () => {
  const iterations: RefinementIteration[] = [
    createIteration(1, 0.55),
    createIteration(2, 0.58),
    createIteration(3, 0.62),
    createIteration(4, 0.66),
  ];

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.90}
      baselineScore={0.50}
      selectedIteration={4}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};

export const AboveTarget: Story = () => {
  const iterations: RefinementIteration[] = [
    createIteration(1, 0.70),
    createIteration(2, 0.78),
    createIteration(3, 0.85),
    createIteration(4, 0.92),
    createIteration(5, 0.96),
  ];

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.85}
      baselineScore={0.60}
      selectedIteration={5}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};

export const NonLinearProgress: Story = () => {
  const iterations: RefinementIteration[] = [
    createIteration(1, 0.60),
    createIteration(2, 0.62),
    createIteration(3, 0.61), // Regression
    createIteration(4, 0.75),
    createIteration(5, 0.73), // Small regression
    createIteration(6, 0.88),
  ];

  return (
    <MetricsDashboard
      iterations={iterations}
      targetScore={0.90}
      baselineScore={0.55}
      selectedIteration={6}
      onIterationSelect={(num) => console.log('Select iteration:', num)}
      onRevert={(num) => console.log('Revert to:', num)}
    />
  );
};
