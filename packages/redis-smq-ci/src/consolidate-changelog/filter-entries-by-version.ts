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

/**
 * Filter entries by since/until version range
 */
export function filterEntriesByVersion(
  entries: Map<string, IChangelogEntry>,
  since?: string,
  until?: string,
): Map<string, IChangelogEntry> {
  const filtered = new Map<string, IChangelogEntry>();
  const versions = Array.from(entries.keys()).sort(compareVersions);

  for (const version of versions) {
    let include = true;

    if (since && compareVersions(version, since) < 0) {
      include = false;
    }

    if (until && compareVersions(version, until) > 0) {
      include = false;
    }

    if (include) {
      filtered.set(version, entries.get(version)!);
    }
  }

  return filtered;
}
