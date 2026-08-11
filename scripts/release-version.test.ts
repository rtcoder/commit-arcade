import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();
const RELEASE_VERSION = '1.0.0';

async function readJson(filePath: string) {
  return JSON.parse(await readFile(path.join(ROOT, filePath), 'utf8'));
}

describe('release version metadata', () => {
  it('keeps package and browser manifest versions aligned for v1', async () => {
    const packageJson = await readJson('package.json');
    const chromeManifest = await readJson('extension/chrome/manifest.json');
    const firefoxManifest = await readJson('extension/firefox/manifest.json');

    expect(packageJson.version).toBe(RELEASE_VERSION);
    expect(chromeManifest.version).toBe(RELEASE_VERSION);
    expect(firefoxManifest.version).toBe(RELEASE_VERSION);
  });
});
