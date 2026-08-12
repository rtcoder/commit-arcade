import {describe, expect, it} from 'vitest';

import {createAsteroidsGame} from './asteroidsGame';
import {createTestRenderer} from '../../test/testRenderer';

describe('createAsteroidsGame', () => {
  it('renders the ship and asteroids on start', () => {
    const game = createAsteroidsGame({initialAsteroids: [{row: 2, column: 6, drift: 0}], initialShipColumn: 5});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 2, 6)).toBe('enemy');
  });

  it('moves the ship horizontally', () => {
    const game = createAsteroidsGame({initialAsteroids: [], initialShipColumn: 5});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowRight', type: 'down'});
    game.update(200);
    game.handleInput({key: 'ArrowRight', type: 'up'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 7)).toBe('player');
  });

  it('shoots an asteroid and reports score', () => {
    const scores: number[] = [];
    const game = createAsteroidsGame({
      asteroidSpeedRowsPerSecond: 0,
      initialAsteroids: [{row: 3, column: 5, drift: 0}],
      initialShipColumn: 5,
    });
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.handleInput({key: ' ', type: 'down'});
    game.update(300);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 3, 5)).not.toBe('enemy');
  });

  it('ends when an asteroid reaches the ship row', () => {
    let gameOver = false;
    const game = createAsteroidsGame({
      asteroidSpeedRowsPerSecond: 4,
      initialAsteroids: [{row: 5, column: 4, drift: 0}],
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});
    game.update(300);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
