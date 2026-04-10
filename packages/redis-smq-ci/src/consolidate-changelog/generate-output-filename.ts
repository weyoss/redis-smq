/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Generate output filename based on version
 * Pattern: release-v[major].[minor].[patch].md
 */
export function generateOutputFilename(version: string): string {
  const versionMatch = version.match(/^(\d+)\.(\d+)\.(\d+)/);
  if (versionMatch) {
    const [, major, minor, patch] = versionMatch;
    return `release-v${major}.${minor}.${patch}.md`;
  }
  return 'CONSOLIDATED_CHANGELOG.md';
}
