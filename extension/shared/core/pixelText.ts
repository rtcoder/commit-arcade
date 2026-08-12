import {createEmptyFrame, type BoardFrame, type BoardSize, type PixelState} from './board';

interface PixelMenuOptions {
  labels: readonly string[];
  selectedIndex: number;
  size: BoardSize;
}

const GLYPH_HEIGHT = 5;
const GLYPH_WIDTH = 3;
const GLYPH_GAP = 1;
const ROW_GAP = 1;

const FONT: Record<string, readonly string[]> = {
  ' ': ['000', '000', '000', '000', '000'],
  A: ['111', '101', '111', '101', '101'],
  B: ['110', '101', '110', '101', '110'],
  C: ['111', '100', '100', '100', '111'],
  D: ['110', '101', '101', '101', '110'],
  E: ['111', '100', '110', '100', '111'],
  F: ['111', '100', '110', '100', '100'],
  G: ['111', '100', '101', '101', '111'],
  H: ['101', '101', '111', '101', '101'],
  I: ['111', '010', '010', '010', '111'],
  J: ['001', '001', '001', '101', '111'],
  K: ['101', '101', '110', '101', '101'],
  L: ['100', '100', '100', '100', '111'],
  M: ['101', '111', '111', '101', '101'],
  N: ['101', '111', '111', '111', '101'],
  O: ['111', '101', '101', '101', '111'],
  P: ['111', '101', '111', '100', '100'],
  Q: ['111', '101', '101', '111', '001'],
  R: ['110', '101', '110', '101', '101'],
  S: ['111', '100', '111', '001', '111'],
  T: ['111', '010', '010', '010', '010'],
  U: ['101', '101', '101', '101', '111'],
  V: ['101', '101', '101', '101', '010'],
  W: ['101', '101', '111', '111', '101'],
  X: ['101', '101', '010', '101', '101'],
  Y: ['101', '101', '010', '010', '010'],
  Z: ['111', '001', '010', '100', '111'],
};

export function createPixelMenuFrame(options: PixelMenuOptions): BoardFrame {
  const frame = createEmptyFrame(options.size);
  const visibleLabels = visibleMenuLabels(options.labels, options.selectedIndex, options.size.rows);
  const blockHeight = visibleLabels.length * GLYPH_HEIGHT + Math.max(0, visibleLabels.length - 1) * ROW_GAP;
  let row = Math.max(0, Math.floor((options.size.rows - blockHeight) / 2));

  for (const entry of visibleLabels) {
    const state: PixelState = entry.index === options.selectedIndex ? 'player' : 'accent';
    drawText(frame, entry.label, row, centeredColumn(entry.label, options.size.columns), state);
    row += GLYPH_HEIGHT + ROW_GAP;
  }

  return frame;
}

function visibleMenuLabels(labels: readonly string[], selectedIndex: number, rows: number): Array<{index: number; label: string}> {
  const capacity = Math.max(1, Math.floor((rows + ROW_GAP) / (GLYPH_HEIGHT + ROW_GAP)));
  const count = Math.min(labels.length, capacity);
  const before = Math.floor((count - 1) / 2);
  const start = selectedIndex - before;
  return Array.from({length: count}, (_, offset) => {
    const index = wrapIndex(start + offset, labels.length);
    return {index, label: labels[index] ?? ''};
  });
}

function drawText(frame: BoardFrame, text: string, row: number, column: number, state: PixelState): void {
  const normalized = text.toUpperCase();
  for (let charIndex = 0; charIndex < normalized.length; charIndex += 1) {
    const glyph = FONT[normalized[charIndex] ?? ' '] ?? FONT[' '];
    const glyphColumn = column + charIndex * (GLYPH_WIDTH + GLYPH_GAP);
    drawGlyph(frame, glyph, row, glyphColumn, state);
  }
}

function drawGlyph(frame: BoardFrame, glyph: readonly string[] | undefined, row: number, column: number, state: PixelState): void {
  if (glyph === undefined) {
    return;
  }
  for (let y = 0; y < GLYPH_HEIGHT; y += 1) {
    const frameRow = frame[row + y];
    for (let x = 0; x < GLYPH_WIDTH; x += 1) {
      if (glyph[y]?.[x] === '1' && frameRow?.[column + x] !== undefined) {
        frameRow[column + x] = state;
      }
    }
  }
}

function centeredColumn(text: string, columns: number): number {
  const width = text.length * GLYPH_WIDTH + Math.max(0, text.length - 1) * GLYPH_GAP;
  return Math.max(0, Math.floor((columns - width) / 2));
}

function wrapIndex(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (index + length) % length;
}
