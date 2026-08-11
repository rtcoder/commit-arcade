import { describe, expect, it } from 'vitest';
import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { findContributionGraph } from './githubContributionGraph';

const ROOT = process.cwd();

async function fixture(name: string) {
  return readFile(path.join(ROOT, 'extension', 'shared', 'test', 'fixtures', 'github', name), 'utf8');
}

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

  it('detects the current public GitHub contribution fragment fixture', async () => {
    document.body.innerHTML = await fixture('octocat-contributions.html');

    const graph = findContributionGraph(document);

    expect(graph).not.toBeNull();
    expect(graph?.cells.length).toBeGreaterThan(300);
    expect(graph?.size.rows).toBeGreaterThanOrEqual(7);
    expect(graph?.size.columns).toBeGreaterThanOrEqual(50);
  });

  it('keeps empty contribution graphs playable with zero intensity cells', async () => {
    document.body.innerHTML = await fixture('empty-contribution-graph.html');

    const graph = findContributionGraph(document);

    expect(graph?.cells).toHaveLength(4);
    expect(graph?.cells.every((cell) => cell.intensity === 0)).toBe(true);
  });

  it('detects narrow table-like contribution graph fixtures', async () => {
    document.body.innerHTML = await fixture('narrow-contribution-graph.html');

    const graph = findContributionGraph(document);

    expect(graph?.size).toEqual({ rows: 2, columns: 3 });
    expect(graph?.cells.map((cell) => cell.intensity)).toEqual([0, 1, 2, 3, 4, 0]);
  });

  it('no-ops for public organization pages without contribution graph cells', async () => {
    document.body.innerHTML = await fixture('missing-contribution-graph.html');

    expect(findContributionGraph(document)).toBeNull();
  });
});
