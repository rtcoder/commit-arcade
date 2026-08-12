import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createSnakeGame} from './snakeGame';

describe('createSnakeGame', () => {
  it('grows after eating food and ends when hitting a boundary', () => {
    let score = 0;
    let gameOver = false;
    const game = createSnakeGame({initialFood: {row: 1, column: 3}});
    const renderer = createTestRenderer();

    game.start({
      size: {rows: 3, columns: 5},
      onScore: (nextScore) => (score = nextScore),
      onGameOver: () => (gameOver = true),
    });
    game.update(250);
    game.render(renderer);

    expect(score).toBe(1);
    expect(renderer.lastFrame?.flat().filter((state) => state === 'player')).toHaveLength(2);

    game.update(1000);

    expect(gameOver).toBe(true);
  });

  it('buffers one direction change per tick and ignores immediate reverse input', () => {
    const game = createSnakeGame({initialFood: {row: 0, column: 0}});
    const renderer = createTestRenderer();

    game.start({size: {rows: 5, columns: 8}});
    game.handleInput({key: 'ArrowLeft', type: 'down'});
    game.handleInput({key: 's', type: 'down'});
    game.handleInput({key: 'a', type: 'down'});
    game.update(250);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 3, 2)).toBe('player');
    expect(cellAt(renderer.lastFrame, 2, 2)).toBe('empty');
  });

  it('keeps spawned food off the snake after growth', () => {
    const game = createSnakeGame({foodSequence: [{row: 2, column: 3}, {row: 2, column: 2}, {row: 0, column: 0}]});
    const renderer = createTestRenderer();

    game.start({size: {rows: 5, columns: 8}});
    game.update(250);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 2)).toBe('player');
    expect(cellAt(renderer.lastFrame, 0, 0)).toBe('bonus');
  });

  it('spawns food at a random unoccupied coordinate instead of the first free cell', () => {
    const game = createSnakeGame({random: () => 0.75});
    const renderer = createTestRenderer();

    game.start({size: {rows: 3, columns: 5}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 0, 0)).toBe('empty');
    expect(cellAt(renderer.lastFrame, 2, 1)).toBe('bonus');
    expect(cellAt(renderer.lastFrame, 1, 2)).toBe('player');
  });

  it('ends when the snake collides with itself', () => {
    let gameOver = false;
    const game = createSnakeGame({
      initialSnake: [
        {row: 2, column: 2},
        {row: 3, column: 2},
        {row: 3, column: 3},
        {row: 2, column: 3},
      ],
      initialDirection: {row: -1, column: 0},
      initialFood: {row: 0, column: 0},
    });

    game.start({size: {rows: 5, columns: 8}, onGameOver: () => (gameOver = true)});
    game.handleInput({key: 'ArrowRight', type: 'down'});
    game.handleInput({key: 'ArrowDown', type: 'down'});
    game.update(250);
    game.update(250);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
