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
  const cells = Array.from(root.querySelectorAll('rect.ContributionCalendar-day, rect[data-date], [data-date][data-level], [data-date][data-count]'));
  return graphFromBestContainer(cells);
}

function graphFromBestContainer(elements: Element[]): ContributionGraph | null {
  const grouped = new Map<Element, Element[]>();
  for (const element of elements) {
    const container = closestGraphContainer(element);
    grouped.set(container, [...(grouped.get(container) ?? []), element]);
  }

  const bestGroup = [...grouped.entries()]
    .filter(([, group]) => group.length > 0)
    .sort((a, b) => b[1].length - a[1].length)[0];

  if (bestGroup === undefined) {
    return null;
  }

  return graphFromPositionedElements(bestGroup[1], bestGroup[0]);
}

function graphFromPositionedElements(elements: Element[], container: Element): ContributionGraph | null {
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
    container,
    size: { rows: rows.length, columns: columns.length },
  };
}

function toPositionedElement(element: Element): PositionedElement | null {
  const x = numericAttribute(element, 'x') ?? numericAttribute(element, 'data-column') ?? domColumnIndex(element);
  const y = numericAttribute(element, 'y') ?? numericAttribute(element, 'data-row') ?? domRowIndex(element);
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

function domColumnIndex(element: Element): number {
  const parent = element.parentElement;
  return parent === null ? 0 : Array.from(parent.children).indexOf(element);
}

function domRowIndex(element: Element): number {
  const row = element.closest('tr, [role="row"], g');
  const parent = row?.parentElement;
  if (row === null || row === undefined || parent == null) {
    return 0;
  }
  return Array.from(parent.children).indexOf(row);
}

function sortedUnique(values: number[]): number[] {
  return [...new Set(values)].sort((a, b) => a - b);
}

function closestGraphContainer(element: Element): Element {
  return element.closest('[aria-label*="Contribution"], .js-yearly-contributions, section') ?? element.parentElement ?? element;
}
