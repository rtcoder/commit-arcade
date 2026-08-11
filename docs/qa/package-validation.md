# Browser Package Validation

Commit Arcade validates generated browser build directories before CI uploads release archives.

Run locally:

```sh
npm run build:chrome
npm run build:firefox
npm run validate:packages
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
