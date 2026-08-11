# Browser Package Validation

Commit Arcade validates generated browser build directories before CI uploads release archives.

Run locally:

```sh
npm run build:chrome
npm run build:firefox
npm run validate:packages
npm run package:archives -- v1.0.0
```

The validator checks:

- Chrome build uses `manifest_version: 3`.
- Firefox build uses `manifest_version: 2`.
- Manifest name, version, description, GitHub content-script match, JavaScript and CSS entries are present.
- Required extension icons exist at 16, 32, 48, 96, 128 and 256 px.
- Generated packages do not include local dependencies, repository metadata, Codex files, IDE config, package manifests, private keys or unexpectedly large files.

Manual store checks still required:

- Chrome Web Store dashboard upload and policy review.
- Firefox AMO upload or AMO lint result for the exact submitted archive.
- Store screenshots, permission justification and privacy/support text review.

## Store Archive Contents

`npm run package:archives -- v1.0.0` writes deterministic ZIP files to `dist/`:

- `dist/commit-arcade-chrome-v1.0.0.zip`
- `dist/commit-arcade-firefox-v1.0.0.zip`

Each archive unzips directly into an extension root and includes:

- `manifest.json`
- `contentScript.js`
- `content.css`
- `assets/**`

Store archives intentionally exclude source maps and source TypeScript files. Firefox AMO source-review material is handled separately from these installable extension archives.

See `docs/qa/amo-source-submission.md` for Firefox source-review package instructions.

Safari packaging is handled separately through Xcode using `extension/chrome/build` as the WebExtension input. See `extension/safari/README.md`.
