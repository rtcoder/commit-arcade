import type {ContributionCell, ContributionGraph} from './githubContributionGraph';

export interface ArcadeBoard {
  destroy(): void;
  element: HTMLElement;
  graph: ContributionGraph;
}

export interface ArcadeBoardOptions {
  rows?: number;
}

const DEFAULT_ROWS = 21;
const MIN_ROWS = 15;
const MAX_ROWS = 25;

export function createArcadeBoard(root: Document, sourceGraph: ContributionGraph, options: ArcadeBoardOptions = {}): ArcadeBoard {
  const rows = clampRows(options.rows ?? DEFAULT_ROWS);
  const columns = Math.max(1, sourceGraph.size.columns);
  const element = root.createElement('div');
  element.className = 'commit-arcade-board';
  element.setAttribute('aria-hidden', 'true');
  element.style.setProperty('--commit-arcade-board-rows', String(rows));
  element.style.setProperty('--commit-arcade-board-columns', String(columns));

  const cells: ContributionCell[] = [];
  for (let row = 0; row < rows; row += 1) {
    for (let column = 0; column < columns; column += 1) {
      const cell = root.createElement('span');
      cell.className = 'commit-arcade-board-cell';
      element.append(cell);
      cells.push({
        coordinate: {row, column},
        element: cell,
        intensity: 0,
      });
    }
  }

  return {
    destroy(): void {
      element.remove();
    },
    element,
    graph: {
      cells,
      container: sourceGraph.container,
      size: {rows, columns},
    },
  };
}

function clampRows(rows: number): number {
  if (!Number.isFinite(rows)) {
    return DEFAULT_ROWS;
  }
  return Math.min(MAX_ROWS, Math.max(MIN_ROWS, Math.round(rows)));
}
