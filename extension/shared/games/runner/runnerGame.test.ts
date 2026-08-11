import { describe, expect, it } from 'vitest';

import { createRunnerGame } from './runnerGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createRunnerGame', () => {
  it('jumps on ArrowUp and reports game over on obstacle collision', () => {
    let gameOver = false;
    const game = createRunnerGame({ obstacleColumns: [2] });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 3, columns: 6 }, onGameOver: () => (gameOver = true) });
    game.handleInput({ key: 'ArrowUp', type: 'down' });
    game.update(120);
    game.render(renderer);

    expect(renderer.lastFrame?.[1]?.[1]).toBe('player');

    game.update(1000);

    expect(gameOver).toBe(true);
  });
});
