import {describe, expect, it} from 'vitest';

import {createBoardRenderer} from './boardRenderer';
import type {ContributionGraph} from './githubContributionGraph';

describe('createBoardRenderer', () => {
  it('updates only changed cells and clears stale extension-owned state', () => {
    const cells = Array.from({length: 4}, (_, index) => {
      const element = document.createElement('rect');
      return {
        coordinate: {row: Math.floor(index / 2), column: index % 2},
        element,
        intensity: index,
      };
    });
    const graph: ContributionGraph = {cells, container: document.createElement('section'), size: {rows: 2, columns: 2}};
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

  it('renders sparse GitHub table cells by their coordinates instead of dense array position', () => {
    const firstWeekTopCell = document.createElement('td');
    const secondWeekBottomCell = document.createElement('td');
    const lastWeekTopCell = document.createElement('td');
    const cells = [
      {coordinate: {row: 0, column: 1}, element: firstWeekTopCell, intensity: 0},
      {coordinate: {row: 1, column: 1}, element: secondWeekBottomCell, intensity: 0},
      {coordinate: {row: 0, column: 2}, element: lastWeekTopCell, intensity: 0},
    ];
    const graph: ContributionGraph = {cells, container: document.createElement('section'), size: {rows: 2, columns: 3}};
    const renderer = createBoardRenderer(graph);

    renderer.render([
      ['empty', 'player', 'bonus'],
      ['empty', 'enemy', 'empty'],
    ]);

    expect(firstWeekTopCell.getAttribute('data-commit-arcade-state')).toBe('player');
    expect(secondWeekBottomCell.getAttribute('data-commit-arcade-state')).toBe('enemy');
    expect(lastWeekTopCell.getAttribute('data-commit-arcade-state')).toBe('bonus');
  });
});
