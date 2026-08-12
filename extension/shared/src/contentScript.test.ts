import { describe, expect, it } from 'vitest';

import { initializeCommitArcade } from './contentScript';
import type { CommitArcadeSettingsStorage } from '../core/settings';

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

  it('injects the Play control when GitHub lazy-loads the contribution graph after startup', async () => {
    document.body.innerHTML = '<main><h1>Profile</h1></main>';
    delete document.documentElement.dataset.commitArcadeReady;

    const controller = initializeCommitArcade(document);

    expect(document.querySelector('.commit-arcade-button')).toBeNull();

    document.querySelector('main')?.insertAdjacentHTML('beforeend', contributionGraphFixture());
    await flushPromises();

    const playButton = document.querySelector<HTMLButtonElement>('.commit-arcade-button');

    expect(playButton?.textContent).toContain('Play');
    expect(document.documentElement.dataset.commitArcadeReady).toBe('true');

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
    expect(document.querySelector('[aria-disabled="true"]')).toBeNull();

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

  it('neutralizes contribution cell colors during gameplay and restores the graph mode on Stop', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="4" x="0" y="0" fill="#216e39"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="3" x="12" y="0" fill="#30a14e"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-03" data-level="2" x="0" y="12" fill="#40c463"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-04" data-level="1" x="12" y="12" fill="#9be9a8"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    const graph = document.querySelector('section[aria-label="Contribution Graph"]');

    expect(graph?.classList.contains('commit-arcade-game-active')).toBe(true);

    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();

    expect(graph?.classList.contains('commit-arcade-game-active')).toBe(false);
    expect(document.querySelector('rect')?.getAttribute('fill')).toBe('#216e39');

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

  it('shows a compact session HUD with game name, score and high score', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document, {
      gameFactories: {
        runner: () => ({
          id: 'runner',
          name: 'Scoring Runner',
          description: 'Scores immediately',
          status: 'playable',
          start: () => undefined,
          update: () => undefined,
          handleInput: () => undefined,
          render: (_renderer) => undefined,
          stop: () => undefined,
        }),
      },
    });
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    const hud = document.querySelector<HTMLElement>('.commit-arcade-session');

    expect(hud?.textContent).toContain('Scoring Runner');
    expect(hud?.textContent).toContain('Score 0');
    expect(hud?.textContent).toContain('Best 0');
    expect(hud?.textContent).toContain('Playing');

    controller.destroy();
  });

  it('starts a selected game from the picker with keyboard activation and accessible labels', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    const snake = Array.from(document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')).find((item) =>
      item.textContent?.includes('Snake'),
    );

    expect(snake?.getAttribute('aria-label')).toBe('Start Snake. Classic panoramic Snake inside the contribution grid.');

    snake?.dispatchEvent(new KeyboardEvent('keydown', { bubbles: true, cancelable: true, key: 'Enter' }));

    expect(document.querySelector<HTMLElement>('.commit-arcade-session')?.textContent).toContain('Snake');

    controller.destroy();
  });

  it('starts newly shipped games from playable picker entries', () => {
    document.body.innerHTML = contributionGraphFixture();

    const controller = initializeCommitArcade(document);
    for (const gameName of ['Pong', 'Breakout', 'Space Invaders', 'Tron', 'Frogger', 'Helicopter', 'Commit Beat']) {
      document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
      const item = Array.from(document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')).find((button) =>
        button.textContent?.includes(gameName),
      );

      expect(item?.disabled).toBe(false);
      expect(item?.getAttribute('aria-label')).toContain(`Start ${gameName}.`);

      item?.click();

      expect(document.querySelector<HTMLElement>('.commit-arcade-session')?.textContent).toContain(gameName);

      document.querySelector<HTMLButtonElement>('.commit-arcade-stop-button')?.click();
    }

    controller.destroy();
  });

  it('shows compact controls help for the active game without replacing the graph', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-03" data-level="0" x="0" y="12"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-04" data-level="0" x="12" y="12"></rect>
        </svg>
      </section>
    `;

    const controller = initializeCommitArcade(document);
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    const help = document.querySelector<HTMLElement>('.commit-arcade-controls-help');

    expect(help?.textContent).toContain('Jump');
    expect(help?.textContent).toContain('Esc stops');
    expect(document.querySelectorAll('rect')).toHaveLength(4);

    controller.destroy();
  });

  it('orders the last selected game first and persists selected game plus high score', async () => {
    document.body.innerHTML = contributionGraphFixture();
    const values: Record<string, unknown> = {
      commitArcadeSettings: {
        highScores: { snake: 7 },
        selectedGame: 'snake',
        soundEnabled: false,
      },
    };
    const storage = createMemoryStorage(values);

    const controller = initializeCommitArcade(document, { storage });
    await flushPromises();
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();

    const pickerItems = document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item');

    expect(pickerItems[0]?.textContent).toBe('Snake');
    expect(pickerItems[0]?.getAttribute('aria-current')).toBe('true');

    pickerItems[0]?.click();

    expect(document.querySelector<HTMLElement>('.commit-arcade-session')?.textContent).toContain('Best 7');
    expect(values.commitArcadeSettings).toMatchObject({ selectedGame: 'snake' });

    controller.destroy();
  });

  it('persists a new high score without storing contribution graph data', async () => {
    document.body.innerHTML = contributionGraphFixture();
    const values: Record<string, unknown> = {};
    const storage = createMemoryStorage(values);

    const controller = initializeCommitArcade(document, {
      gameFactories: {
        runner: () => ({
          id: 'runner',
          name: 'Storage Runner',
          description: 'Scores immediately',
          status: 'playable',
          start: ({ onScore, onGameOver }) => {
            onScore?.(9);
            onGameOver?.();
          },
          update: () => undefined,
          handleInput: () => undefined,
          render: () => undefined,
          stop: () => undefined,
        }),
      },
      storage,
    });
    await flushPromises();
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    await flushPromises();

    expect(values.commitArcadeSettings).toMatchObject({
      highScores: { runner: 9 },
      selectedGame: 'runner',
    });
    expect(JSON.stringify(values.commitArcadeSettings)).not.toContain('2026-01-01');

    controller.destroy();
  });

  it('continues gameplay when settings storage fails', async () => {
    document.body.innerHTML = contributionGraphFixture();
    const storage: CommitArcadeSettingsStorage = {
      async get() {
        throw new Error('storage get unavailable');
      },
      async set() {
        throw new Error('storage set unavailable');
      },
    };

    const controller = initializeCommitArcade(document, { storage });
    await flushPromises();
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    expect(document.querySelector('[data-commit-arcade-state="player"]')).not.toBeNull();

    controller.destroy();
  });

  it('updates the session HUD score and exposes Restart and Stop after game over', () => {
    document.body.innerHTML = `
      <section aria-label="Contribution Graph">
        <svg>
          <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0" fill="#ebedf0"></rect>
          <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0" fill="#ebedf0"></rect>
        </svg>
      </section>
    `;
    let starts = 0;

    const controller = initializeCommitArcade(document, {
      gameFactories: {
        runner: () => ({
          id: 'runner',
          name: 'Restartable Runner',
          description: 'Scores and ends immediately',
          status: 'playable',
          start: ({ onScore, onGameOver }) => {
            starts += 1;
            onScore?.(starts === 1 ? 4 : 1);
            onGameOver?.();
          },
          update: () => undefined,
          handleInput: () => undefined,
          render: (_renderer) => undefined,
          stop: () => undefined,
        }),
      },
    });
    document.querySelector<HTMLButtonElement>('.commit-arcade-button')?.click();
    document.querySelectorAll<HTMLButtonElement>('.commit-arcade-picker-item')[0]?.click();

    const hud = document.querySelector<HTMLElement>('.commit-arcade-session');

    expect(hud?.textContent).toContain('Score 4');
    expect(hud?.textContent).toContain('Best 4');
    expect(hud?.textContent).toContain('Game over');
    expect(document.querySelector<HTMLButtonElement>('.commit-arcade-restart-button')).not.toBeNull();

    document.querySelector<HTMLButtonElement>('.commit-arcade-restart-button')?.click();

    expect(starts).toBe(2);
    expect(document.querySelector<HTMLElement>('.commit-arcade-session')?.textContent).toContain('Score 1');
    expect(document.querySelector<HTMLElement>('.commit-arcade-session')?.textContent).toContain('Best 4');

    document.querySelector<HTMLButtonElement>('.commit-arcade-stop-button')?.click();

    expect(document.querySelector('.commit-arcade-session')).toBeNull();
    expect(document.querySelector('[data-commit-arcade-state]')).toBeNull();
    expect(document.querySelector('rect')?.getAttribute('fill')).toBe('#ebedf0');

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

function contributionGraphFixture(): string {
  return `
    <section aria-label="Contribution Graph">
      <svg>
        <rect class="ContributionCalendar-day" data-date="2026-01-01" data-level="0" x="0" y="0" fill="#ebedf0"></rect>
        <rect class="ContributionCalendar-day" data-date="2026-01-02" data-level="0" x="12" y="0" fill="#ebedf0"></rect>
        <rect class="ContributionCalendar-day" data-date="2026-01-03" data-level="0" x="0" y="12" fill="#ebedf0"></rect>
        <rect class="ContributionCalendar-day" data-date="2026-01-04" data-level="0" x="12" y="12" fill="#ebedf0"></rect>
      </svg>
    </section>
  `;
}

function createMemoryStorage(values: Record<string, unknown>): CommitArcadeSettingsStorage {
  return {
    async get(key) {
      return { [key]: values[key] };
    },
    async set(patch) {
      Object.assign(values, patch);
    },
  };
}

async function flushPromises(): Promise<void> {
  await Promise.resolve();
  await Promise.resolve();
  await Promise.resolve();
}
