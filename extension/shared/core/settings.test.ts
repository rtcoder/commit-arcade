import { describe, expect, it } from 'vitest';

import { loadSettings, saveSettings, type CommitArcadeSettingsStorage } from './settings';

describe('settings', () => {
  it('loads defaults when storage is unavailable and persists patches when storage works', async () => {
    const values: Record<string, unknown> = {};
    const storage: CommitArcadeSettingsStorage = {
      async get(key) {
        return { [key]: values[key] };
      },
      async set(patch) {
        Object.assign(values, patch);
      },
    };

    await expect(loadSettings(undefined)).resolves.toEqual({
      highScores: {},
      selectedGame: 'runner',
      soundEnabled: false,
    });

    await saveSettings({ selectedGame: 'snake' }, storage);

    await expect(loadSettings(storage)).resolves.toMatchObject({ selectedGame: 'snake' });
  });
});
