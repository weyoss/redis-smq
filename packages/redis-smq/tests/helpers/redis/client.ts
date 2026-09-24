/*
 * Copyright (c)
 * Weyoss <weyoss@outlook.com>
 * https://github.com/weyoss
 *
 * This source code is licensed under the MIT license found in the LICENSE file
 * in the root directory of this source tree.
 */

/**
 * Pool-aware Redis client helpers for tests.
 *
 * The pool here is RedisSMQ's own connection pool (`Pool` from
 * `src/core/common/redis/connection-pool/`), which every worker
 * initializes against its per-worker embedded Redis server. It is not
 * shared across workers — each fork gets its own pool bound to its own
 * server. That means the leak this helper was written to close (the old
 * `getRedisInstance()` acquired an EXCLUSIVE connection and never
 * released it, exhausting the pool after `max` calls) is still a real
 * concern within a single worker's test file: `max: 5` and 20 tests
 * means the sixth `getRedisInstance()` call would hang.
 *
 * Two APIs, both guaranteed to release the connection back to the pool:
 *
 *   - `withRedisClient(fn)`   — recommended. Runs `fn(client)` and
 *                               releases automatically, including on
 *                               throw.
 *
 *   - `acquireRedisClient()`  — escape hatch for cases where you cannot
 *                               wrap the work in a closure. Callers MUST
 *                               call `release()` in a `finally` block.
 *
 * The client returned is promisified so every callback-style method has
 * an `*Async` variant returning a Promise. Call sites use the `*Async`
 * form consistently.
 *
 * Do NOT construct a bare `Client` here. That bypasses the pool, which
 * is occasionally what you want (`flush.ts` does it deliberately, to
 * avoid racing the pool's own connections during a flush), but is
 * almost never what a test wants.
 */

import bluebird from 'bluebird';
import type { IRedisClient } from 'redis-smq-common';
import { ERedisConnectionAcquisitionMode } from '../../../src/core/common/redis/connection-pool/types/connection-pool.js';
import { Pool } from '../../../src/core/common/redis/connection-pool/pool.js';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type TPromisifiedRedisClient = ReturnType<
  typeof bluebird.promisifyAll<IRedisClient>
>;

export interface IAcquiredRedisClient {
  client: TPromisifiedRedisClient;
  release: () => void;
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Acquire a client from the pool.
 *
 * Prefer `withRedisClient` unless you genuinely cannot wrap the work in a
 * closure. When using this directly, always release in a `finally`:
 *
 *   const { client, release } = await acquireRedisClient();
 *   try {
 *     // ... work with `client`
 *   } finally {
 *     release();
 *   }
 *
 * `release` is idempotent, so double-calling it is safe. The returned
 * `release` closure also keeps a reference to the original raw client,
 * not the promisified wrapper — the pool tracks connections by identity
 * and does not recognize a wrapped proxy.
 */
export async function acquireRedisClient(
  mode: ERedisConnectionAcquisitionMode = ERedisConnectionAcquisitionMode.EXCLUSIVE,
): Promise<IAcquiredRedisClient> {
  const pool = Pool.getInstance();
  if (!pool) {
    throw new Error(
      'Redis connection pool is not initialized. ' +
        'Did RedisSMQ.initialize() run in beforeAll (tests/setup/global.ts) ' +
        'or beforeEach (tests/setup/per-test.ts)?',
    );
  }

  const poolAsync = bluebird.promisifyAll(pool);
  const raw = await poolAsync.acquireAsync(mode);
  if (!raw) {
    throw new Error(
      `Pool.acquire(${mode}) resolved without a client. This is a bug in the pool.`,
    );
  }

  const client = bluebird.promisifyAll(raw);

  let released = false;
  const release = (): void => {
    if (released) return;
    released = true;
    pool.release(raw);
  };

  return { client, release };
}

/**
 * Run `fn` with a client acquired from the pool. The connection is
 * released on return, throw, or timeout — whichever comes first.
 *
 * This is the API tests should use by default:
 *
 *   const value = await withRedisClient((c) => c.getAsync('my-key'));
 */
export async function withRedisClient<T>(
  fn: (client: TPromisifiedRedisClient) => Promise<T> | T,
  mode: ERedisConnectionAcquisitionMode = ERedisConnectionAcquisitionMode.EXCLUSIVE,
): Promise<T> {
  const { client, release } = await acquireRedisClient(mode);
  try {
    return await fn(client);
  } finally {
    release();
  }
}

/**
 * Snapshot of the pool's stats.
 *
 * Useful for assertions in the pool tests and for debugging "why did
 * this suite hang" — after every test, `inUse` should be 0 if all
 * acquires were paired with releases. A non-zero `inUse` between tests
 * points at a `withRedisClient` caller that somehow didn't release (which
 * should be impossible given the `finally`, but a raw `acquireRedisClient`
 * without a matching `release` is exactly the shape of bug this exists to
 * catch).
 *
 * On the per-worker design, `stats.total` reflects only this worker's
 * pool. There is no cross-worker meaning to the number; if you see a
 * suspiciously low `total` after two tests, it's because this worker's
 * server is small, not because other workers are doing something.
 */
export function getPoolStats(): ReturnType<Pool['getStats']> {
  const pool = Pool.getInstance();
  if (!pool) {
    throw new Error('Redis connection pool is not initialized.');
  }
  return pool.getStats();
}
