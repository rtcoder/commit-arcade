import { createBoardRenderer } from '../core/boardRenderer';
import { createGameEngine, type GameEngine } from '../core/gameEngine';
import { findContributionGraph } from '../core/githubContributionGraph';
import { gameRegistry } from '../core/gameRegistry';
import { createInputManager } from '../core/inputManager';
import { restoreSnapshot, snapshotCells, type GraphSnapshot } from '../core/stateSnapshot';
import { createFlappyGame } from '../games/flappy/flappyGame';
import { createRunnerGame } from '../games/runner/runnerGame';
import { createSnakeGame } from '../games/snake/snakeGame';
import type { CommitArcadeGame, GameMetadata } from '../core/gameTypes';

export interface CommitArcadeController {
  destroy(): void;
}

export function initializeCommitArcade(root: Document = document): CommitArcadeController {
  const abortController = new AbortController();
  const graph = findContributionGraph(root);
  const ownedElements: Element[] = [];
  const view = root.defaultView ?? window;
  const inputManager = createInputManager(view);
  let activeEngine: GameEngine | null = null;
  let activeSnapshot: GraphSnapshot | null = null;
  let activeFrame = 0;
  let lastFrameTime = 0;

  root.documentElement.dataset.commitArcadeReady = 'true';

  if (graph !== null && graph.container.querySelector('.commit-arcade-button') === null) {
    const button = root.createElement('button');
    button.type = 'button';
    button.className = 'commit-arcade-button';
    button.setAttribute('aria-label', 'Play Commit Arcade');
    button.textContent = '▶ Play';
    button.addEventListener('click', () => {
      if (activeEngine !== null) {
        stopGame(button);
        return;
      }
      togglePicker(root, graph.container, button, ownedElements, startGame);
    }, {
      signal: abortController.signal,
    });
    graph.container.insertAdjacentElement('afterbegin', button);
    ownedElements.push(button);
  }

  return {
    destroy(): void {
      stopGame(null);
      inputManager.destroy();
      abortController.abort();
      for (const element of ownedElements) {
        element.remove();
      }
      delete root.documentElement.dataset.commitArcadeReady;
    },
  };

  function startGame(game: GameMetadata, button: HTMLButtonElement): void {
    if (graph === null || game.status !== 'playable') {
      return;
    }
    const playableGame = createPlayableGame(game.id);
    if (playableGame === null) {
      return;
    }
    graph.container.querySelector('.commit-arcade-picker')?.remove();
    activeSnapshot = snapshotCells(graph.cells.map((cell) => cell.element));
    const renderer = createBoardRenderer(graph);
    activeEngine = createGameEngine({
      renderer,
      size: graph.size,
      onError: () => stopGame(button),
      onGameOver: () => inputManager.deactivate(),
    });
    inputManager.activate(usedKeysForGame(game.id), (input) => activeEngine?.handleInput(input));
    activeEngine.start(playableGame);
    activeEngine.tick(0);
    button.textContent = '■ Stop';
    button.setAttribute('aria-label', 'Stop Commit Arcade');
    lastFrameTime = view.performance.now();
    activeFrame = view.requestAnimationFrame(tick);
  }

  function stopGame(button: HTMLButtonElement | null): void {
    if (activeFrame !== 0) {
      view.cancelAnimationFrame(activeFrame);
      activeFrame = 0;
    }
    inputManager.deactivate();
    activeEngine?.stop();
    activeEngine = null;
    if (activeSnapshot !== null) {
      restoreSnapshot(activeSnapshot);
      activeSnapshot = null;
    }
    root.querySelector('.commit-arcade-picker')?.remove();
    if (button !== null) {
      button.textContent = '▶ Play';
      button.setAttribute('aria-label', 'Play Commit Arcade');
    }
  }

  function tick(now: number): void {
    const deltaMs = Math.min(100, now - lastFrameTime);
    lastFrameTime = now;
    activeEngine?.tick(deltaMs);
    if (activeEngine?.isRunning() === true) {
      activeFrame = view.requestAnimationFrame(tick);
    }
  }
}

function togglePicker(
  root: Document,
  container: Element,
  button: HTMLButtonElement,
  ownedElements: Element[],
  startGame: (game: GameMetadata, button: HTMLButtonElement) => void,
): void {
  const existingPicker = container.querySelector('.commit-arcade-picker');
  if (existingPicker !== null) {
    existingPicker.remove();
    button.textContent = '▶ Play';
    button.setAttribute('aria-label', 'Play Commit Arcade');
    return;
  }

  const picker = root.createElement('div');
  picker.className = 'commit-arcade-picker';
  picker.setAttribute('role', 'menu');
  picker.setAttribute('aria-label', 'Choose a game');

  for (const game of gameRegistry) {
    const item = root.createElement('button');
    item.type = 'button';
    item.className = 'commit-arcade-picker-item';
    item.textContent = game.name;
    item.setAttribute('role', 'menuitem');
    if (game.status === 'planned') {
      item.disabled = true;
      item.setAttribute('aria-disabled', 'true');
    } else {
      item.addEventListener('click', () => startGame(game, button));
    }
    picker.append(item);
  }

  button.insertAdjacentElement('afterend', picker);
  ownedElements.push(picker);
}

function createPlayableGame(gameId: string): CommitArcadeGame | null {
  switch (gameId) {
    case 'runner':
      return createRunnerGame();
    case 'snake':
      return createSnakeGame();
    case 'flappy':
      return createFlappyGame();
    default:
      return null;
  }
}

function usedKeysForGame(gameId: string): ReadonlySet<string> {
  switch (gameId) {
    case 'snake':
      return new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Escape']);
    case 'runner':
      return new Set(['ArrowUp', 'ArrowDown', ' ', 'Space', 'Escape']);
    case 'flappy':
      return new Set(['ArrowUp', ' ', 'Space', 'Escape']);
    default:
      return new Set(['Escape']);
  }
}

if (typeof document !== 'undefined' && !document.documentElement.dataset.commitArcadeReady) {
  initializeCommitArcade(document);
}
