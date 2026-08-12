import {describe, expect, it} from 'vitest';

import {createTetrisGame} from './tetrisGame';
import {createTestRenderer} from '../../test/testRenderer';

describe('createTetrisGame', () => {
  it('renders a falling 2x2 piece on start', () => {
    const game = createTetrisGame({initialPiece: {row: 0, column: 5}});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 0, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 1, 6)).toBe('player');
  });

  it('moves the active piece horizontally', () => {
    const game = createTetrisGame({initialPiece: {row: 0, column: 5}});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowLeft', type: 'down'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 0, 4)).toBe('player');
    expect(cellAt(renderer.lastFrame, 0, 6)).toBe('empty');
  });

  it('locks a piece at the bottom and reports score', () => {
    const scores: number[] = [];
    const game = createTetrisGame({initialPiece: {row: 5, column: 5}, dropStepMs: 100});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.update(100);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 6, 5)).toBe('obstacle');
    expect(cellAt(renderer.lastFrame, 0, 5)).toBe('player');
  });

  it('ends when the spawn area is blocked', () => {
    let gameOver = false;
    const game = createTetrisGame({
      initialSettled: [
        {row: 0, column: 5},
        {row: 0, column: 6},
      ],
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
