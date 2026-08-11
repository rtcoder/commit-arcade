import { createEmptyFrame, type BoardFrame, type PixelState } from './board';
import type { ContributionGraph } from './githubContributionGraph';

export type CommitArcadeMode = 'arcade' | 'contribution';

export interface ContributionModeSeed {
  schemaVersion: 1;
  gameId: string;
  rows: number;
  columns: number;
  intensityBuckets: number[];
}

export function deriveContributionModeFrame(graph: ContributionGraph): BoardFrame {
  const frame = createEmptyFrame(graph.size);
  for (const cell of graph.cells) {
    frame[cell.coordinate.row]![cell.coordinate.column] = pixelStateForIntensity(cell.intensity);
  }
  return frame;
}

export function createContributionModeSeed(graph: ContributionGraph, gameId: string): ContributionModeSeed {
  return {
    columns: graph.size.columns,
    gameId,
    intensityBuckets: graph.cells.map((cell) => normalizeIntensity(cell.intensity)),
    rows: graph.size.rows,
    schemaVersion: 1,
  };
}

export function pixelStateForIntensity(intensity: number): PixelState {
  const normalized = normalizeIntensity(intensity);
  if (normalized <= 0) {
    return 'empty';
  }
  if (normalized === 1) {
    return 'bonus';
  }
  if (normalized <= 3) {
    return 'obstacle';
  }
  return 'enemy';
}

function normalizeIntensity(intensity: number): number {
  if (!Number.isFinite(intensity)) {
    return 0;
  }
  return Math.max(0, Math.min(4, Math.trunc(intensity)));
}
