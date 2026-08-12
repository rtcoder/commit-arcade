import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

const ROOT = process.cwd();

async function readText(filePath: string) {
  return readFile(path.join(ROOT, filePath), 'utf8');
}

async function readPngSize(filePath: string) {
  const png = await readFile(path.join(ROOT, filePath));
  expect(png.subarray(0, 8).toString('hex')).toBe('89504e470d0a1a0a');
  return {
    width: png.readUInt32BE(16),
    height: png.readUInt32BE(20),
  };
}

describe('Chrome Web Store assets', () => {
  it('provides required image assets at Chrome Web Store dimensions', async () => {
    await expect(readPngSize('docs/store/chrome/icon-128.png')).resolves.toEqual({width: 128, height: 128});
    await expect(readPngSize('docs/store/chrome/promo-small-440x280.png')).resolves.toEqual({width: 440, height: 280});
    await expect(readPngSize('docs/store/chrome/screenshot-runner-1280x800.png')).resolves.toEqual({
      width: 1280,
      height: 800,
    });
  });

  it('keeps listing copy aligned with local-only gameplay', async () => {
    const checklist = await readText('docs/store/chrome/listing.md');

    expect(checklist).toContain('Short description');
    expect(checklist).toContain('Long description');
    expect(checklist).toContain('local');
    expect(checklist).toContain('does not collect');
    expect(checklist).toContain('docs/store/chrome/icon-128.png');
    expect(checklist).toContain('docs/store/chrome/screenshot-runner-1280x800.png');
    expect(checklist).toContain('docs/store/chrome/promo-small-440x280.png');
  });
});

describe('v1 public website content', () => {
  it('documents install paths, support, release notes and privacy behavior', async () => {
    const home = await readText('docs/index.html');
    const privacy = await readText('docs/privacy.html');

    expect(home).toContain('Install for Chrome');
    expect(home).toContain('Install for Firefox');
    expect(home).toContain('CHANGELOG.md');
    expect(home).toContain('GitHub Issues');
    expect(privacy).toContain('Gameplay preferences and high scores remain local in browser storage.');
  });

  it('documents controls for all v1 games', async () => {
    const games = await readText('docs/games.html');

    expect(games).toContain('Commit Runner');
    expect(games).toContain('Snake');
    expect(games).toContain('Flappy Commit');
    expect(games).toContain('Pong');
    expect(games).toContain('Breakout');
    expect(games).toContain('Space Invaders');
    expect(games).toContain('Frogger');
    expect(games).toContain('Tron');
    expect(games).toContain('Helicopter');
    expect(games).toContain('Commit Beat');
    expect(games).toContain('Missile Command');
    expect(games).toContain('Centipede');
    expect(games).toContain('Arrow keys');
    expect(games).toContain('Space');
    expect(games).toContain('Escape');
  });
});

describe('theme and responsive QA assets', () => {
  it('provides reference captures for light, dark, dimmed and narrow layouts', async () => {
    await expect(readPngSize('docs/qa/visual/theme-light-1280x800.png')).resolves.toEqual({width: 1280, height: 800});
    await expect(readPngSize('docs/qa/visual/theme-dark-1280x800.png')).resolves.toEqual({width: 1280, height: 800});
    await expect(readPngSize('docs/qa/visual/theme-dark-dimmed-1280x800.png')).resolves.toEqual({
      width: 1280,
      height: 800,
    });
    await expect(readPngSize('docs/qa/visual/theme-narrow-390x844.png')).resolves.toEqual({width: 390, height: 844});
  });

  it('keeps extension visual CSS scoped and keyboard focus visible', async () => {
    const css = await readText('extension/shared/styles/content.css');
    const qa = await readText('docs/qa/theme-responsive-visual-qa.md');

    expect(css).toContain('.commit-arcade-picker-item:focus-visible');
    expect(css).toContain('.commit-arcade-session-button:focus-visible');
    expect(css).toContain('@media (max-width: 480px)');
    expect(css).toContain('max-width: min(220px, calc(100vw - 32px))');
    expect(qa).toContain('GitHub light theme');
    expect(qa).toContain('GitHub dark theme');
    expect(qa).toContain('GitHub dark dimmed theme');
    expect(qa).toContain('Narrow mobile-ish profile layouts');
  });

  it('colors both SVG and table-based GitHub contribution cells during gameplay', async () => {
    const css = await readText('extension/shared/styles/content.css');

    expect(css).toMatch(
      /commit-arcade-game-active[\s\S]*ContributionCalendar-day[\s\S]*fill: var\(--contribution-default-bgColor-0\) !important;[\s\S]*background-color: var\(--contribution-default-bgColor-0\) !important;/,
    );
    expect(css).toMatch(
      /data-commit-arcade-state='player'][\s\S]*fill: var\(--commit-arcade-player\) !important;[\s\S]*background-color: var\(--commit-arcade-player\) !important;/,
    );
    expect(css).toMatch(
      /data-commit-arcade-state='enemy'][\s\S]*fill: var\(--commit-arcade-enemy\) !important;[\s\S]*background-color: var\(--commit-arcade-enemy\) !important;/,
    );
    expect(css).toMatch(
      /data-commit-arcade-state='bonus'][\s\S]*fill: var\(--commit-arcade-accent\) !important;[\s\S]*background-color: var\(--commit-arcade-accent\) !important;/,
    );
  });
});
