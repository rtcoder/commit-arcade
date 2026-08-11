import { mkdir, mkdtemp, readFile, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { createAmoSourceArchive } from './package-amo-source.mjs';

describe('createAmoSourceArchive', () => {
  it('creates a deterministic Firefox source package with lockfile and reviewer instructions', async () => {
    const root = await mkdtemp(path.join(os.tmpdir(), 'commit-arcade-source-'));
    await createSourceTree(root);
    const distDir = path.join(root, 'dist');

    const first = await createAmoSourceArchive({ distDir, root, version: 'v1.0.0' });
    const firstBytes = await readFile(first.archivePath);
    const second = await createAmoSourceArchive({ distDir, root, version: 'v1.0.0' });
    const secondBytes = await readFile(second.archivePath);

    expect(path.basename(first.archivePath)).toBe('commit-arcade-firefox-source-v1.0.0.zip');
    expect(first.entries).toEqual(
      expect.arrayContaining([
        'README.md',
        'package-lock.json',
        'package.json',
        'docs/qa/amo-source-submission.md',
        'scripts/build-extension.mjs',
        'extension/shared/src/contentScript.ts',
        'extension/firefox/manifest.json',
      ]),
    );
    expect(first.entries.some((entry) => entry.startsWith('node_modules/'))).toBe(false);
    expect(first.entries.some((entry) => entry.startsWith('dist/'))).toBe(false);
    expect(first.entries.some((entry) => entry.startsWith('.ytrack/'))).toBe(false);
    expect(first.entries).not.toContain('commit-arcade-codex.md');
    expect(first.entries.some((entry) => entry.includes('/build/'))).toBe(false);
    expect(firstBytes.equals(secondBytes)).toBe(true);
  });
});

async function createSourceTree(root: string): Promise<void> {
  await mkdir(path.join(root, 'docs', 'qa'), { recursive: true });
  await mkdir(path.join(root, 'scripts'), { recursive: true });
  await mkdir(path.join(root, 'extension', 'shared', 'src'), { recursive: true });
  await mkdir(path.join(root, 'extension', 'firefox'), { recursive: true });
  await mkdir(path.join(root, 'extension', 'firefox', 'build'), { recursive: true });
  await mkdir(path.join(root, 'node_modules', 'ignored'), { recursive: true });
  await mkdir(path.join(root, '.ytrack'), { recursive: true });
  await mkdir(path.join(root, 'dist'), { recursive: true });
  await writeFile(path.join(root, 'README.md'), '# Commit Arcade\n');
  await writeFile(path.join(root, 'package.json'), '{}\n');
  await writeFile(path.join(root, 'package-lock.json'), '{}\n');
  await writeFile(path.join(root, 'commit-arcade-codex.md'), 'local plan\n');
  await writeFile(path.join(root, 'docs', 'qa', 'amo-source-submission.md'), '# AMO Source\n');
  await writeFile(path.join(root, 'scripts', 'build-extension.mjs'), 'export {};\n');
  await writeFile(path.join(root, 'extension', 'shared', 'src', 'contentScript.ts'), 'export {};\n');
  await writeFile(path.join(root, 'extension', 'firefox', 'manifest.json'), '{}\n');
  await writeFile(path.join(root, 'extension', 'firefox', 'build', 'contentScript.js'), 'ignored\n');
  await writeFile(path.join(root, 'node_modules', 'ignored', 'index.js'), 'ignored\n');
  await writeFile(path.join(root, '.ytrack', 'config.json'), '{}\n');
  await writeFile(path.join(root, 'dist', 'ignored.zip'), 'ignored\n');
}
