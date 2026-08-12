import {type BoardCoordinate, type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface TronOptions {
  initialDirection?: BoardCoordinate;
  initialPlayer?: BoardCoordinate;
  initialTrail?: BoardCoordinate[];
  stepMs?: number;
}

const DEFAULT_STEP_MS = 160;

export function createTronGame(options: TronOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let player: BoardCoordinate = {row: 0, column: 0};
  let direction: BoardCoordinate = {row: 0, column: 1};
  let queuedDirection: BoardCoordinate | null = null;
  let trail: BoardCoordinate[] = [];
  let elapsedMs = 0;
  let score = 0;
  let stopped = false;

  return {
    id: 'tron',
    name: 'Tron',
    description: 'Light-cycle trails in a narrow contribution arena.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      player = options.initialPlayer !== undefined ? {...options.initialPlayer} : {
        row: Math.floor(size.rows / 2),
        column: 1,
      };
      direction = options.initialDirection ?? {row: 0, column: 1};
      queuedDirection = null;
      trail = options.initialTrail?.map((segment) => ({...segment})) ?? [player];
      elapsedMs = 0;
      score = 0;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      elapsedMs += Math.max(0, deltaMs);
      const stepMs = Math.max(1, options.stepMs ?? DEFAULT_STEP_MS);
      while (elapsedMs >= stepMs && !stopped) {
        elapsedMs -= stepMs;
        step();
      }
    },
    handleInput(input: GameInput): void {
      if (input.type !== 'down') {
        return;
      }
      const next = directionForKey(input.key);
      if (next !== null && !isReverse(next, direction)) {
        queuedDirection = next;
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const segment of trail) {
        if (isInBounds(segment)) {
          frame[segment.row]![segment.column] = 'trail';
        }
      }
      if (isInBounds(player)) {
        frame[player.row]![player.column] = 'player';
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function step(): void {
    if (queuedDirection !== null) {
      direction = queuedDirection;
      queuedDirection = null;
    }
    const next = {row: player.row + direction.row, column: player.column + direction.column};
    if (!isInBounds(next) || trail.some((segment) => sameCoordinate(segment, next))) {
      stopped = true;
      context?.onGameOver?.();
      return;
    }
    trail.push(next);
    player = next;
    score += 1;
    context?.onScore?.(score);
  }

  function isInBounds(coordinate: BoardCoordinate): boolean {
    return coordinate.row >= 0 && coordinate.row < size.rows && coordinate.column >= 0 && coordinate.column < size.columns;
  }
}

function directionForKey(key: string): BoardCoordinate | null {
  switch (key) {
    case 'ArrowUp':
    case 'w':
    case 'W':
      return {row: -1, column: 0};
    case 'ArrowDown':
    case 's':
    case 'S':
      return {row: 1, column: 0};
    case 'ArrowLeft':
    case 'a':
    case 'A':
      return {row: 0, column: -1};
    case 'ArrowRight':
    case 'd':
    case 'D':
      return {row: 0, column: 1};
    default:
      return null;
  }
}

function isReverse(next: BoardCoordinate, current: BoardCoordinate): boolean {
  return next.row + current.row === 0 && next.column + current.column === 0;
}

function sameCoordinate(first: BoardCoordinate, second: BoardCoordinate): boolean {
  return first.row === second.row && first.column === second.column;
}
