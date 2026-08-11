import type { BoardRenderer, CommitArcadeGame, GameInput } from './gameTypes';
import type { BoardSize } from './board';

export interface GameEngine {
  handleInput(input: GameInput): void;
  isRunning(): boolean;
  start(game: CommitArcadeGame): void;
  stop(): void;
  tick(deltaMs: number): void;
}

export interface GameEngineOptions {
  renderer: BoardRenderer;
  size: BoardSize;
  onError?: (error: Error) => void;
  onGameOver?: () => void;
  onScore?: (score: number) => void;
}

export function createGameEngine(options: GameEngineOptions): GameEngine {
  let activeGame: CommitArcadeGame | null = null;
  let running = false;

  return {
    handleInput(input): void {
      activeGame?.handleInput(input);
    },
    isRunning(): boolean {
      return running;
    },
    start(game): void {
      if (running) {
        this.stop();
      }
      activeGame = game;
      running = true;
      const context = { size: options.size };
      game.start({
        ...context,
        ...(options.onGameOver === undefined ? {} : { onGameOver: options.onGameOver }),
        ...(options.onScore === undefined ? {} : { onScore: options.onScore }),
      });
    },
    stop(): void {
      if (activeGame !== null) {
        activeGame.stop();
      }
      activeGame = null;
      running = false;
      options.renderer.clear();
    },
    tick(deltaMs): void {
      if (!running || activeGame === null) {
        return;
      }
      try {
        activeGame.update(deltaMs);
        activeGame.render(options.renderer);
      } catch (error) {
        options.onError?.(error instanceof Error ? error : new Error(String(error)));
        this.stop();
      }
    },
  };
}
