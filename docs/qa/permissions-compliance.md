# Permissions and Remote-Code Compliance

Audit date: 2026-08-11

## Manifest Scope

Commit Arcade runs as a content script only on:

```text
https://github.com/*
```

The extension does not request `permissions` or `host_permissions`. It does not request tabs, browsing history, network, clipboard, downloads, native messaging or scripting permissions.

## Content Security Policy

Chrome Manifest V3:

```json
{
  "content_security_policy": {
    "extension_pages": "script-src 'self'; object-src 'self';"
  }
}
```

Firefox Manifest V2:

```json
{
  "content_security_policy": "script-src 'self'; object-src 'self';"
}
```

The CSP allows only packaged extension scripts and blocks remote script execution, `eval` and plugin objects.

## Automated Checks

`extension/shared/security/remoteCodeCompliance.test.ts` verifies:

- Manifest content script scope is GitHub-only.
- No broad permissions or host permissions are declared.
- CSP is explicit and does not include `unsafe-eval`, `http:` or `https:`.
- Runtime sources do not use `eval`, `Function`, `fetch`, `XMLHttpRequest`, `sendBeacon` or dynamic extension script injection APIs.

## Store Permission Justification

Chrome Web Store / Edge Add-ons:

> Commit Arcade injects a local content script on github.com pages so users can play small arcade games directly on the visible GitHub contribution graph. The extension does not request account credentials, tokens, broad host access, telemetry, analytics or remote code. It modifies only the local page presentation while a game is running and restores the original graph state when the session ends.

Firefox AMO:

> Commit Arcade runs a local content script on github.com to detect the contribution graph and render temporary game states onto existing graph cells. It does not collect or transmit browsing data, profile data, contribution data, credentials or gameplay data. All code is packaged with the extension and no remote scripts are loaded.

## Privacy Claim Alignment

The public privacy page states that no telemetry or external analytics are included and gameplay preferences/high scores remain local. The manifests and runtime audit match that claim: there are no network APIs, remote-code paths or analytics integrations in extension runtime sources.
