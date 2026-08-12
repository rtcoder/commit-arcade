import {mkdir, readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

import {createDeterministicZip} from './package-extension.mjs';

const DEFAULT_VERSION = 'v1.0.0';
const EXCLUDED_ROOTS = new Set(['.codex', '.git', '.idea', '.ytrack', 'dist', 'node_modules']);
const EXCLUDED_FILES = new Set(['commit-arcade-codex.md']);
const EXCLUDED_SEGMENTS = new Set(['build']);
const EXCLUDED_SUFFIXES = ['.zip'];

export async function createAmoSourceArchive({distDir, root, version = DEFAULT_VERSION}) {
    const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
    const archivePath = path.join(distDir, `commit-arcade-firefox-source-${normalizedVersion}.zip`);
    const entries = (await listSourceEntries(root)).sort((a, b) => a.localeCompare(b));
    await mkdir(distDir, {recursive: true});
    await createDeterministicZip({archivePath, entries, root});
    return {archivePath, entries};
}

async function listSourceEntries(root, prefix = '') {
    const directoryEntries = await readdir(path.join(root, prefix), {withFileTypes: true});
    const entries = [];
    for (const entry of directoryEntries) {
        const relativePath = path.join(prefix, entry.name);
        const normalized = relativePath.split(path.sep).join('/');
        if (isExcluded(normalized)) {
            continue;
        }
        if (entry.isDirectory()) {
            entries.push(...(await listSourceEntries(root, relativePath)));
        } else if (entry.isFile()) {
            entries.push(normalized);
        }
    }
    return entries;
}

function isExcluded(entry) {
    const segments = entry.split('/');
    return (
        EXCLUDED_ROOTS.has(segments[0]) ||
        EXCLUDED_FILES.has(entry) ||
        segments.some((segment) => EXCLUDED_SEGMENTS.has(segment)) ||
        EXCLUDED_SUFFIXES.some((suffix) => entry.endsWith(suffix))
    );
}

function rootDir() {
    return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const version = process.argv[2] ?? process.env.GITHUB_REF_NAME ?? DEFAULT_VERSION;
    const root = rootDir();
    const result = await createAmoSourceArchive({
        distDir: path.join(root, 'dist'),
        root,
        version,
    });
    console.log(`Created ${path.relative(root, result.archivePath)}`);
    for (const entry of result.entries) {
        console.log(`ok - ${entry}`);
    }
}
