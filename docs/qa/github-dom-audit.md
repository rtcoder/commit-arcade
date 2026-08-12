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

- macOS 26.5.2, unauthenticated GitHub session.
- Public pages were fetched with `curl -L --compressed` using a browser user agent.
- Public profile overviews lazy-load the contribution graph through an `include-fragment`.
- The stable public fragment endpoint for the current graph is `https://github.com/users/octocat/contributions`.

Observed selectors:

| Profile type                        | URL                                              | Graph result                                                                                                                                                      |
|-------------------------------------|--------------------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Normal public user profile          | `https://github.com/octocat?tab=overview`        | Overview page exposes a lazy `include-fragment`; graph is loaded from `/users/octocat/contributions`.                                                             |
| Normal public contribution fragment | `https://github.com/users/octocat/contributions` | Contribution graph present; 367 `td.ContributionCalendar-day[data-date][data-level]` cells in `extension/shared/test/fixtures/github/octocat-contributions.html`. |
| Organization profile                | `https://github.com/openai`                      | No personal contribution graph, expected no-op target. Captured in `extension/shared/test/fixtures/github/openai-organization-overview.html`.                     |
| Missing graph fixture               | local fixture                                    | No contribution graph, expected no-op target. Captured in `extension/shared/test/fixtures/github/missing-contribution-graph.html`.                                |
| Empty graph fixture                 | local fixture                                    | Contribution graph exists with all zero-intensity cells. Captured in `extension/shared/test/fixtures/github/empty-contribution-graph.html`.                       |
| Narrow graph fixture                | local fixture                                    | Contribution graph exists in compact table markup. Captured in `extension/shared/test/fixtures/github/narrow-contribution-graph.html`.                            |

Findings:

- GitHub's current public profile graph is table-based, not SVG-based.
- The graph remains contribution-labeled through `.js-yearly-contributions`, `.js-calendar-graph`,
  `.ContributionCalendar-grid`, and `td.ContributionCalendar-day`.
- The extension selector path that includes `[data-date][data-level]` is required for the current production DOM;
  relying only on SVG `rect` would miss the 2026-08-11 GitHub markup.
- Organization and missing-profile pages do not expose a personal graph and should not receive a Commit Arcade button.
- Tests cover current public markup, legacy SVG markup, empty graphs, narrow table-like graphs, unrelated date
  rectangles, and no-graph pages.

### Missing or Unsupported Graph

- Risk: private/limited profiles, failed GitHub rendering, organization pages, or non-profile pages may have no
  contribution graph.
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
