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
  AcquireLockNotAllowedError,
  LockNotAcquiredError,
  RedisLock,
} from '../../../src/redis-lock/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getRedisInstance } from '../../helpers/common.js';

const KEY = 'auto-extend-lock';

// Same minimum-TTL constraint as in `lock-lifecycle.test.ts` — 5000ms is
// the proven lower bound accepted by `RedisLock`. Do NOT shrink this.
const TTL_MS = 5000;
/** > 2 × TTL_MS — guarantees several auto-refresh cycles have run. */
const WAIT_MS = 11000;

describe('RedisLock: autoExtend', () => {
  it('rejects manual extendLock() while auto-extending', async () => {
    const client = await getRedisInstance();
    const lock = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, TTL_MS, false, true),
    );
    await lock.acquireLockAsync();
    await expect(lock.extendLockAsync()).rejects.toThrow(
      AcquireLockNotAllowedError,
    );
    await lock.releaseLockAsync();
  });

  it('keeps the lock held past the TTL via automatic refresh', async () => {
    const client = await getRedisInstance();
    const owner = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, TTL_MS, false, true),
    );
    await owner.acquireLockAsync();

    await bluebird.delay(WAIT_MS);

    const competitor = bluebird.promisifyAll(
      new RedisLock(client, getDummyLogger(), KEY, TTL_MS, false),
    );
    await expect(competitor.acquireLockAsync()).rejects.toThrow(
      LockNotAcquiredError,
    );

    await owner.releaseLockAsync();
    await competitor.releaseLockAsync();
  });
});
