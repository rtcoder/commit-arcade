# GitHub Contribution Graph DOM Audit

## Goal

Capture the GitHub profile graph variants that Commit Arcade v1.0 must support without storing private profile data.

## Fixture Classes

### Legacy SVG Contribution Calendar

- Risk: older fixtures and possible GitHub variants may expose contribution cells as SVG rectangles.
- Container: section or region with contribution-related accessible label.
- Cells: SVG `rect` nodes with `data-date`, `data-level`, and rendered `x`/`y` coordinates.
- Expected behavior: detect visible row/column coordinates from unique `x`/`y` values.

Covered by:

- `extension/shared/core/githubContributionGraph.test.ts`

### Mixed Page with Unrelated Date Rects

- Risk: other calendar/date visualizations may also use `rect[data-date]`.
- Expected behavior: choose the largest contribution-like container and ignore unrelated smaller groups.

Covered by:

- `uses the largest contribution-like container and ignores unrelated date rects elsewhere`

### Table-like / Non-SVG Fallback

- Current GitHub profile markup, observed on 2026-08-11, renders contribution cells as table cells.
- Cells: `td.ContributionCalendar-day` with `data-date` and `data-level`.
- Expected behavior: derive row and column from DOM row/child position.

Covered by:

- `derives row and column coordinates from table-like contribution markup without SVG x/y attributes`

## Live Audit: 2026-08-11

Environment:

- Codex In-app Browser, unauthenticated GitHub session.
- Build artifacts available from `npm run build:chrome` and `npm run build:firefox`.
- Public pages were opened directly with `?tab=overview` for user profiles.
- The in-app browser adapter used for this audit did not expose viewport resizing, so narrow viewport remains on the manual release checklist.

Observed selectors:

| Profile type | URL | Graph result |
| --- | --- | --- |
| Normal public user profile | `https://github.com/octocat?tab=overview` | Contribution graph present; 367 `td.ContributionCalendar-day` cells, 372 `.ContributionCalendar-day` elements, 367 `data-date` cells, 372 `data-level` elements, 0 `rect.ContributionCalendar-day` cells. |
| High-activity public user profile | `https://github.com/torvalds?tab=overview` | Contribution graph present; same table-based calendar shape as the normal public profile. |
| Organization profile | `https://github.com/openai` | No personal contribution graph, expected no-op target. |
| Missing profile | `https://github.com/this-user-should-not-exist-commit-arcade-audit-2026` | No contribution graph, expected no-op target. |

Findings:

- GitHub's current public profile graph is table-based, not SVG-based.
- The graph remains contribution-labeled through `.js-yearly-contributions`, `.js-calendar-graph`, `Contribution Graph` text, and `tool-tip[for^="contribution-day"]`.
- The extension selector path that includes `[data-date][data-level]` is required for the current production DOM.
- Organization and missing-profile pages do not expose a personal graph and should not receive a Commit Arcade button.

### Missing or Unsupported Graph

- Risk: private/limited profiles, failed GitHub rendering, organization pages, or non-profile pages may have no contribution graph.
- Expected behavior: return `null`; content script must not modify the page.

Covered by:

- adapter no-graph test
- content script no-op test

## Manual Audit Checklist

Record only profile type and result, not private data.

- Normal public user profile with full graph.
- New or empty public user profile.
- Profile with private contributions hidden or limited.
- Organization profile or page without a personal graph.
- Narrow viewport profile page.
- GitHub light theme.
- GitHub dark theme.

For each case:

- Play button appears only when a visible contribution graph exists.
- No duplicate Play buttons after soft navigation.
- Stop, Esc, hidden tab, and navigation restore the graph.
- Contribution cells retain original visual state after cleanup.
