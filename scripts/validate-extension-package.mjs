import {readdir, readFile, stat} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const TARGETS = new Set(['chrome', 'firefox']);
const EXPECTED_MANIFEST_VERSION = {
    chrome: 3,
    firefox: 2,
};
const REQUIRED_ICON_SIZES = ['16', '32', '48', '96', '128', '256'];
const FORBIDDEN_ENTRIES = new Set([
    '.codex',
    '.env',
    '.git',
    '.github',
    '.idea',
    'commit-arcade-codex.md',
    'node_modules',
    'package-lock.json',
    'package.json',
    'tsconfig.json',
]);
const MAX_FILE_BYTES = 512 * 1024;

export async function validateExtensionPackage(target, buildDir = defaultBuildDir(target)) {
    assertTarget(target);
    const checks = [];
    const manifest = await readManifest(buildDir);
    const expectedManifestVersion = EXPECTED_MANIFEST_VERSION[target];
    if (manifest.manifest_version !== expectedManifestVersion) {
        throw new Error(`Expected manifest_version ${expectedManifestVersion} for ${target}, got ${manifest.manifest_version}`);
    }
    checks.push(`${target} manifest version ${expectedManifestVersion}`);

    assertString(manifest.name, 'manifest name');
    assertString(manifest.version, 'manifest version');
    assertString(manifest.description, 'manifest description');
    await validateContentScripts(manifest, buildDir, checks);
    await validateIcons(manifest, buildDir, checks);
    await validatePackageTree(buildDir, checks);
    return checks;
}

function defaultBuildDir(target) {
    const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
    return path.join(root, 'extension', target, 'build');
}

async function readManifest(buildDir) {
    const manifestPath = path.join(buildDir, 'manifest.json');
    let raw;
    try {
        raw = await readFile(manifestPath, 'utf8');
    } catch {
        throw new Error('Missing manifest.json');
    }
    try {
        return JSON.parse(raw);
    } catch (error) {
        throw new Error(`Invalid manifest.json: ${error instanceof Error ? error.message : String(error)}`);
    }
}

async function validateContentScripts(manifest, buildDir, checks) {
    if (!Array.isArray(manifest.content_scripts) || manifest.content_scripts.length === 0) {
        throw new Error('Missing content_scripts entries');
    }
    for (const contentScript of manifest.content_scripts) {
        if (!Array.isArray(contentScript.matches) || !contentScript.matches.includes('https://github.com/*')) {
            throw new Error('Missing GitHub content script match');
        }
        for (const scriptPath of contentScript.js ?? []) {
            await assertFile(path.join(buildDir, scriptPath), `Missing content script ${scriptPath}`);
            checks.push(`content script ${scriptPath}`);
        }
        for (const stylesheetPath of contentScript.css ?? []) {
            await assertFile(path.join(buildDir, stylesheetPath), `Missing stylesheet ${stylesheetPath}`);
            checks.push(`stylesheet ${stylesheetPath}`);
        }
    }
}

async function validateIcons(manifest, buildDir, checks) {
    if (typeof manifest.icons !== 'object' || manifest.icons === null) {
        throw new Error('Missing icons');
    }
    for (const size of REQUIRED_ICON_SIZES) {
        const iconPath = manifest.icons[size];
        if (typeof iconPath !== 'string') {
            throw new Error(`Missing ${size}x${size} icon`);
        }
        await assertFile(path.join(buildDir, iconPath), `Missing icon ${iconPath}`);
        checks.push(`icon ${iconPath}`);
    }
}

async function validatePackageTree(buildDir, checks) {
    const entries = await listPackageEntries(buildDir);
    for (const entry of entries) {
        const firstSegment = entry.split(path.sep)[0];
        if (FORBIDDEN_ENTRIES.has(firstSegment) || entry.endsWith('.pem') || entry.endsWith('.key')) {
            throw new Error(`Forbidden package entry ${entry}`);
        }
        const fileStats = await stat(path.join(buildDir, entry));
        if (fileStats.isFile() && fileStats.size > MAX_FILE_BYTES) {
            throw new Error(`Unexpected oversized file ${entry}`);
        }
    }
    checks.push(`${entries.length} package entries scanned`);
}

async function assertFile(filePath, message) {
    try {
        const fileStats = await stat(filePath);
        if (!fileStats.isFile()) {
            throw new Error(message);
        }
    } catch {
        throw new Error(message);
    }
}

async function listPackageEntries(root, prefix = '') {
    const directoryEntries = await readdir(path.join(root, prefix), {withFileTypes: true});
    const entries = [];
    for (const entry of directoryEntries) {
        const relativePath = path.join(prefix, entry.name);
        entries.push(relativePath);
        if (entry.isDirectory()) {
            entries.push(...(await listPackageEntries(root, relativePath)));
        }
    }
    return entries;
}

function assertString(value, label) {
    if (typeof value !== 'string' || value.trim() === '') {
        throw new Error(`Missing ${label}`);
    }
}

function assertTarget(target) {
    if (!TARGETS.has(target)) {
        throw new Error('Usage: node scripts/validate-extension-package.mjs chrome|firefox [buildDir]');
    }
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
    const target = process.argv[2];
    const buildDir = process.argv[3];
    const checks = await validateExtensionPackage(target, buildDir);
    for (const check of checks) {
        console.log(`ok - ${check}`);
    }
    console.log(`Validated ${target} extension package.`);
}
