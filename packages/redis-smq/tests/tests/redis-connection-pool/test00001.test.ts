/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { IConnectionPoolConfig } from '../../../src/common/redis-connection-pool/types/index.js';
import { RedisConnectionPool } from '../../../src/index.js';
import bluebird from 'bluebird';
import { config } from '../../common/config.js';
import { IRedisClient } from 'redis-smq-common';

describe('Redis Connection Pool', async () => {
  const poolConfig: IConnectionPoolConfig = {
    min: 2,
    max: 5,
    acquireTimeoutMillis: 3000,
    idleTimeoutMillis: 10000,
    reapIntervalMillis: 5000,
  };

  let pool: ReturnType<typeof bluebird.promisifyAll<RedisConnectionPool>>;

  beforeEach(async () => {
    pool = bluebird.promisifyAll(
      RedisConnectionPool.getInstance(config.redis, poolConfig),
    );
    await pool.initAsync();
  });

  afterEach(async () => {
    await bluebird.promisifyAll(RedisConnectionPool).shutdownAsync();
  });

  it('Pool initialization', async () => {
    const stats = pool.getStats();
    expect(stats.total).toEqual(2);
  });

  it('Connection acquisition and release', async () => {
    const redisClient = await pool.acquireAsync();
    const statsAfterAcquire = pool.getStats();
    expect(statsAfterAcquire.inUse).toEqual(1);

    pool.release(redisClient);
    const statsAfterRelease = pool.getStats();
    expect(statsAfterRelease.inUse).toEqual(0);
  });

  it('Concurrent connections', async () => {
    const concurrentOperations = 10;
    const operations: Promise<void>[] = [];

    for (let i = 0; i < concurrentOperations; i++) {
      operations.push(
        new Promise<void>((resolve, reject) => {
          pool.acquire((err, client) => {
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
  });

  it('Pool limits', async () => {
    const maxConnections = 5; // As configured in initialization
    const clients: IRedisClient[] = [];

    // Acquire maximum number of connections
    for (let i = 0; i < maxConnections; i++) {
      const client = await pool.acquireAsync();
      clients.push(client);
    }

    const stats = pool.getStats();
    expect(stats.inUse).toEqual(maxConnections);

    await expect(async () => pool.acquireAsync()).rejects.toThrow(
      'Connection acquire timeout',
    );
  });

  it('Graceful shutdown', async () => {
    await pool.shutdownAsync();
    const stats = pool.getStats();
    expect(stats.total).toEqual(0);
  });
});
