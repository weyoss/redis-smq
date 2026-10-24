/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

export function validateRedisKey(key: string | null | undefined): boolean {
  if (!key || !key.length) return false;
  const lower = key.toLowerCase();
  const filtered = lower.replace(/(?:[a-z][a-z0-9]?)+(?:[-_.]?[a-z0-9])*/g, '');
  return filtered.length === 0;
}
