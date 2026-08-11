# Commit Arcade MVP Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the first usable Commit Arcade WebExtension MVP from the project specification.

**Architecture:** Keep all behavior in `extension/shared`; browser folders only package the shared content script and assets. Isolate GitHub DOM discovery, rendering, input, settings, game lifecycle, and game logic behind small TypeScript modules.

**Tech Stack:** TypeScript, DOM APIs, WebExtensions APIs, CSS, esbuild, Vitest, jsdom.

## Global Constraints

- UI text and code identifiers are English.
- Gameplay runs locally with no backend, analytics, telemetry, or network requests.
- The GitHub contribution grid is never resized, replaced with canvas, or permanently modified.
- Game modules never manipulate GitHub DOM directly.
- Chromium uses Manifest V3; Firefox uses the closest compatible WebExtension target.
- Safari packaging is documented, not duplicated.
- Strict TypeScript is required.

---

### Task 1: Workspace, Build, and Test Scaffold

**Files:**
- Create: `package.json`
- Create: `tsconfig.json`
- Create: `vitest.config.ts`
- Create: `scripts/build-extension.mjs`
- Create: `extension/shared/src/contentScript.ts`
- Create: `extension/shared/styles/content.css`
- Create: `extension/chrome/manifest.json`
- Create: `extension/firefox/manifest.json`
- Create: `extension/safari/README.md`

**Interfaces:**
- Produces: `npm run typecheck`, `npm test`, `npm run build:chrome`, `npm run build:firefox`
- Produces: shared entrypoint `extension/shared/src/contentScript.ts`

- [ ] Write minimal test scaffold using Vitest.
- [ ] Verify the scaffold fails before config exists.
- [ ] Add package/build/typecheck/test configuration.
- [ ] Add placeholder content script and manifests.
- [ ] Run `npm install`, `npm run typecheck`, `npm test`, and browser builds.

### Task 2: Board Model and Snapshot

**Files:**
- Create: `extension/shared/core/board.ts`
- Create: `extension/shared/core/stateSnapshot.ts`
- Test: `extension/shared/core/board.test.ts`
- Test: `extension/shared/core/stateSnapshot.test.ts`

**Interfaces:**
- Produces: `BoardSize`, `BoardCoordinate`, `PixelState`, `BoardFrame`, `createEmptyFrame(size)`, `getCellIndex(size, coordinate)`
- Produces: `snapshotCells(cells)` and `restoreSnapshot(snapshot)`

- [ ] Write failing tests for board indexing and empty frames.
- [ ] Implement board helpers.
- [ ] Write failing tests for snapshot/restore of attributes, classes, inline styles, text, and owned data attributes.
- [ ] Implement snapshot/restore.
- [ ] Run focused tests and type-check.

### Task 3: GitHub Graph Adapter and Renderer

**Files:**
- Create: `extension/shared/core/githubContributionGraph.ts`
- Create: `extension/shared/core/boardRenderer.ts`
- Test: `extension/shared/core/githubContributionGraph.test.ts`
- Test: `extension/shared/core/boardRenderer.test.ts`

**Interfaces:**
- Produces: `findContributionGraph(root: ParentNode): ContributionGraph | null`
- Produces: `createBoardRenderer(graph: ContributionGraph): BoardRenderer`

- [ ] Write failing DOM tests for graph discovery from SVG rect cells and table-like fixtures.
- [ ] Implement graph discovery, coordinate extraction, original-state capture, and safe null result.
- [ ] Write failing renderer tests for semantic classes and diffed updates.
- [ ] Implement renderer with extension-owned classes and CSS variables.
- [ ] Run focused tests and type-check.

### Task 4: Input, Settings, Registry, and Engine

**Files:**
- Create: `extension/shared/core/inputManager.ts`
- Create: `extension/shared/core/settings.ts`
- Create: `extension/shared/core/gameTypes.ts`
- Create: `extension/shared/core/gameRegistry.ts`
- Create: `extension/shared/core/gameEngine.ts`
- Test: matching `*.test.ts` files under `extension/shared/core`

**Interfaces:**
- Produces: `createInputManager(target)`, `loadSettings()`, `saveSettings(patch)`, `createGameEngine(options)`, `gameRegistry`

- [ ] Write failing tests for active-only key capture and `preventDefault` filtering.
- [ ] Implement input manager.
- [ ] Write failing tests for settings defaults and storage failure fallback.
- [ ] Implement settings wrapper.
- [ ] Write failing tests for registry playable/planned entries.
- [ ] Implement registry and game interfaces.
- [ ] Write failing tests for engine start/stop/error cleanup.
- [ ] Implement engine lifecycle.

### Task 5: MVP Games

**Files:**
- Create: `extension/shared/games/runner/runnerGame.ts`
- Create: `extension/shared/games/snake/snakeGame.ts`
- Create: `extension/shared/games/flappy/flappyGame.ts`
- Test: matching `*.test.ts` files

**Interfaces:**
- Produces: `createRunnerGame()`, `createSnakeGame()`, `createFlappyGame()`

- [ ] Write failing tests for Runner jump, obstacle movement, collision, and score.
- [ ] Implement Runner.
- [ ] Write failing tests for Snake movement, growth, food spawn, and collision.
- [ ] Implement Snake.
- [ ] Write failing tests for Flappy gravity, flap, barrier movement, scoring, and collision.
- [ ] Implement Flappy Commit.

### Task 6: Content Script UI and Styles

**Files:**
- Modify: `extension/shared/src/contentScript.ts`
- Modify: `extension/shared/styles/content.css`
- Test: `extension/shared/src/contentScript.test.ts`

**Interfaces:**
- Consumes: graph adapter, renderer, engine, registry, settings, input manager

- [ ] Write failing DOM tests for one Play button, no duplicate injection, picker rendering, and Stop cleanup.
- [ ] Implement page controller and compact picker.
- [ ] Add theme-aware CSS and accessible focus states.
- [ ] Run DOM tests and type-check.

### Task 7: Assets, Docs, and Workflows

**Files:**
- Create: `docs/assets/logo.svg`
- Create: `docs/assets/logo-mark.svg`
- Create: `extension/shared/assets/logo.svg`
- Create: `extension/shared/assets/icons/*.svg`
- Create: `docs/index.html`
- Create: `docs/games.html`
- Create: `docs/privacy.html`
- Create: `docs/styles/site.css`
- Create: `.github/workflows/ci.yml`
- Create: `.github/workflows/build-extensions.yml`
- Create: `.github/workflows/pages.yml`

**Interfaces:**
- Consumes: browser manifests and build outputs

- [ ] Add SVG logos and icon variants.
- [ ] Add lightweight GitHub Pages site and privacy page.
- [ ] Add CI, release build, and Pages workflows.
- [ ] Run full verification.
