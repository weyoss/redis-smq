/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { ParsedVersion } from './types/index.js';

export function parseVersion(version: string): ParsedVersion {
  const cleanVersion = version.replace(/^v/, '');
  const match = cleanVersion.match(
    /^(\d+)\.(\d+)\.(\d+)(?:-([a-zA-Z]+)\.(\d+))?$/,
  );

  if (!match) {
    throw new Error(`Invalid version format: ${version}`);
  }

  const [, major, minor, patch, prereleaseType, prereleaseNumber] = match;

  return {
    major: parseInt(major, 10),
    minor: parseInt(minor, 10),
    patch: parseInt(patch, 10),
    prereleaseType,
    prereleaseNumber: prereleaseNumber
      ? parseInt(prereleaseNumber, 10)
      : undefined,
  };
}
