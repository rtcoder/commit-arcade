import {describe, expect, it} from 'vitest';

import {PIXEL_FONT, createPixelMenuFrame} from './pixelText';

describe('createPixelMenuFrame', () => {
  it('keeps every source glyph declared as five rows of five pixels', () => {
    for (const glyph of Object.values(PIXEL_FONT)) {
      expect(glyph).toHaveLength(5);
      expect(glyph.every((row) => row.length === 5)).toBe(true);
    }
  });

  it('renders menu labels into board pixels with a highlighted selected row', () => {
    const frame = createPixelMenuFrame({
      labels: ['RUN', 'SNAKE'],
      selectedIndex: 1,
      size: {columns: 53, rows: 21},
    });

    expect(frame).toHaveLength(21);
    expect(frame[0]).toHaveLength(53);
    expect(frame.flat().filter((state) => state === 'accent').length).toBeGreaterThan(0);
    expect(frame.flat().filter((state) => state === 'player').length).toBeGreaterThan(0);
  });

  it('centers the selected label between clipped previous and next labels', () => {
    const frame = createPixelMenuFrame({
      labels: ['PREV', 'SEL', 'NEXT'],
      selectedIndex: 1,
      size: {columns: 53, rows: 21},
    });
    const playerRows = rowsContaining(frame, 'player');
    const accentRows = rowsContaining(frame, 'accent');

    expect(playerRows).toEqual([6, 7, 8, 9, 10, 11, 12, 13, 14, 15]);
    expect(accentRows.some((row) => row < 6)).toBe(true);
    expect(accentRows.some((row) => row > 15)).toBe(true);
    expect(accentRows.every((row) => row < 6 || row > 15)).toBe(true);
    expect(frame[0]?.every((state) => state === 'empty')).toBe(true);
    expect(frame[20]?.every((state) => state === 'empty')).toBe(true);
  });

  it('supports intermediate scroll offsets for smooth wheel transitions', () => {
    const frame = createPixelMenuFrame({
      labels: ['PREV', 'SEL', 'NEXT'],
      scrollOffsetRows: 5,
      selectedIndex: 1,
      size: {columns: 53, rows: 21},
    });
    const playerRows = rowsContaining(frame, 'player');

    expect(playerRows).toEqual([11, 12, 13, 14, 15, 16, 17, 18, 19]);
  });

  it('draws each glyph in a five by ten pixel box', () => {
    const frame = createPixelMenuFrame({
      labels: ['I'],
      selectedIndex: 0,
      size: {columns: 7, rows: 12},
    });
    const markedCoordinates = frame.flatMap((row, rowIndex) =>
      row.map((state, columnIndex) => ({columnIndex, rowIndex, state})).filter((cell) => cell.state === 'player'),
    );
    const markedRows = new Set(markedCoordinates.map((cell) => cell.rowIndex));
    const markedColumns = new Set(markedCoordinates.map((cell) => cell.columnIndex));

    expect(markedRows.size).toBe(10);
    expect(markedColumns.size).toBe(5);
  });
});

function rowsContaining(frame: ReturnType<typeof createPixelMenuFrame>, state: 'accent' | 'player'): number[] {
  return frame.flatMap((row, rowIndex) => row.includes(state) ? [rowIndex] : []);
}
