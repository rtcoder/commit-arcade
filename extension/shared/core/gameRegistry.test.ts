import { describe, expect, it } from 'vitest';

import { gameRegistry } from './gameRegistry';

describe('gameRegistry', () => {
  it('marks the three MVP games as playable and the remaining seven games as planned', () => {
    const playable = gameRegistry.filter((game) => game.status === 'playable').map((game) => game.id);
    const planned = gameRegistry.filter((game) => game.status === 'planned').map((game) => game.id);

    expect(playable).toEqual(['runner', 'snake', 'flappy']);
    expect(planned).toEqual([
      'pong',
      'breakout',
      'space-invaders',
      'tron',
      'frogger',
      'helicopter',
      'rhythm',
    ]);
  });
});
