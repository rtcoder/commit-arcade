import { describe, expect, it } from 'vitest';

import { createSnakeGame } from './snakeGame';
import { createTestRenderer } from '../../test/testRenderer';

describe('createSnakeGame', () => {
  it('grows after eating food and ends when hitting a boundary', () => {
    let score = 0;
    let gameOver = false;
    const game = createSnakeGame({ initialFood: { row: 1, column: 3 } });
    const renderer = createTestRenderer();

    game.start({ size: { rows: 3, columns: 5 }, onScore: (nextScore) => (score = nextScore), onGameOver: () => (gameOver = true) });
    game.update(250);
    game.render(renderer);

    expect(score).toBe(1);
    expect(renderer.lastFrame?.flat().filter((state) => state === 'player')).toHaveLength(2);

    game.update(1000);

    expect(gameOver).toBe(true);
  });
});
