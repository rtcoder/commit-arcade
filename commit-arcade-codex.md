# Commit Arcade — Codex Project Specification

## 1. Project goal

Build a cross-browser extension named **Commit Arcade** that turns the GitHub contribution graph on a user's profile into a tiny pixel-game screen.

The extension must inject a small **Play** button next to the GitHub contribution graph. Clicking the button switches the graph into game mode without changing its dimensions.

Core idea:

> **Play your GitHub contributions.**

The contribution graph is the display. Its existing grid dimensions remain unchanged.

The extension must be designed so additional games can be added later without rewriting the core runtime.

---

## 2. Product name and logo

### Product name

**Commit Arcade**

### Logo concept

Use this exact visual idea:

```text
>_ ▶
```

The project must include an SVG version of the logo.

Create:

```text
docs/assets/logo.svg
docs/assets/logo-mark.svg
extension/shared/assets/logo.svg
```

### SVG logo requirements

Generate the logo as vector SVG, not as a raster image embedded in SVG.

Design:

- terminal prompt: `>_`
- followed by a pixel/terminal-style play icon: `▶`
- monospace / developer-tool aesthetic
- minimalist
- readable at small sizes
- dark-theme friendly
- GitHub-inspired but do **not** copy GitHub trademarks or the Octocat
- default foreground should work on transparent background
- include `viewBox`
- no external fonts
- no external resources
- no JavaScript inside SVG
- SVG must remain editable by hand
- provide an accessible `<title>` and `<desc>`
- generate square icon variants from the same visual system for extension icons:
  - 16×16
  - 32×32
  - 48×48
  - 96×96
  - 128×128
  - 256×256

The square icon may use only the simplified `>_▶` mark if the full spacing is unreadable.

---

## 3. Repository structure

Use the following top-level structure:

```text
/
├── extension/
│   ├── shared/
│   │   ├── src/
│   │   ├── styles/
│   │   ├── assets/
│   │   ├── games/
│   │   ├── core/
│   │   └── types/
│   │
│   ├── chrome/
│   │   ├── manifest.json
│   │   └── build/
│   │
│   ├── firefox/
│   │   ├── manifest.json
│   │   └── build/
│   │
│   └── safari/
│       ├── README.md
│       └── build/
│
├── docs/
│   ├── index.html
│   ├── privacy.html
│   ├── games.html
│   ├── assets/
│   ├── styles/
│   └── scripts/
│
├── .github/
│   └── workflows/
│       ├── ci.yml
│       ├── build-extensions.yml
│       └── pages.yml
│
├── package.json
├── tsconfig.json
├── README.md
├── LICENSE
└── codex.md
```

### Browser strategy

The main supported browser families are:

- Google Chrome
- Microsoft Edge
- Brave
- Opera
- Vivaldi
- Firefox
- Safari

Chromium browsers should share the same implementation wherever possible.

`extension/chrome` is the canonical Chromium build target.

The following browsers should be able to use the Chromium package unless store-specific packaging requires otherwise:

- Chrome
- Edge
- Brave
- Opera
- Vivaldi

Firefox gets its own manifest/build target.

Safari gets a dedicated compatibility/package layer. Keep as much source code as possible in `extension/shared`. Document any Safari-specific Xcode / Safari Web Extension packaging requirements in `extension/safari/README.md`.

Do not duplicate game logic between browsers.

---

## 4. Technology

Preferred implementation:

- TypeScript
- DOM APIs
- WebExtensions API
- `webextension-polyfill` where useful
- CSS
- lightweight build tooling
- no heavy frontend framework unless clearly justified

Prefer:

- small bundle size
- no runtime dependencies that are unnecessary
- zero network requests required for gameplay
- deterministic local gameplay
- strict TypeScript configuration

The extension should function entirely locally after installation.

---

## 5. GitHub page integration

The extension operates on GitHub user profile pages containing a contribution graph.

Example page:

```text
https://github.com/<username>
```

The implementation must not rely on one fragile CSS selector.

Create a dedicated graph adapter responsible for:

- finding the contribution graph
- discovering all contribution cells
- preserving cell order
- determining row/column positions
- reading current visual state
- reading contribution intensity where available
- watching GitHub SPA/navigation changes
- restoring the original graph exactly after game mode ends

