import { createEmptyFrame, type BoardCoordinate, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface CentipedeOptions {
  initialDirection?: -1 | 1;
  initialPlayerColumn?: number;
  initialSegments?: BoardCoordinate[];
  segmentStepMs?: number;
}

const PLAYER_SPEED_COLUMNS_PER_SECOND = 10;
const PROJECTILE_SPEED_ROWS_PER_SECOND = 10;
const DEFAULT_SEGMENT_STEP_MS = 220;

export function createCentipedeGame(options: CentipedeOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let playerColumn = 0;
  let playerDirection = 0;
  let segments: BoardCoordinate[] = [];
  let segmentDirection: -1 | 1 = 1;
  let stepElapsedMs = 0;
  let projectile: BoardCoordinate | null = null;
  let previousProjectileRow: number | null = null;
  let score = 0;
  let stopped = false;

  return {
    id: 'centipede',
    name: 'Centipede',
    description: 'Shoot a descending segmented bug before it reaches your row.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerColumn = options.initialPlayerColumn ?? Math.floor(size.columns / 2);
      playerDirection = 0;
      segments = options.initialSegments?.map((segment) => ({ ...segment })) ?? initialSegments();
      segmentDirection = options.initialDirection ?? 1;
      stepElapsedMs = 0;
      projectile = null;
      previousProjectileRow = null;
      score = 0;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const safeDeltaMs = Math.max(0, deltaMs);
      playerColumn = clamp(playerColumn + (playerDirection * PLAYER_SPEED_COLUMNS_PER_SECOND * safeDeltaMs) / 1000, 0, size.columns - 1);
      updateProjectile(safeDeltaMs);
      updateSegments(safeDeltaMs);
      if (segments.some((segment) => segment.row >= playerRow())) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    handleInput(input: GameInput): void {
      if (input.type === 'up') {
        if (isHorizontalKey(input.key)) {
          playerDirection = 0;
        }
        return;
      }
      if (input.key === 'ArrowLeft' || input.key === 'a' || input.key === 'A') {
        playerDirection = -1;
      } else if (input.key === 'ArrowRight' || input.key === 'd' || input.key === 'D') {
        playerDirection = 1;
      } else if ((input.key === ' ' || input.key === 'Space' || input.key === 'ArrowUp') && projectile === null) {
        projectile = { row: playerRow() - 1, column: Math.round(playerColumn) };
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const segment of segments) {
        if (isInBounds(segment)) {
          frame[segment.row]![segment.column] = 'enemy';
        }
      }
      if (projectile !== null && projectile.row >= 0) {
        frame[clamp(Math.round(projectile.row), 0, size.rows - 1)]![clamp(Math.round(projectile.column), 0, size.columns - 1)] = 'projectile';
      }
      frame[playerRow()]![Math.round(playerColumn)] = 'player';
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function updateProjectile(deltaMs: number): void {
    if (projectile === null) {
      return;
    }
    previousProjectileRow = projectile.row;
    projectile = { ...projectile, row: projectile.row - (PROJECTILE_SPEED_ROWS_PER_SECOND * deltaMs) / 1000 };
    checkProjectileHits();
    if (projectile !== null && projectile.row < 0) {
      projectile = null;
      previousProjectileRow = null;
    }
  }

  function checkProjectileHits(): void {
    if (projectile === null) {
      return;
    }
    const projectileColumn = Math.round(projectile.column);
    const currentProjectileRow = Math.round(projectile.row);
    const previousRow = Math.round(previousProjectileRow ?? projectile.row);
    const hitIndex = segments.findIndex(
      (segment) => segment.column === projectileColumn && segment.row <= previousRow && segment.row >= currentProjectileRow,
    );
    if (hitIndex >= 0) {
      segments.splice(hitIndex, 1);
      projectile = null;
      previousProjectileRow = null;
      score += 1;
      context?.onScore?.(score);
      if (segments.length === 0) {
        segments = initialSegments();
      }
    }
  }

  function updateSegments(deltaMs: number): void {
    stepElapsedMs += deltaMs;
    const stepMs = Math.max(1, options.segmentStepMs ?? DEFAULT_SEGMENT_STEP_MS);
    while (stepElapsedMs >= stepMs && !stopped) {
      stepElapsedMs -= stepMs;
      const nextColumns = segments.map((segment) => segment.column + segmentDirection);
      if (nextColumns.some((column) => column < 0 || column >= size.columns)) {
        segmentDirection = segmentDirection === 1 ? -1 : 1;
        segments = segments.map((segment) => ({ row: segment.row + 1, column: segment.column }));
      } else {
        segments = segments.map((segment) => ({ row: segment.row, column: segment.column + segmentDirection }));
      }
    }
  }

  function initialSegments(): BoardCoordinate[] {
    const length = Math.min(8, Math.max(1, size.columns - 4));
    return Array.from({ length }, (_, index) => ({ row: 0, column: index + 2 }));
  }

  function playerRow(): number {
    return Math.max(0, size.rows - 1);
  }

  function isInBounds(coordinate: BoardCoordinate): boolean {
    return coordinate.row >= 0 && coordinate.row < size.rows && coordinate.column >= 0 && coordinate.column < size.columns;
  }
}

function isHorizontalKey(key: string): boolean {
  return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'A' || key === 'd' || key === 'D';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
