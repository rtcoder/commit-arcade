import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createPongGame} from './pongGame';

describe('createPongGame', () => {
  it('renders player paddle, ai paddle and ball on start', () => {
    const game = createPongGame({initialBall: {row: 3, column: 6}, initialPlayerRow: 2, initialAiRow: 2});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 0)).toBe('player');
    expect(cellAt(renderer.lastFrame, 3, 0)).toBe('player');
    expect(cellAt(renderer.lastFrame, 4, 0)).toBe('player');
    expect(cellAt(renderer.lastFrame, 3, 6)).toBe('bonus');
    expect(cellAt(renderer.lastFrame, 3, 11)).toBe('enemy');
  });

  it('moves the player paddle with arrow keys', () => {
    const game = createPongGame({initialPlayerRow: 3});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowUp', type: 'down'});
    game.update(160);
    game.handleInput({key: 'ArrowUp', type: 'up'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 0)).toBe('player');
    expect(cellAt(renderer.lastFrame, 5, 0)).toBe('empty');
  });

  it('bounces the ball off the player paddle', () => {
    const game = createPongGame({
      initialBall: {row: 3, column: 1},
      initialBallVelocity: {row: 0, column: -6},
      initialPlayerRow: 2,
    });
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.update(200);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 3, 1)).toBe('bonus');
  });

  it('ends when the ball passes the player paddle', () => {
    let gameOver = false;
    const game = createPongGame({
      initialBall: {row: 0, column: 1},
      initialBallVelocity: {row: 0, column: -8},
      initialPlayerRow: 3,
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});
    game.update(400);

    expect(gameOver).toBe(true);
  });

  it('scores when the ball passes the ai paddle', () => {
    const scores: number[] = [];
    const game = createPongGame({
      initialBall: {row: 0, column: 10},
      initialBallVelocity: {row: 0, column: 8},
      initialAiRow: 3,
    });

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.update(400);

    expect(scores).toEqual([1]);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
