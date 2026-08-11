# V1.0.0 Release Candidate Smoke

QA date: 2026-08-11

Candidate branch: `v1-final-release-qa`

Base commit before final tag: `52b2b76`

## Environment

| Target | Version | Result |
| --- | --- | --- |
| macOS | 26.5.2 build 25F84 | Recorded for release smoke. |
| Google Chrome | 151.0.7922.77 | Chromium package target available. |
| Mozilla Firefox | 151.0.4 | Firefox package target available. |
| Microsoft Edge | 151.0.4129.59 | Chromium-compatible smoke target available. |
| Brave Browser | 144.1.86.142 | Chromium-compatible smoke target available. |
| Opera | 122.0.5643.92 | Chromium-compatible smoke target available. |
| Safari | 26.5.2 | Safari app present; WebExtension conversion remains documented separately in `extension/safari/README.md`. |
| Vivaldi | Not installed | Deferred because the app is unavailable on this machine. |

## Candidate Artifacts

| Artifact | SHA-256 |
| --- | --- |
| `dist/commit-arcade-chrome-v1.0.0.zip` | `e457a1bbb8df213edaaef0ea3431b026cca90d48446c9fe2c6416a12f7df029f` |
| `dist/commit-arcade-firefox-v1.0.0.zip` | `2866b5885d03414c8ceac7ab83c41d5c7af671bfab9833bd3da604bce15145c9` |

The AMO source ZIP is intentionally omitted from this table because it contains this QA document. Record its checksum from `shasum -a 256 dist/commit-arcade-firefox-source-v1.0.0.zip` after the final source package is generated.

## Smoke Matrix

| Area | Coverage | Result |
| --- | --- | --- |
| GitHub profile DOM | Current public `octocat` contribution fragment, organization no-op page, empty graph fixture, narrow graph fixture, missing graph fixture. | Passed in `extension/shared/core/githubContributionGraph.test.ts`. |
| GitHub light/dark/narrow visuals | Static visual QA captures and responsive CSS checklist. | Covered by `docs/qa/theme-responsive-visual-qa.md`. |
| Package structure | Chrome MV3 and Firefox MV2 manifests, scripts, styles, icons, excluded private/dev files. | Covered by `npm run validate:packages`. |
| Store submission assets | Chrome screenshots/promo/icon/listing, Firefox AMO listing/source package, Edge submission notes. | Covered by `docs/store/chrome`, `docs/qa/firefox-amo-listing.md`, `docs/qa/edge-addons-submission.md`, and `docs/qa/amo-source-submission.md`. |
| Stop / Esc / navigation cleanup | Automated content-script and game-engine tests cover cleanup paths; manual checklist remains in theme QA. | Passed by full test suite before tagging. |

## Known Release Notes

- No P0/P1 blockers were found in the release-candidate gates.
- Vivaldi GUI smoke is deferred because Vivaldi is not installed locally.
- Safari store packaging is outside the automated WebExtension workflow until an Xcode/App Store packaging path is implemented.
