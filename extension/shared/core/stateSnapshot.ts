interface CellSnapshot {
  attributes: Array<[string, string]>;
  element: Element;
  textContent: string | null;
}

export interface GraphSnapshot {
  cells: CellSnapshot[];
}

export function snapshotCells(cells: readonly Element[]): GraphSnapshot {
  return {
    cells: cells.map((element) => ({
      attributes: Array.from(element.attributes, (attribute) => [attribute.name, attribute.value]),
      element,
      textContent: element.textContent,
    })),
  };
}

export function restoreSnapshot(snapshot: GraphSnapshot): void {
  for (const cell of snapshot.cells) {
    for (const attribute of Array.from(cell.element.attributes)) {
      cell.element.removeAttribute(attribute.name);
    }
    for (const [name, value] of cell.attributes) {
      cell.element.setAttribute(name, value);
    }
    cell.element.textContent = cell.textContent;
  }
}
