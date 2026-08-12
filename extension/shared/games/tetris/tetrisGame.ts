import {createEmptyFrame, type BoardCoordinate, type BoardSize} from '../../core/board';
import type {BoardRenderer, CommitArcadeGame, GameContext, GameInput} from '../../core/gameTypes';

interface TetrisOptions {
  dropStepMs?: number;
  initialPiece?: BoardCoordinate;
  initialSettled?: BoardCoordinate[];
}

const DEFAULT_DROP_STEP_MS = 500;
const PIECE_OFFSETS: readonly BoardCoordinate[] = [
  {row: 0, column: 0},
  {row: 0, column: 1},
  {row: 1, column: 0},
  {row: 1, column: 1},
];

export function createTetrisGame(options: TetrisOptions = {}): CommitArcadeGame {
  let context: GameContext | null = null;
  let size: BoardSize = {rows: 1, columns: 1};
  let piece: BoardCoordinate = {row: 0, column: 0};
  let settled: BoardCoordinate[] = [];
  let elapsedMs = 0;
  let score = 0;
  let stopped = false;

  return {
    id: 'tetris',
    name: 'Mini Tetris',
    description: 'Compact falling blocks on the contribution grid.',
    status: 'playable',
    start(nextContext): void {
      context = nextContext;
      size = nextContext.size;
      settled = options.initialSettled?.map((cell) => ({...cell})) ?? [];
      piece = options.initialPiece !== undefined ? {...options.initialPiece} : spawnPiece();
      elapsedMs = 0;
      score = 0;
      stopped = false;
      if (collides(piece)) {
        stopped = true;
        context?.onGameOver?.();
      }
    },
    update(deltaMs): void {
      if (stopped) {
        return;
      }
      elapsedMs += Math.max(0, deltaMs);
      const stepMs = Math.max(1, options.dropStepMs ?? DEFAULT_DROP_STEP_MS);
      while (elapsedMs >= stepMs && !stopped) {
        elapsedMs -= stepMs;
        stepDown();
      }
    },
    handleInput(input: GameInput): void {
      if (stopped || input.type !== 'down') {
        return;
      }
      if (input.key === 'ArrowLeft' || input.key === 'a' || input.key === 'A') {
        tryMove({row: piece.row, column: piece.column - 1});
      } else if (input.key === 'ArrowRight' || input.key === 'd' || input.key === 'D') {
        tryMove({row: piece.row, column: piece.column + 1});
      } else if (input.key === 'ArrowDown' || input.key === 's' || input.key === 'S') {
        stepDown();
      }
    },
    render(renderer: BoardRenderer): void {
      const frame = createEmptyFrame(size);
      for (const cell of settled) {
        if (isInBounds(cell)) {
          frame[cell.row]![cell.column] = 'obstacle';
        }
      }
      for (const cell of pieceCells(piece)) {
        if (isInBounds(cell)) {
          frame[cell.row]![cell.column] = 'player';
        }
      }
      renderer.render(frame);
    },
    stop(): void {
      stopped = true;
    },
  };

  function stepDown(): void {
    const nextPiece = {row: piece.row + 1, column: piece.column};
    if (collides(nextPiece)) {
      lockPiece();
      return;
    }
    piece = nextPiece;
  }

  function tryMove(nextPiece: BoardCoordinate): void {
    if (!collides(nextPiece)) {
      piece = nextPiece;
    }
  }

  function lockPiece(): void {
    settled.push(...pieceCells(piece));
    score += 1;
    context?.onScore?.(score);
    piece = spawnPiece();
    if (collides(piece)) {
      stopped = true;
      context?.onGameOver?.();
    }
  }

  function spawnPiece(): BoardCoordinate {
    return {row: 0, column: Math.max(0, Math.floor(size.columns / 2) - 1)};
  }

  function collides(origin: BoardCoordinate): boolean {
    return pieceCells(origin).some((cell) => !isInBounds(cell) || settled.some((settledCell) => sameCoordinate(settledCell, cell)));
  }

  function pieceCells(origin: BoardCoordinate): BoardCoordinate[] {
    return PIECE_OFFSETS.map((offset) => ({row: origin.row + offset.row, column: origin.column + offset.column}));
  }

  function isInBounds(coordinate: BoardCoordinate): boolean {
    return coordinate.row >= 0 && coordinate.row < size.rows && coordinate.column >= 0 && coordinate.column < size.columns;
  }
}

function sameCoordinate(first: BoardCoordinate, second: BoardCoordinate): boolean {
  return first.row === second.row && first.column === second.column;
}
