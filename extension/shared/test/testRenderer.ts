import type { BoardFrame } from '../core/board';
import type { BoardRenderer } from '../core/gameTypes';

export function createTestRenderer(): BoardRenderer & { lastFrame: BoardFrame | null } {
  return {
    lastFrame: null,
    clear() {
      this.lastFrame = null;
    },
    render(frame) {
      this.lastFrame = frame.map((row) => [...row]);
    },
  };
}
