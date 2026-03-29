/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { IChangelogEntry, IConsolidatedEntry } from './types/index.js';
import { compareVersions } from './compare-versions.js';
import { isPreRelease } from './is-prerelease.js';
import { getBaseVersion } from './get-base-version.js';
import { formatChangelog } from './format-changelog.js';

/**
 * Consolidates changelog entries into a single release
 */
export function consolidateChangelogFromEntries(
  entries: Map<string, IChangelogEntry>,
  options: {
    preserveOrder?: boolean;
    includeMetadata?: boolean;
    sectionOrder?: string[];
  } = {},
): string {
  const { includeMetadata = true, sectionOrder = [] } = options;

  // Filter to only pre-releases (validation already ensures no final releases)
  const preReleases = Array.from(entries.keys())
    .sort(compareVersions)
    .filter(isPreRelease);

  if (preReleases.length === 0) {
    return '';
  }

  // Find the highest base version among pre-releases
  const highestBaseVersion =
    preReleases
      .map((v) => getBaseVersion(v))
      .sort(compareVersions)
      .pop() || '0.0.0';

  // Get the latest pre-release date
  const latestPreRelease = preReleases[preReleases.length - 1];
  const latestEntry = entries.get(latestPreRelease)!;

  const consolidatedEntry: IConsolidatedEntry = {
    version: highestBaseVersion,
    date: latestEntry.date,
    sections: new Map(),
  };

  // Merge all changes from all pre-releases
  for (const version of preReleases) {
    const entry = entries.get(version)!;
    for (const [section, changes] of entry.sections) {
      if (!consolidatedEntry.sections.has(section)) {
        consolidatedEntry.sections.set(section, new Set());
      }
      for (const change of changes) {
        consolidatedEntry.sections.get(section)!.add(change);
      }
    }
  }

  return formatChangelog(consolidatedEntry, {
    includeMetadata,
    sectionOrder,
  });
}
