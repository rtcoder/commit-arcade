import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { describe, expect, it } from 'vitest';

const ROOT = process.cwd();

describe('release workflow', () => {
  it('runs full release gates for semantic v1 tags and uploads predictable artifacts', async () => {
    const workflow = await readFile(path.join(ROOT, '.github', 'workflows', 'build-extensions.yml'), 'utf8');

    expect(workflow).toContain("'v[0-9]+.[0-9]+.[0-9]+'");
    expect(workflow).toContain('npm run lint');
    expect(workflow).toContain('npm test -- --run');
    expect(workflow).toContain('npm run build:chrome');
    expect(workflow).toContain('npm run build:firefox');
    expect(workflow).toContain('npm run validate:packages');
    expect(workflow).toContain('npm run package:archives -- ${GITHUB_REF_NAME}');
    expect(workflow).toContain('npm run package:amo-source -- ${GITHUB_REF_NAME}');
    expect(workflow).toContain('commit-arcade-chrome-${{ github.ref_name }}');
    expect(workflow).toContain('dist/commit-arcade-chrome-${{ github.ref_name }}.zip');
    expect(workflow).toContain('commit-arcade-firefox-${{ github.ref_name }}');
    expect(workflow).toContain('dist/commit-arcade-firefox-${{ github.ref_name }}.zip');
    expect(workflow).toContain('commit-arcade-firefox-source-${{ github.ref_name }}');
    expect(workflow).toContain('dist/commit-arcade-firefox-source-${{ github.ref_name }}.zip');
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
