# Synthetic Arcade Board Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Render games on a larger synthetic board instead of the native 7-row GitHub contribution graph.

**Architecture:** Keep GitHub graph detection as the anchor for the Play control and column count. Create a temporary DOM-backed `ContributionGraph` with 21 rows and the source graph's columns for gameplay, then remove it on stop while preserving existing source graph restore behavior.

**Tech Stack:** TypeScript, Vitest, existing Commit Arcade board renderer and content script lifecycle.

## Global Constraints

- Default synthetic board rows: 21.
- Clamp configurable rows to 15-25.
- Keep original GitHub graph DOM restorable and avoid modifying source contribution data.
- Keep renderer compatible with existing `ContributionGraph` interface.

---

### Task 1: Synthetic Board Helper

**Files:**
- Create: `extension/shared/core/arcadeBoard.ts`
- Create: `extension/shared/core/arcadeBoard.test.ts`

**Interfaces:**
- Produces: `createArcadeBoard(root: Document, sourceGraph: ContributionGraph, options?: ArcadeBoardOptions): ArcadeBoard`.

- [ ] Write failing tests for default 21-row board, row clamping and cleanup.
- [ ] Implement DOM board creation and synthetic `ContributionGraph` cells.
- [ ] Run targeted tests.

### Task 2: Content Script Wiring

**Files:**
- Modify: `extension/shared/src/contentScript.ts`
- Modify: `extension/shared/src/contentScript.test.ts`
- Modify: `extension/shared/styles/content.css`
- Modify: `scripts/store-assets.test.ts`

**Interfaces:**
- Consumes: `createArcadeBoard`.

- [ ] Write failing tests that starting a game creates a 21-row board and removes it on stop.
- [ ] Wire renderer and engine size to synthetic board graph.
- [ ] Add CSS for dense synthetic board cells.
- [ ] Run full verification.
