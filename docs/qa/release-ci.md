# Release CI

The release workflow runs on semantic v1 tags such as `v1.0.0`.

Package and source manifest versions are `1.0.0` for the v1 release. Generated build manifests are stamped from `package.json` so release packages use the package version as the source of truth.

Before tagging, verify locally:

```sh
npm ci
npm run lint
npm test -- --run
npm run build:chrome
npm run build:firefox
npm run validate:packages
npm run package:archives -- v1.0.0
npm run package:amo-source -- v1.0.0
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
