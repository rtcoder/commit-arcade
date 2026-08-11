export interface BoardSize {
  rows: number;
  columns: number;
}

export interface BoardCoordinate {
  row: number;
  column: number;
}

export type PixelState =
  | 'empty'
  | 'player'
  | 'enemy'
  | 'obstacle'
  | 'projectile'
  | 'bonus'
  | 'trail'
  | 'accent';

export type BoardFrame = PixelState[][];

export function createEmptyFrame(size: BoardSize): BoardFrame {
  validateBoardSize(size);
  return Array.from({ length: size.rows }, () => Array.from({ length: size.columns }, () => 'empty'));
}

export function getCellIndex(size: BoardSize, coordinate: BoardCoordinate): number {
  validateBoardSize(size);
  if (
    coordinate.row < 0 ||
    coordinate.row >= size.rows ||
    coordinate.column < 0 ||
    coordinate.column >= size.columns
  ) {
    throw new RangeError(`Board coordinate out of range: ${coordinate.row},${coordinate.column}`);
  }
  return coordinate.row * size.columns + coordinate.column;
}

function validateBoardSize(size: BoardSize): void {
  if (!Number.isInteger(size.rows) || !Number.isInteger(size.columns) || size.rows <= 0 || size.columns <= 0) {
    throw new RangeError(`Invalid board size: ${size.rows}x${size.columns}`);
  }
}
