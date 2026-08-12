import type {BoardCoordinate, BoardFrame, PixelState} from './board';
import type {BoardRenderer} from './gameTypes';
import type {ContributionGraph} from './githubContributionGraph';

const CELL_CLASS = 'commit-arcade-cell';

export function createBoardRenderer(graph: ContributionGraph): BoardRenderer {
  let previousFrame: BoardFrame | null = null;
  const cellsByCoordinate = new Map(graph.cells.map((cell) => [coordinateKey(cell.coordinate), cell.element]));

  return {
    render(frame: BoardFrame): void {
      for (let row = 0; row < graph.size.rows; row += 1) {
        for (let column = 0; column < graph.size.columns; column += 1) {
          const state = frame[row]?.[column] ?? 'empty';
          if (previousFrame?.[row]?.[column] === state) {
            continue;
          }
          const element = cellsByCoordinate.get(coordinateKey({row, column}));
          applyState(element, state);
        }
      }
      previousFrame = frame.map((row) => [...row]);
    },
    clear(): void {
      for (const cell of graph.cells) {
        applyState(cell.element, 'empty');
      }
      previousFrame = null;
    },
  };
}

function coordinateKey(coordinate: BoardCoordinate): string {
  return `${coordinate.row}:${coordinate.column}`;
}

function applyState(element: Element | undefined, state: PixelState): void {
  if (element === undefined) {
    return;
  }

  if (state === 'empty') {
    element.removeAttribute('data-commit-arcade-state');
    element.classList.remove(CELL_CLASS);
    return;
  }

  element.classList.add(CELL_CLASS);
  element.setAttribute('data-commit-arcade-state', state);
}
