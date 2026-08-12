import { createEmptyFrame, type BoardCoordinate, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface MissileCommandOptions {
  initialCannonColumn?: number;
  initialMissiles?: BoardCoordinate[];
  missileSpeedRowsPerSecond?: number;
  projectileSpeedRowsPerSecond?: number;
  seed?: number;
  spawnMs?: number;
}

const CANNON_SPEED_COLUMNS_PER_SECOND = 10;
const DEFAULT_MISSILE_SPEED_ROWS_PER_SECOND = 2;
const DEFAULT_PROJECTILE_SPEED_ROWS_PER_SECOND = 10;
const DEFAULT_SPAWN_MS = 900;

export function createMissileCommandGame(options: MissileCommandOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let cannonColumn = 0;
  let cannonDirection = 0;
  let missiles: BoardCoordinate[] = [];
  let projectile: BoardCoordinate | null = null;
  let previousProjectileRow: number | null = null;
  let spawnElapsedMs = 0;
  let randomState = normalizeSeed(options.seed ?? 1);
  let score = 0;
  let stopped = false;

  return {
    id: 'missile-command',
    name: 'Missile Command',
    description: 'Defend the contribution base from falling missiles.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      cannonColumn = options.initialCannonColumn ?? Math.floor(size.columns / 2);
      cannonDirection = 0;
      missiles = options.initialMissiles?.map((missile) => ({ ...missile })) ?? [{ row: 0, column: Math.floor(size.columns / 2) }];
      projectile = null;
      previousProjectileRow = null;
      spawnElapsedMs = 0;
      randomState = normalizeSeed(options.seed ?? 1);
      score = 0;
      stopped = false;
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const safeDeltaMs = Math.max(0, deltaMs);
      cannonColumn = clamp(cannonColumn + (cannonDirection * CANNON_SPEED_COLUMNS_PER_SECOND * safeDeltaMs) / 1000, 0, size.columns - 1);
      updateProjectile(safeDeltaMs);
      missiles = missiles.map((missile) => ({ ...missile, row: missile.row + (missileSpeed() * safeDeltaMs) / 1000 }));
      checkProjectileHits();
      if (missiles.some((missile) => Math.round(missile.row) >= baseRow())) {
        stopped = true;
        context?.onGameOver?.();
        return;
      }
      spawnMissiles(safeDeltaMs);
    },
    handleInput(input: GameInput): void {
      if (input.type === 'up') {
        if (isHorizontalKey(input.key)) {
          cannonDirection = 0;
        }
        return;
      }
      if (input.key === 'ArrowLeft' || input.key === 'a' || input.key === 'A') {
        cannonDirection = -1;
      } else if (input.key === 'ArrowRight' || input.key === 'd' || input.key === 'D') {
        cannonDirection = 1;
      } else if ((input.key === ' ' || input.key === 'Space' || input.key === 'ArrowUp') && projectile === null) {
        projectile = { row: baseRow() - 1, column: Math.round(cannonColumn) };
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const missile of missiles) {
        const row = clamp(Math.round(missile.row), 0, size.rows - 1);
        frame[row]![clamp(Math.round(missile.column), 0, size.columns - 1)] = 'enemy';
      }
      if (projectile !== null && projectile.row >= 0) {
        frame[clamp(Math.round(projectile.row), 0, size.rows - 1)]![clamp(Math.round(projectile.column), 0, size.columns - 1)] = 'projectile';
      }
      frame[baseRow()]![Math.round(cannonColumn)] = 'player';
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
    projectile = { ...projectile, row: projectile.row - (projectileSpeed() * deltaMs) / 1000 };
    if (projectile.row < 0) {
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
    const hitIndex = missiles.findIndex(
      (missile) =>
        Math.round(missile.column) === projectileColumn &&
        Math.round(missile.row) <= previousRow &&
        Math.round(missile.row) >= currentProjectileRow,
    );
    if (hitIndex >= 0) {
      missiles.splice(hitIndex, 1);
      projectile = null;
      previousProjectileRow = null;
      score += 1;
      context?.onScore?.(score);
    }
  }

  function spawnMissiles(deltaMs: number): void {
    if (options.initialMissiles !== undefined) {
      return;
    }
    spawnElapsedMs += deltaMs;
    const spawnMs = Math.max(1, options.spawnMs ?? DEFAULT_SPAWN_MS);
    while (spawnElapsedMs >= spawnMs) {
      spawnElapsedMs -= spawnMs;
      missiles.push({ row: 0, column: nextRandomInt() % size.columns });
    }
  }

  function missileSpeed(): number {
    return options.missileSpeedRowsPerSecond ?? DEFAULT_MISSILE_SPEED_ROWS_PER_SECOND;
  }

  function projectileSpeed(): number {
    return options.projectileSpeedRowsPerSecond ?? DEFAULT_PROJECTILE_SPEED_ROWS_PER_SECOND;
  }

  function baseRow(): number {
    return Math.max(0, size.rows - 1);
  }

  function nextRandomInt(): number {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState;
  }
}

function isHorizontalKey(key: string): boolean {
  return key === 'ArrowLeft' || key === 'ArrowRight' || key === 'a' || key === 'A' || key === 'd' || key === 'D';
}

function normalizeSeed(seed: number): number {
  return Number.isInteger(seed) ? seed >>> 0 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
