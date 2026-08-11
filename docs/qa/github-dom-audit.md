# GitHub Contribution Graph DOM Audit

## Goal

Capture the GitHub profile graph variants that Commit Arcade v1.0 must support without storing private profile data.

## Fixture Classes

### Normal SVG Contribution Calendar

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

- Risk: future GitHub markup or test fixtures may represent cells as table/grid elements with date/level metadata but no SVG coordinates.
- Expected behavior: derive row and column from DOM row/child position.

Covered by:

- `derives row and column coordinates from table-like contribution markup without SVG x/y attributes`

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
