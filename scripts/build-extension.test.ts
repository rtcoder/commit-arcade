import {describe, expect, it} from 'vitest';

import {stampManifestVersion} from './build-extension.mjs';

describe('build extension manifest metadata', () => {
  it('uses package.json as the release version source of truth', () => {
    const manifest = {
      manifest_version: 3,
      name: 'Commit Arcade',
      version: '0.0.0',
    };

    expect(stampManifestVersion(manifest, '1.0.0')).toEqual({
      manifest_version: 3,
      name: 'Commit Arcade',
      version: '1.0.0',
    });
  });
});
