import { describe, expect, it } from 'vitest';

import { initializeCommitArcade } from './contentScript';

describe('initializeCommitArcade', () => {
  it('returns a controller with a cleanup method', () => {
    const controller = initializeCommitArcade(document);

    expect(typeof controller.destroy).toBe('function');

    controller.destroy();
  });

  it('does not modify the page when no contribution graph exists', () => {
    document.body.innerHTML = '<main><h1>Profile</h1></main>';
    delete document.documentElement.dataset.commitArcadeReady;

    const controller = initializeCommitArcade(document);

    expect(document.querySelector('.commit-arcade-button')).toBeNull();
    expect(document.documentElement.dataset.commitArcadeReady).toBeUndefined();

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

  it('stops an active game with Escape and restores the graph', () => {
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

    window.dispatchEvent(new KeyboardEvent('keydown', { cancelable: true, key: 'Escape' }));

    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();
    expect(document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.textContent).toContain('Play');

    controller.destroy();
  });

  it('shows a non-blocking error message and restores the graph when a game crashes', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0" fill="#ebedf0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0" fill="#ebedf0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document, {
      gameFactories: {
        runner: () => ({
          id: 'runner',
          name: 'Broken Runner',
          description: 'Crashes on update',
          status: 'playable',
          start: () => undefined,
          update: () => {
            throw new Error('broken game');
          },
          handleInput: () => undefined,
          render: () => undefined,
          stop: () => undefined,
        }),
      },
    });
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    expect(document.querySelector('.commit-arcade-message')?.textContent).toContain('Game over');
    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();

    controller.destroy();
  });

  it('stops timers and restores the graph when the tab becomes hidden', () => {
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
    Object.defineProperty(document, 'hidden', { configurable: true, value: true });

    const controller = initializeCommitArcade(document);
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();
    document.dispatchEvent(new Event('visibilitychange'));

    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();
    expect(document.querySelector('.commit-arcade-message')?.textContent).toContain('Paused');

    controller.destroy();
  });

  it('replaces the controller after GitHub soft navigation changes the graph', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="1" x="12" y="0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    const firstButton = document.querySelector<HTMLButtonElement>('.commit-arcade-button');
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-02-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-02-02" data-level="1" x="12" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-02-03" data-level="2" x="24" y="0"></rect>
        </svg>
      </section>
    `;
    document.dispatchEvent(new Event('turbo:render'));

    const nextButtons = document.querySelectorAll<HTMLButtonElement>('.commit-arcade-button');

    expect(nextButtons).toHaveLength(1);
    expect(nextButtons[0]).not.toBe(firstButton);
    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();

    controller.destroy();
  });

  it('re-scans the graph after browser back or forward navigation', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="1" x="12" y="0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-03-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-03-02" data-level="1" x="12" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-03-03" data-level="2" x="24" y="0"></rect>
        </svg>
      </section>
    `;

    window.dispatchEvent(new PopStateEvent('popstate'));

    expect(document.querySelectorAll<HTMLButtonElement>('.commit-arcade-button')).toHaveLength(1);

    controller.destroy();
  });
});
