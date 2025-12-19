/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import bluebird from 'bluebird';
import { ERedisConnectionAcquisitionMode } from '../../../src/common/redis/redis-connection-pool/types/connection-pool.js';
import { expect } from 'vitest';
import { IRedisClient } from 'redis-smq-common';
import { RedisConnectionPool } from '../../../src/common/redis/redis-connection-pool/redis-connection-pool.js';

export const connectionAcquisitionAndRelease = async (
  pool: ReturnType<typeof bluebird.promisifyAll<RedisConnectionPool>>,
  acquisitionMode: ERedisConnectionAcquisitionMode,
) => {
  const redisClient = await pool.acquireAsync(acquisitionMode);
  const statsAfterAcquire = pool.getStats();
  expect(statsAfterAcquire.inUse).toEqual(1);

  pool.release(redisClient);
  const statsAfterRelease = pool.getStats();
  expect(statsAfterRelease.inUse).toEqual(0);
};

export const concurrentConnections = async (
  pool: ReturnType<typeof bluebird.promisifyAll<RedisConnectionPool>>,
  acquisitionMode: ERedisConnectionAcquisitionMode,
) => {
  const concurrentOperations = 10;
  const operations: Promise<void>[] = [];

  for (let i = 0; i < concurrentOperations; i++) {
    operations.push(
      new Promise<void>((resolve, reject) => {
        pool.acquire(acquisitionMode, (err, client) => {
          if (err) {
            reject(
              new Error(`Failed to acquire connection ${i}: ${err.message}`),
            );
            return;
          }
          if (!client) {
            reject(new Error(`Expected a RedisClient instance`));
          }

          // Simulate some work
          setTimeout(() => {
            client?.get('hello', (err) => {
              pool.release(client);
              if (err) {
                return reject(
                  new Error(`Get failed for connection ${i}: ${err.message}`),
                );
              }
              resolve();
            });
          }, Math.random() * 100); // Random delay 0-100ms
        });
      }),
    );
  }

  await Promise.all(operations);

  const finalStats = pool.getStats();
  expect(finalStats.inUse).toEqual(0);
};

export const poolLimitsEXCLUSIVE = async (
  pool: ReturnType<typeof bluebird.promisifyAll<RedisConnectionPool>>,
): Promise<void> => {
  const maxConnections = 5; // As configured in initialization
  const clients: IRedisClient[] = [];

  // Acquire maximum number of connections
  for (let i = 0; i < maxConnections; i++) {
    const client = await pool.acquireAsync(
      ERedisConnectionAcquisitionMode.EXCLUSIVE,
    );
    clients.push(client);
  }

  const stats = pool.getStats();
  expect(stats.inUse).toEqual(maxConnections);

  await expect(async () =>
    pool.acquireAsync(ERedisConnectionAcquisitionMode.EXCLUSIVE),
  ).rejects.toThrow('Connection acquire timeout');

  await expect(async () =>
    pool.acquireAsync(ERedisConnectionAcquisitionMode.SHARED),
  ).rejects.toThrow('Connection acquire timeout');
};

export const poolLimitsSHARED = async (
  pool: ReturnType<typeof bluebird.promisifyAll<RedisConnectionPool>>,
): Promise<void> => {
  const maxConnections = 5; // As configured in initialization
  const clients: IRedisClient[] = [];

  // Acquire maximum number of connections
  for (let i = 0; i < maxConnections; i++) {
    const client = await pool.acquireAsync(
      ERedisConnectionAcquisitionMode.SHARED,
    );
    clients.push(client);
  }

  const stats = pool.getStats();
  expect(stats.inUse).toEqual(1);
};
