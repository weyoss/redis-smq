/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { parseVersion } from './parse-version.js';

const PRERELEASE_PRIORITIES: Record<string, number> = {
  alpha: 0,
  beta: 1,
  rc: 2,
  next: 3,
};

function isPrerelease(version: string): boolean {
  return /-(next|rc|alpha|beta)\.[0-9]+$/.test(version);
}

function getBaseVersion(version: string): string {
  return version.replace(/-(next|rc|alpha|beta)\.[0-9]+$/, '');
}

function getPrereleasePriority(prereleaseType?: string): number {
  if (!prereleaseType) return 999;
  return PRERELEASE_PRIORITIES[prereleaseType] ?? 4;
}

function versionCompare(v1: string, v2: string): number {
  const parsed1 = parseVersion(v1);
  const parsed2 = parseVersion(v2);

  if (parsed1.major !== parsed2.major)
    return parsed1.major < parsed2.major ? -1 : 1;
  if (parsed1.minor !== parsed2.minor)
    return parsed1.minor < parsed2.minor ? -1 : 1;
  if (parsed1.patch !== parsed2.patch)
    return parsed1.patch < parsed2.patch ? -1 : 1;

  const priority1 = getPrereleasePriority(parsed1.prereleaseType);
  const priority2 = getPrereleasePriority(parsed2.prereleaseType);
  if (priority1 !== priority2) return priority1 < priority2 ? -1 : 1;

  const num1 = parsed1.prereleaseNumber ?? 0;
  const num2 = parsed2.prereleaseNumber ?? 0;
  if (num1 !== num2) return num1 < num2 ? -1 : 1;

  return 0;
}

export function isVersionInRange(
  version: string,
  from?: string,
  to?: string,
): boolean {
  const cleanVersion = version.replace(/^v/, '');

  if (from) {
    const fromClean = from.replace(/^v/, '');
    if (
      isPrerelease(fromClean) &&
      !isPrerelease(cleanVersion) &&
      cleanVersion === getBaseVersion(fromClean)
    ) {
      return false;
    }
    if (
      cleanVersion !== fromClean &&
      versionCompare(cleanVersion, fromClean) === -1
    ) {
      return false;
    }
  }

  if (to) {
    const toClean = to.replace(/^v/, '');
    if (
      isPrerelease(toClean) &&
      !isPrerelease(cleanVersion) &&
      cleanVersion === getBaseVersion(toClean)
    ) {
      return false;
    }
    if (
      cleanVersion !== toClean &&
      versionCompare(cleanVersion, toClean) === 1
    ) {
      return false;
    }
  }

  return true;
}
