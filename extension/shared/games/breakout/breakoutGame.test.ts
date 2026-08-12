import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createBreakoutGame} from './breakoutGame';

describe('createBreakoutGame', () => {
  it('renders bricks, paddle and ball on start', () => {
    const game = createBreakoutGame({initialBall: {row: 4, column: 6}, initialPaddleColumn: 5});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 0, 0)).toBe('obstacle');
    expect(cellAt(renderer.lastFrame, 1, 11)).toBe('obstacle');
    expect(cellAt(renderer.lastFrame, 6, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('player');
    expect(cellAt(renderer.lastFrame, 4, 6)).toBe('bonus');
  });

  it('moves the paddle with horizontal keys', () => {
    const game = createBreakoutGame({initialPaddleColumn: 5});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowLeft', type: 'down'});
    game.update(200);
    game.handleInput({key: 'ArrowLeft', type: 'up'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 3)).toBe('player');
    expect(cellAt(renderer.lastFrame, 6, 7)).toBe('empty');
  });

  it('removes a brick and reports score when the ball hits it', () => {
    const scores: number[] = [];
    const game = createBreakoutGame({
      brickRows: 1,
      initialBall: {row: 2, column: 4},
      initialBallVelocity: {row: -5, column: 0},
    });
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.update(400);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 0, 4)).not.toBe('obstacle');
  });

  it('bounces the ball off the bottom paddle', () => {
    const game = createBreakoutGame({
      initialBall: {row: 5, column: 5},
      initialBallVelocity: {row: 5, column: 0},
      initialPaddleColumn: 4,
    });
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.update(300);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 5, 5)).toBe('bonus');
  });

  it('ends when the ball passes below the paddle', () => {
    let gameOver = false;
    const game = createBreakoutGame({
      initialBall: {row: 5, column: 0},
      initialBallVelocity: {row: 6, column: 0},
      initialPaddleColumn: 5,
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});
    game.update(400);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
