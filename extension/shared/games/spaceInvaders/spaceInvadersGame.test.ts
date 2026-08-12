import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createSpaceInvadersGame} from './spaceInvadersGame';

describe('createSpaceInvadersGame', () => {
  it('renders the player and invader wave on start', () => {
    const game = createSpaceInvadersGame({initialInvaders: [{row: 1, column: 4}], initialPlayerColumn: 6});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('player');
    expect(cellAt(renderer.lastFrame, 1, 4)).toBe('enemy');
  });

  it('moves the player horizontally with arrow keys', () => {
    const game = createSpaceInvadersGame({initialPlayerColumn: 6});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}});
    game.handleInput({key: 'ArrowLeft', type: 'down'});
    game.update(200);
    game.handleInput({key: 'ArrowLeft', type: 'up'});
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 4)).toBe('player');
    expect(cellAt(renderer.lastFrame, 6, 6)).toBe('empty');
  });

  it('fires a projectile that removes an invader and reports score', () => {
    const scores: number[] = [];
    const game = createSpaceInvadersGame({
      initialInvaders: [{row: 3, column: 5}],
      initialPlayerColumn: 5,
      invaderStepMs: 1000,
    });
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (score) => scores.push(score)});
    game.handleInput({key: ' ', type: 'down'});
    game.update(300);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 3, 5)).not.toBe('enemy');
  });

  it('ends when invaders descend into the player row', () => {
    let gameOver = false;
    const game = createSpaceInvadersGame({
      initialInvaders: [{row: 5, column: 11}],
      initialDirection: 1,
      invaderStepMs: 1,
    });

    game.start({size: {rows: 7, columns: 12}, onGameOver: () => (gameOver = true)});
    game.update(20);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
