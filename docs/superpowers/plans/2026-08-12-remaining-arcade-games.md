# Remaining Arcade Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Tron, Helicopter and Commit Beat as playable Commit Arcade games.

**Architecture:** Implement each game as an isolated `CommitArcadeGame` module with deterministic options for tests.
Wire all three through the existing registry, picker, factory, input filtering, HUD help and static games documentation.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade board renderer and game engine.

## Global Constraints

- Keep games local-only with no network calls or new permissions.
- Preserve graph restoration and active-game background neutralization.
- Tune all behavior for 7-row GitHub contribution grids.
- Keep HUD control copy compact.

---

### Task 1: Tron

**Files:**

- Create: `extension/shared/games/tron/tronGame.ts`
- Create: `extension/shared/games/tron/tronGame.test.ts`

**Interfaces:**

- Produces: `createTronGame(options?: TronOptions): CommitArcadeGame`.

- [ ] Write failing tests for initial render, turning, trail collision game over and scoring by distance.
- [ ] Implement light-cycle movement with a persistent trail and one-cell-per-step ticks.
- [ ] Run targeted tests.

### Task 2: Helicopter

**Files:**

- Create: `extension/shared/games/helicopter/helicopterGame.ts`
- Create: `extension/shared/games/helicopter/helicopterGame.test.ts`

**Interfaces:**

- Produces: `createHelicopterGame(options?: HelicopterOptions): CommitArcadeGame`.

- [ ] Write failing tests for start rendering, press-to-rise input, tunnel collision and scoring.
- [ ] Implement gravity, thrust and scrolling tunnel columns.
- [ ] Run targeted tests.

### Task 3: Commit Beat

**Files:**

- Create: `extension/shared/games/rhythm/rhythmGame.ts`
- Create: `extension/shared/games/rhythm/rhythmGame.test.ts`

**Interfaces:**

- Produces: `createRhythmGame(options?: RhythmOptions): CommitArcadeGame`.

- [ ] Write failing tests for notes rendering, lane hits, misses and scoring.
- [ ] Implement four-lane rhythm notes moving toward a hit row.
- [ ] Run targeted tests.

### Task 4: Product Wiring

**Files:**

- Modify: `extension/shared/core/gameRegistry.ts`
- Modify: `extension/shared/core/gameRegistry.test.ts`
- Modify: `extension/shared/src/contentScript.ts`
- Modify: `extension/shared/src/contentScript.test.ts`
- Modify: `docs/games.html`
- Modify: `docs/index.html`
- Modify: `scripts/store-assets.test.ts`

**Interfaces:**

- Consumes: `createTronGame`, `createHelicopterGame`, `createRhythmGame`.

- [ ] Mark all games playable in registry tests.
- [ ] Wire factories, controls and help text.
- [ ] Update public docs and docs tests.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build:chrome`, and `npm run build:firefox`.
