import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createFroggerGame} from './froggerGame';

describe('createFroggerGame', () => {
  it('renders the player at the bottom and traffic lanes above', () => {
    const game = createFroggerGame({initialCars: [{row: 3, column: 5, direction: 1}]});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('player');
    expect(cellAt(renderer.lastFrame, 3, 5)).toBe('obstacle');
  });

  it('moves the player one cell per direction input', () => {
    const game = createFroggerGame({initialCars: []});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowUp', type: 'down'});
    game.handleInput({key: 'ArrowLeft', type: 'down'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 5, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('empty');
  });

  it('ends when traffic collides with the player', () => {
    let gameOver = false;
    const game = createFroggerGame({
      initialCars: [{row: 5, column: 4, direction: 1}],
      initialPlayer: {row: 5, column: 5},
      trafficStepMs: 1,
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});
    game.update(5);

    expect(gameOver).toBe(true);
  });

  it('scores and resets the player when reaching the top row', () => {
    const scores: number[] = [];
    const game = createFroggerGame({initialCars: [], initialPlayer: {row: 1, column: 6}});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.handleInput({key: 'ArrowUp', type: 'down'});
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('player');
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
