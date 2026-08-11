# Chrome Web Store Listing

Official Chrome Web Store image requirements used for this checklist:

- Store icon: `128x128` PNG.
- Screenshot: at least one `1280x800` or `640x400` PNG/JPEG, up to five.
- Small promo tile: `440x280` PNG/JPEG.

## Files

- Store icon: `docs/store/chrome/icon-128.png`
- Screenshot: `docs/store/chrome/screenshot-runner-1280x800.png`
- Small promo tile: `docs/store/chrome/promo-small-440x280.png`
- Editable icon source: `docs/store/chrome/source/icon-128.svg`
- Editable screenshot source: `docs/store/chrome/source/screenshot-runner-1280x800.svg`
- Editable promo source: `docs/store/chrome/source/promo-small-440x280.svg`

## Short description

```text
Play tiny arcade games on your GitHub contribution graph.
```

## Long description

```text
Commit Arcade turns the visible GitHub contribution graph on a profile page into a tiny local arcade screen.

Open a GitHub profile with a contribution graph, press Play, and choose Commit Runner, Snake, or Flappy Commit. Games render directly on the existing graph cells and restore the original graph state when you stop, press Escape, hide the tab, or navigate away.

Commit Arcade is intentionally local and lightweight. It runs only on github.com, does not request broad extension permissions, does not collect credentials or contribution data, and does not send telemetry or analytics. Gameplay preferences and high scores remain local in browser storage.
```

## Category And Support

- Category: Fun or Games, depending on the current Chrome Web Store taxonomy.
- Language: English.
- Website: deployed Commit Arcade site.
- Support URL: `https://github.com/rtcoder/commit-arcade/issues`
- Privacy URL: deployed `docs/privacy.html`.

## Privacy Answers

```text
Commit Arcade does not collect or transmit account credentials, profile data, contribution data, browsing history, telemetry, analytics, or gameplay data. Preferences and high scores remain local in browser storage.
```

## Permission Justification

```text
Commit Arcade does not request extension permissions or host_permissions. It declares a content script match for https://github.com/* so it can detect the visible GitHub contribution graph and temporarily render local game states on those graph cells.
```

## Asset Notes

- Assets use the Commit Arcade name and abstract contribution-grid visuals.
- Assets do not use Google, Chrome, GitHub or Octocat logos.
- The screenshot is a synthetic product screenshot focused on the actual extension experience: a contribution-style graph with the Commit Arcade session UI visible.
