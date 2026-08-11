import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

export function stampManifestVersion(manifest, version) {
  return {
    ...manifest,
    version,
  };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, 'utf8'));
}

async function writeStampedManifest({ root, target, outputDir }) {
  const packageJson = await readJson(path.join(root, 'package.json'));
  const manifestPath = path.join(root, 'extension', target, 'manifest.json');
  const manifest = await readJson(manifestPath);
  const stampedManifest = stampManifestVersion(manifest, packageJson.version);
  await writeFile(path.join(outputDir, 'manifest.json'), `${JSON.stringify(stampedManifest, null, 2)}\n`);
}

async function buildExtension(target) {
  if (target !== 'chrome' && target !== 'firefox') {
    throw new Error('Usage: node scripts/build-extension.mjs chrome|firefox');
  }

  const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const outputDir = path.join(root, 'extension', target, 'build');
  const sharedDir = path.join(root, 'extension', 'shared');

  await rm(outputDir, { force: true, recursive: true });
  await mkdir(outputDir, { recursive: true });

  await build({
    bundle: true,
    entryPoints: [path.join(sharedDir, 'src', 'contentScript.ts')],
    format: 'iife',
    logLevel: 'info',
    outfile: path.join(outputDir, 'contentScript.js'),
    sourcemap: true,
    target: ['chrome120', 'firefox120'],
  });

  await writeStampedManifest({ root, target, outputDir });
  await cp(path.join(sharedDir, 'styles', 'content.css'), path.join(outputDir, 'content.css'));
  await cp(path.join(sharedDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true });

  console.log(`Built ${target} extension at ${path.relative(root, outputDir)}`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  await buildExtension(process.argv[2]);
}
