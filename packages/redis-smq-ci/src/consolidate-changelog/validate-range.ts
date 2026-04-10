/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IChangelogEntry } from './types/index.js';
import { compareVersions } from './compare-versions.js';
import { isFinalRelease } from './is-final-release.js';
import { isPreRelease } from './is-prerelease.js';

/**
 * Validate that the range contains only pre-releases
 */
export function validateRange(entries: Map<string, IChangelogEntry>): void {
  const sortedVersions = Array.from(entries.keys()).sort(compareVersions);
  const finalReleases = sortedVersions.filter(isFinalRelease);
  const preReleases = sortedVersions.filter(isPreRelease);

  if (finalReleases.length > 0 && preReleases.length > 0) {
    const finalReleasesList = finalReleases.map((v) => `  - ${v}`).join('\n');
    const preReleasesList = preReleases.map((v) => `  - ${v}`).join('\n');

    throw new Error(
      `Cannot consolidate: Found both final releases and pre-releases in the selected range.\n\n` +
        `Final releases found:\n${finalReleasesList}\n\n` +
        `Pre-releases found:\n${preReleasesList}\n\n` +
        `Consolidation should only include pre-releases without any final releases between them.\n` +
        `Please adjust your --since/--until filters to exclude final releases.`,
    );
  }
}
