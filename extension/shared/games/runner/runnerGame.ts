import { createEmptyFrame, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface RunnerOptions {
  obstacleColumns?: number[];
  seed?: number;
}

const PLAYER_COLUMN = 2;
const INITIAL_SPEED_COLUMNS_PER_SECOND = 4;
const SPEED_ACCELERATION_COLUMNS_PER_SECOND = 0.2;
const GRAVITY_ROWS_PER_SECOND = 30;
const JUMP_VELOCITY_ROWS_PER_SECOND = -12;
const MIN_OBSTACLE_SPACING = 7;
const OBSTACLE_SPACING_RANGE = 6;

export function createRunnerGame(options: RunnerOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let playerColumn = 0;
  let playerRow = 0;
  let velocity = 0;
  let obstacles: number[] = [];
  let speed = INITIAL_SPEED_COLUMNS_PER_SECOND;
  let distance = 0;
  let score = 0;
  let nextSpawnDistance = 0;
  let randomState = normalizeSeed(options.seed ?? 1);
  let stopped = false;

  return {
    id: 'runner',
    name: 'Commit Runner',
    description: 'A tiny endless runner across your contribution graph.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerColumn = Math.min(PLAYER_COLUMN, size.columns - 1);
      playerRow = groundRow();
      velocity = 0;
      obstacles = options.obstacleColumns !== undefined ? [...options.obstacleColumns] : initialObstacleColumns();
      speed = INITIAL_SPEED_COLUMNS_PER_SECOND;
      distance = 0;
      score = 0;
      randomState = normalizeSeed(options.seed ?? 1);
      nextSpawnDistance = nextObstacleSpacing();
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const seconds = Math.max(0, deltaMs) / 1000;
      updatePlayer(seconds);
      const travel = speed * seconds + (SPEED_ACCELERATION_COLUMNS_PER_SECOND * seconds * seconds) / 2;
      speed += SPEED_ACCELERATION_COLUMNS_PER_SECOND * seconds;
      distance += travel;
      obstacles = obstacles.map((column) => column - travel).filter((column) => column >= -1);
      spawnObstacles(travel);
      const nextScore = Math.floor(distance);
      if (nextScore > score) {
        score = nextScore;
        context?.onScore?.(score);
      }
      if (isOnGround() && obstacles.some((column) => Math.round(column) === playerColumn)) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    handleInput(input: GameInput): void {
      if (input.type === 'down' && isJumpKey(input.key) && isOnGround()) {
        velocity = JUMP_VELOCITY_ROWS_PER_SECOND;
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      frame[Math.round(playerRow)]![playerColumn] = 'player';
      for (const column of obstacles) {
        const renderedColumn = Math.round(column);
        if (renderedColumn >= 0 && renderedColumn < size.columns) {
          frame[groundRow()]![renderedColumn] = 'obstacle';
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function updatePlayer(seconds: number): void {
    if (seconds === 0) {
      return;
    }
    playerRow += velocity * seconds + (GRAVITY_ROWS_PER_SECOND * seconds * seconds) / 2;
    velocity += GRAVITY_ROWS_PER_SECOND * seconds;
    if (playerRow >= groundRow()) {
      playerRow = groundRow();
      velocity = 0;
    }
    if (playerRow < 0) {
      playerRow = 0;
      velocity = 0;
    }
  }

  function spawnObstacles(travel: number): void {
    nextSpawnDistance -= travel;
    while (nextSpawnDistance <= 0) {
      obstacles.push(size.columns - 1);
      nextSpawnDistance += nextObstacleSpacing();
    }
  }

  function nextObstacleSpacing(): number {
    return MIN_OBSTACLE_SPACING + (nextRandomInt() % OBSTACLE_SPACING_RANGE);
  }

  function nextRandomInt(): number {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState;
  }

  function groundRow(): number {
    return Math.max(0, size.rows - 1);
  }

  function isOnGround(): boolean {
    return playerRow >= groundRow();
  }

  function initialObstacleColumns(): number[] {
    return size.columns > playerColumn + 1 ? [size.columns - 1] : [];
  }
}

function isJumpKey(key: string): boolean {
  return key === 'ArrowUp' || key === ' ' || key === 'Space';
}

function normalizeSeed(seed: number): number {
  return Number.isInteger(seed) ? seed >>> 0 : 1;
}
