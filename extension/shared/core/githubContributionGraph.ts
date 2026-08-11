import type { BoardCoordinate, BoardSize } from './board';

export interface ContributionCell {
  coordinate: BoardCoordinate;
  element: Element;
  intensity: number;
}

export interface ContributionGraph {
  cells: ContributionCell[];
  container: Element;
  size: BoardSize;
}

interface PositionedElement {
  element: Element;
  intensity: number;
  x: number;
  y: number;
}

export function findContributionGraph(root: ParentNode): ContributionGraph | null {
  const svgCells = Array.from(root.querySelectorAll('rect.ContributionCalendar-day, rect[data-date]'));
  if (svgCells.length > 0) {
    return graphFromPositionedElements(svgCells);
  }

  const tableCells = Array.from(root.querySelectorAll('[data-date][data-level], [data-date][data-count]'));
  if (tableCells.length > 0) {
    return graphFromPositionedElements(tableCells);
  }

  return null;
}

function graphFromPositionedElements(elements: Element[]): ContributionGraph | null {
  const positioned = elements
    .map(toPositionedElement)
    .filter((cell): cell is PositionedElement => cell !== null)
    .sort((a, b) => a.y - b.y || a.x - b.x);

  if (positioned.length === 0) {
    return null;
  }

  const rows = sortedUnique(positioned.map((cell) => cell.y));
  const columns = sortedUnique(positioned.map((cell) => cell.x));
  const cells = positioned.map((cell) => ({
    coordinate: {
      row: rows.indexOf(cell.y),
      column: columns.indexOf(cell.x),
    },
    element: cell.element,
    intensity: cell.intensity,
  }));

  return {
    cells,
    container: closestGraphContainer(positioned[0]!.element),
    size: { rows: rows.length, columns: columns.length },
  };
}

function toPositionedElement(element: Element): PositionedElement | null {
  const x = numericAttribute(element, 'x') ?? numericAttribute(element, 'data-column') ?? inferIndex(element);
  const y = numericAttribute(element, 'y') ?? numericAttribute(element, 'data-row') ?? 0;
  if (x === null || y === null) {
    return null;
  }

  return {
    element,
    intensity: numericAttribute(element, 'data-level') ?? numericAttribute(element, 'data-count') ?? 0,
    x,
    y,
  };
}

function numericAttribute(element: Element, name: string): number | null {
  const value = element.getAttribute(name);
  if (value === null || value.trim() === '') {
    return null;
  }
  const numeric = Number(value);
  return Number.isFinite(numeric) ? numeric : null;
}

function inferIndex(element: Element): number {
  const parent = element.parentElement;
  return parent === null ? 0 : Array.from(parent.children).indexOf(element);
}

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function closestGraphContainer(element: Element): Element {
  return element.closest('[aria-label*="Contribution"], .js-yearly-contributions, section') ?? element.parentElement ?? element;
}
