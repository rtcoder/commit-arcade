# Pong And Breakout Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Pong and Breakout as playable Commit Arcade games on the GitHub contribution graph.

**Architecture:** Follow the existing `CommitArcadeGame` interface with isolated game modules under
`extension/shared/games`. Keep each game deterministic in tests through injected options, and wire them through the
existing registry, factory, input and HUD copy paths.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade board renderer and game engine.

## Global Constraints

- Keep games local-only with no network calls or new permissions.
- Support narrow GitHub contribution grids, especially 7-row by 52-ish-column boards.
- Preserve existing graph restoration behavior.
- Keep controls compact enough for the existing HUD.

---

### Task 1: Pong Game

**Files:**

- Create: `extension/shared/games/pong/pongGame.ts`
- Create: `extension/shared/games/pong/pongGame.test.ts`

**Interfaces:**

- Consumes: `CommitArcadeGame`, `GameContext`, `GameInput`, `createEmptyFrame`.
- Produces: `createPongGame(options?: PongOptions): CommitArcadeGame`.

- [ ] Write failing tests for paddle movement, ball bounce, scoring and game over.
- [ ] Run `npm test -- extension/shared/games/pong/pongGame.test.ts` and confirm it fails.
- [ ] Implement one-player Pong with left player paddle, right AI paddle, ball physics and score callbacks.
- [ ] Run `npm test -- extension/shared/games/pong/pongGame.test.ts` and confirm it passes.

### Task 2: Breakout Game

**Files:**

- Create: `extension/shared/games/breakout/breakoutGame.ts`
- Create: `extension/shared/games/breakout/breakoutGame.test.ts`

**Interfaces:**

- Consumes: `CommitArcadeGame`, `GameContext`, `GameInput`, `createEmptyFrame`.
- Produces: `createBreakoutGame(options?: BreakoutOptions): CommitArcadeGame`.

- [ ] Write failing tests for paddle movement, brick hit scoring, wall bounce and bottom miss game over.
- [ ] Run `npm test -- extension/shared/games/breakout/breakoutGame.test.ts` and confirm it fails.
- [ ] Implement Breakout with top-row bricks, bottom paddle and discrete ball movement.
- [ ] Run `npm test -- extension/shared/games/breakout/breakoutGame.test.ts` and confirm it passes.

### Task 3: Registry And UI Wiring

**Files:**

- Modify: `extension/shared/core/gameRegistry.ts`
- Modify: `extension/shared/src/contentScript.ts`
- Modify: `extension/shared/core/gameRegistry.test.ts`
- Modify: `extension/shared/src/contentScript.test.ts`
- Modify: `docs/games.html`

**Interfaces:**

- Consumes: `createPongGame`, `createBreakoutGame`.
- Produces: playable picker entries and controls help for Pong and Breakout.

- [ ] Write failing tests that registry exposes Pong and Breakout as playable and picker can start both.
- [ ] Run targeted registry/content script tests and confirm they fail.
- [ ] Wire factories, keyboard controls and help text.
- [ ] Update games documentation copy.
- [ ] Run full `npm test`, `npm run typecheck`, `npm run build:chrome`, and `npm run build:firefox`.
