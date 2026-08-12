import { describe, expect, it } from 'vitest';

import { createMissileCommandGame } from './missileCommandGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createMissileCommandGame', () => {
  it('renders the cannon and falling missiles on start', () => {
    const game = createMissileCommandGame({ initialCannonColumn: 5, initialMissiles: [{ row: 2, column: 6 }] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 2, 6)).toBe('enemy');
  });

  it('moves the cannon horizontally', () => {
    const game = createMissileCommandGame({ initialCannonColumn: 5, initialMissiles: [] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.handleInput({ key: 'ArrowLeft', type: 'down' });
    game.update(200);
    game.handleInput({ key: 'ArrowLeft', type: 'up' });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 3)).toBe('player');
  });

  it('intercepts a missile and reports score', () => {
    const scores: number[] = [];
    const game = createMissileCommandGame({
      initialCannonColumn: 5,
      initialMissiles: [{ row: 3, column: 5 }],
      missileSpeedRowsPerSecond: 0,
    });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 }, onScore: (score) => scores.push(score) });
    game.handleInput({ key: ' ', type: 'down' });
    game.update(300);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 3, 5)).not.toBe('enemy');
  });

  it('ends when a missile reaches the base row', () => {
    let gameOver = false;
    const game = createMissileCommandGame({
      initialMissiles: [{ row: 5, column: 4 }],
      missileSpeedRowsPerSecond: 4,
    });

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.update(300);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
