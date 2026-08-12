import {readFile} from 'node:fs/promises';
import path from 'node:path';

import {describe, expect, it} from 'vitest';

const ROOT = process.cwd();
const MANIFESTS = [
  {browser: 'chrome', manifestPath: 'extension/chrome/manifest.json'},
  {browser: 'firefox', manifestPath: 'extension/firefox/manifest.json'},
] as const;
const RUNTIME_FILES = [
  'extension/shared/src/contentScript.ts',
  'extension/shared/core/settings.ts',
  'extension/shared/core/githubContributionGraph.ts',
] as const;

describe('extension store compliance', () => {
  it('uses GitHub-only content script scope with no broad permissions', async () => {
    for (const {manifestPath} of MANIFESTS) {
      const manifest = await readJson(manifestPath);

      expect(manifest.permissions ?? []).toEqual([]);
      expect(manifest.host_permissions ?? []).toEqual([]);
      expect(manifest.content_scripts).toHaveLength(1);
      expect(manifest.content_scripts[0].matches).toEqual(['https://github.com/*']);
    }
  });

  it('declares CSP that allows only packaged extension code', async () => {
    for (const {browser, manifestPath} of MANIFESTS) {
      const manifest = await readJson(manifestPath);
      const csp = browser === 'chrome' ? manifest.content_security_policy?.extension_pages : manifest.content_security_policy;

      expect(csp).toBe('script-src \'self\'; object-src \'self\';');
      expect(csp).not.toContain('unsafe-eval');
      expect(csp).not.toContain('http:');
      expect(csp).not.toContain('https:');
    }
  });

  it('does not use remote-code or telemetry APIs in extension runtime sources', async () => {
    const forbiddenPatterns = [
      /\beval\s*\(/,
      /\bFunction\s*\(/,
      /\bfetch\s*\(/,
      /\bXMLHttpRequest\b/,
      /navigator\.sendBeacon/,
      /chrome\.scripting\.executeScript/,
      /browser\.scripting\.executeScript/,
      /https?:\/\/(?!github\.com\/\*)/,
    ];

    for (const runtimeFile of RUNTIME_FILES) {
      const source = await readFile(path.join(ROOT, runtimeFile), 'utf8');
      for (const pattern of forbiddenPatterns) {
        expect(source, `${runtimeFile} should not match ${pattern}`).not.toMatch(pattern);
      }
    }
  });
});

async function readJson(relativePath: string): Promise<Record<string, any>> {
  return JSON.parse(await readFile(path.join(ROOT, relativePath), 'utf8'));
}
