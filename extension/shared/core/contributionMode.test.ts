import { describe, expect, it } from 'vitest';

import { createContributionModeSeed, deriveContributionModeFrame } from './contributionMode';
import type { ContributionGraph } from './githubContributionGraph';

describe('contributionMode', () => {
  it('maps contribution intensity to logical board states without exposing contribution history', () => {
    const graph: ContributionGraph = {
      container: document.createElement('section'),
      size: { rows: 1, columns: 4 },
      cells: [0, 1, 2, 4].map((intensity, column) => ({
        coordinate: { row: 0, column },
        element: document.createElement('rect'),
        intensity,
      })),
    };

    expect(deriveContributionModeFrame(graph)).toEqual([['empty', 'bonus', 'obstacle', 'enemy']]);
    expect(createContributionModeSeed(graph, 'runner')).toEqual({
      columns: 4,
      gameId: 'runner',
      intensityBuckets: [0, 1, 2, 4],
      rows: 1,
      schemaVersion: 1,
    });
  });
});
