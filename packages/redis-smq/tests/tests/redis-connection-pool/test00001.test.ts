/*
 * Copyright (c)
 * Weyoss <weyoss@protonmail.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ERedisConnectionAcquisitionMode,
  IConnectionPoolConfig,
} from '../../../src/common/redis-connection-pool/types/connection-pool.js';
import bluebird from 'bluebird';
import { config } from '../../common/config.js';
import {
  concurrentConnections,
  connectionAcquisitionAndRelease,
  poolLimitsEXCLUSIVE,
  poolLimitsSHARED,
} from './common.js';
import { RedisConnectionPool } from '../../../src/common/redis-connection-pool/redis-connection-pool.js';

const connectionPool = bluebird.promisifyAll(RedisConnectionPool);

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
    await connectionPool.shutdownAsync();
    pool = bluebird.promisifyAll(
      await connectionPool.initializeAsync(config.redis, poolConfig),
    );
  });

  afterEach(async () => {
    await bluebird.promisifyAll(RedisConnectionPool).shutdownAsync();
  });

  it('Pool initialization', async () => {
    const stats = pool.getStats();
    expect(stats.total).toEqual(2);
  });

  it('Connection acquisition and release: ERedisConnectionAcquisitionMode.EXCLUSIVE', async () => {
    await connectionAcquisitionAndRelease(
      pool,
      ERedisConnectionAcquisitionMode.EXCLUSIVE,
    );
  });

  it('Connection acquisition and release: ERedisConnectionAcquisitionMode.SHARED', async () => {
    await connectionAcquisitionAndRelease(
      pool,
      ERedisConnectionAcquisitionMode.SHARED,
    );
  });

  it('Concurrent connections: ERedisConnectionAcquisitionMode.EXCLUSIVE', async () => {
    await concurrentConnections(
      pool,
      ERedisConnectionAcquisitionMode.EXCLUSIVE,
    );
  });

  it('Concurrent connections: ERedisConnectionAcquisitionMode.SHARED', async () => {
    await concurrentConnections(pool, ERedisConnectionAcquisitionMode.SHARED);
  });

  it('Pool limits: ERedisConnectionAcquisitionMode.EXCLUSIVE', async () => {
    await poolLimitsEXCLUSIVE(pool);
  });

  it('Pool limits: ERedisConnectionAcquisitionMode.SHARED', async () => {
    await poolLimitsSHARED(pool);
  });

  it('Graceful shutdown', async () => {
    await pool.shutdownAsync();
    const stats = pool.getStats();
    expect(stats.total).toEqual(0);
  });
});
