import {mkdir, mkdtemp, readFile, stat, writeFile} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

import {createExtensionArchive} from './package-extension.mjs';

describe('createExtensionArchive', () => {
  it('creates a deterministic versioned archive without source maps', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'commit-arcade-package-'));
    const buildDir = path.join(root, 'extension', 'chrome', 'build');
    const distDir = path.join(root, 'dist');
    await createBuild(buildDir);

    const first = await createExtensionArchive({
      buildDir,
      distDir,
      target: 'chrome',
      version: 'v1.0.0',
    });
    const firstBytes = await readFile(first.archivePath);
    const second = await createExtensionArchive({
      buildDir,
      distDir,
      target: 'chrome',
      version: 'v1.0.0',
    });
    const secondBytes = await readFile(second.archivePath);

    expect(path.basename(first.archivePath)).toBe('commit-arcade-chrome-v1.0.0.zip');
    expect(first.entries).toEqual([
      'assets/icons/icon-128.svg',
      'content.css',
      'contentScript.js',
      'manifest.json',
    ]);
    expect(first.entries).not.toContain('contentScript.js.map');
    expect(firstBytes.equals(secondBytes)).toBe(true);
    expect((await stat(first.archivePath)).size).toBeGreaterThan(0);
  });

  it('creates Firefox archives with extension-root entries', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'commit-arcade-package-'));
    const buildDir = path.join(root, 'extension', 'firefox', 'build');
    const distDir = path.join(root, 'dist');
    await createBuild(buildDir);

    const result = await createExtensionArchive({
      buildDir,
      distDir,
      target: 'firefox',
      version: 'v1.0.0',
    });

    expect(path.basename(result.archivePath)).toBe('commit-arcade-firefox-v1.0.0.zip');
    expect(result.entries).toContain('manifest.json');
    expect(result.entries.some((entry) => entry.startsWith('extension/'))).toBe(false);
  });
});

async function createBuild(buildDir: string): Promise<void> {
  await mkdir(path.join(buildDir, 'assets', 'icons'), {recursive: true});
  await writeFile(path.join(buildDir, 'manifest.json'), '{"manifest_version":3}\n');
  await writeFile(path.join(buildDir, 'contentScript.js'), '(() => {})();\n');
  await writeFile(path.join(buildDir, 'contentScript.js.map'), '{}\n');
  await writeFile(path.join(buildDir, 'content.css'), ':root {}\n');
  await writeFile(path.join(buildDir, 'assets', 'icons', 'icon-128.svg'), '<svg />\n');
}
