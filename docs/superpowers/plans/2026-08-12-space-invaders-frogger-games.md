# Space Invaders And Frogger Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Space Invaders and Frogger as playable Commit Arcade games on the contribution graph.

**Architecture:** Keep each game as an isolated `CommitArcadeGame` module with deterministic options for tests. Wire the
new modules through the existing registry, picker, factory, input filtering, HUD help and static games documentation.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade board renderer and game engine.

## Global Constraints

- Keep games local-only with no network calls or new permissions.
- Preserve graph restoration and active-game background neutralization.
- Keep controls compact and compatible with the existing HUD.
- Tune for 7-row GitHub contribution grids.

---

### Task 1: Space Invaders

**Files:**

- Create: `extension/shared/games/spaceInvaders/spaceInvadersGame.ts`
- Create: `extension/shared/games/spaceInvaders/spaceInvadersGame.test.ts`

**Interfaces:**

- Produces: `createSpaceInvadersGame(options?: SpaceInvadersOptions): CommitArcadeGame`.

- [ ] Write failing tests for start rendering, player movement, projectile collision scoring and invader descent game
  over.
- [ ] Run `npm test -- extension/shared/games/spaceInvaders/spaceInvadersGame.test.ts` and confirm it fails.
- [ ] Implement player, projectile, invader wave movement, scoring and game over.
- [ ] Run the same test and confirm it passes.

### Task 2: Frogger

**Files:**

- Create: `extension/shared/games/frogger/froggerGame.ts`
- Create: `extension/shared/games/frogger/froggerGame.test.ts`

**Interfaces:**

- Produces: `createFroggerGame(options?: FroggerOptions): CommitArcadeGame`.

- [ ] Write failing tests for start rendering, grid movement, collision game over and goal scoring.
- [ ] Run `npm test -- extension/shared/games/frogger/froggerGame.test.ts` and confirm it fails.
- [ ] Implement player movement, moving traffic lanes, wraparound and goal reset.
- [ ] Run the same test and confirm it passes.

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

- Consumes: `createSpaceInvadersGame`, `createFroggerGame`.

- [ ] Mark Space Invaders and Frogger as playable in registry tests.
- [ ] Wire factories, controls and help text.
- [ ] Update public docs and docs tests.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build:chrome`, and `npm run build:firefox`.
