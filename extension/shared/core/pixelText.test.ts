import {describe, expect, it} from 'vitest';

import {createPixelMenuFrame} from './pixelText';

describe('createPixelMenuFrame', () => {
  it('renders menu labels into board pixels with a highlighted selected row', () => {
    const frame = createPixelMenuFrame({
      labels: ['RUN', 'SNAKE'],
      selectedIndex: 1,
      size: {columns: 24, rows: 13},
    });

    expect(frame).toHaveLength(13);
    expect(frame[0]).toHaveLength(24);
    expect(frame.flat().filter((state) => state === 'accent').length).toBeGreaterThan(0);
    expect(frame.flat().filter((state) => state === 'player').length).toBeGreaterThan(0);
    expect(frame[0]?.every((state) => state === 'empty')).toBe(true);
  });
});
