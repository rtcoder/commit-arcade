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
