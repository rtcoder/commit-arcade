import {describe, expect, it} from 'vitest';

import {gameRegistry} from './gameRegistry';

describe('gameRegistry', () => {
  it('marks the shipped games as playable and the remaining games as planned', () => {
    const playable = gameRegistry.filter((game) => game.status === 'playable').map((game) => game.id);
    const planned = gameRegistry.filter((game) => game.status === 'planned').map((game) => game.id);

    expect(playable).toEqual([
      'runner',
      'snake',
      'flappy',
      'pong',
      'breakout',
      'space-invaders',
      'tron',
      'frogger',
      'helicopter',
      'rhythm',
      'missile-command',
      'centipede',
    ]);
    expect(planned).toEqual([]);
  });
});
