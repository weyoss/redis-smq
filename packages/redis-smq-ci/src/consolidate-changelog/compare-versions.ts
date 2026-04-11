/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Parse a version string into its components
 * Handles: major.minor.patch[-prerelease.identifier]
 */
function parseVersion(version: string): {
  major: number;
  minor: number;
  patch: number;
  prerelease?: string;
  prereleaseNum?: number;
} {
  const match = version.match(/^(\d+)\.(\d+)\.(\d+)(?:-([a-z]+)\.(\d+))?$/);
  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  const [, major, minor, patch, prerelease, prereleaseNum] = match;

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prerelease,
    prereleaseNum: prereleaseNum ? parseInt(prereleaseNum, 10) : undefined,
  };
}

/**
 * Compare two version strings according to SemVer rules
 * Returns:
 *   1 if v1 > v2
 *   -1 if v1 < v2
 *   0 if equal
 */
export function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1);
  const parts2 = parseVersion(v2);

  // Compare major
  if (parts1.major !== parts2.major) {
    return parts1.major > parts2.major ? 1 : -1;
  }

  // Compare minor
  if (parts1.minor !== parts2.minor) {
    return parts1.minor > parts2.minor ? 1 : -1;
  }

  // Compare patch
  if (parts1.patch !== parts2.patch) {
    return parts1.patch > parts2.patch ? 1 : -1;
  }

  // Both have no prerelease tags (final releases)
  if (!parts1.prerelease && !parts2.prerelease) {
    return 0;
  }

  // Final release > pre-release (by SemVer rules)
  if (!parts1.prerelease && parts2.prerelease) {
    return 1;
  }
  if (parts1.prerelease && !parts2.prerelease) {
    return -1;
  }

  // Both have prerelease tags - compare by type and number
  if (parts1.prerelease && parts2.prerelease) {
    // Define order of prerelease types
    const prereleaseOrder: Record<string, number> = {
      alpha: 1,
      beta: 2,
      rc: 3,
      next: 4,
      pre: 5,
    };

    const order1 = prereleaseOrder[parts1.prerelease] || 99;
    const order2 = prereleaseOrder[parts2.prerelease] || 99;

    if (order1 !== order2) {
      return order1 > order2 ? 1 : -1;
    }

    // Same prerelease type, compare numbers
    const num1 = parts1.prereleaseNum || 0;
    const num2 = parts2.prereleaseNum || 0;

    if (num1 !== num2) {
      return num1 > num2 ? 1 : -1;
    }
  }

  return 0;
}
