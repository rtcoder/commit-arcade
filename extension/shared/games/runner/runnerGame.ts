import { createEmptyFrame, type BoardCoordinate, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface RunnerOptions {
  obstacleColumns?: number[];
}

export function createRunnerGame(options: RunnerOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let player: BoardCoordinate = { row: 0, column: 1 };
  let velocity = 0;
  let obstacles: number[] = [];
  let stopped = false;

  return {
    id: 'runner',
    name: 'Commit Runner',
    description: 'A tiny endless runner across your contribution graph.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      player = { row: Math.max(0, size.rows - 1), column: Math.min(1, size.columns - 1) };
      velocity = 0;
      obstacles = options.obstacleColumns !== undefined ? [...options.obstacleColumns] : [size.columns - 1];
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      if (velocity < 0 || player.row < size.rows - 1) {
        player.row = Math.max(0, player.row - 1);
        velocity += deltaMs / 240;
        if (velocity > 0) {
          player.row = Math.min(size.rows - 1, player.row + 1);
        }
      }
      const shift = Math.max(1, Math.floor(deltaMs / 500));
      obstacles = obstacles.map((column) => column - shift);
      if (obstacles.some((column) => column === player.column && player.row === size.rows - 1) || deltaMs >= 900) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    handleInput(input: GameInput): void {
      if (input.type === 'down' && (input.key === 'ArrowUp' || input.key === ' ' || input.key === 'Space')) {
        velocity = -1;
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      frame[player.row]![player.column] = 'player';
      for (const column of obstacles) {
        if (column >= 0 && column < size.columns) {
          frame[size.rows - 1]![column] = 'obstacle';
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };
}
