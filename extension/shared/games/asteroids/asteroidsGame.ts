import {createEmptyFrame, type BoardSize} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface Asteroid {
  drift: number;
  row: number;
  column: number;
}

interface AsteroidsOptions {
  asteroidSpeedRowsPerSecond?: number;
  initialAsteroids?: Asteroid[];
  initialShipColumn?: number;
  projectileSpeedRowsPerSecond?: number;
  seed?: number;
  spawnMs?: number;
}

const SHIP_SPEED_COLUMNS_PER_SECOND = 10;
const DEFAULT_ASTEROID_SPEED_ROWS_PER_SECOND = 2.4;
const DEFAULT_PROJECTILE_SPEED_ROWS_PER_SECOND = 10;
const DEFAULT_SPAWN_MS = 700;

export function createAsteroidsGame(options: AsteroidsOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let shipColumn = 0;
  let shipDirection = 0;
  let asteroids: Asteroid[] = [];
  let projectile: {row: number; column: number} | null = null;
  let previousProjectileRow: number | null = null;
  let spawnElapsedMs = 0;
  let randomState = normalizeSeed(options.seed ?? 1);
  let score = 0;
  let stopped = false;

  return {
    id: 'asteroids',
    name: 'Asteroids',
    description: 'Dodge and shoot drifting asteroids on the contribution grid.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      shipColumn = options.initialShipColumn ?? Math.floor(size.columns / 2);
      shipDirection = 0;
      asteroids = options.initialAsteroids?.map((asteroid) => ({...asteroid})) ?? [nextAsteroid()];
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
      shipColumn = clamp(shipColumn + (shipDirection * SHIP_SPEED_COLUMNS_PER_SECOND * safeDeltaMs) / 1000, 0, size.columns - 1);
      updateProjectile(safeDeltaMs);
      asteroids = asteroids.map((asteroid) => ({
        ...asteroid,
        column: asteroid.column + (asteroid.drift * safeDeltaMs) / 1000,
        row: asteroid.row + (asteroidSpeed() * safeDeltaMs) / 1000,
      }));
      bounceAsteroids();
      checkProjectileHits();
      if (asteroids.some((asteroid) => Math.round(asteroid.row) >= shipRow())) {
        stopped = true;
        context?.onGameOver?.();
        return;
      }
      spawnAsteroids(safeDeltaMs);
    },
    handleInput(input: GameInput): void {
      if (input.type === 'up') {
        if (isHorizontalKey(input.key)) {
          shipDirection = 0;
        }
        return;
      }
      if (input.key === 'ArrowLeft' || input.key === 'a' || input.key === 'A') {
        shipDirection = -1;
      } else if (input.key === 'ArrowRight' || input.key === 'd' || input.key === 'D') {
        shipDirection = 1;
      } else if ((input.key === ' ' || input.key === 'Space' || input.key === 'ArrowUp') && projectile === null) {
        projectile = {row: shipRow() - 1, column: Math.round(shipColumn)};
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const asteroid of asteroids) {
        const row = clamp(Math.round(asteroid.row), 0, size.rows - 1);
        const column = clamp(Math.round(asteroid.column), 0, size.columns - 1);
        frame[row]![column] = 'enemy';
      }
      if (projectile !== null && projectile.row >= 0) {
        frame[clamp(Math.round(projectile.row), 0, size.rows - 1)]![clamp(Math.round(projectile.column), 0, size.columns - 1)] = 'projectile';
      }
      frame[shipRow()]![Math.round(shipColumn)] = 'player';
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
    projectile = {...projectile, row: projectile.row - (projectileSpeed() * deltaMs) / 1000};
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
    const hitIndex = asteroids.findIndex(
      (asteroid) =>
        Math.round(asteroid.column) === projectileColumn &&
        Math.round(asteroid.row) <= previousRow &&
        Math.round(asteroid.row) >= currentProjectileRow,
    );
    if (hitIndex >= 0) {
      asteroids.splice(hitIndex, 1);
      projectile = null;
      previousProjectileRow = null;
      score += 1;
      context?.onScore?.(score);
    }
  }

  function bounceAsteroids(): void {
    asteroids = asteroids.map((asteroid) => {
      if (asteroid.column < 0) {
        return {...asteroid, column: 0, drift: Math.abs(asteroid.drift)};
      }
      if (asteroid.column > size.columns - 1) {
        return {...asteroid, column: size.columns - 1, drift: -Math.abs(asteroid.drift)};
      }
      return asteroid;
    });
  }

  function spawnAsteroids(deltaMs: number): void {
    if (options.initialAsteroids !== undefined) {
      return;
    }
    spawnElapsedMs += deltaMs;
    const spawnMs = Math.max(1, options.spawnMs ?? DEFAULT_SPAWN_MS);
    while (spawnElapsedMs >= spawnMs) {
      spawnElapsedMs -= spawnMs;
      asteroids.push(nextAsteroid());
    }
  }

  function nextAsteroid(): Asteroid {
    const drift = (nextRandomInt() % 3) - 1;
    return {row: 0, column: nextRandomInt() % size.columns, drift};
  }

  function asteroidSpeed(): number {
    return options.asteroidSpeedRowsPerSecond ?? DEFAULT_ASTEROID_SPEED_ROWS_PER_SECOND;
  }

  function projectileSpeed(): number {
    return options.projectileSpeedRowsPerSecond ?? DEFAULT_PROJECTILE_SPEED_ROWS_PER_SECOND;
  }

  function shipRow(): number {
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
