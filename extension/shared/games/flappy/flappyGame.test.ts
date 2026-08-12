import {describe, expect, it} from 'vitest';
import {createTestRenderer} from '../../test/testRenderer';

import {createFlappyGame} from './flappyGame';

describe('createFlappyGame', () => {
  it('flaps upward and scores after passing a barrier', () => {
    let score = 0;
    const game = createFlappyGame({initialBarrierColumn: 4, gapStart: 0, gapSize: 7, seed: 1});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 12}, onScore: (nextScore) => (score = nextScore)});
    game.handleInput({key: 'Space', type: 'down'});
    game.update(120);
    game.render(renderer);

    expect(rowWithState(renderer.lastFrame, 'player')).toBeLessThan(3);

    for (let tick = 0; tick < 12; tick += 1) {
      game.update(100);
    }

    expect(score).toBe(1);
  });

  it('generates deterministic reachable gaps on seven-row boards', () => {
    const first = createFlappyGame({seed: 5});
    const second = createFlappyGame({seed: 5});
    const different = createFlappyGame({seed: 6});
    const firstRenderer = createTestRenderer();
    const secondRenderer = createTestRenderer();
    const differentRenderer = createTestRenderer();

    for (const game of [first, second, different]) {
      game.start({size: {rows: 7, columns: 18}});
      for (let tick = 0; tick < 28; tick += 1) {
        game.update(100);
      }
    }
    first.render(firstRenderer);
    second.render(secondRenderer);
    different.render(differentRenderer);

    expect(firstRenderer.lastFrame).toEqual(secondRenderer.lastFrame);
    expect(firstRenderer.lastFrame).not.toEqual(differentRenderer.lastFrame);
    expect(gapRowsByBarrier(firstRenderer.lastFrame).every((gapRows) => gapRows.length >= 2)).toBe(true);
  });

  it('increments score exactly once per passed barrier and respawns the next barrier', () => {
    const scores: number[] = [];
    const game = createFlappyGame({gapStart: 1, gapSize: 6, initialBarrierColumn: 3, seed: 2});
    const renderer = createTestRenderer();

    game.start({size: {rows: 7, columns: 14}, onScore: (score) => scores.push(score)});
    for (let tick = 0; tick < 16; tick += 1) {
      game.update(100);
    }
    game.render(renderer);

    expect(scores).toEqual([1]);
    expect(columnsWithState(renderer.lastFrame, 'obstacle').some((column) => column > 3)).toBe(true);
  });

  it('ends the game when the player reaches a barrier outside the gap', () => {
    let gameOver = false;
    const game = createFlappyGame({gapStart: 0, gapSize: 2, initialBarrierColumn: 1, seed: 3});

    game.start({size: {rows: 7, columns: 10}, onGameOver: () => (gameOver = true)});
    game.update(100);

    expect(gameOver).toBe(true);
  });
});

function rowWithState(frame: ReturnType<typeof createTestRenderer>['lastFrame'], state: string): number {
  if (frame === null) {
    return -1;
  }
  return frame.findIndex((row) => row.includes(state as never));
}

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

function gapRowsByBarrier(frame: ReturnType<typeof createTestRenderer>['lastFrame']): number[][] {
  if (frame === null) {
    return [];
  }
  return columnsWithState(frame, 'obstacle').map((column) =>
    frame.flatMap((row, index) => (row[column] === 'obstacle' ? [] : [index])),
  );
}