GitHub may change markup. Keep all GitHub-specific DOM logic isolated in one module.

Suggested module:

```text
extension/shared/core/githubContributionGraph.ts
```

---

## 6. Contribution grid constraints

The game board dimensions must be exactly the dimensions of the visible GitHub contribution graph.

Do **not**:

- add extra rows
- add extra columns
- stretch the graph into a larger playfield
- replace it with a canvas of another size
- resize the contribution cells
- permanently modify the GitHub DOM

Typical graph size is approximately:

```text
7 rows × 52–53 columns
```

But do not hard-code 53 columns. Detect the actual number of columns from the DOM.

Internally expose:

```ts
interface BoardSize {
  rows: number;
  columns: number;
}
```

---

## 7. Play button

Add a compact button next to the contribution graph controls.

Default state:

```text
▶ Play
```

Game mode state:

```text
■ Stop
```

The button should visually fit GitHub's existing UI.

Requirements:

- support GitHub light theme
- support GitHub dark theme
- support keyboard focus
- accessible `aria-label`
- do not interfere with GitHub's original contribution settings controls
- do not create duplicate buttons after client-side navigation
- restore graph state after stopping the game

When game mode starts:

1. Snapshot original cell state.
2. Disable normal hover tooltip behavior where necessary.
3. Start selected game.
4. Render game pixels using the original contribution cells.
5. Capture required keyboard input.
6. Prevent page scrolling only for keys currently used by the game.
7. Restore everything on exit.

---

## 8. Game architecture

Games must be modular.

Suggested interface:

```ts
export interface CommitArcadeGame {
  id: string;
  name: string;
  description: string;

  start(context: GameContext): void;
  update(deltaMs: number): void;
  handleInput(input: GameInput): void;
  render(renderer: BoardRenderer): void;
  stop(): void;
}
```

Suggested directory:

```text
extension/shared/games/
├── runner/
├── flappy/
├── snake/
├── pong/
├── breakout/
├── space-invaders/
├── tron/
├── frogger/
├── helicopter/
└── rhythm/
```

Core game runtime:

```text
extension/shared/core/
├── gameEngine.ts
├── board.ts
├── boardRenderer.ts
├── inputManager.ts
├── gameRegistry.ts
├── githubContributionGraph.ts
├── stateSnapshot.ts
└── settings.ts
```

The renderer must abstract away raw GitHub DOM manipulation.

Games must render logical cell states such as:

```ts
type PixelState =
  | 'empty'
  | 'player'
  | 'enemy'
  | 'obstacle'
  | 'projectile'
  | 'bonus'
  | 'trail'
  | 'accent';
```

The browser-specific renderer translates these states into GitHub-compatible cell styles.

---

## 9. Game selector

The extension should initially provide a simple game picker when the user clicks Play.

Keep it compact.

Possible interaction:

```text
Commit Arcade
─────────────
▶ Commit Runner
  Flappy Commit
  Snake
  Pong
  Breakout
  Space Invaders
  Tron
  Frogger
  Helicopter
  Commit Beat
```

Remember the last selected game locally.

Do not require an extension popup for the MVP.

The main interaction should happen directly beside the contribution graph.

---

# 10. Games

The architecture must support all ten games below.

The first implementation milestone may prioritize a smaller subset, but all ten must be represented in the game registry/specification.

---

## 10.1 Commit Runner

### Concept

A minimalist endless runner inspired by classic browser runner games.

The player remains near the left side of the board while the world moves from right to left.

### Controls

```text
Space / ArrowUp — jump
ArrowDown       — optional duck
Esc             — exit game
```

### Gameplay

- bottom row acts as the ground
- player occupies one cell or a tiny multi-cell sprite where feasible
- obstacles enter from the right
- obstacle speed gradually increases
- collision ends the run
- score is based on survival time / distance
- optional pickups can add score

### Why it fits

The contribution graph is extremely wide and short, which is ideal for a side-scrolling runner.

### Suggested display

```text
.....................................................
.....................................................
.....................................................
.....P...............................................
.....P.................#.............................
#####################################################
#####################################################
```

This should be the primary flagship game.

---

## 10.2 Flappy Commit

### Concept

A one-button side-scrolling game inspired by Flappy Bird.

