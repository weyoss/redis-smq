/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { isFinalRelease } from './is-final-release.js';

/**
 * Check if a version is a pre-release
 */
export function isPreRelease(version: string): boolean {
  return !isFinalRelease(version);
}
