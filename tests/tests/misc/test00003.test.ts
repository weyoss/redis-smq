/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { test, expect } from '@jest/globals';
import { redisKeys } from '../../../src/common/redis-keys/redis-keys.js';
import { RedisKeysError } from '../../../src/common/redis-keys/redis-keys.error.js';

test('redisKeys', async () => {
  expect(redisKeys.validateNamespace('global')).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey('')).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey(null)).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.validateRedisKey(undefined)).toBeInstanceOf(RedisKeysError);
  expect(redisKeys.getKeySegmentSeparator()).toBe(':');
});