### Controls

```text
Space / ArrowUp — flap
Esc             — exit game
```

### Gameplay

- player remains near the left side
- gravity continuously pulls the player down
- each key press creates upward velocity
- vertical barriers move from right to left
- every barrier contains a gap
- touching a barrier or board edge ends the game
- passing a barrier increases score

### Why it fits

The graph's long horizontal shape is ideal for continuously scrolling obstacles.

With only seven rows, gaps should generally be two or three cells high.

---

## 10.3 Snake

### Concept

Classic Snake played directly inside the contribution grid.

### Controls

```text
ArrowUp
ArrowDown
ArrowLeft
ArrowRight
WASD
Esc
```

### Gameplay

- snake begins with a short body
- food appears in an empty cell
- eating food increases snake length
- touching the snake body ends the game
- board edge behavior should be configurable internally:
  - default: collision
  - optional future mode: wrap-around
- increase speed gradually

### Rendering

Use different logical pixel states for:

- snake head
- snake body
- food

### Why it fits

Seven rows are sufficient because the graph has more than fifty columns, creating a distinctive panoramic Snake board.

---

## 10.4 Pong

### Concept

Minimal one-player Pong against AI.

### Controls

```text
W / ArrowUp   — move paddle up
S / ArrowDown — move paddle down
Esc           — exit
```

### Gameplay

- player paddle on the left
- AI paddle on the right
- ball travels through the grid
- paddle height: approximately two cells
- score when ball passes a paddle
- first to a configurable score wins
- AI should be imperfect, not unbeatable

### Technical note

A logical ball position may use sub-cell floating point coordinates and map to the closest graph cell when rendered.

This avoids poor movement caused by the very low vertical resolution.

---

## 10.5 Breakout

### Concept

Classic brick-breaking game.

### Controls

```text
ArrowLeft / A  — move paddle left
ArrowRight / D — move paddle right
Space          — launch ball
Esc            — exit
```

### Gameplay

- bricks occupy the top one or two rows
- paddle occupies several cells near the bottom
- ball bounces between walls, paddle and bricks
- destroyed bricks disappear
- player wins by removing all bricks
- missing the paddle costs a life or restarts the round

### Technical note

Use sub-cell velocity internally and quantize only when rendering.

---

## 10.6 Space Invaders

### Concept

A compressed interpretation of Space Invaders designed specifically for a seven-row board.

### Controls

```text
ArrowLeft / A
ArrowRight / D
Space — shoot
Esc
```

### Gameplay

- player ship occupies the bottom row
- enemies occupy one or two rows near the top
- enemy formation moves horizontally
- projectiles travel vertically
- enemies periodically shoot downward
- enemies descend after reaching a side boundary
- player wins after destroying the wave

### Constraints

Because vertical space is very limited:

- projectiles should move quickly
- no more than a small number of simultaneous bullets
- enemy sprites should usually occupy one cell

---

## 10.7 Tron / Light Cycles

### Concept

The player continuously moves and leaves a permanent trail.

Collision with any trail ends the round.

### Modes

Initial:

```text
Player vs AI
```

Future:

```text
Local 2-player
```

### Controls

Player 1:

```text
Arrow keys
```

Optional Player 2:

```text
WASD
```

### Gameplay

- movement continues automatically
- direction changes cannot immediately reverse into the previous cell
- every visited cell becomes a trail
- touching a trail or boundary ends the round
- AI should use lightweight pathfinding / survival heuristics

### Why it fits

The unusual 53×7 aspect ratio creates a fast, narrow Tron arena.

---

## 10.8 Frogger

### Concept

Each of the seven contribution rows becomes a traffic/environment lane.

### Controls

```text
Arrow keys / WASD
Esc
```

### Possible lane layout

```text
ROW 0 — Finish / safe zone
ROW 1 — traffic moving left
ROW 2 — traffic moving right
ROW 3 — traffic moving left
ROW 4 — traffic moving right
ROW 5 — optional logs / hazards
ROW 6 — Start / safe zone
```

### Gameplay

- player starts at the bottom
- goal is to reach the top
- hazards continuously move horizontally
- touching a vehicle resets the player or costs a life
- reaching the top increases level/score
- later levels increase traffic speed

### Why it fits

