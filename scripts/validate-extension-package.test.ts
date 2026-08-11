import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

import { validateExtensionPackage } from './validate-extension-package.mjs';

describe('validateExtensionPackage', () => {
  it('accepts a complete Chrome build directory', async () => {
    const buildDir = await createBuildDir({
      manifestVersion: 3,
      target: 'chrome',
    });

    await expect(validateExtensionPackage('chrome', buildDir)).resolves.toEqual(
      expect.arrayContaining([
        'chrome manifest version 3',
        'content script contentScript.js',
        'stylesheet content.css',
        'icon assets/icons/icon-128.svg',
      ]),
    );
  });

  it('accepts a complete Firefox build directory', async () => {
    const buildDir = await createBuildDir({
      manifestVersion: 2,
      target: 'firefox',
    });

    await expect(validateExtensionPackage('firefox', buildDir)).resolves.toContain('firefox manifest version 2');
  });

  it('rejects missing content script assets', async () => {
    const buildDir = await createBuildDir({
      manifestVersion: 3,
      skipContentScript: true,
      target: 'chrome',
    });

    await expect(validateExtensionPackage('chrome', buildDir)).rejects.toThrow('Missing content script contentScript.js');
  });

  it('rejects browser manifest mismatches', async () => {
    const buildDir = await createBuildDir({
      manifestVersion: 2,
      target: 'chrome',
    });

    await expect(validateExtensionPackage('chrome', buildDir)).rejects.toThrow('Expected manifest_version 3');
  });

  it('rejects generated packages that include local dependencies or config', async () => {
    const buildDir = await createBuildDir({
      manifestVersion: 2,
      target: 'firefox',
    });
    await mkdir(path.join(buildDir, 'node_modules'), { recursive: true });

    await expect(validateExtensionPackage('firefox', buildDir)).rejects.toThrow('Forbidden package entry node_modules');
  });
});

interface BuildDirOptions {
  manifestVersion: number;
  skipContentScript?: boolean;
  target: 'chrome' | 'firefox';
}

async function createBuildDir(options: BuildDirOptions): Promise<string> {
  const buildDir = await mkdtemp(path.join(os.tmpdir(), `commit-arcade-${options.target}-`));
  await mkdir(path.join(buildDir, 'assets', 'icons'), { recursive: true });
  const manifest = {
    manifest_version: options.manifestVersion,
    name: 'Commit Arcade',
    version: '0.1.0',
    description: 'Play your GitHub contributions.',
    icons: {
      16: 'assets/icons/icon-16.svg',
      32: 'assets/icons/icon-32.svg',
      48: 'assets/icons/icon-48.svg',
      96: 'assets/icons/icon-96.svg',
      128: 'assets/icons/icon-128.svg',
      256: 'assets/icons/icon-256.svg',
    },
    content_scripts: [
      {
        matches: ['https://github.com/*'],
        js: ['contentScript.js'],
        css: ['content.css'],
      },
    ],
  };
  await writeFile(path.join(buildDir, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
  if (options.skipContentScript !== true) {
    await writeFile(path.join(buildDir, 'contentScript.js'), '(() => {})();\n');
  }
  await writeFile(path.join(buildDir, 'content.css'), ':root {}\n');
  for (const size of [16, 32, 48, 96, 128, 256]) {
    await writeFile(path.join(buildDir, 'assets', 'icons', `icon-${size}.svg`), '<svg />\n');
  }
  return buildDir;
}
