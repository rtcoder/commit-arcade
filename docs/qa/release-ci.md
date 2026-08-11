# Release CI

The release workflow runs on version tag pushes such as `v1.0.0` and can also be started manually. Tag pushes use the tag name for artifact and ZIP names.

Package and source manifest versions are `1.0.0` for the v1 release. Generated build manifests are stamped from `package.json` so release packages use the package version as the source of truth.

Before tagging, verify locally:

```sh
npm ci
npm audit --audit-level=moderate
npm test -- --run
npm run typecheck
npm run build:chrome
npm run build:firefox
npm run validate:packages
npm run package:archives -- v1.0.0
npm run package:amo-source -- v1.0.0
shasum -a 256 dist/commit-arcade-*.zip
```

Cut the release tag:

```sh
git tag v1.0.0
git push origin v1.0.0
```

The `Build Extensions` workflow uploads predictable artifacts:

- `commit-arcade-chrome-v1.0.0` containing `commit-arcade-chrome-v1.0.0.zip`
- `commit-arcade-firefox-v1.0.0` containing `commit-arcade-firefox-v1.0.0.zip`
- `commit-arcade-firefox-source-v1.0.0` containing `commit-arcade-firefox-source-v1.0.0.zip`

Release notes live in `CHANGELOG.md`.

Safari remains outside this workflow until an Xcode/App Store packaging path is implemented.

## V1.0.0 Local Artifact Checksums

Generated on 2026-08-11 from the release candidate:

- `dist/commit-arcade-chrome-v1.0.0.zip`: `e457a1bbb8df213edaaef0ea3431b026cca90d48446c9fe2c6416a12f7df029f`
- `dist/commit-arcade-firefox-v1.0.0.zip`: `2866b5885d03414c8ceac7ab83c41d5c7af671bfab9833bd3da604bce15145c9`

The AMO source ZIP contains release QA documentation, so its checksum is recorded from the final generated artifact outside the tracked source tree.
