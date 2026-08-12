# Tetris And Asteroids Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Mini Tetris and Asteroids as playable Commit Arcade games.

**Architecture:** Implement each game as an isolated `CommitArcadeGame` module with deterministic test options. Wire both through registry, content-script factory, input filtering, HUD help and public games documentation.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade board renderer and game engine.

## Global Constraints

- Keep games local-only with no network calls or new permissions.
- Tune for 7-row GitHub contribution grids.
- Preserve graph restoration and active-game background neutralization.
- Keep HUD control copy compact.

---

### Task 1: Mini Tetris

**Files:**
- Create: `extension/shared/games/tetris/tetrisGame.ts`
- Create: `extension/shared/games/tetris/tetrisGame.test.ts`

**Interfaces:**
- Produces: `createTetrisGame(options?: TetrisOptions): CommitArcadeGame`.

- [ ] Write failing tests for initial piece rendering, horizontal movement, locking/scoring and spawn-block game over.
- [ ] Implement a compact 2x2 block dropper with settled cells and score callbacks.
- [ ] Run targeted tests.

### Task 2: Asteroids

**Files:**
- Create: `extension/shared/games/asteroids/asteroidsGame.ts`
- Create: `extension/shared/games/asteroids/asteroidsGame.test.ts`

**Interfaces:**
- Produces: `createAsteroidsGame(options?: AsteroidsOptions): CommitArcadeGame`.

- [ ] Write failing tests for ship rendering, movement, projectile scoring and asteroid collision game over.
- [ ] Implement falling asteroids, player ship and upward projectile collision.
- [ ] Run targeted tests.

### Task 3: Product Wiring

**Files:**
- Modify: `extension/shared/core/gameRegistry.ts`
- Modify: `extension/shared/core/gameRegistry.test.ts`
- Modify: `extension/shared/src/contentScript.ts`
- Modify: `extension/shared/src/contentScript.test.ts`
- Modify: `docs/games.html`
- Modify: `docs/index.html`
- Modify: `scripts/store-assets.test.ts`

**Interfaces:**
- Consumes: `createTetrisGame`, `createAsteroidsGame`.

- [ ] Add registry entries as playable games.
- [ ] Wire factories, input keys and HUD help text.
- [ ] Update public docs and docs tests.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build:chrome`, and `npm run build:firefox`.
