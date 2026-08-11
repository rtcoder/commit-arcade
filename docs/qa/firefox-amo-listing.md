# Firefox AMO Listing And Reviewer Notes

## Listing Metadata

- Name: `Commit Arcade`
- Summary: `Play your GitHub contributions.`
- Category: Games & Entertainment.
- Support URL: `https://github.com/rtcoder/commit-arcade/issues`
- Homepage URL: `https://github.com/rtcoder/commit-arcade`
- Privacy URL: deployed Commit Arcade privacy page.

Description:

```text
Commit Arcade turns the visible GitHub contribution graph on a profile page into a tiny local arcade screen.

Open a GitHub user profile, press Play beside the contribution graph, and play small games directly on the existing contribution cells. The extension keeps the graph dimensions intact, runs only on github.com, and restores the original graph when the game stops, the tab is hidden, or you navigate away.

Commit Arcade does not collect credentials, contribution data, browsing history, telemetry, analytics, or gameplay data. Gameplay preferences and high scores remain local in browser storage. All extension code is packaged locally and no remote scripts are loaded.
```

## Reviewer Notes

```text
Commit Arcade is a Firefox WebExtension content-script add-on for GitHub profile pages.

The Firefox manifest uses Manifest V2 and injects one packaged content script plus CSS only on https://github.com/*. The add-on does not request permissions or host_permissions beyond the content_scripts match pattern. It does not request tabs, history, clipboard, downloads, native messaging, scripting, network, or broad host access.

The add-on detects the visible GitHub contribution graph, adds a small Play control, temporarily renders local game state onto the existing graph cells, and restores the original graph when the game stops, Esc is pressed, the tab is hidden, or navigation occurs.

No credentials, profile data, contribution data, browsing history, telemetry, analytics, or gameplay data are collected or transmitted. Runtime sources are audited to avoid eval, Function, fetch, XMLHttpRequest, sendBeacon, remote scripts, and dynamic extension script injection. All code is packaged with the extension.

Build and source package instructions are documented in docs/qa/amo-source-submission.md. The installable archive is dist/commit-arcade-firefox-v1.0.0.zip and the AMO source-review archive is dist/commit-arcade-firefox-source-v1.0.0.zip when built for v1.0.0.
```

## Reviewer Test Steps

1. Install `dist/commit-arcade-firefox-v1.0.0.zip`.
2. Open `https://github.com/octocat?tab=overview`.
3. Confirm the GitHub contribution graph is visible.
4. Confirm one Commit Arcade play control appears near the contribution graph.
5. Click Play and start the available game.
6. Confirm the game renders inside the existing contribution graph cells without resizing or replacing the graph.
7. Press Escape or Stop.
8. Confirm the original contribution graph visual state is restored.
9. Reload the page and confirm only one play control appears.
10. Navigate to `https://github.com/torvalds?tab=overview` and repeat the Play/Stop restoration check.
11. Navigate to `https://github.com/openai`.
12. Confirm no play control appears on organization pages without a personal contribution graph.
13. Navigate to a nonexistent GitHub user page.
14. Confirm no play control appears and the page is not modified.

Additional manual QA before submission:

- New or empty profile.
- Profile with private or restricted contribution visibility.
- GitHub light theme.
- GitHub dark theme.
- Narrow viewport.

## Source Package

Build AMO artifacts with:

```sh
npm ci
npm run build:firefox
npm run validate:firefox
npm run package:firefox -- v1.0.0
npm run package:amo-source -- v1.0.0
```

Expected artifacts:

- `dist/commit-arcade-firefox-v1.0.0.zip`
- `dist/commit-arcade-firefox-source-v1.0.0.zip`

Reviewer environment:

- Node.js 22.x
- npm 10.x or newer
- macOS, Linux or Windows shell capable of running npm scripts

## Screenshot Needs

- GitHub profile page with the contribution graph and Commit Arcade play control.
- Active game rendered on the contribution graph.
- Stopped game with the original graph restored.
- GitHub dark theme.
- Narrow viewport if the UI remains readable.

Prepare a square PNG listing icon even though the runtime extension package includes SVG icons.

## Privacy Consistency

- Firefox manifest scope is only `https://github.com/*`.
- No `permissions` or `host_permissions` are declared.
- CSP is `script-src 'self'; object-src 'self';`.
- Privacy copy must say that nothing is collected or transmitted, while acknowledging that preferences and high scores stay local in browser storage.
