import { mkdir, readdir, readFile, rm, stat, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const TARGETS = new Set(['chrome', 'firefox']);
const PACKAGE_TARGETS = ['chrome', 'firefox'];
const DEFAULT_VERSION = 'v1.0.0';
const FIXED_DOS_TIME = 0;
const FIXED_DOS_DATE = (1 << 5) | 1;

export async function createExtensionArchive({ buildDir, distDir, target, version = DEFAULT_VERSION }) {
  assertTarget(target);
  const entries = (await listFiles(buildDir))
    .filter((entry) => !entry.endsWith('.map'))
    .sort((a, b) => a.localeCompare(b));
  await mkdir(distDir, { recursive: true });
  const normalizedVersion = version.startsWith('v') ? version : `v${version}`;
  const archivePath = path.join(distDir, `commit-arcade-${target}-${normalizedVersion}.zip`);
  await createDeterministicZip({ archivePath, entries, root: buildDir });
  return { archivePath, entries };
}

export async function createDeterministicZip({ archivePath, entries, root }) {
  await mkdir(path.dirname(archivePath), { recursive: true });
  const archive = await buildZip(entries, root);
  await rm(archivePath, { force: true });
  await writeFile(archivePath, archive);
}

async function listFiles(root, prefix = '') {
  const directoryEntries = await readdir(path.join(root, prefix), { withFileTypes: true });
  const files = [];
  for (const entry of directoryEntries) {
    const relativePath = path.join(prefix, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await listFiles(root, relativePath)));
    } else if (entry.isFile()) {
      files.push(relativePath.split(path.sep).join('/'));
    }
  }
  return files;
}

async function buildZip(entries, buildDir) {
  const localFileRecords = [];
  const centralDirectoryRecords = [];
  let offset = 0;

  for (const entry of entries) {
    const data = await readFile(path.join(buildDir, entry));
    const name = Buffer.from(entry, 'utf8');
    const crc = crc32(data);
    const local = localFileRecord({ crc, data, name });
    const central = centralDirectoryRecord({ crc, data, name, offset });
    localFileRecords.push(local, data);
    centralDirectoryRecords.push(central);
    offset += local.length + data.length;
  }

  const centralDirectory = Buffer.concat(centralDirectoryRecords);
  const end = endOfCentralDirectoryRecord({
    centralDirectoryOffset: offset,
    centralDirectorySize: centralDirectory.length,
    entries: entries.length,
  });
  return Buffer.concat([...localFileRecords, centralDirectory, end]);
}

function localFileRecord({ crc, data, name }) {
  const record = Buffer.alloc(30 + name.length);
  record.writeUInt32LE(0x04034b50, 0);
  record.writeUInt16LE(20, 4);
  record.writeUInt16LE(0x0800, 6);
  record.writeUInt16LE(0, 8);
  record.writeUInt16LE(FIXED_DOS_TIME, 10);
  record.writeUInt16LE(FIXED_DOS_DATE, 12);
  record.writeUInt32LE(crc, 14);
  record.writeUInt32LE(data.length, 18);
  record.writeUInt32LE(data.length, 22);
  record.writeUInt16LE(name.length, 26);
  record.writeUInt16LE(0, 28);
  name.copy(record, 30);
  return record;
}

function centralDirectoryRecord({ crc, data, name, offset }) {
  const record = Buffer.alloc(46 + name.length);
  record.writeUInt32LE(0x02014b50, 0);
  record.writeUInt16LE(20, 4);
  record.writeUInt16LE(20, 6);
  record.writeUInt16LE(0x0800, 8);
  record.writeUInt16LE(0, 10);
  record.writeUInt16LE(FIXED_DOS_TIME, 12);
  record.writeUInt16LE(FIXED_DOS_DATE, 14);
  record.writeUInt32LE(crc, 16);
  record.writeUInt32LE(data.length, 20);
  record.writeUInt32LE(data.length, 24);
  record.writeUInt16LE(name.length, 28);
  record.writeUInt16LE(0, 30);
  record.writeUInt16LE(0, 32);
  record.writeUInt16LE(0, 34);
  record.writeUInt16LE(0, 36);
  record.writeUInt32LE(0, 38);
  record.writeUInt32LE(offset, 42);
  name.copy(record, 46);
  return record;
}

function endOfCentralDirectoryRecord({ centralDirectoryOffset, centralDirectorySize, entries }) {
  const record = Buffer.alloc(22);
  record.writeUInt32LE(0x06054b50, 0);
  record.writeUInt16LE(0, 4);
  record.writeUInt16LE(0, 6);
  record.writeUInt16LE(entries, 8);
  record.writeUInt16LE(entries, 10);
  record.writeUInt32LE(centralDirectorySize, 12);
  record.writeUInt32LE(centralDirectoryOffset, 16);
  record.writeUInt16LE(0, 20);
  return record;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc = (crc >>> 8) ^ CRC_TABLE[(crc ^ byte) & 0xff];
  }
  return (crc ^ 0xffffffff) >>> 0;
}

const CRC_TABLE = Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit += 1) {
    value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  }
  return value >>> 0;
});

function assertTarget(target) {
  if (!TARGETS.has(target)) {
    throw new Error('Usage: node scripts/package-extension.mjs chrome|firefox [version]');
  }
}

function rootDir() {
  return path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  const version = process.argv[3] ?? process.env.GITHUB_REF_NAME ?? DEFAULT_VERSION;
  const root = rootDir();
  const targets = target === 'all' ? PACKAGE_TARGETS : [target];
  for (const packageTarget of targets) {
    assertTarget(packageTarget);
    const buildDir = path.join(root, 'extension', packageTarget, 'build');
    await stat(path.join(buildDir, 'manifest.json'));
    const result = await createExtensionArchive({
      buildDir,
      distDir: path.join(root, 'dist'),
      target: packageTarget,
      version,
    });
    console.log(`Created ${path.relative(root, result.archivePath)}`);
    for (const entry of result.entries) {
      console.log(`ok - ${entry}`);
    }
  }
}
