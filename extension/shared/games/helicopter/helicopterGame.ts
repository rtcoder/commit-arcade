import { createEmptyFrame, type BoardSize } from '../../core/board';
import type { BoardRenderer, CommitArcadeGame, GameContext, GameInput } from '../../core/gameTypes';

interface TunnelColumn {
  column: number;
  gapStart: number;
  scored?: boolean;
}

interface HelicopterOptions {
  initialRow?: number;
  initialTunnel?: TunnelColumn[];
  seed?: number;
}

const PLAYER_COLUMN = 1;
const GAP_SIZE = 3;
const SCROLL_COLUMNS_PER_SECOND = 4;
const GRAVITY_ROWS_PER_SECOND = 12;
const THRUST_ROWS_PER_SECOND = -18;
const SPAWN_SPACING = 4;

export function createHelicopterGame(options: HelicopterOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = { rows: 1, columns: 1 };
  let playerRow = 0;
  let velocity = 0;
  let thrusting = false;
  let tunnel: TunnelColumn[] = [];
  let randomState = normalizeSeed(options.seed ?? 1);
  let score = 0;
  let stopped = false;

  return {
    id: 'helicopter',
    name: 'Helicopter',
    description: 'One-button flight through a scrolling tunnel.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      playerRow = options.initialRow ?? Math.floor(size.rows / 2);
      velocity = 0;
      thrusting = false;
      randomState = normalizeSeed(options.seed ?? 1);
      tunnel = options.initialTunnel?.map((column) => ({ ...column })) ?? initialTunnel();
      score = 0;
      stopped = false;
      checkCollision();
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      const seconds = Math.max(0, deltaMs) / 1000;
      velocity += (thrusting ? THRUST_ROWS_PER_SECOND : GRAVITY_ROWS_PER_SECOND) * seconds;
      playerRow = clamp(playerRow + velocity * seconds, 0, size.rows - 1);
      tunnel = tunnel.map((column) => ({ ...column, column: column.column - SCROLL_COLUMNS_PER_SECOND * seconds }));
      for (const column of tunnel) {
        if (column.scored !== true && column.column < PLAYER_COLUMN) {
          column.scored = true;
          score += 1;
          context?.onScore?.(score);
        }
      }
      tunnel = tunnel.filter((column) => column.column >= -1);
      spawnTunnel();
      checkCollision();
    },
    handleInput(input: GameInput): void {
      if (input.key === ' ' || input.key === 'Space' || input.key === 'ArrowUp') {
        thrusting = input.type === 'down';
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const column of tunnel) {
        const renderedColumn = Math.round(column.column);
        if (renderedColumn < 0 || renderedColumn >= size.columns) {
          continue;
        }
        for (let row = 0; row < size.rows; row += 1) {
          if (!isInGap(row, column.gapStart)) {
            frame[row]![renderedColumn] = 'obstacle';
          }
        }
      }
      frame[Math.round(playerRow)]![PLAYER_COLUMN] = 'player';
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function checkCollision(): void {
    const row = Math.round(playerRow);
    const collides = tunnel.some((column) => Math.round(column.column) === PLAYER_COLUMN && !isInGap(row, column.gapStart));
    if (collides) {
      stopped = true;
      context?.onGameOver?.();
    }
  }

  function spawnTunnel(): void {
    const rightmost = tunnel.reduce((max, column) => Math.max(max, column.column), -Infinity);
    if (rightmost <= size.columns - SPAWN_SPACING) {
      tunnel.push({ column: size.columns - 1, gapStart: nextGapStart() });
    }
  }

  function initialTunnel(): TunnelColumn[] {
    const result: TunnelColumn[] = [];
    for (let column = Math.max(3, Math.floor(size.columns / 2)); column < size.columns; column += SPAWN_SPACING) {
      result.push({ column, gapStart: nextGapStart() });
    }
    return result;
  }

  function nextGapStart(): number {
    return nextRandomInt() % Math.max(1, size.rows - GAP_SIZE + 1);
  }

  function isInGap(row: number, gapStart: number): boolean {
    return row >= gapStart && row < gapStart + Math.min(GAP_SIZE, size.rows);
  }

  function nextRandomInt(): number {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState;
  }
}

function normalizeSeed(seed: number): number {
  return Number.isInteger(seed) ? seed >>> 0 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
