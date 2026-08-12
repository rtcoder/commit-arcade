import {type BoardCoordinate, type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface SpaceInvadersOptions {
  initialDirection?: -1 | 1;
  initialInvaders?: BoardCoordinate[];
  initialPlayerColumn?: number;
  invaderStepMs?: number;
}

const PLAYER_SPEED_COLUMNS_PER_SECOND = 12;
const PROJECTILE_SPEED_ROWS_PER_SECOND = 10;
const DEFAULT_INVADER_STEP_MS = 450;

export function createSpaceInvadersGame(options: SpaceInvadersOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let playerColumn = 0;
  let playerDirection = 0;
  let projectile: BoardCoordinate | null = null;
  let invaders: BoardCoordinate[] = [];
  let invaderDirection: -1 | 1 = 1;
  let invaderElapsedMs = 0;
  let score = 0;
  let stopped = false;

  return {
    id: 'space-invaders',
    name: 'Space Invaders',
    description: 'A compressed seven-row invader wave.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerColumn = clamp(options.initialPlayerColumn ?? Math.floor(size.columns / 2), 0, size.columns - 1);
      playerDirection = 0;
      projectile = null;
      invaders = options.initialInvaders?.map((invader) => ({...invader})) ?? createInitialInvaders();
      invaderDirection = options.initialDirection ?? 1;
      invaderElapsedMs = 0;
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
      updateInvaders(safeDeltaMs);
      if (invaders.some((invader) => invader.row >= playerRow())) {
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
        projectile = {row: playerRow() - 1, column: Math.round(playerColumn)};
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const invader of invaders) {
        if (isInBounds(invader)) {
          frame[invader.row]![invader.column] = 'enemy';
        }
      }
      if (projectile !== null && isInBounds(projectile)) {
        frame[Math.round(projectile.row)]![Math.round(projectile.column)] = 'projectile';
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
    const previousRow = projectile.row;
    const nextProjectile = {...projectile, row: projectile.row - (PROJECTILE_SPEED_ROWS_PER_SECOND * deltaMs) / 1000};
    projectile = nextProjectile;
    const projectileColumn = Math.round(nextProjectile.column);
    const hitIndex = invaders.findIndex(
      (invader) =>
        invader.column === projectileColumn &&
        invader.row <= Math.round(previousRow) &&
        invader.row >= Math.round(nextProjectile.row),
    );
    if (hitIndex >= 0) {
      invaders.splice(hitIndex, 1);
      projectile = null;
      score += 1;
      context?.onScore?.(score);
      if (invaders.length === 0) {
        invaders = createInitialInvaders();
      }
      return;
    }
    if (projectile.row < 0) {
      projectile = null;
    }
  }

  function updateInvaders(deltaMs: number): void {
    invaderElapsedMs += deltaMs;
    const stepMs = Math.max(1, options.invaderStepMs ?? DEFAULT_INVADER_STEP_MS);
    while (invaderElapsedMs >= stepMs && !stopped) {
      invaderElapsedMs -= stepMs;
      const nextColumns = invaders.map((invader) => invader.column + invaderDirection);
      if (nextColumns.some((column) => column < 0 || column >= size.columns)) {
        invaderDirection = invaderDirection === 1 ? -1 : 1;
        invaders = invaders.map((invader) => ({row: invader.row + 1, column: invader.column}));
      } else {
        invaders = invaders.map((invader) => ({row: invader.row, column: invader.column + invaderDirection}));
      }
    }
  }

  function createInitialInvaders(): BoardCoordinate[] {
    const result: BoardCoordinate[] = [];
    const rows = Math.min(2, Math.max(1, size.rows - 4));
    for (let row = 0; row < rows; row += 1) {
      for (let column = 2; column < size.columns - 2; column += 3) {
        result.push({row, column});
      }
    }
    return result.length > 0 ? result : [{row: 0, column: Math.floor(size.columns / 2)}];
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