The fixed seven-row constraint becomes part of the game's design rather than a limitation.

---

## 10.9 Helicopter

### Concept

Inspired by classic one-button browser helicopter games.

The player flies through a scrolling tunnel.

### Controls

```text
Hold Space / mouse button — rise
Release                   — fall
Esc                       — exit
```

### Gameplay

- gravity pulls the player down
- holding the control applies upward acceleration
- tunnel walls and obstacles scroll from right to left
- hitting any wall ends the run
- score increases with distance
- tunnel becomes progressively harder

### Rendering

The upper and lower tunnel boundaries are represented by occupied cells.

The safe path remains between them.

### Why it fits

The contribution graph behaves naturally like a tiny horizontal oscilloscope-style tunnel.

---

## 10.10 Commit Beat

### Concept

A minimal rhythm game inspired by lane-based music games.

Working name:

**Commit Beat**

### Controls

For four lanes:

```text
A S D F
```

Alternative:

```text
1 2 3 4
```

### Gameplay

- notes travel horizontally toward a hit line
- four logical lanes fit inside the seven graph rows
- player presses the corresponding key when a note reaches the target column
- timing windows:
  - Perfect
  - Good
  - Miss
- combo multiplier
- score counter

### Audio

MVP should avoid copyrighted music.

Options:

- silent rhythm patterns
- procedural metronome/beeps using Web Audio API
- user-selectable BPM
- later support original/public-domain audio only

### Why it fits

The wide horizontal board maps naturally to a scrolling timeline.

---

# 11. Contribution-based gameplay mode

Design the engine so a future mode can interpret the user's real contribution data as game content.

Two conceptual modes:

```text
Arcade Mode
Contribution Mode
```

### Arcade Mode

The game uses the contribution cells purely as a display.

The original contribution values do not affect the game.

### Contribution Mode

The original contribution graph becomes input for procedural level generation.

Potential mapping:

```text
0 contributions     -> empty
low intensity       -> pickup
medium intensity    -> obstacle
high intensity      -> dangerous obstacle / special object
```

Do not require Contribution Mode for the first MVP, but preserve the original contribution intensity snapshot so it can be implemented later.

---

# 12. Rendering

Never delete the contribution grid.

Game rendering should alter presentation only.

Preferred order:

1. read original state
2. assign logical board coordinates to cells
3. temporarily add Commit Arcade CSS classes / attributes
4. update state each frame/tick
5. remove extension-owned classes/attributes on stop
6. restore original values

Avoid excessive DOM writes.

Only update cells whose logical state changed since the previous frame.

The game loop does not need 60 FPS.

Recommended range:

```text
8–30 logical updates per second
```

depending on game.

Use `requestAnimationFrame()` for visual scheduling where appropriate, while maintaining a deterministic fixed-step or delta-time based simulation.

---

# 13. Colors

The games should visually belong to GitHub.

Do not hard-code assumptions that work only in dark mode.

Create semantic variables, for example:

```css
--commit-arcade-empty
--commit-arcade-dim
--commit-arcade-player
--commit-arcade-enemy
--commit-arcade-accent
--commit-arcade-danger
```

Where possible derive or adapt colors from GitHub theme variables.

The classic GitHub green contribution palette may be used as the base inspiration.

Ensure sufficient distinction between game entities.

---

# 14. UI language

All extension UI, game UI and user-facing messages must be in **English**.

Examples:

```text
Play
Stop
Choose a game
Score
High score
Game over
Restart
Resume
Paused
Press Space to start
Use arrow keys to move
```

Internal technical documentation may be in English.

Code identifiers must be English.

---

# 15. Keyboard handling

Input handling must be centralized.

Requirements:

- capture keys only while a game is active
- call `preventDefault()` only for keys used by the active game
- typing elsewhere on the GitHub page must work normally outside game mode
- stop keyboard capture immediately when game mode ends
- support `Esc` as a universal exit key
- handle tab visibility changes
- automatically pause if the tab becomes hidden

---

# 16. Persistence

Use browser local extension storage.

Store:

```ts
interface CommitArcadeSettings {
  selectedGame: string;
  soundEnabled: boolean;
  highScores: Record<string, number>;
}
```

Do not store contribution history.

Do not send analytics in the initial version.

