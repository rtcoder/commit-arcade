# Safari Packaging

Commit Arcade keeps source code in `extension/shared` and treats Safari as a packaging target, not a fork of game logic.

Use Apple's Safari Web Extension tooling from Xcode to wrap the shared WebExtension output. Keep Safari-specific signing, entitlements, and App Store notes in this directory as packaging requirements become concrete.
