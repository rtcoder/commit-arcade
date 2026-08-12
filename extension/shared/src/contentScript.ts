import { createBoardRenderer } from '../core/boardRenderer';
import { createGameEngine, type GameEngine } from '../core/gameEngine';
import { findContributionGraph } from '../core/githubContributionGraph';
import { gameRegistry } from '../core/gameRegistry';
import { createInputManager } from '../core/inputManager';
import { loadSettings, saveSettings, type CommitArcadeSettings, type CommitArcadeSettingsStorage } from '../core/settings';
import { restoreSnapshot, snapshotCells, type GraphSnapshot } from '../core/stateSnapshot';
import { createFlappyGame } from '../games/flappy/flappyGame';
import { createRunnerGame } from '../games/runner/runnerGame';
import { createSnakeGame } from '../games/snake/snakeGame';
import type { CommitArcadeGame, GameMetadata } from '../core/gameTypes';

export interface CommitArcadeController {
  destroy(): void;
}

export interface CommitArcadeOptions {
  gameFactories?: Partial<Record<string, () => CommitArcadeGame>>;
  storage?: CommitArcadeSettingsStorage;
}

export function initializeCommitArcade(root: Document = document, options: CommitArcadeOptions = {}): CommitArcadeController {
  const abortController = new AbortController();
  const ownedElements: Element[] = [];
  const view = root.defaultView ?? window;
  const inputManager = createInputManager(view);
  const lazyGraphObserver = new view.MutationObserver(() => {
    if (activeGraph !== null) {
      return;
    }
    activeGraph = findContributionGraph(root);
    installGraph();
  });
  let activeGraph = findContributionGraph(root);
  let activeEngine: GameEngine | null = null;
  let activeSnapshot: GraphSnapshot | null = null;
  let activeFrame = 0;
  let lastFrameTime = 0;
  let activeButton: HTMLButtonElement | null = null;
  let activeGame: GameMetadata | null = null;
  let activeScore = 0;
  let activeStatus = 'Ready';
  let activeSession: HTMLElement | null = null;
  const highScores: Record<string, number> = {};
  let selectedGame = 'runner';
  let settingsLoaded = options.storage === undefined;
  const settingsPromise = loadSettings(options.storage).then((settings) => {
    selectedGame = settings.selectedGame;
    Object.assign(highScores, settings.highScores);
    settingsLoaded = true;
    return settings;
  });

  installGraph();
  lazyGraphObserver.observe(root.documentElement, { childList: true, subtree: true });
  root.addEventListener('turbo:render', rescanGraph, { signal: abortController.signal });
  view.addEventListener('popstate', rescanGraph, { signal: abortController.signal });

  return {
    destroy(): void {
      stopGame(null);
      inputManager.destroy();
      lazyGraphObserver.disconnect();
      abortController.abort();
      removeOwnedElements();
      delete root.documentElement.dataset.commitArcadeReady;
    },
  };

  function installGraph(): void {
    if (activeGraph === null || activeGraph.container.querySelector('.commit-arcade-button') !== null) {
      return;
    }
    const graph = activeGraph;

    root.documentElement.dataset.commitArcadeReady = 'true';
    const button = root.createElement('button');
    button.type = 'button';
    button.className = 'commit-arcade-button';
    button.setAttribute('aria-label', 'Play Commit Arcade');
    button.textContent = '▶ Play';
    button.addEventListener('click', () => {
      if (activeEngine !== null || activeSession !== null) {
        stopGame(button);
        return;
      }
      if (!settingsLoaded) {
        void settingsPromise.finally(() => {
          if (activeEngine === null && activeSession === null && graph.container.querySelector('.commit-arcade-picker') === null) {
            togglePicker(root, graph.container, button, ownedElements, startGame, selectedGame);
          }
        });
        return;
      }
      togglePicker(root, graph.container, button, ownedElements, startGame, selectedGame);
    }, {
      signal: abortController.signal,
    });
    graph.container.insertAdjacentElement('afterbegin', button);
    ownedElements.push(button);
    root.addEventListener(
      'visibilitychange',
      () => {
        if (root.hidden && activeEngine !== null) {
          stopGame(activeButton);
          showMessage(root, graph.container, ownedElements, 'Paused. Commit Arcade restored the graph.');
        }
      },
      { signal: abortController.signal },
    );
  }

  function rescanGraph(): void {
    stopGame(activeButton);
    removeOwnedElements();
    delete root.documentElement.dataset.commitArcadeReady;
    activeGraph = findContributionGraph(root);
    installGraph();
  }

  function startGame(game: GameMetadata, button: HTMLButtonElement): void {
    if (activeGraph === null || game.status !== 'playable') {
      return;
    }
    const graph = activeGraph;
    const playableGame = createPlayableGame(game.id, options.gameFactories);
    if (playableGame === null) {
      return;
    }
    graph.container.querySelector('.commit-arcade-picker')?.remove();
    activeGame = playableGame;
    activeScore = 0;
    activeStatus = 'Playing';
    selectedGame = game.id;
    persistSettings({ selectedGame });
    activeSnapshot = snapshotCells(graph.cells.map((cell) => cell.element));
    activeSession = showSession(root, graph.container, ownedElements, {
      game: playableGame,
      highScore: highScores[game.id] ?? 0,
      onRestart: () => restartGame(button),
      onStop: () => stopGame(button),
      score: activeScore,
      status: activeStatus,
    });
    const renderer = createBoardRenderer(graph);
    activeEngine = createGameEngine({
      renderer,
      size: graph.size,
      onError: () => {
        stopGame(button);
        showMessage(root, graph.container, ownedElements, 'Game over. Commit Arcade restored the graph.');
      },
      onGameOver: () => {
        activeStatus = 'Game over';
        inputManager.deactivate();
        activeEngine?.stop();
        activeEngine = null;
        renderSession();
      },
      onScore: (score) => {
        activeScore = score;
        highScores[game.id] = Math.max(highScores[game.id] ?? 0, score);
        persistSettings({ highScores: { ...highScores } });
        renderSession();
      },
    });
    inputManager.activate(usedKeysForGame(game.id), (input) => {
      if (input.type === 'down' && input.key === 'Escape') {
        stopGame(button);
        return;
      }
      activeEngine?.handleInput(input);
    });
    activeEngine.start(playableGame);
    activeEngine?.tick(0);
    button.textContent = '■ Stop';
    button.setAttribute('aria-label', 'Stop Commit Arcade');
    activeButton = button;
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
    activeButton = null;
    if (activeSnapshot !== null) {
      restoreSnapshot(activeSnapshot);
      activeSnapshot = null;
    }
    root.querySelector('.commit-arcade-picker')?.remove();
    activeSession?.remove();
    activeSession = null;
    activeGame = null;
    activeScore = 0;
    activeStatus = 'Ready';
    if (button !== null) {
      button.textContent = '▶ Play';
      button.setAttribute('aria-label', 'Play Commit Arcade');
    }
  }

  function restartGame(button: HTMLButtonElement): void {
    const game = activeGame;
    stopGame(button);
    if (game !== null) {
      startGame(game, button);
    }
  }

  function removeOwnedElements(): void {
    for (const element of ownedElements.splice(0)) {
      element.remove();
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

  function renderSession(): void {
    if (activeSession === null || activeGame === null) {
      return;
    }
    renderSessionContent(activeSession, {
      game: activeGame,
      highScore: highScores[activeGame.id] ?? activeScore,
      onRestart: () => {
        if (activeButton !== null) {
          restartGame(activeButton);
        }
      },
      onStop: () => stopGame(activeButton),
      score: activeScore,
      status: activeStatus,
    });
  }

  function persistSettings(patch: Partial<CommitArcadeSettings>): void {
    void saveSettings(patch, options.storage).catch(() => undefined);
  }
}

function togglePicker(
  root: Document,
  container: Element,
  button: HTMLButtonElement,
  ownedElements: Element[],
  startGame: (game: GameMetadata, button: HTMLButtonElement) => void,
  selectedGame: string,
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

  for (const game of orderedGames(selectedGame)) {
    const item = root.createElement('button');
    item.type = 'button';
    item.className = 'commit-arcade-picker-item';
    item.textContent = game.name;
    item.setAttribute('role', 'menuitem');
    item.setAttribute('aria-label', game.status === 'playable' ? `Start ${game.name}. ${game.description}` : `${game.name}. Planned game.`);
    if (game.id === selectedGame) {
      item.setAttribute('aria-current', 'true');
    }
    if (game.status === 'planned') {
      item.disabled = true;
      item.setAttribute('aria-disabled', 'true');
    } else {
      item.addEventListener('click', () => startGame(game, button));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          startGame(game, button);
        }
      });
    }
    picker.append(item);
  }

  button.insertAdjacentElement('afterend', picker);
  ownedElements.push(picker);
}

