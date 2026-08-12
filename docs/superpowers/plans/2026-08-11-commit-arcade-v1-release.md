# Commit Arcade v1.0 Release Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:
> executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship Commit Arcade v1.0 as a real, installable, review-ready browser extension with a polished three-game MVP
and release assets.

**Architecture:** Keep the current shared TypeScript runtime. Harden the GitHub adapter against real profile variants,
polish the direct-on-graph UI, produce store-ready Chromium and Firefox packages, and keep Safari as a documented
packaging path unless we decide to ship an App Store build for v1.0.

**Tech Stack:** TypeScript, DOM APIs, WebExtensions APIs, CSS, esbuild, Vitest, jsdom, browser manual testing, GitHub
Actions.

## Global Constraints

- The contribution graph is the display; do not resize, replace, or permanently modify it.
- The extension remains local-only: no backend, telemetry, analytics, remote code, or GitHub token.
- All UI and store copy are English.
- Chromium build uses Manifest V3.
- Firefox submission must include source/build instructions when the packaged code is bundled.
- Safari Web Extension distribution requires Xcode/App Store packaging and remains separate from shared game logic.
- Release branches use descriptive names without the `codex/` prefix.

---

## Release Definition

v1.0 is done when:

- Chrome, Firefox, Edge, and Safari manual smoke tests are documented.
- Chrome and Firefox packages can be produced from a clean checkout.
- GitHub profile pages with normal, empty, private, and responsive contribution graphs do not break.
- Commit Runner, Snake, and Flappy Commit are playable and restartable.
- Stop, Esc, navigation, hidden tab, and crash cleanup restore the graph.
- Store listing assets and privacy/support docs are present.
- CI validates tests, typecheck, builds, and package archives.

## References Checked

- Chrome Web Store currently requires MV3 for new items and readable/non-obfuscated extension code.
- Chrome listing assets include a 128x128 icon, at least one 1280x800 or 640x400 screenshot, and a 440x280 promo tile.
- AMO reviewers may require source code and reproducible build instructions for bundled/transpiled/minified extensions.
- Edge Add-ons publishing goes through Partner Center and requires package, listing, privacy information, permission
  justification, and certification notes.
- Safari Web Extensions are packaged with Xcode and distributed through Apple’s app model/App Store path.

## Phase 1: Real GitHub Compatibility

Stabilize the adapter and lifecycle against live GitHub profile DOM, responsive layouts, SPA navigation, and theme
changes.

## Phase 2: v1 Product UX

Make the direct graph experience feel intentional: picker, HUD, score, high scores, restart, controls, focus,
reduced-motion respect, and polished failure states.

## Phase 3: Game Polish

Tune Runner, Snake, and Flappy Commit from minimal playable implementations into v1-quality tiny games with
deterministic tests and balanced behavior on 7x52-ish boards.

## Phase 4: Packaging and CI

Produce deterministic Chromium and Firefox packages, source review bundle, validation scripts, tag release workflow, and
browser-specific docs.

## Phase 5: Store and Website Readiness

Create store screenshots, promo assets, concise listing copy, privacy/support pages, install docs, release notes, and a
v1 landing page update.

## Phase 6: Compliance and Release QA

Audit permissions, CSP, dependencies, privacy claims, build reproducibility, and manual browser matrix. Fix blockers
before tagging v1.0.0.
