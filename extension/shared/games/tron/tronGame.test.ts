import { describe, expect, it } from 'vitest';

import { createTronGame } from './tronGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createTronGame', () => {
  it('renders the cycle and its starting trail', () => {
    const game = createTronGame({ initialPlayer: { row: 3, column: 4 } });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 3, 4)).toBe('player');
  });

  it('turns and advances one cell per step', () => {
    const game = createTronGame({ initialPlayer: { row: 3, column: 4 }, stepMs: 100 });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.handleInput({ key: 'ArrowUp', type: 'down' });
    game.update(100);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 4)).toBe('player');
    expect(cellAt(renderer.lastFrame, 3, 4)).toBe('trail');
  });

  it('reports score as the trail grows', () => {
    const scores: number[] = [];
    const game = createTronGame({ initialPlayer: { row: 3, column: 4 }, stepMs: 100 });

    game.start({ size: { rows: 7, columns: 12 }, onScore: (score) => scores.push(score) });
    game.update(100);
    game.update(100);

    expect(scores).toEqual([1, 2]);
  });

  it('ends when the cycle hits its own trail', () => {
    let gameOver = false;
    const game = createTronGame({
      initialDirection: { row: 0, column: 1 },
      initialPlayer: { row: 3, column: 4 },
      initialTrail: [
        { row: 3, column: 4 },
        { row: 3, column: 5 },
      ],
      stepMs: 100,
    });

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.update(100);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
