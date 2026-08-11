import { cp, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { build } from 'esbuild';

const target = process.argv[2];
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

await cp(path.join(root, 'extension', target, 'manifest.json'), path.join(outputDir, 'manifest.json'));
await cp(path.join(sharedDir, 'styles', 'content.css'), path.join(outputDir, 'content.css'));
await cp(path.join(sharedDir, 'assets'), path.join(outputDir, 'assets'), { recursive: true });

console.log(`Built ${target} extension at ${path.relative(root, outputDir)}`);
