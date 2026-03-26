/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { expect, test } from 'vitest';
import { InvalidRedisKeyError } from '../../../src/errors/index.js';
import { validateRedisKey } from '../../../src/common/redis/redis-keys/validator.js';

test('validateRedisKey', async () => {
  expect(validateRedisKey('')).toBeInstanceOf(InvalidRedisKeyError);
  expect(validateRedisKey(null)).toBeInstanceOf(InvalidRedisKeyError);
  expect(validateRedisKey(undefined)).toBeInstanceOf(InvalidRedisKeyError);
});
