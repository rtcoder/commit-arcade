import {describe, expect, it} from 'vitest';

import {createArcadeBoard} from './arcadeBoard';
import type {ContributionGraph} from './githubContributionGraph';

describe('createArcadeBoard', () => {
  it('creates a 21-row synthetic graph using the source graph columns', () => {
    const sourceGraph = graphWithSize({rows: 7, columns: 4});

    const board = createArcadeBoard(document, sourceGraph);

    expect(board.graph.size).toEqual({rows: 21, columns: 4});
    expect(board.graph.cells).toHaveLength(84);
    expect(board.element.className).toContain('commit-arcade-board');
    expect(board.element.style.getPropertyValue('--commit-arcade-board-rows')).toBe('21');
    expect(board.element.style.getPropertyValue('--commit-arcade-board-columns')).toBe('4');
    expect(board.graph.cells[5]?.coordinate).toEqual({row: 1, column: 1});
  });

  it('clamps configured rows to the supported 15-25 range', () => {
    const sourceGraph = graphWithSize({rows: 7, columns: 3});

    expect(createArcadeBoard(document, sourceGraph, {rows: 9}).graph.size.rows).toBe(15);
    expect(createArcadeBoard(document, sourceGraph, {rows: 40}).graph.size.rows).toBe(25);
  });

  it('removes the synthetic board from the DOM on destroy', () => {
    const sourceGraph = graphWithSize({rows: 7, columns: 3});
    const board = createArcadeBoard(document, sourceGraph);

    sourceGraph.container.append(board.element);

    expect(sourceGraph.container.querySelector('.commit-arcade-board')).toBe(board.element);

    board.destroy();

    expect(sourceGraph.container.querySelector('.commit-arcade-board')).toBeNull();
  });
});

function graphWithSize(size: {rows: number; columns: number}): ContributionGraph {
  const container = document.createElement('section');
  return {
    cells: [],
    container,
    size,
  };
}
