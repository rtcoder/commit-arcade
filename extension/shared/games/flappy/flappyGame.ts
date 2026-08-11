import { createEmptyFrame, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext } from '../../core/gameTypes';

interface FlappyOptions {
  gapSize?: number;
  gapStart?: number;
  initialBarrierColumn?: number;
}

export function createFlappyGame(options: FlappyOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let playerRow = 0;
  let velocity = 0;
  let barrierColumn = 0;
  let scored = false;
  let stopped = false;

  return {
    id: 'flappy',
    name: 'Flappy Commit',
    description: 'Flap through scrolling commit barriers.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerRow = Math.floor(size.rows / 2);
      velocity = 0;
      barrierColumn = options.initialBarrierColumn ?? size.columns - 1;
      scored = false;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      velocity += deltaMs / 300;
      playerRow = clamp(Math.round(playerRow + velocity), 0, size.rows - 1);
      const shift = Math.max(1, Math.floor(deltaMs / 500));
      barrierColumn -= shift;
      if (!scored && barrierColumn < 1) {
        scored = true;
        context?.onScore?.(1);
      }
      if (barrierColumn === 1 && !isInGap(playerRow)) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    handleInput(input): void {
      if (input.type === 'down' && (input.key === 'ArrowUp' || input.key === ' ' || input.key === 'Space')) {
        velocity = -1;
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      frame[playerRow]![1] = 'player';
      if (barrierColumn >= 0 && barrierColumn < size.columns) {
        for (let row = 0; row < size.rows; row += 1) {
          if (!isInGap(row)) {
            frame[row]![barrierColumn] = 'obstacle';
          }
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function isInGap(row: number): boolean {
    const gapStart = options.gapStart ?? 1;
    const gapSize = options.gapSize ?? 2;
    return row >= gapStart && row < gapStart + gapSize;
  }
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
