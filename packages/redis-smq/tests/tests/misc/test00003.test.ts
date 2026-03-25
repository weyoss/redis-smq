/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import { InvalidRedisKeyError } from '../../../src/errors/index.js';

test('redisKeys', async () => {
  expect(redisKeys.validateNamespace('global')).toBeInstanceOf(
    InvalidRedisKeyError,
  );
  expect(redisKeys.validateKey('')).toBeInstanceOf(InvalidRedisKeyError);
  expect(redisKeys.validateKey(null)).toBeInstanceOf(InvalidRedisKeyError);
  expect(redisKeys.validateKey(undefined)).toBeInstanceOf(InvalidRedisKeyError);
});
