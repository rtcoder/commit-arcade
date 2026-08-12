import {type BoardSize, createEmptyFrame} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface RhythmNote {
  lane: number;
  row: number;
}

interface RhythmOptions {
  initialNotes?: RhythmNote[];
  noteSpeedRowsPerSecond?: number;
  seed?: number;
  spawnMs?: number;
}

const LANE_COUNT = 4;
const DEFAULT_NOTE_SPEED_ROWS_PER_SECOND = 3;
const DEFAULT_SPAWN_MS = 800;

export function createRhythmGame(options: RhythmOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let notes: RhythmNote[] = [];
  let spawnElapsedMs = 0;
  let randomState = normalizeSeed(options.seed ?? 1);
  let score = 0;
  let stopped = false;

  return {
    id: 'rhythm',
    name: 'Commit Beat',
    description: 'A minimal lane rhythm game for commit timelines.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      notes = options.initialNotes?.map((note) => ({...note})) ?? [{lane: 0, row: 0}];
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
      const travel = (noteSpeed() * safeDeltaMs) / 1000;
      notes = notes.map((note) => ({...note, row: note.row + travel}));
      if (notes.some((note) => note.row > hitRow() + 0.5)) {
        stopped = true;
        context?.onGameOver?.();
        return;
      }
      spawnElapsedMs += safeDeltaMs;
      const spawnMs = Math.max(1, options.spawnMs ?? DEFAULT_SPAWN_MS);
      while (spawnElapsedMs >= spawnMs) {
        spawnElapsedMs -= spawnMs;
        notes.push({lane: nextRandomInt() % LANE_COUNT, row: 0});
      }
    },
    handleInput(input: GameInput): void {
      if (stopped || input.type !== 'down') {
        return;
      }
      const lane = laneForKey(input.key);
      if (lane === null) {
        return;
      }
      const hitIndex = notes.findIndex((note) => note.lane === lane && Math.abs(note.row - hitRow()) <= 0.5);
      if (hitIndex >= 0) {
        notes.splice(hitIndex, 1);
        score += 1;
        context?.onScore?.(score);
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (let lane = 0; lane < LANE_COUNT; lane += 1) {
        frame[hitRow()]![laneColumn(lane)] = 'player';
      }
      for (const note of notes) {
        const row = Math.round(note.row);
        if (row >= 0 && row < size.rows) {
          frame[row]![laneColumn(note.lane)] = 'bonus';
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function hitRow(): number {
    return Math.max(0, size.rows - 1);
  }

  function laneColumn(lane: number): number {
    const usableWidth = Math.max(1, size.columns - 1);
    return Math.min(size.columns - 1, 1 + Math.floor((clamp(lane, 0, LANE_COUNT - 1) * usableWidth) / LANE_COUNT));
  }

  function noteSpeed(): number {
    return options.noteSpeedRowsPerSecond ?? DEFAULT_NOTE_SPEED_ROWS_PER_SECOND;
  }

  function nextRandomInt(): number {
    randomState = (randomState * 1664525 + 1013904223) >>> 0;
    return randomState;
  }
}

function laneForKey(key: string): number | null {
  switch (key) {
    case 'a':
    case 'A':
    case 'ArrowLeft':
      return 0;
    case 's':
    case 'S':
    case 'ArrowDown':
      return 1;
    case 'd':
    case 'D':
    case 'ArrowUp':
      return 2;
    case 'f':
    case 'F':
    case 'ArrowRight':
      return 3;
    default:
      return null;
  }
}

function normalizeSeed(seed: number): number {
  return Number.isInteger(seed) ? seed >>> 0 : 1;
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}
