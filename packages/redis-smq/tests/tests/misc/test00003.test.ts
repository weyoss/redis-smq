/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { redisKeys } from '../../../src/common/redis/redis-keys/redis-keys.js';
import { RedisKeysError } from '../../../src/errors/index.js';

test('redisKeys', async () => {
  expect(redisKeys.validateNamespace('global')).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey('')).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey(null)).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey(undefined)).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.getKeySegmentSeparator()).toBe(':');
});
