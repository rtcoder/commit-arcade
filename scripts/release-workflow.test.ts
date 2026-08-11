import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

describe('release workflow', () => {
  it('runs full release gates on every push and uploads predictable artifacts', async () => {
    const workflow = await readFile(path.join(ROOT, '.github', 'workflows', 'build-extensions.yml'), 'utf8');

    expect(workflow).toContain('push:');
    expect(workflow).not.toContain('tags:');
    expect(workflow).toContain('id: package-version');
    expect(workflow).toContain('version=v$(node -p "require(\'./package.json\').version")');
    expect(workflow).toContain('id: package-suffix');
    expect(workflow).toContain('if [ "${GITHUB_REF_TYPE}" = "tag" ]; then');
    expect(workflow).toContain('PACKAGE_VERSION: ${{ steps.package-suffix.outputs.value }}');
    expect(workflow).toContain('actions/checkout@v7');
    expect(workflow).toContain('actions/setup-node@v7');
    expect(workflow).toContain('actions/upload-artifact@v7');
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm test -- --run');
    expect(workflow).toContain('npm run build:chrome');
    expect(workflow).toContain('npm run build:firefox');
    expect(workflow).toContain('npm run validate:packages');
    expect(workflow).toContain('npm run package:archives -- "${PACKAGE_VERSION}"');
    expect(workflow).toContain('npm run package:amo-source -- "${PACKAGE_VERSION}"');
    expect(workflow).toContain('commit-arcade-chrome-${{ steps.package-suffix.outputs.value }}');
    expect(workflow).toContain('dist/commit-arcade-chrome-${{ steps.package-suffix.outputs.value }}.zip');
    expect(workflow).toContain('commit-arcade-firefox-${{ steps.package-suffix.outputs.value }}');
    expect(workflow).toContain('dist/commit-arcade-firefox-${{ steps.package-suffix.outputs.value }}.zip');
    expect(workflow).toContain('commit-arcade-firefox-source-${{ steps.package-suffix.outputs.value }}');
    expect(workflow).toContain('dist/commit-arcade-firefox-source-${{ steps.package-suffix.outputs.value }}.zip');
  });

  it('documents the v1.0.0 release tag flow', async () => {
    const docs = await readFile(path.join(ROOT, 'docs', 'qa', 'release-ci.md'), 'utf8');

    expect(docs).toContain('git tag v1.0.0');
    expect(docs).toContain('git push origin v1.0.0');
    expect(docs).toContain('commit-arcade-chrome-v1.0.0.zip');
    expect(docs).toContain('commit-arcade-firefox-v1.0.0.zip');
    expect(docs).toContain('commit-arcade-firefox-source-v1.0.0.zip');
  });
});
