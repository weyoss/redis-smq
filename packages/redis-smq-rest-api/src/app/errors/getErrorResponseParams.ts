/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { RedisSMQError } from 'redis-smq-common';
import { errors } from './errors.js';

export function getErrorResponseParams(
  error: RedisSMQError | (new () => RedisSMQError),
) {
  const className = error.name;
  const errs: Record<string, readonly [number, string]> = errors;
  return errs[className] ?? [500, 'InternalServerError'];
}
