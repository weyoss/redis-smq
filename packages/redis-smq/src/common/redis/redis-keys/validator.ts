/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { InvalidRedisKeyError } from '../../../errors/index.js';

export function validateRedisKey(
  key: string | null | undefined,
): string | InvalidRedisKeyError {
  if (!key?.length) return new InvalidRedisKeyError();
  const valid = /^[a-z][a-z0-9\-_.]*$/.test(key.toLowerCase());
  if (!valid) return new InvalidRedisKeyError();
  return key.toLowerCase();
}
