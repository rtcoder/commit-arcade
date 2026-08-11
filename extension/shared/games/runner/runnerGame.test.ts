import { describe, expect, it } from 'vitest';

import { createRunnerGame } from './runnerGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createRunnerGame', () => {
  it('jumps on ArrowUp and reports game over on obstacle collision', () => {
    let gameOver = false;
    const game = createRunnerGame({ obstacleColumns: [9], seed: 1 });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 7, columns: 12 }, onGameOver: () => (gameOver = true) });
    game.handleInput({ key: 'ArrowUp', type: 'down' });
    game.update(120);
    game.render(renderer);

    expect(renderer.lastFrame?.[5]?.[2]).toBe('player');

    game.update(1600);

    expect(gameOver).toBe(true);
  });

  it('scores survival distance faster as runner speed increases', () => {
    const scores: number[] = [];
    const game = createRunnerGame({ obstacleColumns: [], seed: 4 });

    game.start({ size: { rows: 7, columns: 52 }, onScore: (score) => scores.push(score) });
    game.update(1000);
    const scoreAfterOneSecond = scores.at(-1) ?? 0;
    game.update(5000);

    expect(scoreAfterOneSecond).toBeGreaterThan(0);
    expect(scores.at(-1)).toBeGreaterThan(scoreAfterOneSecond + 20);
  });

  it('uses deterministic seeded obstacle spacing with fair visible gaps', () => {
    const first = createRunnerGame({ seed: 7 });
    const second = createRunnerGame({ seed: 7 });
    const different = createRunnerGame({ seed: 8 });
    const firstRenderer = createTestRenderer();
    const secondRenderer = createTestRenderer();
    const differentRenderer = createTestRenderer();

    for (const game of [first, second, different]) {
      game.start({ size: { rows: 7, columns: 24 } });
      for (let tick = 0; tick < 42; tick += 1) {
        game.update(100);
      }
    }
    first.render(firstRenderer);
    second.render(secondRenderer);
    different.render(differentRenderer);

    expect(firstRenderer.lastFrame).toEqual(secondRenderer.lastFrame);
    expect(firstRenderer.lastFrame).not.toEqual(differentRenderer.lastFrame);

    const obstacleColumns = columnsWithState(firstRenderer.lastFrame, 'obstacle');
    const gaps = obstacleColumns.slice(1).map((column, index) => column - obstacleColumns[index]!);

    expect(Math.min(...gaps)).toBeGreaterThanOrEqual(4);
  });
});

function columnsWithState(frame: ReturnType<typeof createTestRenderer>['lastFrame'], state: string): number[] {
  if (frame === null) {
    return [];
  }
  const columns = new Set<number>();
  frame.forEach((row) => {
    row.forEach((cell, column) => {
      if (cell === state) {
        columns.add(column);
      }
    });
  });
  return [...columns].sort((a, b) => a - b);
}
