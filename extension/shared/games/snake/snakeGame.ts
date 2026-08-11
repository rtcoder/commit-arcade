import { createEmptyFrame, type BoardCoordinate, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface SnakeOptions {
  initialFood?: BoardCoordinate;
}

export function createSnakeGame(options: SnakeOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let snake: BoardCoordinate[] = [];
  let direction: BoardCoordinate = { row: 0, column: 1 };
  let food: BoardCoordinate = { row: 0, column: 0 };
  let score = 0;
  let stopped = false;
  let accumulatedMs = 0;

  return {
    id: 'snake',
    name: 'Snake',
    description: 'Classic panoramic Snake inside the contribution grid.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      snake = [{ row: Math.floor(size.rows / 2), column: Math.min(2, size.columns - 1) }];
      direction = { row: 0, column: 1 };
      food = options.initialFood ?? { row: snake[0]!.row, column: Math.min(snake[0]!.column + 2, size.columns - 1) };
      score = 0;
      stopped = false;
      accumulatedMs = 0;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      accumulatedMs += deltaMs;
      while (accumulatedMs >= 250 && !stopped) {
        accumulatedMs -= 250;
        step();
      }
    },
    handleInput(input): void {
      if (input.type !== 'down') {
        return;
      }
      const next = directionForKey(input.key);
      if (next !== null && (next.row + direction.row !== 0 || next.column + direction.column !== 0)) {
        direction = next;
      }
    },
    render(renderer): void {
      const frame = createEmptyFrame(size);
      frame[food.row]![food.column] = 'bonus';
      for (const segment of snake) {
        frame[segment.row]![segment.column] = 'player';
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function step(): void {
    const head = snake[0]!;
    const next = { row: head.row + direction.row, column: head.column + direction.column };
    if (isOutOfBounds(next) || snake.some((segment) => segment.row === next.row && segment.column === next.column)) {
      stopped = true;
      context?.onGameOver?.();
      return;
    }
    snake.unshift(next);
    if (next.row === food.row && next.column === food.column) {
      score += 1;
      context?.onScore?.(score);
      food = firstEmptyCell();
    } else {
      snake.pop();
    }
  }

  function firstEmptyCell(): BoardCoordinate {
    for (let row = 0; row < size.rows; row += 1) {
      for (let column = 0; column < size.columns; column += 1) {
        if (!snake.some((segment) => segment.row === row && segment.column === column)) {
          return { row, column };
        }
      }
    }
    return { row: 0, column: 0 };
  }

  function isOutOfBounds(coordinate: BoardCoordinate): boolean {
    return coordinate.row < 0 || coordinate.row >= size.rows || coordinate.column < 0 || coordinate.column >= size.columns;
  }
}

function directionForKey(key: string): BoardCoordinate | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return { row: -1, column: 0 };
    case 'ArrowDown':
    case 's':
    case 'S':
      return { row: 1, column: 0 };
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return { row: 0, column: -1 };
    case 'ArrowRight':
    case 'd':
    case 'D':
      return { row: 0, column: 1 };
    default:
      return null;
  }
}
