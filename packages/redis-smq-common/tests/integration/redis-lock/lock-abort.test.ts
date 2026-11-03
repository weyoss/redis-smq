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
import { OperationAbortedError } from '../../../src/errors/index.js';
import { RedisLock } from '../../../src/redis-lock/index.js';
import { getDummyLogger } from '../../../src/logger/index.js';
import { getMockedRedisClient } from './common.js';

function makeLockWithMockedClient() {
  const client = getMockedRedisClient();
  return bluebird.promisifyAll(
    new RedisLock(client, getDummyLogger(), 'abort-lock', 10_000, false),
  );
}

describe('RedisLock: abort in flight', () => {
  describe('shutdown() during extendLock()', () => {
    it('rejects with OperationAbortedError', async () => {
      const lock = makeLockWithMockedClient();
      await lock.acquireLockAsync();

      await expect(
        Promise.all([lock.extendLockAsync(), lock.shutdownAsync()]),
      ).rejects.toThrow(OperationAbortedError);
    });
  });

  describe('client "error" event during acquireLock()', () => {
    it('rejects with OperationAbortedError', async () => {
      const client = getMockedRedisClient();
      const lock = bluebird.promisifyAll(
        new RedisLock(client, getDummyLogger(), 'abort-lock', 10_000, false),
      );

      const errorFiredAt = new Promise<void>((resolve) => {
        setTimeout(() => {
          client.emit('error', new Error('simulated client failure'));
          resolve();
        }, 3000);
      });

      await expect(
        Promise.all([lock.acquireLockAsync(), errorFiredAt]),
      ).rejects.toThrow(OperationAbortedError);
    });
  });
});