Do not send telemetry.

No backend is required.

---

# 17. Privacy

The extension should request the minimum permissions possible.

Target principle:

```text
GitHub profile DOM in -> local game -> nothing sent out
```

The public privacy page must clearly state:

- no account credentials are collected
- no contribution data is uploaded
- no browsing history is collected
- no telemetry by default
- no external analytics
- all gameplay data remains local in browser storage

Create:

```text
docs/privacy.html
```

---

# 18. GitHub Pages website

The `/docs` directory is the source for GitHub Pages.

Create a lightweight static website for **Commit Arcade**.

No framework is necessary.

Pages:

```text
docs/index.html
docs/games.html
docs/privacy.html
```

### Landing page

The landing page should include:

1. Commit Arcade logo
2. tagline:
   `Play your GitHub contributions.`
3. short explanation
4. visual representation/mockup of the contribution graph
5. Play button demonstration
6. supported browsers
7. game list
8. installation section
9. privacy statement
10. GitHub repository link
11. footer

### Visual direction

- GitHub/developer aesthetic
- terminal influences
- pixel-game details
- dark mode by default or automatic theme support
- responsive
- lightweight
- no heavy animation
- no third-party trackers

The site content must be in English.

---

# 19. GitHub Actions

Use GitHub Actions where useful.

## 19.1 CI

Create:

```text
.github/workflows/ci.yml
```

Run on pull requests and pushes.

Tasks:

- install dependencies
- lint
- type-check
- run unit tests
- build Chromium target
- build Firefox target

---

## 19.2 Extension builds

Create:

```text
.github/workflows/build-extensions.yml
```

On version tags such as:

```text
v1.0.0
```

Build distributable archives:

```text
commit-arcade-chrome-v1.0.0.zip
commit-arcade-firefox-v1.0.0.zip
```

Optionally create Edge/Opera packages from the Chromium build if required by store submission workflow.

Upload build artifacts to the GitHub Actions run.

If GitHub Releases are enabled, attach generated archives to the corresponding release.

Safari packaging may require a macOS runner and Xcode. Keep Safari build automation separate if it significantly complicates the normal CI pipeline.

---

## 19.3 GitHub Pages deployment

Create:

```text
.github/workflows/pages.yml
```

Deploy `/docs` to GitHub Pages.

Trigger:

- push to the default branch when files under `/docs/**` change
- manual `workflow_dispatch`

Use the official GitHub Pages actions.

---

# 20. Testing

## Unit tests

Focus on game logic independent of DOM:

- collision detection
- movement
- scoring
- spawn logic
- board boundaries
- snake growth
- Pong ball reflection
- runner jump state
- Frogger lane movement
- Tron trail collision

Game logic should be testable without GitHub or a browser.

## DOM tests

Test:

- contribution graph discovery
- coordinate extraction
- state snapshot
- state restore
- Play button insertion
- duplicate injection prevention

## Manual browser matrix

At minimum verify:

```text
Chrome
Firefox
Edge
Safari
```

Also perform smoke tests where possible in:

```text
Brave
Opera
Vivaldi
```

Test both GitHub light and dark themes.

---

# 21. Error handling

The extension must fail safely.

If the contribution graph cannot be identified:

- do not modify the page
- do not throw visible uncaught errors
- optionally log a concise debug message

If GitHub changes markup:

- the rest of the page must continue functioning
- no permanent styles should remain

If a game crashes:

1. stop game loop
2. release keyboard handlers
3. restore graph
4. show a small non-blocking error message

---

# 22. GitHub SPA navigation

GitHub uses client-side navigation in multiple parts of the site.

The extension must handle:

- initial page load
- browser back/forward
- GitHub soft navigation
- switching between profile pages

Use an observer/navigation adapter rather than repeatedly polling at high frequency.

Never inject more than one Commit Arcade controller per graph.

---

# 23. Accessibility

Requirements:

- keyboard accessible Play/Stop controls
- visible focus state
- `aria-label` on icon-only controls
- do not rely only on color for important surrounding UI
- respect `prefers-reduced-motion` for non-game decorative animations
- gameplay itself may naturally involve motion

---

# 24. Performance

Target:

