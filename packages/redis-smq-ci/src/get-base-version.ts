/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Get the base version (without pre-release suffix)
 */
export function getBaseVersion(version: string): string {
  return version.replace(/-.*$/, '');
}
