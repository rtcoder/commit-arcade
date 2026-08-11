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

  it('uses the largest contribution-like container and ignores unrelated date rects elsewhere', () => {
    document.body.innerHTML = `
      <main>
        <svg aria-label="Unrelated calendar">
          <rect data-date="2026-02-01" x="0" y="0"></rect>
          <rect data-date="2026-02-02" x="12" y="0"></rect>
        </svg>
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
      </main>
    `;

    const graph = findContributionGraph(document);

    expect(graph?.size).toEqual({ rows: 2, columns: 2 });
    expect(graph?.cells).toHaveLength(4);
  });

  it('derives row and column coordinates from table-like contribution markup without SVG x/y attributes', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <table>
          <tbody>
            <tr>
              <td data-date="2026-01-01" data-level="0"></td>
              <td data-date="2026-01-02" data-level="1"></td>
            </tr>
            <tr>
              <td data-date="2026-01-03" data-level="2"></td>
              <td data-date="2026-01-04" data-level="3"></td>
            </tr>
          </tbody>
        </table>
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
});
