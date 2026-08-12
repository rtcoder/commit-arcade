import { describe, expect, it } from 'vitest';

import { createCentipedeGame } from './centipedeGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createCentipedeGame', () => {
  it('renders player and centipede segments on start', () => {
    const game = createCentipedeGame({ initialPlayerColumn: 5, initialSegments: [{ row: 1, column: 4 }] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 5)).toBe('player');
    expect(cellAt(renderer.lastFrame, 1, 4)).toBe('enemy');
  });

  it('moves the player horizontally', () => {
    const game = createCentipedeGame({ initialPlayerColumn: 5, initialSegments: [] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.handleInput({ key: 'ArrowRight', type: 'down' });
    game.update(200);
    game.handleInput({ key: 'ArrowRight', type: 'up' });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 6, 7)).toBe('player');
  });

  it('shoots a segment and reports score', () => {
    const scores: number[] = [];
    const game = createCentipedeGame({
      initialPlayerColumn: 5,
      initialSegments: [{ row: 3, column: 5 }],
      segmentStepMs: 1000,
    });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 }, onScore: (score) => scores.push(score) });
    game.handleInput({ key: ' ', type: 'down' });
    game.update(300);
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(cellAt(renderer.lastFrame, 3, 5)).not.toBe('enemy');
  });

  it('ends when a segment reaches the player row', () => {
    let gameOver = false;
    const game = createCentipedeGame({
      initialDirection: 1,
      initialSegments: [{ row: 5, column: 11 }],
      segmentStepMs: 1,
    });

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.update(20);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
