# Safari Packaging

Commit Arcade keeps source code in `extension/shared` and treats Safari as a packaging target, not a fork of game logic.

Safari packaging is intentionally separate from Chrome and Firefox release archives because it depends on Xcode targets, Apple signing and App Store Connect distribution.

Apple reference: https://developer.apple.com/documentation/safariservices/packaging-a-web-extension-for-safari

## Input Package

Use the generated Chromium WebExtension build as the Safari converter input:

```sh
npm ci
npm run build:chrome
npm run validate:chrome
```

Input directory:

```text
extension/chrome/build
```

That directory contains the generated `manifest.json`, `contentScript.js`, `content.css` and `assets/**` files. Safari-specific files, Xcode projects, signing material and App Store notes should stay under `extension/safari/` and must not fork `extension/shared` game logic.

## Xcode Packaging Steps

1. Open Xcode on macOS with an Apple Developer Program team configured.
2. Create a Safari Web Extension app project or add Safari Web Extension targets to an existing container app.
3. Use Xcode's Safari Web Extension tooling to import or reference `extension/chrome/build`.
4. Name the app and extension `Commit Arcade`.
5. Configure stable bundle identifiers for the container app and extension target.
6. Select the Apple Developer Team for signing.
7. Confirm the extension target includes `manifest.json`, `contentScript.js`, `content.css` and `assets/**`.
8. Build and run the macOS container app.
9. Open Safari Settings, enable the extension and grant website access for `github.com`.
10. Archive through Xcode only after bundle IDs, signing and App Store metadata are final.

## macOS Notes

- Validate locally with Xcode before any App Store upload.
- Safari should inherit the same least-privilege scope: content script access to `https://github.com/*`, with no broad permissions.
- If Safari rejects the current Chrome Manifest V3 input, create a Safari-specific manifest target in this directory and keep shared game code in `extension/shared`.
- Confirm whether App Store listing icons require raster assets in addition to the SVG runtime icons.

## iOS And iPadOS Notes

- Safari Web Extensions on iOS/iPadOS require a container app install flow.
- Test on simulator or device after macOS smoke passes.
- Enable the extension in Settings -> Safari -> Extensions.
- Grant GitHub site access and repeat the GitHub profile smoke test.
- Check narrow viewport behavior separately from desktop Safari.

## Manual Safari Smoke Checklist

1. `npm run build:chrome` passes.
2. `npm run validate:chrome` passes.
3. Xcode project builds with the selected Apple Developer Team.
4. macOS container app launches.
5. Safari lists the Commit Arcade extension.
6. Extension can be enabled.
7. GitHub site access can be granted.
8. `https://github.com/octocat?tab=overview` shows one Commit Arcade play control.
9. A game starts and renders on the visible contribution graph.
10. Stop and Escape restore the original graph state.
11. No play control appears on pages without a personal contribution graph.
12. iOS or iPadOS simulator/device can enable the extension and pass the same profile smoke flow.

## Deferred Automation

- No `build:safari`, `validate:safari` or `package:safari` script exists for v1.0.0.
- Xcode archive, notarization, provisioning and App Store upload remain manual until bundle IDs and signing requirements are fixed.
- A future task can add a non-Xcode sanity check for the Safari input directory, but full Safari packaging should stay manual until the Apple release path is concrete.
