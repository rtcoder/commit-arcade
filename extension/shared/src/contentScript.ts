import {type ArcadeBoard, createArcadeBoard} from '../core/arcadeBoard';
import {createBoardRenderer} from '../core/boardRenderer';
import {createGameEngine, type GameEngine} from '../core/gameEngine';
import {gameRegistry} from '../core/gameRegistry';
import type {CommitArcadeGame, GameMetadata} from '../core/gameTypes';
import {findContributionGraph} from '../core/githubContributionGraph';
import {createInputManager} from '../core/inputManager';
import {
  type CommitArcadeSettings,
  type CommitArcadeSettingsStorage,
  loadSettings,
  saveSettings,
} from '../core/settings';
import {type GraphSnapshot, restoreSnapshot, snapshotCells} from '../core/stateSnapshot';
import {createAsteroidsGame} from '../games/asteroids/asteroidsGame';
import {createBreakoutGame} from '../games/breakout/breakoutGame';
import {createFlappyGame} from '../games/flappy/flappyGame';
import {createFroggerGame} from '../games/frogger/froggerGame';
import {createHelicopterGame} from '../games/helicopter/helicopterGame';
import {createCentipedeGame} from '../games/centipede/centipedeGame';
import {createMissileCommandGame} from '../games/missileCommand/missileCommandGame';
import {createPongGame} from '../games/pong/pongGame';
import {createRhythmGame} from '../games/rhythm/rhythmGame';
import {createRunnerGame} from '../games/runner/runnerGame';
import {createSnakeGame} from '../games/snake/snakeGame';
import {createSpaceInvadersGame} from '../games/spaceInvaders/spaceInvadersGame';
import {createTetrisGame} from '../games/tetris/tetrisGame';
import {createTronGame} from '../games/tron/tronGame';

