# Missile Command And Centipede Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add Missile Command and Centipede as playable Commit Arcade games.

**Architecture:** Implement each game as an isolated `CommitArcadeGame` module with deterministic options for tests. Wire both through registry, content-script game factory, input filtering, HUD help and public games documentation.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade game engine and board renderer.

## Global Constraints

- Keep games local-only with no network calls or new permissions.
- Tune for 7-row GitHub contribution grids.
- Preserve graph restoration and active-game background neutralization.
- Keep HUD control copy compact.

---

### Task 1: Missile Command

**Files:**
- Create: `extension/shared/games/missileCommand/missileCommandGame.ts`
- Create: `extension/shared/games/missileCommand/missileCommandGame.test.ts`

**Interfaces:**
- Produces: `createMissileCommandGame(options?: MissileCommandOptions): CommitArcadeGame`.

- [ ] Write failing tests for base rendering, cannon movement, projectile interception scoring and base-hit game over.
- [ ] Implement falling missiles, player cannon, upward projectiles and score/game-over callbacks.
- [ ] Run targeted tests.

### Task 2: Centipede

**Files:**
- Create: `extension/shared/games/centipede/centipedeGame.ts`
- Create: `extension/shared/games/centipede/centipedeGame.test.ts`

**Interfaces:**
- Produces: `createCentipedeGame(options?: CentipedeOptions): CommitArcadeGame`.

- [ ] Write failing tests for segment rendering, player movement, projectile hit scoring and segment reaching player row game over.
- [ ] Implement centipede wave motion, player cannon and projectile collision.
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
- Consumes: `createMissileCommandGame`, `createCentipedeGame`.

- [ ] Add registry entries as playable games.
- [ ] Wire factories, input keys and HUD help text.
- [ ] Update public docs and docs tests.
- [ ] Run `npm test`, `npm run typecheck`, `npm run build:chrome`, and `npm run build:firefox`.