function orderedGames(selectedGame: string): readonly GameMetadata[] {
  const selected = gameRegistry.find((game) => game.id === selectedGame);
  if (selected === undefined) {
    return gameRegistry;
  }
  return [selected, ...gameRegistry.filter((game) => game.id !== selectedGame)];
}

function createPlayableGame(gameId: string, overrides: CommitArcadeOptions['gameFactories'] = {}): CommitArcadeGame | null {
  const override = overrides[gameId];
  if (override !== undefined) {
    return override();
  }

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

function showMessage(root: Document, container: Element, ownedElements: Element[], text: string): void {
  container.querySelector('.commit-arcade-message')?.remove();
  const message = root.createElement('div');
  message.className = 'commit-arcade-message';
  message.setAttribute('role', 'status');
  message.textContent = text;
  container.insertAdjacentElement('afterbegin', message);
  ownedElements.push(message);
}

interface SessionViewModel {
  game: GameMetadata;
  highScore: number;
  onRestart: () => void;
  onStop: () => void;
  score: number;
  status: string;
}

function showSession(root: Document, container: Element, ownedElements: Element[], model: SessionViewModel): HTMLElement {
  container.querySelector('.commit-arcade-session')?.remove();
  const session = root.createElement('div');
  session.className = 'commit-arcade-session';
  session.setAttribute('role', 'status');
  renderSessionContent(session, model);
  container.insertAdjacentElement('afterbegin', session);
  ownedElements.push(session);
  return session;
}

function renderSessionContent(session: HTMLElement, model: SessionViewModel): void {
  session.replaceChildren();

  const title = session.ownerDocument.createElement('span');
  title.className = 'commit-arcade-session-title';
  title.textContent = model.game.name;

  const score = session.ownerDocument.createElement('span');
  score.textContent = `Score ${model.score}`;

  const best = session.ownerDocument.createElement('span');
  best.textContent = `Best ${model.highScore}`;

  const status = session.ownerDocument.createElement('span');
  status.textContent = model.status;

  const help = session.ownerDocument.createElement('span');
  help.className = 'commit-arcade-controls-help';
  help.textContent = controlsHelpForGame(model.game.id);

  const restart = session.ownerDocument.createElement('button');
  restart.type = 'button';
  restart.className = 'commit-arcade-session-button commit-arcade-restart-button';
  restart.setAttribute('aria-label', `Restart ${model.game.name}`);
  restart.textContent = 'Restart';
  restart.addEventListener('click', model.onRestart);

  const stop = session.ownerDocument.createElement('button');
  stop.type = 'button';
  stop.className = 'commit-arcade-session-button commit-arcade-stop-button';
  stop.setAttribute('aria-label', `Stop ${model.game.name}`);
  stop.textContent = 'Stop';
  stop.addEventListener('click', model.onStop);

  session.append(title, score, best, status, help, restart, stop);
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

function controlsHelpForGame(gameId: string): string {
  switch (gameId) {
    case 'snake':
      return 'Move with arrows or WASD. Esc stops.';
    case 'runner':
      return 'Jump with Up or Space. Esc stops.';
    case 'flappy':
      return 'Flap with Up or Space. Esc stops.';
    default:
      return 'Esc stops.';
  }
}

if (typeof document !== 'undefined' && !document.documentElement.dataset.commitArcadeReady) {
  initializeCommitArcade(document);
}
