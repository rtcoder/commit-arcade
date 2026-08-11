# Changelog

## 1.0.0 - 2026-08-11

Commit Arcade v1.0.0 is the first release-ready browser extension build.

### Shipped

- GitHub contribution graph detection for personal profile pages.
- Play controls injected near the visible contribution graph.
- Commit Runner, Snake and Flappy Commits games rendered on graph cells.
- Keyboard and button controls for start, stop, restart and game selection.
- Local settings and high-score persistence in browser storage.
- Light, dark, narrow viewport and graph restoration safeguards.
- Chrome MV3 and Firefox MV2 build targets with deterministic release archives.
- Firefox AMO source-review archive generation.

### Privacy

- Runtime scope is limited to `https://github.com/*`.
- No extension permissions or host permissions are requested.
- No credentials, contribution data, browsing history, telemetry, analytics or gameplay data are collected or transmitted.
- Gameplay preferences and high scores remain local in browser storage.
- All runtime code is packaged with the extension; no remote scripts are loaded.

### Release Artifacts

Build from a clean checkout with:

```sh
npm ci
npm run build:chrome
npm run build:firefox
npm run validate:packages
npm run package:archives -- v1.0.0
npm run package:amo-source -- v1.0.0
```

Expected v1.0.0 artifacts:

- `dist/commit-arcade-chrome-v1.0.0.zip`
- `dist/commit-arcade-firefox-v1.0.0.zip`
- `dist/commit-arcade-firefox-source-v1.0.0.zip`
