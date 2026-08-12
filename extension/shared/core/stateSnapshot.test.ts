import {describe, expect, it} from 'vitest';

import {restoreSnapshot, snapshotCells} from './stateSnapshot';

describe('stateSnapshot', () => {
  it('restores classes, inline styles, attributes, text, and removes extension-owned attributes', () => {
    const cell = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    cell.setAttribute('fill', '#40c463');
    cell.setAttribute('data-level', '2');
    cell.className.baseVal = 'ContributionCalendar-day';
    cell.setAttribute('style', 'opacity: 0.5');
    cell.textContent = 'original';

    const snapshot = snapshotCells([cell]);
    cell.className.baseVal = 'ContributionCalendar-day commit-arcade-cell';
    cell.setAttribute('fill', '#cf222e');
    cell.setAttribute('data-commit-arcade-state', 'enemy');
    cell.setAttribute('style', 'opacity: 1');
    cell.textContent = 'changed';

    restoreSnapshot(snapshot);

    expect(cell.className.baseVal).toBe('ContributionCalendar-day');
    expect(cell.getAttribute('fill')).toBe('#40c463');
    expect(cell.getAttribute('data-level')).toBe('2');
    expect(cell.getAttribute('data-commit-arcade-state')).toBeNull();
    expect(cell.getAttribute('style')).toBe('opacity: 0.5');
    expect(cell.textContent).toBe('original');
  });
});
