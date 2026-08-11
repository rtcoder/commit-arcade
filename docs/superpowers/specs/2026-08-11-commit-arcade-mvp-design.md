# Commit Arcade MVP Design

## Source

This design condenses `commit-arcade-codex.md` into an implementation-ready MVP. The product decision is already made: Commit Arcade is a cross-browser extension that turns the visible GitHub contribution graph into a tiny pixel-game display without resizing or replacing the graph.

## Scope

The MVP builds the reusable architecture, browser packages, static docs, and three playable games:

- Commit Runner
- Snake
- Flappy Commit

The registry must also represent Pong, Breakout, Space Invaders, Tron, Frogger, Helicopter, and Commit Beat as planned games so the runtime shape is future-proof without shipping broken launch entries.

## Architecture

The extension is a small TypeScript WebExtension. Browser-specific folders contain manifests and generated build output. All runtime, games, styles, assets, and types live under `extension/shared`.

GitHub DOM access is isolated in `githubContributionGraph.ts`. It discovers the visible contribution grid, snapshots the original cell state, computes board coordinates, and watches navigation changes. Games only see a logical board and renderer. They never touch GitHub cells directly.

The game engine owns lifecycle, fixed-step updates, rendering, scoring callbacks, and cleanup. The input manager only captures keys while a game is active and releases them immediately on stop, navigation, or hidden-tab pause.

## Components

- `extension/shared/core/board.ts`: board coordinates, pixel states, and frame helpers.
- `extension/shared/core/githubContributionGraph.ts`: GitHub graph discovery and DOM cell metadata.
- `extension/shared/core/stateSnapshot.ts`: exact restoration of modified cell state.
- `extension/shared/core/boardRenderer.ts`: semantic pixel states to GitHub-compatible DOM presentation.
- `extension/shared/core/inputManager.ts`: active-game keyboard handling.
- `extension/shared/core/gameEngine.ts`: game loop and lifecycle.
- `extension/shared/core/gameRegistry.ts`: playable and planned game metadata.
- `extension/shared/core/settings.ts`: local extension storage for selected game, sound flag, and high scores.
- `extension/shared/src/contentScript.ts`: page controller, Play/Stop button, picker, navigation wiring.
- `extension/shared/games/*`: game modules.

## Data Flow

On a GitHub profile page, the content script asks the graph adapter for a graph. When found, it injects one controller near the contribution controls. Pressing Play opens a compact picker. Starting a game snapshots the original graph, starts input capture, runs the engine, renders logical frames through the renderer, and updates only changed cells. Stopping a game tears down input, stops timers, and restores the graph from the snapshot.

Settings and high scores stay in browser local storage. Contribution history is never stored or uploaded.

## Error Handling

Missing graph means no page modification. A game crash stops the engine, releases keyboard handlers, restores the graph, and shows a small non-blocking message. Navigation cleanup is idempotent, so GitHub SPA transitions cannot create duplicate controllers.

## Testing

Unit tests cover board helpers, snapshot/restore behavior, input key filtering, engine cleanup, and MVP game logic. DOM tests use controlled fixtures for GitHub contribution graphs. Build verification includes type-check, tests, Chromium build, and Firefox build.

## Deferred Work

Full implementations of the seven non-MVP games, Contribution Mode, achievements, local stats, per-game difficulty, and release-store polish remain roadmap work.

## Contribution Mode Data Contract

Contribution Mode is future work, but the core now has a small data contract so the snapshot and adapter preserve the right information without storing private history. `deriveContributionModeFrame(graph)` maps normalized contribution intensity to logical pixels:

- `0` -> `empty`
- `1` -> `bonus`
- `2` or `3` -> `obstacle`
- `4` and above -> `enemy`

`createContributionModeSeed(graph, gameId)` returns only `{ schemaVersion, gameId, rows, columns, intensityBuckets }`. It deliberately excludes dates, contribution counts beyond normalized buckets, URLs, user names, and any browser history. Sharing a future level seed should share this generated configuration, not raw profile data.
