# Theme And Responsive Visual QA

QA date: 2026-08-11

## Scope

This checklist covers Commit Arcade controls on GitHub contribution graph layouts in:

- GitHub light theme.
- GitHub dark theme.
- GitHub dark dimmed theme.
- Narrow mobile-ish profile layouts.

Reference captures:

- `docs/qa/visual/theme-light-1280x800.png`
- `docs/qa/visual/theme-dark-1280x800.png`
- `docs/qa/visual/theme-dark-dimmed-1280x800.png`
- `docs/qa/visual/theme-narrow-390x844.png`

## CSS Findings

- All extension CSS selectors remain scoped under `.commit-arcade-*`.
- Button, picker item and session button focus states use visible outlines.
- Picker width is capped to avoid overflowing narrow layouts.
- On very narrow layouts, the picker becomes static and the session toolbar stacks vertically.
- Messages and sessions use GitHub theme variables with fallback colors.

## Manual Browser Checklist

1. Open a public GitHub personal profile with a visible contribution graph.
2. Verify one Commit Arcade play control appears near the graph.
3. Tab to the play control and confirm a visible focus outline.
4. Open the game picker and tab through picker items.
5. Confirm picker items have visible focus and do not overlap GitHub controls incoherently.
6. Start Commit Runner and confirm the session toolbar fits above the graph.
7. Press Escape and confirm the message is readable and the graph is restored.
8. Repeat in GitHub light theme.
9. Repeat in GitHub dark theme.
10. Repeat in GitHub dark dimmed theme.
11. Repeat at a narrow viewport around 390 px wide.
12. Confirm the picker and session toolbar stack instead of overflowing.

## Remaining Manual Evidence

The reference captures in this directory are static fixtures for review. Final beta smoke should still capture
screenshots from real GitHub pages for CA-38 and CA-45.
