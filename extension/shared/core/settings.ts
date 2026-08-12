export interface CommitArcadeSettings {
  selectedGame: string;
  soundEnabled: boolean;
  highScores: Record<string, number>;
}

export interface CommitArcadeSettingsStorage {
  get(key: string): Promise<Record<string, unknown>>;

  set(patch: Record<string, unknown>): Promise<void>;
}

const SETTINGS_KEY = 'commitArcadeSettings';

const DEFAULT_SETTINGS: CommitArcadeSettings = {
  highScores: {},
  selectedGame: 'runner',
  soundEnabled: false,
};

export async function loadSettings(storage = getExtensionStorage()): Promise<CommitArcadeSettings> {
  if (storage === undefined) {
    return {...DEFAULT_SETTINGS, highScores: {}};
  }
  try {
    const result = await storage.get(SETTINGS_KEY);
    return normalizeSettings(result[SETTINGS_KEY]);
  } catch {
    return {...DEFAULT_SETTINGS, highScores: {}};
  }
}

export async function saveSettings(
  patch: Partial<CommitArcadeSettings>,
  storage = getExtensionStorage(),
): Promise<CommitArcadeSettings> {
  const next = {...(await loadSettings(storage)), ...patch};
  if (storage !== undefined) {
    await storage.set({[SETTINGS_KEY]: next});
  }
  return next;
}

function normalizeSettings(value: unknown): CommitArcadeSettings {
  if (typeof value !== 'object' || value === null) {
    return {...DEFAULT_SETTINGS, highScores: {}};
  }
  const candidate = value as Partial<CommitArcadeSettings>;
  return {
    highScores: isScoreMap(candidate.highScores) ? candidate.highScores : {},
    selectedGame: typeof candidate.selectedGame === 'string' ? candidate.selectedGame : DEFAULT_SETTINGS.selectedGame,
    soundEnabled: typeof candidate.soundEnabled === 'boolean' ? candidate.soundEnabled : DEFAULT_SETTINGS.soundEnabled,
  };
}

function isScoreMap(value: unknown): value is Record<string, number> {
  return (
    typeof value === 'object' &&
    value !== null &&
    Object.values(value).every((score) => typeof score === 'number' && Number.isFinite(score))
  );
}

function getExtensionStorage(): CommitArcadeSettingsStorage | undefined {
  const globalRecord = globalThis as unknown as {
    browser?: { storage?: { local?: CommitArcadeSettingsStorage } };
    chrome?: { storage?: { local?: CommitArcadeSettingsStorage } };
  };
  return globalRecord.browser?.storage?.local ?? globalRecord.chrome?.storage?.local;
}
