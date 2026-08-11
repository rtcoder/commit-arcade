import { describe, expect, it } from 'vitest';

import { createFlappyGame } from './flappyGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createFlappyGame', () => {
  it('flaps upward and scores after passing a barrier', () => {
    let score = 0;
    const game = createFlappyGame({ initialBarrierColumn: 2, gapStart: 0, gapSize: 2 });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 4, columns: 6 }, onScore: (nextScore) => (score = nextScore) });
    game.handleInput({ key: 'Space', type: 'down' });
    game.update(120);
    game.render(renderer);

    expect(renderer.lastFrame?.flat()).toContain('player');

    game.update(1000);

    expect(score).toBe(1);
  });
});
