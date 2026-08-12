import { describe, expect, it } from 'vitest';

import { createRhythmGame } from './rhythmGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createRhythmGame', () => {
  it('renders falling notes and the hit row', () => {
    const game = createRhythmGame({ initialNotes: [{ lane: 1, row: 2 }] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 3)).toBe('bonus');
    expect(cellAt(renderer.lastFrame, 6, 3)).toBe('player');
  });

  it('scores when the matching lane is hit on the hit row', () => {
    const scores: number[] = [];
    const game = createRhythmGame({ initialNotes: [{ lane: 2, row: 6 }] });

    game.start({ size: { rows: 7, columns: 12 }, onScore: (score) => scores.push(score) });
    game.handleInput({ key: 'd', type: 'down' });

    expect(scores).toEqual([1]);
  });

  it('ends when a note passes the hit row', () => {
    let gameOver = false;
    const game = createRhythmGame({ initialNotes: [{ lane: 0, row: 6 }], noteSpeedRowsPerSecond: 4 });

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.update(400);

    expect(gameOver).toBe(true);
  });

  it('moves notes downward over time', () => {
    const game = createRhythmGame({ initialNotes: [{ lane: 3, row: 1 }], noteSpeedRowsPerSecond: 4 });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 } });
    game.update(250);
    game.render(renderer);

    expect(cellAt(renderer.lastFrame, 2, 9)).toBe('bonus');
  });
});

function cellAt(frame: ReturnType<typeof createTestRenderer>['lastFrame'], row: number, column: number): string | undefined {
  return frame?.[row]?.[column];
}