const ACTIVE_GRAPH_CLASS = 'commit-arcade-game-active';

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
  let activeArcadeBoard: ArcadeBoard | null = null;
  let activeSession: HTMLElement | null = null;
  let activeMenu: HTMLElement | null = null;
  let activeMenuGames: readonly GameMetadata[] = [];
  let activeMenuSelection = 0;
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
  lazyGraphObserver.observe(root.documentElement, {childList: true, subtree: true});
  root.addEventListener('turbo:render', rescanGraph, {signal: abortController.signal});
  view.addEventListener('popstate', rescanGraph, {signal: abortController.signal});

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
      if (activeMenu !== null) {
        closeGameMenu(button);
        return;
      }
      if (!settingsLoaded) {
        void settingsPromise.finally(() => {
          if (activeEngine === null && activeSession === null && graph.container.querySelector('.commit-arcade-picker') === null) {
            openGameMenu(button);
          }
        });
        return;
      }
      openGameMenu(button);
    }, {
      signal: abortController.signal,
    });
    graph.container.append(button);
    ownedElements.push(button);
    root.addEventListener(
      'visibilitychange',
      () => {
        if (root.hidden && activeEngine !== null) {
          stopGame(activeButton);
          showMessage(root, graph.container, ownedElements, 'Paused. Commit Arcade restored the graph.');
        }
      },
      {signal: abortController.signal},
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
    activeMenu?.remove();
    activeMenu = null;
    activeMenuGames = [];
    inputManager.deactivate();
    activeGame = playableGame;
    activeScore = 0;
    activeStatus = 'Playing';
    selectedGame = game.id;
    persistSettings({selectedGame});
    activeSnapshot ??= snapshotCells(graph.cells.map((cell) => cell.element));
    graph.container.classList.add(ACTIVE_GRAPH_CLASS);
    activeSession = showSession(root, graph.container, ownedElements, {
      game: playableGame,
      highScore: highScores[game.id] ?? 0,
      onRestart: () => restartGame(button),
      onStop: () => stopGame(button),
      score: activeScore,
      status: activeStatus,
    });
    const board = ensureArcadeBoard(graph, button);
    board.element.setAttribute('aria-hidden', 'true');
    const renderer = createBoardRenderer(board.graph);
    activeEngine = createGameEngine({
      renderer,
      size: board.graph.size,
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
        persistSettings({highScores: {...highScores}});
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
    activeMenu?.remove();
    activeMenu = null;
    activeMenuGames = [];
    if (activeSnapshot !== null) {
      restoreSnapshot(activeSnapshot);
      activeSnapshot = null;
    }
    activeArcadeBoard?.destroy();
    activeArcadeBoard = null;
    activeGraph?.container.classList.remove(ACTIVE_GRAPH_CLASS);
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

  function openGameMenu(button: HTMLButtonElement): void {
    if (activeGraph === null) {
      return;
    }
    const graph = activeGraph;
    activeSnapshot ??= snapshotCells(graph.cells.map((cell) => cell.element));
    graph.container.classList.add(ACTIVE_GRAPH_CLASS);
    const board = ensureArcadeBoard(graph, button);
    board.element.removeAttribute('aria-hidden');
    activeMenuGames = orderedGames(selectedGame);
    activeMenuSelection = 0;
    activeMenu = showBoardGameMenu(root, board.element, activeMenuGames, activeMenuSelection, {
      onChoose: (game) => startGame(game, button),
      onHover: (index) => {
        activeMenuSelection = index;
        renderMenuSelection();
      },
    });
    inputManager.activate(new Set(['ArrowUp', 'ArrowDown', 'Enter', 'Escape']), (input) => {
      if (input.type !== 'down' || activeMenu === null) {
        return;
      }
      if (input.key === 'Escape') {
        closeGameMenu(button);
        return;
      }
      if (input.key === 'Enter') {
        const game = activeMenuGames[activeMenuSelection];
        if (game !== undefined) {
          startGame(game, button);
        }
        return;
      }
      activeMenuSelection = wrapMenuSelection(input.key === 'ArrowUp' ? activeMenuSelection - 1 : activeMenuSelection + 1, activeMenuGames.length);
      renderMenuSelection();
    });
    button.textContent = '× Close';
    button.setAttribute('aria-label', 'Close Commit Arcade menu');
    activeButton = button;
  }

  function closeGameMenu(button: HTMLButtonElement | null): void {
    inputManager.deactivate();
    activeMenu?.remove();
    activeMenu = null;
    activeMenuGames = [];
    if (activeSnapshot !== null) {
      restoreSnapshot(activeSnapshot);
      activeSnapshot = null;
    }
    activeArcadeBoard?.destroy();
    activeArcadeBoard = null;
    activeGraph?.container.classList.remove(ACTIVE_GRAPH_CLASS);
    activeButton = null;
    if (button !== null) {
      button.textContent = '▶ Play';
      button.setAttribute('aria-label', 'Play Commit Arcade');
    }
  }

  function ensureArcadeBoard(graph: NonNullable<typeof activeGraph>, button: HTMLButtonElement): ArcadeBoard {
    if (activeArcadeBoard === null) {
      activeArcadeBoard = createArcadeBoard(root, graph);
      button.insertAdjacentElement('beforebegin', activeArcadeBoard.element);
    }
    return activeArcadeBoard;
  }

  function renderMenuSelection(): void {
    if (activeMenu === null) {
      return;
    }
    updateBoardGameMenuSelection(activeMenu, activeMenuSelection);
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

interface BoardGameMenuHandlers {
  onChoose: (game: GameMetadata) => void;
  onHover: (index: number) => void;
}

function showBoardGameMenu(
  root: Document,
  board: HTMLElement,
  games: readonly GameMetadata[],
  selectedIndex: number,
  handlers: BoardGameMenuHandlers,
): HTMLElement {
  board.querySelector('.commit-arcade-picker')?.remove();
  const picker = root.createElement('div');
  picker.className = 'commit-arcade-picker commit-arcade-board-menu';
  picker.setAttribute('role', 'menu');
  picker.setAttribute('aria-label', 'Choose a game');

  games.forEach((game, index) => {
    const item = root.createElement('button');
    item.type = 'button';
    item.className = 'commit-arcade-picker-item commit-arcade-board-menu-item';
    item.textContent = game.name;
    item.setAttribute('role', 'menuitem');
    item.setAttribute('aria-label', game.status === 'playable' ? `Start ${game.name}. ${game.description}` : `${game.name}. Planned game.`);
    item.dataset.commitArcadeMenuIndex = String(index);
    if (game.status === 'planned') {
      item.disabled = true;
      item.setAttribute('aria-disabled', 'true');
    } else {
      item.addEventListener('click', () => handlers.onChoose(game));
      item.addEventListener('keydown', (event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          handlers.onChoose(game);
        }
      });
      item.addEventListener('pointerenter', () => handlers.onHover(index));
      item.addEventListener('focus', () => handlers.onHover(index));
    }
    picker.append(item);
  });

  board.append(picker);
  updateBoardGameMenuSelection(picker, selectedIndex);
  return picker;
}

function orderedGames(selectedGame: string): readonly GameMetadata[] {
  const selected = gameRegistry.find((game) => game.id === selectedGame);
  if (selected === undefined) {
    return gameRegistry;
  }
  return [selected, ...gameRegistry.filter((game) => game.id !== selectedGame)];
}

function updateBoardGameMenuSelection(menu: HTMLElement, selectedIndex: number): void {
  for (const item of Array.from(menu.querySelectorAll<HTMLElement>('.commit-arcade-board-menu-item'))) {
    const isSelected = Number(item.dataset.commitArcadeMenuIndex) === selectedIndex;
    item.setAttribute('aria-current', isSelected ? 'true' : 'false');
    item.setAttribute('aria-selected', isSelected ? 'true' : 'false');
    item.tabIndex = isSelected ? 0 : -1;
    if (isSelected && item.ownerDocument.activeElement !== item) {
      item.focus({preventScroll: true});
    }
  }
}

function wrapMenuSelection(index: number, length: number): number {
  if (length <= 0) {
    return 0;
  }
  return (index + length) % length;
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
    case 'pong':
      return createPongGame();
    case 'breakout':
      return createBreakoutGame();
    case 'space-invaders':
      return createSpaceInvadersGame();
    case 'tron':
      return createTronGame();
    case 'frogger':
      return createFroggerGame();
    case 'helicopter':
      return createHelicopterGame();
    case 'rhythm':
      return createRhythmGame();
    case 'missile-command':
      return createMissileCommandGame();
    case 'centipede':
      return createCentipedeGame();
    case 'tetris':
      return createTetrisGame();
    case 'asteroids':
      return createAsteroidsGame();
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
  container.append(message);
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
  container.append(session);
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
    case 'pong':
      return new Set(['ArrowUp', 'ArrowDown', 'w', 's', 'W', 'S', 'Escape']);
    case 'breakout':
      return new Set(['ArrowLeft', 'ArrowRight', 'a', 'd', 'A', 'D', 'Escape']);
    case 'space-invaders':
      return new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Space', 'a', 'd', 'A', 'D', 'Escape']);
    case 'tron':
      return new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Escape']);
    case 'frogger':
      return new Set(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D', 'Escape']);
    case 'helicopter':
      return new Set(['ArrowUp', ' ', 'Space', 'Escape']);
    case 'rhythm':
      return new Set(['ArrowLeft', 'ArrowDown', 'ArrowUp', 'ArrowRight', 'a', 's', 'd', 'f', 'A', 'S', 'D', 'F', 'Escape']);
    case 'missile-command':
    case 'centipede':
      return new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Space', 'a', 'd', 'A', 'D', 'Escape']);
    case 'tetris':
      return new Set(['ArrowLeft', 'ArrowRight', 'ArrowDown', 'a', 'd', 's', 'A', 'D', 'S', 'Escape']);
    case 'asteroids':
      return new Set(['ArrowLeft', 'ArrowRight', 'ArrowUp', ' ', 'Space', 'a', 'd', 'A', 'D', 'Escape']);
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
    case 'pong':
      return 'Move paddle with Up/Down or W/S. Esc stops.';
    case 'breakout':
      return 'Move paddle with Left/Right or A/D. Esc stops.';
    case 'space-invaders':
      return 'Move with Left/Right, fire with Up or Space. Esc stops.';
    case 'tron':
      return 'Turn with arrows or WASD. Esc stops.';
    case 'frogger':
      return 'Hop with arrows or WASD. Esc stops.';
    case 'helicopter':
      return 'Hold Up or Space to rise. Esc stops.';
    case 'rhythm':
      return 'Hit lanes with A/S/D/F or arrows. Esc stops.';
    case 'missile-command':
      return 'Move with Left/Right, fire with Up or Space. Esc stops.';
    case 'centipede':
      return 'Move with Left/Right, fire with Up or Space. Esc stops.';
    case 'tetris':
      return 'Move with Left/Right, drop with Down. Esc stops.';
    case 'asteroids':
      return 'Move with Left/Right, fire with Up or Space. Esc stops.';
    default:
      return 'Esc stops.';
  }
}

if (typeof document !== 'undefined' && !document.documentElement.dataset.commitArcadeReady) {
  initializeCommitArcade(document);
}
