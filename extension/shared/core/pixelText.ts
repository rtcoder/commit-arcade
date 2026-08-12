import {createEmptyFrame, type BoardFrame, type BoardSize, type PixelState} from './board';

interface PixelMenuOptions {
  labels: readonly string[];
  selectedIndex: number;
  size: BoardSize;
}

const GLYPH_HEIGHT = 10;
const GLYPH_WIDTH = 5;
const SOURCE_GLYPH_HEIGHT = 5;
const SOURCE_GLYPH_WIDTH = 5;
const GLYPH_GAP = 1;

export const PIXEL_FONT: Record<string, readonly string[]> = {
  ' ': ['00000', '00000', '00000', '00000', '00000'],
  A: ['01110', '10001', '11111', '10001', '10001'],
  B: ['11110', '10001', '11110', '10001', '11110'],
  C: ['11111', '10000', '10000', '10000', '11111'],
  D: ['11110', '10001', '10001', '10001', '11110'],
  E: ['11111', '10000', '11110', '10000', '11111'],
  F: ['11111', '10000', '11110', '10000', '10000'],
  G: ['11111', '10000', '10111', '10001', '11111'],
  H: ['10001', '10001', '11111', '10001', '10001'],
  I: ['11111', '00100', '00100', '00100', '11111'],
  J: ['00001', '00001', '00001', '10001', '11111'],
  K: ['10001', '10010', '11100', '10010', '10001'],
  L: ['10000', '10000', '10000', '10000', '11111'],
  M: ['10001', '11011', '10101', '10001', '10001'],
  N: ['10001', '11001', '10101', '10011', '10001'],
  O: ['11111', '10001', '10001', '10001', '11111'],
  P: ['11110', '10001', '11110', '10000', '10000'],
  Q: ['11111', '10001', '10001', '10011', '11111'],
  R: ['11110', '10001', '11110', '10010', '10001'],
  S: ['11111', '10000', '11111', '00001', '11111'],
  T: ['11111', '00100', '00100', '00100', '00100'],
  U: ['10001', '10001', '10001', '10001', '11111'],
  V: ['10001', '10001', '10001', '01010', '00100'],
  W: ['10001', '10001', '10101', '11011', '10001'],
  X: ['10001', '01010', '00100', '01010', '10001'],
  Y: ['10001', '01010', '00100', '00100', '00100'],
  Z: ['11111', '00010', '00100', '01000', '11111'],
};

export function createPixelMenuFrame(options: PixelMenuOptions): BoardFrame {
  const frame = createEmptyFrame(options.size);
  const visibleLabels = wheelMenuLabels(options.labels, options.selectedIndex);
  const selectedRow = Math.max(0, Math.ceil((options.size.rows - GLYPH_HEIGHT) / 2));

  for (const entry of visibleLabels) {
    const state: PixelState = entry.index === options.selectedIndex ? 'player' : 'accent';
    const row = selectedRow + entry.offset * GLYPH_HEIGHT;
    drawText(frame, entry.label, row, centeredColumn(entry.label, options.size.columns), state);
  }

  return frame;
}

function wheelMenuLabels(labels: readonly string[], selectedIndex: number): Array<{index: number; label: string; offset: number}> {
  if (labels.length <= 0) {
    return [];
  }
  if (labels.length === 1) {
    return [{index: 0, label: labels[0] ?? '', offset: 0}];
  }
  return [-1, 0, 1].map((offset) => {
    const index = wrapIndex(selectedIndex + offset, labels.length);
    return {index, label: labels[index] ?? '', offset};
  });
}

function drawText(frame: BoardFrame, text: string, row: number, column: number, state: PixelState): void {
  const normalized = text.toUpperCase();
  for (let charIndex = 0; charIndex < normalized.length; charIndex += 1) {
    const glyph = PIXEL_FONT[normalized[charIndex] ?? ' '] ?? PIXEL_FONT[' '];
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
      const sourceY = Math.floor((y * SOURCE_GLYPH_HEIGHT) / GLYPH_HEIGHT);
      const sourceX = Math.floor((x * SOURCE_GLYPH_WIDTH) / GLYPH_WIDTH);
      if (glyph[sourceY]?.[sourceX] === '1' && frameRow?.[column + x] !== undefined) {
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
