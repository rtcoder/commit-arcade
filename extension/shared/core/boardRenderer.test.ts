import { describe, expect, it } from 'vitest';

import { createBoardRenderer } from './boardRenderer';
import type { ContributionGraph } from './githubContributionGraph';

describe('createBoardRenderer', () => {
  it('updates only changed cells and clears stale extension-owned state', () => {
    const cells = Array.from({ length: 4 }, (_, index) => {
      const element = document.createElement('rect');
      return {
        coordinate: { row: Math.floor(index / 2), column: index % 2 },
        element,
        intensity: index,
      };
    });
    const graph: ContributionGraph = { cells, container: document.createElement('section'), size: { rows: 2, columns: 2 } };
    const renderer = createBoardRenderer(graph);

    renderer.render([
      ['empty', 'player'],
      ['enemy', 'empty'],
    ]);
    renderer.render([
      ['empty', 'player'],
      ['empty', 'bonus'],
    ]);

    expect(cells[0]?.element.getAttribute('data-commit-arcade-state')).toBeNull();
    expect(cells[1]?.element.getAttribute('data-commit-arcade-state')).toBe('player');
    expect(cells[2]?.element.getAttribute('data-commit-arcade-state')).toBeNull();
    expect(cells[3]?.element.getAttribute('data-commit-arcade-state')).toBe('bonus');
  });
});
