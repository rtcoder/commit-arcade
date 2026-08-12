import {type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext} from '../../core/gameTypes';

interface FlappyOptions {
  gapSize?: number;
  gapStart?: number;
  initialBarrierColumn?: number;
  seed?: number;
}

interface Barrier {
  column: number;
  gapStart: number;
  scored: boolean;
}

const PLAYER_COLUMN = 1;
const BARRIER_SPEED_COLUMNS_PER_SECOND = 2.6;
const GRAVITY_ROWS_PER_SECOND = 10;
const FLAP_VELOCITY_ROWS_PER_SECOND = -5;
const BARRIER_SPACING = 8;

export function createFlappyGame(options: FlappyOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let playerRow = 0;
  let velocity = 0;
  let barriers: Barrier[] = [];
  let score = 0;
  let randomState = normalizeSeed(options.seed ?? 1);
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
      score = 0;
      randomState = normalizeSeed(options.seed ?? 1);
      barriers = [createBarrier(options.initialBarrierColumn ?? size.columns - 1)];
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const seconds = Math.max(0, deltaMs) / 1000;
      playerRow = clamp(playerRow + velocity * seconds, 0, size.rows - 1);
      velocity += GRAVITY_ROWS_PER_SECOND * seconds;
      barriers = barriers.map((barrier) => ({
        ...barrier,
        column: barrier.column - BARRIER_SPEED_COLUMNS_PER_SECOND * seconds,
      }));
      for (const barrier of barriers) {
        if (!barrier.scored && barrier.column < PLAYER_COLUMN) {
          barrier.scored = true;
          score += 1;
          context?.onScore?.(score);
        }
      }
      barriers = barriers.filter((barrier) => barrier.column >= -1);
      spawnBarrierIfNeeded();
      if (barriers.some((barrier) => Math.round(barrier.column) === PLAYER_COLUMN && !isInGap(Math.round(playerRow), barrier))) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    handleInput(input): void {
      if (input.type === 'down' && (input.key === 'ArrowUp' || input.key === ' ' || input.key === 'Space')) {
        velocity = FLAP_VELOCITY_ROWS_PER_SECOND;
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      frame[Math.round(playerRow)]![PLAYER_COLUMN] = 'player';
      for (const barrier of barriers) {
        const renderedColumn = Math.round(barrier.column);
        if (renderedColumn < 0 || renderedColumn >= size.columns) {
          continue;
        }
        for (let row = 0; row < size.rows; row += 1) {
          if (!isInGap(row, barrier)) {
            frame[row]![renderedColumn] = 'obstacle';
          }
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function spawnBarrierIfNeeded(): void {
    const rightmostColumn = barriers.reduce((rightmost, barrier) => Math.max(rightmost, barrier.column), -Infinity);
    if (rightmostColumn <= size.columns - BARRIER_SPACING) {
      barriers.push(createBarrier(size.columns - 1));
    }
  }

  function createBarrier(column: number): Barrier {
    return {
      column,
      gapStart: options.gapStart ?? nextGapStart(),
      scored: false,
    };
  }

  function nextGapStart(): number {
    return nextRandomInt() % maxGapStart();
  }

  function maxGapStart(): number {
    return Math.max(1, size.rows - gapSize() + 1);
  }

  function gapSize(): number {
    return clamp(options.gapSize ?? Math.max(2, Math.min(3, size.rows - 2)), 1, size.rows);
  }

  function isInGap(row: number, barrier: Barrier): boolean {
    const gapStart = clamp(barrier.gapStart, 0, Math.max(0, size.rows - gapSize()));
    const gapSizeValue = gapSize();
    return row >= gapStart && row < gapStart + gapSizeValue;
  }

  function nextRandomInt(): number {
    randomState ^= randomState << 13;
    randomState >>>= 0;
    randomState ^= randomState >>> 17;
    randomState >>>= 0;
    randomState ^= randomState << 5;
    randomState >>>= 0;
    return randomState;
  }
}

function normalizeSeed(seed: number): number {
  return Number.isInteger(seed) ? seed >>> 0 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
