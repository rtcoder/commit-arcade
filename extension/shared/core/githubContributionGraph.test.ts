import { describe, expect, it } from 'vitest';

import { findContributionGraph } from './githubContributionGraph';

describe('findContributionGraph', () => {
  it('detects SVG contribution cells, preserving row and column coordinates', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <g>
            <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
            <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="1" x="12" y="0"></rect>
            <rect class="ContributionCalendar-day" data-date="2026-01-03" data-level="2" x="0" y="12"></rect>
            <rect class="ContributionCalendar-day" data-date="2026-01-04" data-level="3" x="12" y="12"></rect>
          </g>
        </svg>
      </section>
    `;

    const graph = findContributionGraph(document);

    expect(graph?.size).toEqual({ rows: 2, columns: 2 });
    expect(graph?.cells.map((cell) => [cell.coordinate.row, cell.coordinate.column, cell.intensity])).toEqual([
      [0, 0, 0],
      [0, 1, 1],
      [1, 0, 2],
      [1, 1, 3],
    ]);
  });

  it('returns null when the page has no contribution graph', () => {
    document.body.innerHTML = '<main><h1>Profile</h1></main>';

    expect(findContributionGraph(document)).toBeNull();
  });
});
