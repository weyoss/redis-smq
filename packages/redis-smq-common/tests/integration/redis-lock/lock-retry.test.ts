/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { describe, expect, it } from 'vitest';
import bluebird from 'bluebird';
import {
  LockNotAcquiredError,
  RedisLock,
} from '../../../src/redis-lock/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getRedisInstance } from '../../helpers/common.js';

const KEY = 'retry-lock';

describe('RedisLock: retryOnFail', () => {
  it('rejects immediately when another instance holds the key', async () => {
    const client = await getRedisInstance();
    const holder = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, 20_000, false),
    );
    await holder.acquireLockAsync();

    const competitor = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, 10_000, false),
    );
    await expect(competitor.acquireLockAsync()).rejects.toThrow(
      LockNotAcquiredError,
    );

    await holder.releaseLockAsync();
  });

  it('succeeds when retryOnFail is enabled, and the resulting lock can be extended', async () => {
    const client = await getRedisInstance();
    const holder = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, 20_000, false),
    );
    await holder.acquireLockAsync();

    // Note: retryOnFail lets a second instance acquire the same key even
    // while `holder` still thinks it holds it. This is the current contract
    // — assert it so a regression in that behavior is visible.
    const retrying = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, 10_000, true),
    );
    await expect(retrying.acquireLockAsync()).resolves.toBeUndefined();
    await expect(retrying.extendLockAsync()).resolves.toBeUndefined();

    // `holder` is not explicitly released: `retrying` may have taken over
    // ownership, so `holder.releaseLockAsync()` is not guaranteed to
    // succeed. `beforeEach → startUp() → flushall()` clears the key before
    // the next test.
    await retrying.releaseLockAsync();
  });
});
