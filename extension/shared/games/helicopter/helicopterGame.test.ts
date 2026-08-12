import { describe, expect, it } from 'vitest';

import { createHelicopterGame } from './helicopterGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createHelicopterGame', () => {
  it('renders the helicopter and tunnel walls on start', () => {
    const game = createHelicopterGame({ initialTunnel: [{ column: 6, gapStart: 2 }] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 3, 1)).toBe('player');
    expect(cellAt(renderer.lastFrame, 0, 6)).toBe('obstacle');
    expect(cellAt(renderer.lastFrame, 2, 6)).toBe('empty');
  });

  it('rises while the thrust key is held', () => {
    const game = createHelicopterGame({ initialRow: 4, initialTunnel: [] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.handleInput({ key: ' ', type: 'down' });
    game.update(300);
    game.handleInput({ key: ' ', type: 'up' });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 1)).toBe('player');
  });

  it('reports score as the tunnel scrolls past the player', () => {
    const scores: number[] = [];
    const game = createHelicopterGame({ initialTunnel: [{ column: 2, gapStart: 2 }] });

    game.start({ size: { rows: 7, columns: 12 }, onScore: (score) => scores.push(score) });
    game.update(500);

    expect(scores).toEqual([1]);
  });

  it('ends when the helicopter hits a tunnel wall', () => {
    let gameOver = false;
    const game = createHelicopterGame({ initialRow: 0, initialTunnel: [{ column: 1, gapStart: 2 }] });

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.update(0);

    expect(gameOver).toBe(true);
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
