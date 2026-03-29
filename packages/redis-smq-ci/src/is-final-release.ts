/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Check if a version is a final release
 */
export function isFinalRelease(version: string): boolean {
  const preReleasePatterns = [
    /-next\.\d+$/,
    /-rc\.\d+$/,
    /-alpha\.\d+$/,
    /-beta\.\d+$/,
    /-pre\.\d+$/,
  ];

  return !preReleasePatterns.some((pattern) => pattern.test(version));
}
