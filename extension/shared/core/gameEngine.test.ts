import { describe, expect, it } from 'vitest';

import { createGameEngine } from './gameEngine';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from './gameTypes';

describe('createGameEngine', () => {
  it('starts a game, renders through the renderer, and cleans up after game errors', () => {
    const calls: string[] = [];
    const renderer: BoardRenderer = {
      clear: () => calls.push('clear'),
      render: () => calls.push('render'),
    };
    const game: CommitArcadeGame = {
      id: 'test',
      name: 'Test',
      description: 'Test game',
      status: 'playable',
      start: (_context: GameContext) => calls.push('start'),
      update: () => {
        throw new Error('boom');
      },
      handleInput: (_input: GameInput) => calls.push('input'),
      render: (target) => {
        target.render([['player']]);
      },
      stop: () => calls.push('stop'),
    };
    const engine = createGameEngine({
      renderer,
      size: { rows: 1, columns: 1 },
      onError: (error) => calls.push(error.message),
    });

    engine.start(game);
    engine.tick(16);

    expect(calls).toEqual(['start', 'boom', 'stop', 'clear']);
    expect(engine.isRunning()).toBe(false);
  });
});
