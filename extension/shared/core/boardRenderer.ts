import { getCellIndex, type BoardFrame, type PixelState } from './board';
import type { ContributionGraph } from './githubContributionGraph';
import type { BoardRenderer } from './gameTypes';

const CELL_CLASS = 'commit-arcade-cell';

export function createBoardRenderer(graph: ContributionGraph): BoardRenderer {
  let previousFrame: BoardFrame | null = null;

  return {
    render(frame: BoardFrame): void {
      for (let row = 0; row < graph.size.rows; row += 1) {
        for (let column = 0; column < graph.size.columns; column += 1) {
          const state = frame[row]?.[column] ?? 'empty';
          if (previousFrame?.[row]?.[column] === state) {
            continue;
          }
          applyState(graph.cells[getCellIndex(graph.size, { row, column })]?.element, state);
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