- negligible CPU usage when inactive
- no timers running when no game is active
- no network requests during gameplay
- minimal mutation observer scope
- no whole-document DOM scans every frame
- reuse contribution cell references
- diff rendering between frames

---

# 25. Security

Extension rules:

- no `eval`
- no inline remote scripts
- no remote code loading
- no unnecessary permissions
- no credential access
- no GitHub API token
- sanitize any user-controlled text before rendering
- comply with Manifest V3 requirements for Chromium

Firefox implementation should use the closest compatible WebExtension model.

---

# 26. MVP

The first usable release should include:

- cross-browser shared architecture
- Chromium build
- Firefox build
- Safari compatibility documentation / starter package
- GitHub graph detection
- Play/Stop control
- game selector
- keyboard manager
- board renderer
- graph state restore
- local high scores
- responsive theme integration

Implement these games first:

1. **Commit Runner**
2. **Snake**
3. **Flappy Commit**

Keep the remaining seven games registered as planned modules/documented roadmap items until implemented.

Do not over-engineer features unrelated to this core loop.

---

# 27. Future roadmap

After MVP:

### Phase 2

- Pong
- Breakout
- Frogger
- Tron

### Phase 3

- Space Invaders
- Helicopter
- Commit Beat

### Phase 4

- Contribution Mode
- seeded levels generated from real contribution graphs
- achievements
- local stats
- optional per-game difficulty

Potential future idea:

```text
Share level seed
```

This should share a generated seed/configuration, not private browser data.

---

# 28. Code quality rules

Follow:

- KISS
- DRY
- YAGNI
- single responsibility
- small modules
- explicit interfaces
- strict typing
- test game logic independently from DOM

Avoid:

- giant content script files
- game-specific DOM access
- browser-specific forks of game logic
- magic row/column constants
- global mutable state where avoidable

Prefer files that each have one clear responsibility.

---

# 29. README requirements

`README.md` should include:

- logo
- project description
- screenshot/mockup
- browser support
- installation instructions
- local development
- build commands
- test commands
- game list
- privacy
- contributing
- license
- GitHub Pages link

---

# 30. Acceptance criteria

The implementation is considered ready for the first release when:

- [ ] visiting a GitHub user profile detects the contribution graph
- [ ] exactly one Commit Arcade Play button is injected
- [ ] graph dimensions are preserved
- [ ] clicking Play allows a game to use the contribution cells as pixels
- [ ] stopping restores the original graph
- [ ] leaving the page cleans up correctly
- [ ] keyboard controls do not affect GitHub when the game is inactive
- [ ] Commit Runner works
- [ ] Snake works
- [ ] Flappy Commit works
- [ ] high scores persist locally
- [ ] Chrome build works
- [ ] Firefox build works
- [ ] Edge/Brave/Opera/Vivaldi work from the Chromium package or documented variants
- [ ] Safari path is documented and functional enough for development
- [ ] GitHub dark theme works
- [ ] GitHub light theme works
- [ ] no contribution data leaves the browser
- [ ] `/docs` works as a GitHub Pages site
- [ ] CI builds and tests the project
- [ ] tagged releases generate extension archives

---

# 31. Codex workflow

Before implementing:

1. Inspect the repository.
2. Preserve existing conventions if the repository already contains code.
3. Write a short implementation plan.
4. Implement the shared engine first.
5. Implement browser adapters second.
6. Implement one simple game end-to-end before adding more.
7. Add tests alongside game logic.
8. Verify Chrome and Firefox builds.
9. Keep Safari-specific code isolated.
10. Do not declare completion without running lint, type-check, tests, and production builds.

Recommended implementation order:

```text
GitHub graph adapter
    ↓
Board abstraction
    ↓
Renderer
    ↓
Input manager
    ↓
Game engine
    ↓
Play/Stop UI
    ↓
Commit Runner
    ↓
Persistence
    ↓
Snake
    ↓
Flappy Commit
    ↓
Browser packaging
    ↓
GitHub Pages
    ↓
CI / release workflows
```

---

# 32. Product identity summary

```text
Name:       Commit Arcade
Logo:       >_ ▶
Tagline:    Play your GitHub contributions.
Language:   English
Platform:   Browser extension
Board:      Existing GitHub contribution graph
Backend:    None
Telemetry:  None
Website:    GitHub Pages from /docs
```
