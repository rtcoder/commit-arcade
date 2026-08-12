# Edge Add-ons Submission Notes

Commit Arcade uses the Chromium package for Microsoft Edge Add-ons. Microsoft publishes Edge extensions through Partner
Center and expects a tested `.zip` package, manifest review, listing details, privacy answers and certification notes.

Official reference: https://learn.microsoft.com/en-us/microsoft-edge/extensions/publish/publish-extension

## Package

Build the Chromium package from a clean checkout:

```sh
npm ci
npm run build:chrome
npm run validate:chrome
npm run package:chrome -- v1.0.0
```

Upload:

- `dist/commit-arcade-chrome-v1.0.0.zip`

The generated Chrome build uses Manifest V3 and is also the Edge Developer Mode smoke-test input.

## Partner Center Prerequisites

- Microsoft Partner Center account registered for Microsoft Edge extensions.
- Verified publisher or organization account.
- Public privacy policy URL, such as the deployed version of `docs/privacy.html`.
- Store listing assets: square logo, screenshots, category, website URL and support contact.
- Access to Edge on a test machine for local Developer Mode validation.

Actual submission, certification and publication are blocked until account verification is complete.

## Store Listing Inputs

- Name: `Commit Arcade`
- Summary: `Play your GitHub contributions.`
- Category: Games or Entertainment, depending on current Partner Center taxonomy.
- Website URL: deployed Commit Arcade site.
- Support URL: `https://github.com/rtcoder/commit-arcade/issues`
- Privacy URL: deployed Commit Arcade privacy page.

Description:

```text
Commit Arcade turns the visible GitHub contribution graph on a profile page into a tiny local arcade screen. Open a GitHub user profile, start a game beside the contribution graph, and play directly on the existing contribution cells. The extension runs only on github.com, keeps gameplay local, and restores the original graph when the game stops.
```

## Purpose Statement

```text
Commit Arcade lets users play small arcade games directly on the visible GitHub contribution graph on github.com profile pages. It detects the contribution graph, temporarily renders local game states onto the graph cells while a game is running, and restores the original graph state when the session ends.
```

## Permission Justification

```text
Commit Arcade does not request extension permissions or host_permissions. It only declares a content script match for https://github.com/* so it can find the visible GitHub contribution graph and render temporary local game states onto the existing graph cells.
```

## Privacy And Data Usage Answers

```text
The extension does not collect, transmit, sell, or share account credentials, contribution data, browsing history, profile data, telemetry, analytics, or gameplay data. Gameplay preferences and high scores remain local in browser storage.
```

Remote code answer:

```text
No. Commit Arcade does not use remote code. All runtime code is packaged with the extension, and the Manifest V3 CSP allows only self-hosted extension scripts.
```

## Certification Notes

```text
No test account is required. To test, install the extension in Microsoft Edge, open any public GitHub profile page with a contribution graph, and use the Commit Arcade controls injected near the contribution graph. Start a game, play briefly, then stop the game or press Escape. The original GitHub contribution graph should be restored. The extension does not require login, tokens, network access, telemetry, remote code, or special regional settings.
```

## Edge Developer Mode Smoke Test

1. Run `npm run build:chrome`.
2. Run `npm run validate:chrome`.
3. Open `edge://extensions`.
4. Enable Developer mode.
5. Choose Load unpacked.
6. Select `extension/chrome/build`.
7. Open `https://github.com/octocat?tab=overview`.
8. Confirm the contribution graph is visible.
9. Confirm one Commit Arcade play control appears near the graph.
10. Start a game and confirm it renders inside the existing graph cells.
11. Stop the game and separately test Escape.
12. Confirm the original graph visual state is restored.
13. Confirm no Play control appears on a page without a personal contribution graph.

## Open Blockers

- Partner Center account verification.
- Public privacy URL after site deployment.
- Final Edge listing screenshots and logo upload.
