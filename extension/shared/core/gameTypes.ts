import type {BoardFrame, BoardSize} from './board';

export type GameStatus = 'playable' | 'planned';

export interface GameMetadata {
  id: string;
  name: string;
  description: string;
  status: GameStatus;
}

export interface GameInput {
  key: string;
  type: 'down' | 'up';
}

export interface GameContext {
  size: BoardSize;
  onScore?: (score: number) => void;
  onGameOver?: () => void;
}

export interface BoardRenderer {
  render(frame: BoardFrame): void;

  clear(): void;
}

export interface CommitArcadeGame extends GameMetadata {
  start(context: GameContext): void;

  update(deltaMs: number): void;

  handleInput(input: GameInput): void;

  render(renderer: BoardRenderer): void;

  stop(): void;
}
