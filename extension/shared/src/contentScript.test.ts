import { describe, expect, it } from 'vitest';

import { initializeCommitArcade } from './contentScript';

describe('initializeCommitArcade', () => {
  it('returns a controller with a cleanup method', () => {
    const controller = initializeCommitArcade(document);

    expect(typeof controller.destroy).toBe('function');

    controller.destroy();
  });

  it('injects one Play control for a contribution graph and removes it on destroy', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <div class="js-calendar-graph"></div>
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="1" x="12" y="0"></rect>
        </svg>
      </section>
    `;

    const first = initializeCommitArcade(document);
    const second = initializeCommitArcade(document);
    const playButtons = document.querySelectorAll<HTMLButtonElement>('.commit-arcade-button');

    expect(playButtons).toHaveLength(1);
    expect(playButtons[0]?.textContent).toContain('Play');

    playButtons[0]?.click();

    expect(document.querySelector('[role="menu"]')?.textContent).toContain('Commit Runner');
    expect(document.querySelector('[aria-disabled="true"]')?.textContent).toContain('Pong');

    second.destroy();
    first.destroy();

    expect(document.querySelector('.commit-arcade-button')).toBeNull();
  });

  it('starts a playable game in the contribution cells and restores the graph on Stop', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0" fill="#ebedf0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0" fill="#ebedf0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-03" data-level="0" x="0" y="12" fill="#ebedf0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-04" data-level="0" x="12" y="12" fill="#ebedf0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    expect(document.querySelector('[data-commit-arcade-state="player"]')).not.toBeNull();

    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();

    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();
    expect(document.querySelector('rect')?.getAttribute('fill')).toBe('#ebedf0');

    controller.destroy();
  });
});
